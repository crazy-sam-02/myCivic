import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import IssueDetailModal from '@/components/IssueDetailModal';
import type { Issue } from '@/types/issue';
import { ClipboardList, MapPin, Clock, ThumbsUp, Plus } from 'lucide-react';

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

interface HistoryScreenProps {
  onNavigate?: (tab: string) => void;
}

const HistoryScreen = ({ onNavigate }: HistoryScreenProps) => {
    const { issues, user, voteSeverity } = useApp();
  const [selected, setSelected] = useState<Issue | null>(null);

  const myIssues = issues.filter(i => i.reporterEmail === user.email);

  return (
    <div className="fade-in pb-12 pt-6 sm:pt-8">

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:mb-7 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f7f5]">
            <ClipboardList size={20} className="text-[#2a9d8f]" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-gray-900">My Reports</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {myIssues.length} issue{myIssues.length !== 1 ? 's' : ''} submitted by you
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate?.('report')}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2a9d8f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#2a9d8f]/20 transition-all hover:bg-[#237f72] hover:shadow-md active:scale-[0.98] sm:w-auto sm:justify-start"
        >
          <Plus size={16} /> New Report
        </button>
      </div>

      {/* Empty state */}
      {myIssues.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e8edf2] bg-white py-20 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <ClipboardList size={26} className="text-gray-400" />
          </div>
          <p className="text-base font-semibold text-gray-700">No reports yet</p>
          <p className="mt-1.5 max-w-xs text-sm text-gray-400">
            You haven't submitted any civic issues. Report one to make your city better!
          </p>
          <button
            onClick={() => onNavigate?.('report')}
            className="mt-6 flex items-center gap-2 rounded-xl bg-[#2a9d8f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#237f72] hover:shadow active:scale-[0.99]"
          >
            <Plus size={16} /> Report an Issue
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {myIssues.map(issue => (
            <div
              key={issue.id}
              onClick={() => setSelected(issue)}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-[#e8edf2] bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              {/* Image */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={issue.imageUrl}
                  alt={issue.category}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <span className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getSeverityBadge(issue.severity)}`}>
                  {issue.severity}
                </span>
                <span className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getStatusBadge(issue.status)}`}>
                  {issue.status}
                </span>
              </div>

              {/* Body */}
              <div className="p-4">
                <span className="mb-2 inline-block rounded-full bg-[#e8f7f5] px-2.5 py-0.5 text-[11px] font-semibold text-[#2a9d8f]">
                  {getCategoryIcon(issue.category)} {issue.category}
                </span>
                <p className="mb-3 line-clamp-2 text-[13px] font-semibold leading-snug text-gray-900">
                  {issue.description}
                </p>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <MapPin size={11} />
                    <span className="max-w-[130px] truncate text-[11px]">{issue.location}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400">
                    <div className="flex items-center gap-1">
                      <ThumbsUp size={11} />
                      <span className="text-[11px]">{issue.upvotes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={11} />
                      <span className="text-[11px]">{formatTimeAgo(issue.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(['Low', 'Medium', 'High', 'Critical'] as const).map(level => (
                    <button
                      key={level}
                      onClick={e => { e.stopPropagation(); voteSeverity(issue.id, level); }}
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold transition-all
                        ${issue.userSeverityVote === level
                          ? 'bg-[#2a9d8f] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-[#e8f7f5] hover:text-[#2a9d8f]'
                        }`}
                    >
                      {level}
                      {issue.severityVotes ? ` ${issue.severityVotes[level.toLowerCase() as keyof typeof issue.severityVotes]}` : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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

export default HistoryScreen;
