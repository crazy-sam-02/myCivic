/* Save the native Map constructor BEFORE any import can shadow it */
const NativeMap = Map;
type NativeMapType<K, V> = Map<K, V>;

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import IssueDetailModal from '@/components/IssueDetailModal';
import IssueCard from '@/components/IssueCard';
import type { Issue, IssueCategory, IssueStatus } from '@/types/issue';
import {
  Shield, LayoutDashboard, ListChecks, BarChart2,
  Map as MapIcon, ArrowLeft, TriangleAlert, Clock, TrendingUp,
  CheckCircle2, Trash2, Construction, Droplets, Lightbulb,
  MapPin, ThumbsUp, CalendarClock, SlidersHorizontal,
  Loader2, RefreshCw, AlertCircle, X, Filter, LogOut,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ── Fix Leaflet's broken default icon in Vite ── */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STATUS_COLOR: Record<string, string> = {
  'Open': '#ef4444',
  'In Progress': '#3b82f6',
  'Resolved': '#10b981',
  'Rejected': '#6b7280',
};

const SEVERITY_COLOR: Record<string, string> = {
  'Critical': '#dc2626',
  'High': '#f97316',
  'Medium': '#f59e0b',
  'Low': '#10b981',
};

const buildAdminIcon = (issue: Issue, highlight = false) => {
  const color = STATUS_COLOR[issue.status] ?? '#6b7280';
  const ring = highlight ? `stroke="#0f2d4a" stroke-width="3"` : `stroke="white" stroke-width="2"`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="${highlight ? 38 : 32}" height="${highlight ? 48 : 40}">
    <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24S32 26 32 16C32 7.163 24.837 0 16 0z" fill="${color}" ${ring}/>
    <circle cx="16" cy="16" r="6" fill="white"/>
  </svg>`;
  const size: [number, number] = highlight ? [38, 48] : [32, 40];
  return L.divIcon({ html: svg, className: '', iconSize: size, iconAnchor: [size[0] / 2, size[1]], popupAnchor: [0, -size[1] - 2] });
};

const parseCoords = (loc: string): [number, number] | null => {
  const parts = loc.split(',').map(s => s.trim());
  if (parts.length === 2) {
    const lat = parseFloat(parts[0]), lng = parseFloat(parts[1]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return [lat, lng];
  }
  return null;
};

const adminGeoCache = new NativeMap<string, [number, number] | null>();
const geocodeAddr = async (address: string): Promise<[number, number] | null> => {
  if (adminGeoCache.has(address)) return adminGeoCache.get(address)!;
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`, { headers: { 'Accept-Language': 'en', 'User-Agent': 'CivicAI-Admin/1.0' } });
    const data = await res.json();
    if (data.length > 0) { const c: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)]; adminGeoCache.set(address, c); return c; }
  } catch { /* ignore */ }
  adminGeoCache.set(address, null);
  return null;
};
const resolveAdminCoords = async (issue: Issue): Promise<[number, number] | null> => {
  const direct = parseCoords(issue.location);
  return direct ?? await geocodeAddr(issue.location);
};

interface Plotted { issue: Issue; coords: [number, number]; }

/* ════════════════════════════════════════════════
   Admin Map View sub-component
   ════════════════════════════════════════════════ */
