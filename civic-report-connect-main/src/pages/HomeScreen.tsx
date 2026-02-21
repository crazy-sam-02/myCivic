import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import IssueDetailModal from '@/components/IssueDetailModal';
import type { Issue } from '@/types/issue';
import {
    TriangleAlert, Clock, TrendingUp, CheckCircle2,
    MapPin, ThumbsUp, Plus, ChevronRight,
} from 'lucide-react';

interface HomeScreenProps {
    onNavigate?: (tab: string) => void;
}

const getCategoryIcon = (category: string) => {
    if (category.toLowerCase().includes('waste') || category.toLowerCase().includes('garbage')) return '🗑️';
    if (category.toLowerCase().includes('road') || category.toLowerCase().includes('infra')) return '🛣️';
    if (category.toLowerCase().includes('water')) return '💧';
    if (category.toLowerCase().includes('street') || category.toLowerCase().includes('light')) return '💡';
    return '📌';
};

const getSeverityBadge = (severity: string) => {
    if (severity === 'High' || severity === 'Critical') return 'bg-red-100 text-red-600';
    if (severity === 'Medium') return 'bg-amber-100 text-amber-600';
    return 'bg-emerald-100 text-emerald-600';
};

const getStatusBadge = (status: string) => {
    if (status === 'Open') return 'bg-red-100 text-red-600';
    if (status === 'In Progress') return 'bg-blue-100 text-blue-600';
    if (status === 'Resolved') return 'bg-emerald-100 text-emerald-600';
    return 'bg-amber-100 text-amber-600';
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

const CITY_IMAGE = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&h=400&fit=crop&q=80';

const HomeScreen = ({ onNavigate }: HomeScreenProps) => {
    const { issues, myIssues, upvoteIssue, voteSeverity } = useApp();
    const [selected, setSelected] = useState<Issue | null>(null);

    const totalIssues = issues.length;
    const pending = issues.filter(i => i.status === 'Open').length;
    const inProgress = issues.filter(i => i.status === 'In Progress').length;
    const resolved = issues.filter(i => i.status === 'Resolved').length;
    const recentIssues = issues.slice(0, 3);
    const nearbyAlerts = issues.slice(0, 4);

    return (
        <div className="fade-in pb-12">

            {/* ─── Hero Banner ─── */}
            <div className="pt-5 pb-7">
                <div className="relative min-h-[180px] overflow-hidden rounded-2xl sm:min-h-[200px]">
                    <img
                        src={CITY_IMAGE}
                        alt="City skyline"
                        className="absolute inset-0 h-full w-full object-cover opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0d2744]/90 via-[#0f2d4a]/70 to-[#0d2744]/50" />
                    {/* Decorative dots */}
                    <div className="absolute top-10 right-24 hidden h-3 w-3 animate-pulse rounded-full bg-[#2a9d8f] sm:block" />
                    <div className="absolute top-20 right-48 hidden h-2 w-2 animate-pulse rounded-full bg-white/60 sm:block" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute bottom-14 right-32 hidden h-2.5 w-2.5 animate-pulse rounded-full bg-amber-400 sm:block" style={{ animationDelay: '1s' }} />
                    <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10">
                        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#2a9d8f]/20 px-3 py-1 text-xs font-semibold text-[#6ee7de] backdrop-blur-sm ring-1 ring-[#2a9d8f]/30">
                            🤖 AI-Powered Detection
                        </span>
                        <h1 className="mb-2 text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
                            Report Civic Issues
                        </h1>
                        <p className="mb-6 max-w-sm text-xs leading-relaxed text-white/70 sm:text-sm">
                            Use AI-powered detection to report and track municipal problems in your area.
                        </p>
                        <button
                            onClick={() => onNavigate?.('report')}
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-lg shadow-black/20 transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] sm:px-5 sm:py-2.5"
                        >
                            <Plus size={16} />
                            Report an Issue
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── Stats Row ─── */}
            {/* 2 cols on mobile → 4 cols on md+ */}
            <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                {[
                    { label: 'Total Issues', value: totalIssues, icon: TriangleAlert, bg: 'bg-gray-100', color: 'text-gray-500' },
                    { label: 'Pending', value: pending, icon: Clock, bg: 'bg-amber-50', color: 'text-amber-500' },
                    { label: 'In Progress', value: inProgress, icon: TrendingUp, bg: 'bg-blue-50', color: 'text-blue-500' },
                    { label: 'Resolved', value: resolved, icon: CheckCircle2, bg: 'bg-[#e8f7f5]', color: 'text-[#2a9d8f]', extra: resolved > 0 ? '↑ 12% this week' : undefined },
                ].map(stat => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="flex items-center gap-3 rounded-2xl border border-[#e8edf2] bg-white px-4 py-4 shadow-sm sm:gap-4 sm:px-5">
                            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
                                <Icon size={18} className={stat.color} />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-[10px] font-medium uppercase tracking-wide text-gray-400 sm:text-xs">{stat.label}</p>
                                <p className="mt-0.5 text-xl font-bold leading-none text-gray-900 sm:text-2xl">{stat.value}</p>
                                {stat.extra && <p className="mt-0.5 text-[10px] font-semibold text-[#2a9d8f] sm:text-[11px]">{stat.extra}</p>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ─── Main content: two-column on lg, stacked on smaller ─── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">

                {/* LEFT — Recent Issues */}
                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-bold text-gray-900">Recent Issues</h2>
                        <button className="flex items-center gap-1 text-sm font-semibold text-[#2a9d8f] hover:underline">
                            View all <ChevronRight size={14} />
                        </button>
                    </div>

                    {recentIssues.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[#e8edf2] bg-white p-10 text-center">
                            <p className="text-sm font-medium text-gray-500">No issues reported yet.</p>
                            <p className="mt-1 text-xs text-gray-400">Be the first to report a civic issue!</p>
                        </div>
                    ) : (
                        <div className="space-y-3 sm:space-y-4">
                            {recentIssues.map(issue => (
                                <div
                                    key={issue.id}
                                    onClick={() => setSelected(issue)}
                                    className="group flex cursor-pointer gap-3 overflow-hidden rounded-2xl border border-[#e8edf2] bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:gap-4 sm:p-4"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative h-[80px] w-[100px] flex-shrink-0 overflow-hidden rounded-xl sm:h-[90px] sm:w-[120px]">
                                        <img src={issue.imageUrl} alt={issue.category} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                                    </div>

                                    {/* Details */}
                                    <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                                        <div>
                                            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                                                <span className="rounded-full bg-[#e8f7f5] px-2 py-0.5 text-[10px] font-semibold text-[#2a9d8f] sm:px-2.5 sm:text-[11px]">
                                                    {getCategoryIcon(issue.category)} {issue.category}
                                                </span>
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold sm:px-2.5 sm:text-[11px] ${getSeverityBadge(issue.severity)}`}>
                                                    {issue.severity}
                                                </span>
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold sm:px-2.5 sm:text-[11px] ${getStatusBadge(issue.status)}`}>
                                                    {issue.status}
                                                </span>
                                            </div>
                                            <p className="line-clamp-2 text-xs font-semibold leading-snug text-gray-900 sm:text-sm">
                                                {issue.description}
                                            </p>
                                        </div>
                                        <div className="mt-2 flex flex-wrap items-center gap-3 text-gray-400">
                                            <div className="flex items-center gap-1.5">
                                                <MapPin size={11} />
                                                <span className="max-w-[140px] truncate text-[10px] sm:text-xs">{issue.location}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <ThumbsUp size={11} />
                                                <span className="text-[10px] sm:text-xs">{issue.upvotes}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock size={11} />
                                                <span className="text-[10px] sm:text-xs">{formatTimeAgo(issue.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* RIGHT — Nearby Alerts */}
                <section>
                    <div className="mb-4 flex items-center gap-2">
                        <MapPin size={15} className="text-[#2a9d8f]" />
                        <h2 className="text-base font-bold text-gray-900">Nearby Alerts</h2>
                    </div>

                    {nearbyAlerts.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[#e8edf2] bg-white p-10 text-center">
                            <p className="text-sm text-gray-400">No nearby alerts at the moment.</p>
                        </div>
                    ) : (
                        /* On mobile, alerts go into a 2-col grid; on lg, vertical stack in sidebar */
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            {nearbyAlerts.map(issue => (
                                <div
                                    key={issue.id}
                                    onClick={() => setSelected(issue)}
                                    className="cursor-pointer rounded-2xl border border-[#e8edf2] bg-white p-4 transition-all hover:border-[#2a9d8f]/40 hover:shadow-sm"
                                >
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <span className="truncate rounded-full bg-[#e8f7f5] px-2.5 py-0.5 text-[10px] font-semibold text-[#2a9d8f] sm:text-[11px]">
                                            {getCategoryIcon(issue.category)} {issue.category}
                                        </span>
                                        <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold sm:text-[11px] ${getStatusBadge(issue.status)}`}>
                                            {issue.status}
                                        </span>
                                    </div>
                                    <p className="mb-2.5 line-clamp-1 text-xs font-semibold text-gray-900 sm:text-[13px]">
                                        {issue.description}
                                    </p>
                                    <div className="flex items-center justify-between text-gray-400">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={11} />
                                            <span className="max-w-[120px] truncate text-[10px] sm:text-[11px]">{issue.location}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1">
                                                <ThumbsUp size={11} />
                                                <span className="text-[10px] sm:text-[11px]">{issue.upvotes}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock size={11} />
                                                <span className="text-[10px] sm:text-[11px]">{formatTimeAgo(issue.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {selected && <IssueDetailModal issue={selected} onClose={() => setSelected(null)} />}
            {selected && (
                <IssueDetailModal
                    issue={selected}
                    onClose={() => setSelected(null)}
                    onSeverityVote={(id, severity) => voteSeverity(id, severity)}
                />
            )}
        </div>
    );
};

export default HomeScreen;
