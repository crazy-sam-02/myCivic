import { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import type { Issue } from '@/types/issue';
import {
    MapPin, Loader2, TriangleAlert, CheckCircle2,
    Clock, TrendingUp, RefreshCw, X, AlertCircle,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ── Fix Leaflet's broken default icon path in Vite ── */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* ── Colour per status ── */
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

/* ── Build a coloured SVG div icon ── */
const buildIcon = (issue: Issue) => {
    const color = STATUS_COLOR[issue.status] ?? '#6b7280';
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="32" height="40">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24S32 26 32 16C32 7.163 24.837 0 16 0z"
        fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
    </svg>`;
    return L.divIcon({
        html: svg,
        className: '',
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -42],
    });
};

/* ── Parse "lat, lng" string or return null ── */
const parseCoords = (loc: string): [number, number] | null => {
    const parts = loc.split(',').map(s => s.trim());
    if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return [lat, lng];
        }
    }
    return null;
};

/* ── Geocode an address string via Nominatim (free) ── */
const geocodeCache = new Map<string, [number, number] | null>();

const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
    if (geocodeCache.has(address)) return geocodeCache.get(address)!;
    try {
        const encoded = encodeURIComponent(address);
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'CivicAI-App/1.0' } }
        );
        const data = await res.json();
        if (data.length > 0) {
            const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            geocodeCache.set(address, coords);
            return coords;
        }
    } catch { /* network error */ }
    geocodeCache.set(address, null);
    return null;
};

/* ── Resolve coords for an issue ── */
const resolveCoords = async (issue: Issue): Promise<[number, number] | null> => {
    const direct = parseCoords(issue.location);
    if (direct) return direct;
    return await geocodeAddress(issue.location);
};

/* ── Status badge classes ── */
const getStatusBadge = (s: string) => {
    if (s === 'Open') return 'bg-red-100 text-red-600';
    if (s === 'In Progress') return 'bg-blue-100 text-blue-600';
    if (s === 'Resolved') return 'bg-emerald-100 text-emerald-600';
    return 'bg-gray-100 text-gray-500';
};

const getSeverityBadge = (s: string) => {
    if (s === 'Critical' || s === 'High') return 'bg-red-100 text-red-600';
    if (s === 'Medium') return 'bg-amber-100 text-amber-600';
    return 'bg-emerald-100 text-emerald-600';
};

const getCategoryIcon = (c: string) => {
    if (c.toLowerCase().includes('waste')) return '🗑️';
    if (c.toLowerCase().includes('road')) return '🛣️';
    if (c.toLowerCase().includes('water')) return '💧';
    if (c.toLowerCase().includes('street') || c.toLowerCase().includes('light')) return '💡';
    return '📌';
};

const formatTimeAgo = (dateStr: string) => {
    const m = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    return `${d}d ago`;
};

/* ── Issue detail panel ── */
const IssuePanel = ({ issue, onClose }: { issue: Issue; onClose: () => void }) => (
    <div className="fade-in absolute bottom-4 left-4 z-[1000] w-72 overflow-hidden rounded-2xl border border-[#e8edf2] bg-white shadow-xl sm:w-80">
        {/* Image */}
        <div className="relative h-36 overflow-hidden">
            <img src={issue.imageUrl} alt={issue.category} className="h-full w-full object-cover" />
            <button
                onClick={onClose}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
            >
                <X size={14} />
            </button>
            <span className={`absolute left-2 bottom-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getSeverityBadge(issue.severity)}`}>
                {issue.severity}
            </span>
            <span className={`absolute right-2 bottom-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getStatusBadge(issue.status)}`}>
                {issue.status}
            </span>
        </div>

        {/* Body */}
        <div className="p-4">
            <span className="mb-2 inline-block rounded-full bg-[#e8f7f5] px-2.5 py-0.5 text-[11px] font-semibold text-[#2a9d8f]">
                {getCategoryIcon(issue.category)} {issue.category}
            </span>
            <p className="mb-2 line-clamp-2 text-sm font-semibold text-gray-900">{issue.description}</p>
            <div className="flex items-center gap-1.5 text-gray-500">
                <MapPin size={12} className="flex-shrink-0 text-[#2a9d8f]" />
                <span className="truncate text-xs">{issue.location}</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                <Clock size={11} />
                {formatTimeAgo(issue.createdAt)}
                <span className="ml-auto font-medium text-gray-600">By {issue.reporterName}</span>
            </div>
        </div>
    </div>
);

/* ══════════════ MAIN COMPONENT ══════════════ */
interface PlottedIssue {
    issue: Issue;
    coords: [number, number];
}

const MapScreen = () => {
    const { issues } = useApp();
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<L.Map | null>(null);
    const markers = useRef<Map<string, L.Marker>>(new Map());

    const [plottedIssues, setPlottedIssues] = useState<PlottedIssue[]>([]);
    const [geocoding, setGeocoding] = useState(false);
    const [failedCount, setFailedCount] = useState(0);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [mapReady, setMapReady] = useState(false);

    /* ── Init Leaflet map once ── */
    useEffect(() => {
        if (leafletMap.current || !mapRef.current) return;

        const map = L.map(mapRef.current, {
            center: [20.5937, 78.9629], // India centre
            zoom: 5,
            zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
        }).addTo(map);

        leafletMap.current = map;
        setMapReady(true);

        return () => { map.remove(); leafletMap.current = null; };
    }, []);

    /* ── Geocode all issues once map is ready ── */
    const geocodeAllIssues = useCallback(async () => {
        if (!leafletMap.current) return;
        setGeocoding(true);
        setFailedCount(0);

        const results: PlottedIssue[] = [];
        let failed = 0;

        for (const issue of issues) {
            const coords = await resolveCoords(issue);
            if (coords) {
                results.push({ issue, coords });
            } else {
                failed++;
            }
            // Small delay to respect Nominatim rate-limit (1 req/sec)
            await new Promise(r => setTimeout(r, 300));
        }

        setPlottedIssues(results);
        setFailedCount(failed);
        setGeocoding(false);
    }, [issues]);

    useEffect(() => {
        if (mapReady && issues.length > 0) geocodeAllIssues();
    }, [mapReady, issues.length]);

    /* ── Render / update markers whenever plottedIssues or filter changes ── */
    useEffect(() => {
        if (!leafletMap.current) return;
        const map = leafletMap.current;

        // Remove old markers
        markers.current.forEach(m => map.removeLayer(m));
        markers.current.clear();

        const filtered = filterStatus === 'All'
            ? plottedIssues
            : plottedIssues.filter(p => p.issue.status === filterStatus);

        if (filtered.length === 0) return;

        filtered.forEach(({ issue, coords }) => {
            const marker = L.marker(coords, { icon: buildIcon(issue) }).addTo(map);

            marker.bindPopup(`
        <div style="min-width:200px;font-family:Inter,sans-serif">
          <img src="${issue.imageUrl}" alt="" style="width:100%;height:90px;object-fit:cover;border-radius:8px;margin-bottom:8px"/>
          <div style="font-size:11px;font-weight:700;color:#2a9d8f;margin-bottom:4px">
            ${getCategoryIcon(issue.category)} ${issue.category}
          </div>
          <div style="font-size:12px;font-weight:600;color:#111;margin-bottom:6px;line-height:1.4">
            ${issue.description.slice(0, 80)}${issue.description.length > 80 ? '…' : ''}
          </div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:4px">📍 ${issue.location}</div>
          <div style="display:flex;gap:6px;margin-top:6px">
            <span style="background:${STATUS_COLOR[issue.status]}20;color:${STATUS_COLOR[issue.status]};font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px">${issue.status}</span>
            <span style="background:${SEVERITY_COLOR[issue.severity]}20;color:${SEVERITY_COLOR[issue.severity]};font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px">${issue.severity}</span>
          </div>
        </div>
      `, { maxWidth: 260 });

            marker.on('click', () => {
                setSelectedIssue(issue);
            });

            markers.current.set(issue.id, marker);
        });

        // Fit map to all markers
        if (filtered.length > 0) {
            const group = L.featureGroup(Array.from(markers.current.values()));
            map.fitBounds(group.getBounds().pad(0.15), { maxZoom: 14 });
        }
    }, [plottedIssues, filterStatus]);

    /* ── Pan to selected issue ── */
    useEffect(() => {
        if (!leafletMap.current || !selectedIssue) return;
        const marker = markers.current.get(selectedIssue.id);
        if (marker) {
            leafletMap.current.setView(marker.getLatLng(), 15, { animate: true });
            marker.openPopup();
        }
    }, [selectedIssue]);

    const stats = {
        total: plottedIssues.length,
        open: plottedIssues.filter(p => p.issue.status === 'Open').length,
        inProgress: plottedIssues.filter(p => p.issue.status === 'In Progress').length,
        resolved: plottedIssues.filter(p => p.issue.status === 'Resolved').length,
    };

    const FILTER_TABS = ['All', 'Open', 'In Progress', 'Resolved'];

    return (
        <div className="fade-in pb-6 pt-6 sm:pt-8">

            {/* Header */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-[22px]">Issues Map</h1>
                    <p className="mt-0.5 text-sm text-gray-500">
                        {geocoding
                            ? 'Locating reported issues on the map…'
                            : `${plottedIssues.length} of ${issues.length} issues plotted${failedCount > 0 ? ` · ${failedCount} could not be located` : ''}`
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
                    {!geocoding && issues.length > 0 && (
                        <button
                            onClick={geocodeAllIssues}
                            className="flex items-center gap-1.5 rounded-xl border border-[#e8edf2] bg-white px-3.5 py-2 text-xs font-semibold text-gray-600 shadow-sm transition-all hover:border-[#2a9d8f] hover:text-[#2a9d8f]"
                        >
                            <RefreshCw size={13} /> Refresh
                        </button>
                    )}
                </div>
            </div>

            {/* Stats strip */}
            {plottedIssues.length > 0 && (
                <div className="mb-4 grid grid-cols-4 gap-2 sm:gap-3">
                    {[
                        { label: 'On Map', value: stats.total, icon: MapPin, color: 'text-gray-500', bg: 'bg-gray-100' },
                        { label: 'Open', value: stats.open, icon: TriangleAlert, color: 'text-red-500', bg: 'bg-red-50' },
                        { label: 'In Progress', value: stats.inProgress, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
                        { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'text-[#2a9d8f]', bg: 'bg-[#e8f7f5]' },
                    ].map(s => {
                        const Icon = s.icon;
                        return (
                            <div key={s.label} className="flex items-center gap-2.5 rounded-2xl border border-[#e8edf2] bg-white px-3 py-3 shadow-sm sm:px-4">
                                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${s.bg}`}>
                                    <Icon size={15} className={s.color} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400 sm:text-[10px]">{s.label}</p>
                                    <p className="text-lg font-bold leading-none text-gray-900 sm:text-xl">{s.value}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Filter tabs */}
            <div className="mb-3 flex items-center gap-2">
                {FILTER_TABS.map(f => (
                    <button
                        key={f}
                        onClick={() => setFilterStatus(f)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all
              ${filterStatus === f
                                ? 'border-[#2a9d8f] bg-[#2a9d8f] text-white'
                                : 'border-[#e8edf2] bg-white text-gray-500 hover:border-[#2a9d8f]/50 hover:text-[#2a9d8f]'
                            }`}
                    >
                        {f}
                    </button>
                ))}
                {failedCount > 0 && (
                    <div className="ml-auto flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5">
                        <AlertCircle size={12} className="text-amber-500" />
                        <span className="text-xs font-medium text-amber-700">{failedCount} not located</span>
                    </div>
                )}
            </div>

            {/* Map + Sidebar */}
            <div className="relative">
                {/* Map container */}
                <div
                    ref={mapRef}
                    className="h-[420px] w-full overflow-hidden rounded-2xl border border-[#e8edf2] shadow-md sm:h-[520px] lg:h-[600px]"
                    style={{ zIndex: 0 }}
                />

                {/* Issue detail panel (overlaid on map) */}
                {selectedIssue && (
                    <IssuePanel issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
                )}

                {/* No issues state */}
                {issues.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white/90 backdrop-blur-sm">
                        <MapPin size={32} className="mb-3 text-[#2a9d8f]" />
                        <p className="text-sm font-semibold text-gray-700">No issues reported yet</p>
                        <p className="mt-1 text-xs text-gray-400">Report a civic issue to see it on the map</p>
                    </div>
                )}

                {/* Legend */}
                <div className="absolute bottom-4 right-4 z-[1000] rounded-xl border border-[#e8edf2] bg-white/95 p-3 shadow-lg backdrop-blur-sm">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">Status</p>
                    {Object.entries(STATUS_COLOR).map(([status, color]) => (
                        <div key={status} className="mb-1.5 flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ background: color }} />
                            <span className="text-[11px] text-gray-600">{status}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Issue list below map */}
            {plottedIssues.length > 0 && (
                <div className="mt-5">
                    <h2 className="mb-3 text-sm font-bold text-gray-900">
                        Plotted Issues
                        <span className="ml-2 rounded-full bg-[#e8f7f5] px-2 py-0.5 text-[11px] font-semibold text-[#2a9d8f]">
                            {filterStatus === 'All' ? plottedIssues.length : plottedIssues.filter(p => p.issue.status === filterStatus).length}
                        </span>
                    </h2>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                        {(filterStatus === 'All'
                            ? plottedIssues
                            : plottedIssues.filter(p => p.issue.status === filterStatus)
                        ).map(({ issue, coords }) => (
                            <button
                                key={issue.id}
                                onClick={() => setSelectedIssue(issue)}
                                className={`flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-3 text-left shadow-sm transition-all hover:shadow-md
                  ${selectedIssue?.id === issue.id ? 'border-[#2a9d8f] ring-1 ring-[#2a9d8f]/20' : 'border-[#e8edf2] hover:border-[#2a9d8f]/40'}`}
                            >
                                <img src={issue.imageUrl} alt="" className="h-12 w-12 flex-shrink-0 rounded-lg object-cover" />
                                <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex items-center gap-1.5">
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusBadge(issue.status)}`}>
                                            {issue.status}
                                        </span>
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getSeverityBadge(issue.severity)}`}>
                                            {issue.severity}
                                        </span>
                                    </div>
                                    <p className="truncate text-xs font-semibold text-gray-900">{issue.description}</p>
                                    <div className="mt-0.5 flex items-center gap-1 text-gray-400">
                                        <MapPin size={10} />
                                        <span className="truncate text-[10px]">{issue.location}</span>
                                    </div>
                                    <p className="mt-0.5 text-[10px] text-gray-400">
                                        📍 {coords[0].toFixed(4)}, {coords[1].toFixed(4)}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapScreen;