const AdminMapView = ({ issues, onSelectIssue }: { issues: Issue[]; onSelectIssue: (issue: Issue) => void }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const lMap = useRef<L.Map | null>(null);
  const markerMap = useRef<NativeMapType<string, L.Marker>>(new NativeMap());

  const [plotted, setPlotted] = useState<Plotted[]>([]);
  const [geocoding, setGeocoding] = useState(false);
  const [failed, setFailed] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [filterStat, setFilterStat] = useState('All');
  const [filterSev, setFilterSev] = useState('All');
  const [filterCat, setFilterCat] = useState('All');
  const [showList, setShowList] = useState(true);

  /* Init map */
  useEffect(() => {
    if (lMap.current || !mapRef.current) return;
    const map = L.map(mapRef.current, { center: [20.5937, 78.9629], zoom: 5, zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19,
    }).addTo(map);
    lMap.current = map;
    setMapReady(true);
    return () => { map.remove(); lMap.current = null; };
  }, []);

  /* Geocode all issues */
  const geocodeAll = useCallback(async () => {
    if (!lMap.current) return;
    setGeocoding(true); setFailed(0);
    const results: Plotted[] = []; let f = 0;
    for (const issue of issues) {
      const c = await resolveAdminCoords(issue);
      if (c) results.push({ issue, coords: c }); else f++;
      await new Promise(r => setTimeout(r, 300));
    }
    setPlotted(results); setFailed(f); setGeocoding(false);
  }, [issues]);

  useEffect(() => { if (mapReady && issues.length > 0) geocodeAll(); }, [mapReady, issues.length]);

  /* Apply filters */
  const visible = plotted.filter(p => {
    if (filterStat !== 'All' && p.issue.status !== filterStat) return false;
    if (filterSev !== 'All' && p.issue.severity !== filterSev) return false;
    if (filterCat !== 'All' && p.issue.category !== filterCat) return false;
    return true;
  });

  /* Render markers */
  useEffect(() => {
    if (!lMap.current) return;
    markerMap.current.forEach(m => lMap.current!.removeLayer(m));
    markerMap.current.clear();
    if (visible.length === 0) return;
    visible.forEach(({ issue, coords }) => {
      const isHl = highlighted === issue.id;
      const marker = L.marker(coords, { icon: buildAdminIcon(issue, isHl), zIndexOffset: isHl ? 1000 : 0 }).addTo(lMap.current!);
      marker.bindPopup(`
        <div style="min-width:210px;font-family:Inter,sans-serif">
          <img src="${issue.imageUrl}" style="width:100%;height:100px;object-fit:cover;border-radius:8px;margin-bottom:8px"/>
          <div style="font-size:11px;font-weight:700;color:#2a9d8f;margin-bottom:4px">${issue.category}</div>
          <div style="font-size:12px;font-weight:600;color:#111;line-height:1.4;margin-bottom:6px">${issue.description.slice(0, 90)}${issue.description.length > 90 ? '…' : ''}</div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:6px">📍 ${issue.location}</div>
          <div style="display:flex;gap:6px">
            <span style="background:${STATUS_COLOR[issue.status]}20;color:${STATUS_COLOR[issue.status]};font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px">${issue.status}</span>
            <span style="background:${SEVERITY_COLOR[issue.severity]}20;color:${SEVERITY_COLOR[issue.severity]};font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px">${issue.severity}</span>
          </div>
          <div style="margin-top:8px;padding-top:8px;border-top:1px solid #f3f4f6;font-size:11px;color:#9ca3af">By ${issue.reporterName} · ${issue.assignedOffice}</div>
        </div>
      `, { maxWidth: 280 });
      marker.on('click', () => { setHighlighted(issue.id); onSelectIssue(issue); });
      markerMap.current.set(issue.id, marker);
    });
    const group = L.featureGroup(Array.from(markerMap.current.values()));
    if (markerMap.current.size > 0) lMap.current.fitBounds(group.getBounds().pad(0.15), { maxZoom: 14 });
  }, [plotted, filterStat, filterSev, filterCat, highlighted]);

  /* Pan to highlighted */
  useEffect(() => {
    if (!lMap.current || !highlighted) return;
    const m = markerMap.current.get(highlighted);
    if (m) { lMap.current.setView(m.getLatLng(), 15, { animate: true }); m.openPopup(); }
  }, [highlighted]);

  const STATUSES = ['All', 'Open', 'In Progress', 'Resolved', 'Rejected'];
  const SEVS = ['All', 'Critical', 'High', 'Medium', 'Low'];
  const CATS = ['All', 'Waste Management', 'Roads & Infrastructure', 'Water Supply', 'Streetlights', 'Other'];

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900">Map View</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {geocoding
              ? 'Geocoding issue locations…'
              : `${visible.length} issue${visible.length !== 1 ? 's' : ''} shown on map${failed > 0 ? ` · ${failed} not locatable` : ''}`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {geocoding && (
            <div className="flex items-center gap-2 rounded-xl bg-[#e8f7f5] px-3.5 py-2">
              <Loader2 size={14} className="animate-spin text-[#2a9d8f]" />
              <span className="text-xs font-semibold text-[#2a9d8f]">Geocoding…</span>
            </div>
          )}
          {!geocoding && (
            <button onClick={geocodeAll} className="flex items-center gap-1.5 rounded-xl border border-[#e8edf2] bg-white px-3.5 py-2 text-xs font-semibold text-gray-600 shadow-sm hover:border-[#2a9d8f] hover:text-[#2a9d8f] transition-all">
              <RefreshCw size={13} /> Refresh
            </button>
          )}
          <button onClick={() => setShowList(v => !v)} className="flex items-center gap-1.5 rounded-xl border border-[#e8edf2] bg-white px-3.5 py-2 text-xs font-semibold text-gray-600 shadow-sm hover:border-[#2a9d8f] hover:text-[#2a9d8f] transition-all">
            <Filter size={13} /> {showList ? 'Hide' : 'Show'} List
          </button>
        </div>
      </div>

      {/* Filter row */}
      <div className="mb-4 flex flex-wrap gap-3">
        {/* Status filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Status:</span>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setFilterStat(s)}
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all
                ${filterStat === s ? 'border-[#2a9d8f] bg-[#2a9d8f] text-white' : 'border-[#e8edf2] bg-white text-gray-500 hover:border-[#2a9d8f]/50'}`}>
              {s}
            </button>
          ))}
        </div>
        {/* Severity filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Severity:</span>
          {SEVS.map(s => (
            <button key={s} onClick={() => setFilterSev(s)}
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all
                ${filterSev === s ? 'border-[#2a9d8f] bg-[#2a9d8f] text-white' : 'border-[#e8edf2] bg-white text-gray-500 hover:border-[#2a9d8f]/50'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Map + sidebar layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">

        {/* Map */}
        <div className="relative">
          <div ref={mapRef}
            className="h-[440px] w-full overflow-hidden rounded-2xl border border-[#e8edf2] shadow-md sm:h-[540px] lg:h-[620px]"
            style={{ zIndex: 0 }}
          />

          {/* Legend overlay */}
          <div className="absolute bottom-4 right-4 z-[1000] rounded-xl border border-[#e8edf2] bg-white/95 p-3 shadow-lg backdrop-blur-sm">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</p>
            {Object.entries(STATUS_COLOR).map(([status, color]) => (
              <div key={status} className="mb-1.5 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ background: color }} />
                <span className="text-[11px] text-gray-600">{status}</span>
              </div>
            ))}
          </div>

          {issues.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white/90 backdrop-blur-sm">
              <MapPin size={32} className="mb-3 text-[#2a9d8f]" />
              <p className="text-sm font-semibold text-gray-700">No issues to map yet</p>
            </div>
          )}

          {failed > 0 && !geocoding && (
            <div className="absolute left-3 top-3 z-[1000] flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-1.5 backdrop-blur-sm">
              <AlertCircle size={12} className="text-amber-500" />
              <span className="text-[11px] font-medium text-amber-700">{failed} address{failed > 1 ? 'es' : ''} not geocoded</span>
            </div>
          )}
        </div>

        {/* Issue list sidebar */}
        {showList && (
          <div className="flex flex-col gap-2 overflow-y-auto lg:max-h-[620px]">
            <div className="flex items-center justify-between pb-1">
              <p className="text-sm font-bold text-gray-900">
                Issues
                <span className="ml-2 rounded-full bg-[#e8f7f5] px-2 py-0.5 text-[11px] font-semibold text-[#2a9d8f]">{visible.length}</span>
              </p>
              {highlighted && (
                <button onClick={() => setHighlighted(null)} className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600">
                  <X size={12} /> Clear
                </button>
              )}
            </div>

            {visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e8edf2] bg-white py-10 text-center">
                <MapPin size={22} className="mb-2 text-gray-300" />
                <p className="text-xs text-gray-400">No issues match these filters</p>
              </div>
            ) : (
              visible.map(({ issue, coords }) => (
                <button
                  key={issue.id}
                  onClick={() => { setHighlighted(issue.id); onSelectIssue(issue); }}
                  className={`flex items-start gap-3 rounded-xl border bg-white p-3 text-left transition-all hover:shadow-sm
                    ${highlighted === issue.id ? 'border-[#2a9d8f] ring-1 ring-[#2a9d8f]/20' : 'border-[#e8edf2] hover:border-[#2a9d8f]/40'}`}
                >
                  <img src={issue.imageUrl} alt="" className="h-11 w-11 flex-shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${issue.status === 'Open' ? 'bg-red-100 text-red-600' :
                        issue.status === 'In Progress' ? 'bg-blue-100 text-blue-600' :
                          issue.status === 'Resolved' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
                        }`}>{issue.status}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${(issue.severity === 'High' || issue.severity === 'Critical') ? 'bg-red-100 text-red-600' :
                        issue.severity === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>{issue.severity}</span>
                    </div>
                    <p className="truncate text-[12px] font-semibold text-gray-900">{issue.description}</p>
                    <div className="mt-0.5 flex items-center gap-1 text-gray-400">
                      <MapPin size={10} />
                      <span className="truncate text-[10px]">{issue.location}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-gray-400">📍 {coords[0].toFixed(4)}, {coords[1].toFixed(4)}</p>
                    <p className="mt-0.5 text-[10px] font-medium text-gray-500">{issue.assignedOffice}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Types ─── */
type AdminTab = 'dashboard' | 'issues' | 'analytics' | 'mapview';

interface AdminDashboardProps {
  onLogout: () => void;
}

/* ─── Category config ─── */
const CATEGORY_CONFIG = [
  { key: 'Waste Management', label: 'Waste & Garbage', icon: Trash2, dept: 'Sanitation', color: 'text-orange-500', bg: 'bg-orange-50' },
  { key: 'Roads & Infrastructure', label: 'Road & Infrastructure', icon: Construction, dept: 'Road Department', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { key: 'Water Supply', label: 'Water Problems', icon: Droplets, dept: 'Water Supply', color: 'text-blue-500', bg: 'bg-blue-50' },
  { key: 'Streetlights', label: 'Utility Problems', icon: Lightbulb, dept: 'Electricity', color: 'text-yellow-400', bg: 'bg-yellow-50' },
];

/* ─── Status + Severity badges ─── */
const getStatusBadge = (status: string) => {
  if (status === 'Open') return 'bg-red-100 text-red-600';
  if (status === 'In Progress') return 'bg-blue-100 text-blue-600';
  if (status === 'Resolved') return 'bg-emerald-100 text-emerald-600';
  return 'bg-amber-100 text-amber-600';
};

const getSeverityBadge = (severity: string) => {
  if (severity === 'High' || severity === 'Critical') return 'bg-red-100 text-red-600';
  if (severity === 'Medium') return 'bg-amber-100 text-amber-600';
  return 'bg-emerald-100 text-emerald-600';
};

const getCategoryIcon = (category: string) => {
  if (category.toLowerCase().includes('waste') || category.toLowerCase().includes('garbage')) return '🗑️';
  if (category.toLowerCase().includes('road') || category.toLowerCase().includes('infra')) return '🛣️';
  if (category.toLowerCase().includes('water')) return '💧';
  if (category.toLowerCase().includes('street') || category.toLowerCase().includes('light')) return '💡';
  return '📌';
};

const formatTimeAgo = (dateStr: string) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diffMs / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
};

/* ─────────────────────────────────────────────────── */
const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const { issues, updateIssueStatus, resolveIssue, voteSeverity } = useApp();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [selected, setSelected] = useState<Issue | null>(null);
  const [filterCat, setFilterCat] = useState<IssueCategory | 'All'>('All');
  const [filterStat, setFilterStat] = useState<IssueStatus | 'All'>('All');

  /* Stats */
  const stats = useMemo(() => ({
    total: issues.length,
    pending: issues.filter(i => i.status === 'Open').length,
    inProgress: issues.filter(i => i.status === 'In Progress').length,
    resolved: issues.filter(i => i.status === 'Resolved').length,
    highSev: issues.filter(i => i.severity === 'High' || i.severity === 'Critical').length,
    totalSupports: issues.reduce((acc, i) => acc + (i.upvotes || 0), 0),
  }), [issues]);

  /* Category counts */
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    issues.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1; });
    return counts;
  }, [issues]);

  /* Filtered issues (for Issues tab) */
  const filteredIssues = useMemo(() => {
    return issues.filter(i => {
      const catOk = filterCat === 'All' || i.category === filterCat;
      const statOk = filterStat === 'All' || i.status === filterStat;
      return catOk && statOk;
    });
  }, [issues, filterCat, filterStat]);

  const handleStatusChange = async (id: string, status: IssueStatus, proofUrl?: string, notes?: string) => {
    if (status === 'Resolved' && proofUrl) await resolveIssue(id, proofUrl, notes || '');
    else await updateIssueStatus(id, status);
    setSelected(null);
  };

  /* ── NAV TABS ── */
  const NAV_TABS: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'issues', label: 'Issues', icon: ListChecks },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'mapview', label: 'Map View', icon: MapIcon },
  ];

  return (
    <div className="min-h-screen bg-[#f0f4f8]">

      {/* ─── TOP NAVBAR ─── */}
      <nav className="sticky top-0 z-50 h-14 border-b border-[#e8edf2] bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-4 sm:px-6">

          {/* Logo */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <div className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-[#2a9d8f]">
              <Shield size={14} color="white" />
            </div>
            <span className="text-[14px] font-bold text-gray-900 sm:text-[15px]">
              Civic<span className="text-[#2a9d8f]">AI</span>
            </span>
          </div>

          {/* Nav Links — icon only on sm, label on md+ */}
          <div className="flex items-center gap-0.5">
            {NAV_TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition-all sm:px-3.5
                    ${active
                      ? 'bg-[#e8f7f5] font-semibold text-[#2a9d8f]'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 rounded-lg border border-[#e8edf2] bg-white px-2.5 py-1.5 text-[12px] font-medium text-gray-600 transition-all hover:border-[#2a9d8f] hover:text-[#2a9d8f] sm:px-3.5 sm:text-[13px]"
            >
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">Citizen View</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 rounded-lg border border-[#e8edf2] bg-white px-2.5 py-1.5 text-[12px] font-medium text-gray-600 transition-all hover:border-[#2a9d8f] hover:text-[#2a9d8f] sm:px-3.5 sm:text-[13px]"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ─── PAGE CONTENT ─── */}
      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8">

        {/* ══════ DASHBOARD TAB ══════ */}
        {activeTab === 'dashboard' && (
          <div className="fade-in">
            {/* Page Title */}
            <div className="mb-7">
              <h1 className="text-[22px] font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-0.5 text-sm text-gray-500">Municipal issue management overview</p>
            </div>

            {/* ── STATS ROW 1 ── */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              {/* Total Issues */}
              <div className="flex items-center gap-3.5 rounded-xl border border-[#e8edf2] bg-white px-5 py-4 shadow-sm">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#e8f7f5]">
                  <BarChart2 size={18} className="text-[#2a9d8f]" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-gray-400">Total Issues</p>
                  <p className="text-2xl font-bold leading-tight text-gray-900">{stats.total}</p>
                </div>
              </div>

              {/* Pending */}
              <div className="flex items-center gap-3.5 rounded-xl border border-[#e8edf2] bg-white px-5 py-4 shadow-sm">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#e8f7f5]">
                  <Clock size={18} className="text-[#2a9d8f]" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-gray-400">Pending</p>
                  <p className="text-2xl font-bold leading-tight text-gray-900">{stats.pending}</p>
                </div>
              </div>

              {/* In Progress */}
              <div className="flex items-center gap-3.5 rounded-xl border border-[#e8edf2] bg-white px-5 py-4 shadow-sm">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#e8f7f5]">
                  <TrendingUp size={18} className="text-[#2a9d8f]" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-gray-400">In Progress</p>
                  <p className="text-2xl font-bold leading-tight text-gray-900">{stats.inProgress}</p>
                </div>
              </div>

              {/* Resolved */}
              <div className="flex items-center gap-3.5 rounded-xl border border-[#e8edf2] bg-white px-5 py-4 shadow-sm">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#e8f7f5]">
                  <CheckCircle2 size={18} className="text-[#2a9d8f]" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-gray-400">Resolved</p>
                  <p className="text-2xl font-bold leading-tight text-gray-900">{stats.resolved}</p>
                  {stats.resolved > 0 && (
                    <p className="mt-0.5 text-[11px] font-medium text-[#2a9d8f]">↑ 12% this week</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── STATS ROW 2 ── */}
            <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              {/* High Severity */}
              <div className="flex flex-col items-center justify-center rounded-xl border border-[#e8edf2] bg-white px-5 py-5 shadow-sm">
                <p className="text-3xl font-bold text-red-500">{stats.highSev}</p>
                <p className="mt-1 text-[12px] text-gray-400">High Severity</p>
              </div>

              {/* Avg AI Confidence */}
              <div className="flex flex-col items-center justify-center rounded-xl border border-[#e8edf2] bg-white px-5 py-5 shadow-sm">
                <p className="text-3xl font-bold text-[#2a9d8f]">87%</p>
                <p className="mt-1 text-[12px] text-gray-400">Avg AI Confidence</p>
              </div>

              {/* Avg Resolution */}
              <div className="flex flex-col items-center justify-center rounded-xl border border-[#e8edf2] bg-white px-5 py-5 shadow-sm">
                <p className="text-3xl font-bold text-gray-900">2.4d</p>
                <p className="mt-1 text-[12px] text-gray-400">Avg Resolution</p>
              </div>

              {/* Total Supports */}
              <div className="flex flex-col items-center justify-center rounded-xl border border-[#e8edf2] bg-white px-5 py-5 shadow-sm">
                <p className="text-3xl font-bold text-gray-900">{stats.totalSupports}</p>
                <p className="mt-1 text-[12px] text-gray-400">Total Supports</p>
              </div>
            </div>

            {/* ── ISSUES BY CATEGORY ── */}
            <div>
              <h2 className="mb-4 text-[16px] font-bold text-gray-900">Issues by Category</h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                {CATEGORY_CONFIG.map(cat => {
                  const Icon = cat.icon;
                  const count = categoryCounts[cat.key] || 0;
                  return (
                    <div
                      key={cat.key}
                      className="cursor-pointer rounded-xl border border-[#e8edf2] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                      onClick={() => { setFilterCat(cat.key as IssueCategory); setActiveTab('issues'); }}
                    >
                      <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${cat.bg}`}>
                        <Icon size={20} className={cat.color} />
                      </div>
                      <p className="mb-1 text-[13px] font-semibold text-gray-900">{cat.label}</p>
                      <p className="mb-0.5 text-2xl font-bold text-gray-900">{count}</p>
                      <p className="text-[11px] text-gray-400">{cat.dept}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── RECENT ACTIVITY (bottom) ── */}
            {issues.length > 0 && (
              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-[16px] font-bold text-gray-900">Recent Activity</h2>
                  <button
                    onClick={() => setActiveTab('issues')}
                    className="text-[13px] font-semibold text-[#2a9d8f] hover:underline"
                  >
                    View all →
                  </button>
                </div>
                <div className="overflow-hidden rounded-xl border border-[#e8edf2] bg-white shadow-sm">
                  {issues.slice(0, 5).map((issue, idx) => (
                    <div
                      key={issue.id}
                      onClick={() => setSelected(issue)}
                      className={`flex cursor-pointer items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50 ${idx < 4 ? 'border-b border-[#f3f4f6]' : ''}`}
                    >
                      <img src={issue.imageUrl} alt="" className="h-11 w-11 flex-shrink-0 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-gray-900">{issue.description}</p>
                        <div className="mt-0.5 flex items-center gap-1 text-gray-400">
                          <MapPin size={11} />
                          <span className="truncate text-[11px]">{issue.location}</span>
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getStatusBadge(issue.status)}`}>
                          {issue.status}
                        </span>
                        <span className="text-[11px] text-gray-400">{formatTimeAgo(issue.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════ ISSUES TAB ══════ */}
        {activeTab === 'issues' && (
          <div className="fade-in">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-[22px] font-bold text-gray-900">All Issues</h1>
                <p className="mt-0.5 text-sm text-gray-500">{filteredIssues.length} issues found</p>
              </div>
              {/* Filters */}
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={15} className="text-gray-400" />
                <select
                  value={filterCat}
                  onChange={e => setFilterCat(e.target.value as IssueCategory | 'All')}
                  className="rounded-lg border border-[#e8edf2] bg-white px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-[#2a9d8f]"
                >
                  <option value="All">All Categories</option>
                  <option value="Waste Management">Waste Management</option>
                  <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                  <option value="Water Supply">Water Supply</option>
                  <option value="Streetlights">Streetlights</option>
                  <option value="Other">Other</option>
                </select>
                <select
                  value={filterStat}
                  onChange={e => setFilterStat(e.target.value as IssueStatus | 'All')}
                  className="rounded-lg border border-[#e8edf2] bg-white px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-[#2a9d8f]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>

            {filteredIssues.length === 0 ? (
              <div className="rounded-xl border border-[#e8edf2] bg-white py-16 text-center">
                <p className="text-base font-semibold text-gray-700">No issues found</p>
                <p className="mt-1 text-sm text-gray-400">Try changing the filters</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-[#e8edf2] bg-white shadow-sm">
                {/* Table header */}
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-4 border-b border-[#f3f4f6] bg-gray-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  <span>Issue</span>
                  <span>Category</span>
                  <span>Severity</span>
                  <span>Status</span>
                  <span>Location</span>
                  <span>Date</span>
                </div>
                {filteredIssues.map((issue, idx) => (
                  <div
                    key={issue.id}
                    onClick={() => setSelected(issue)}
                    className={`grid cursor-pointer grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-gray-50 ${idx < filteredIssues.length - 1 ? 'border-b border-[#f3f4f6]' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={issue.imageUrl} alt="" className="h-9 w-9 flex-shrink-0 rounded-lg object-cover" />
                      <p className="truncate text-[13px] font-medium text-gray-900">{issue.description}</p>
                    </div>
                    <span className="text-[12px] text-gray-600">{getCategoryIcon(issue.category)} {issue.category}</span>
                    <span className={`inline-block w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getSeverityBadge(issue.severity)}`}>
                      {issue.severity}
                    </span>
                    <span className={`inline-block w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getStatusBadge(issue.status)}`}>
                      {issue.status}
                    </span>
                    <span className="truncate text-[12px] text-gray-500">{issue.location}</span>
                    <span className="text-[11px] text-gray-400">{formatTimeAgo(issue.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════ ANALYTICS TAB ══════ */}
        {activeTab === 'analytics' && (
          <div className="fade-in">
            <div className="mb-6">
              <h1 className="text-[22px] font-bold text-gray-900">Analytics</h1>
              <p className="mt-0.5 text-sm text-gray-500">Insights into civic issue trends and resolution performance</p>
            </div>
            <div className="grid grid-cols-2 gap-5">
              {/* Resolution Rate */}
              <div className="rounded-xl border border-[#e8edf2] bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-[14px] font-semibold text-gray-800">Resolution Rate</h3>
                <div className="flex items-end gap-3">
                  <p className="text-4xl font-bold text-[#2a9d8f]">
                    {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
                  </p>
                  <p className="mb-1 text-sm text-gray-400">{stats.resolved} of {stats.total} resolved</p>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-[#2a9d8f] transition-all"
                    style={{ width: `${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Severity breakdown */}
              <div className="rounded-xl border border-[#e8edf2] bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-[14px] font-semibold text-gray-800">Severity Breakdown</h3>
                {[
                  { label: 'Critical', count: issues.filter(i => i.severity === 'Critical').length, color: 'bg-red-600' },
                  { label: 'High', count: issues.filter(i => i.severity === 'High').length, color: 'bg-red-400' },
                  { label: 'Medium', count: issues.filter(i => i.severity === 'Medium').length, color: 'bg-amber-400' },
                  { label: 'Low', count: issues.filter(i => i.severity === 'Low').length, color: 'bg-emerald-400' },
                ].map(s => (
                  <div key={s.label} className="mb-2.5">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[12px] text-gray-600">{s.label}</span>
                      <span className="text-[12px] font-semibold text-gray-800">{s.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className={`h-full rounded-full ${s.color}`} style={{ width: `${stats.total > 0 ? (s.count / stats.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Status distribution */}
              <div className="rounded-xl border border-[#e8edf2] bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-[14px] font-semibold text-gray-800">Status Distribution</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { label: 'Open', value: stats.pending, color: 'text-red-500' },
                    { label: 'In Progress', value: stats.inProgress, color: 'text-blue-500' },
                    { label: 'Resolved', value: stats.resolved, color: 'text-[#2a9d8f]' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl bg-gray-50 p-4">
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="mt-1 text-[11px] text-gray-400">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top categories */}
              <div className="rounded-xl border border-[#e8edf2] bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-[14px] font-semibold text-gray-800">Top Categories</h3>
                {Object.entries(categoryCounts)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 4)
                  .map(([cat, count]) => (
                    <div key={cat} className="mb-2.5 flex items-center justify-between">
                      <span className="text-[12px] text-gray-600">{getCategoryIcon(cat)} {cat}</span>
                      <span className="rounded-full bg-[#e8f7f5] px-2.5 py-0.5 text-[11px] font-semibold text-[#2a9d8f]">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════ MAP VIEW TAB ══════ */}
        {activeTab === 'mapview' && (
          <AdminMapView issues={issues} onSelectIssue={setSelected} />
        )}
      </div>

      {/* Issue Detail Modal */}
      {selected && (
        <IssueDetailModal
          issue={selected}
          onClose={() => setSelected(null)}
          isAdmin
          onStatusChange={handleStatusChange}
          onSeverityVote={(id, severity) => voteSeverity(id, severity)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
