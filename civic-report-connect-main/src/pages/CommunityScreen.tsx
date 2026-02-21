import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import IssueDetailModal from '@/components/IssueDetailModal';
import type { Issue } from '@/types/issue';
import { Users, MapPin, ThumbsUp, Clock } from 'lucide-react';

const getCategoryIcon = (category: string) => {
  if (category.toLowerCase().includes('waste') || category.toLowerCase().includes('garbage')) return '🗑️';
  if (category.toLowerCase().includes('road') || category.toLowerCase().includes('infra')) return '🛣️';
  if (category.toLowerCase().includes('water')) return '💧';
  if (category.toLowerCase().includes('street') || category.toLowerCase().includes('light')) return '💡';
  return '📌';
};

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

const formatTimeAgo = (dateStr: string) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diffMs / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d} day${d === 1 ? '' : 's'} ago`;
};

const CommunityScreen = () => {
  const { issues, upvoteIssue, voteSeverity } = useApp();
  const [selected, setSelected] = useState<Issue | null>(null);

  return (
    <div className="fade-in pb-12 pt-6 sm:pt-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f7f5]">
          <Users size={20} className="text-[#2a9d8f]" />
        </div>
        <div>
          <h1 className="text-[22px] font-bold text-gray-900">Community</h1>
          <p className="text-sm text-gray-500">{issues.length} issues reported in your area</p>
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="rounded-xl border border-[#e8edf2] bg-white py-16 text-center shadow-sm">
          <p className="text-base font-semibold text-gray-800">No community issues yet</p>
          <p className="mt-1.5 text-sm text-gray-400">Be the first to report a civic issue!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {issues.map(issue => (
            <div
              key={issue.id}
              onClick={() => setSelected(issue)}
              className="cursor-pointer overflow-hidden rounded-xl border border-[#e8edf2] bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              {/* Image */}
              <div className="relative h-40 overflow-hidden">
                <img src={issue.imageUrl} alt={issue.category} className="h-full w-full object-cover" />
                <span className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getSeverityBadge(issue.severity)}`}>
                  {issue.severity}
                </span>
                <span className={`absolute right-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getStatusBadge(issue.status)}`}>
                  {issue.status}
                </span>
              </div>

              {/* Body */}
              <div className="p-4">
                <span className="mb-2 inline-block rounded-full bg-[#e8f7f5] px-2.5 py-0.5 text-[11px] font-semibold text-[#2a9d8f]">
                  {getCategoryIcon(issue.category)} {issue.category}
                </span>
                <p className="mb-1 text-[13px] font-semibold leading-snug text-gray-900 line-clamp-2">
                  {issue.description}
                </p>
                <p className="mb-3 text-[12px] text-gray-500 line-clamp-1">{issue.description}</p>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-1 text-gray-400">
                    <MapPin size={11} />
                    <span className="max-w-[120px] truncate text-[11px]">{issue.location}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-gray-400">
                      <Clock size={11} />
                      <span className="text-[11px]">{formatTimeAgo(issue.createdAt)}</span>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); upvoteIssue(issue.id); }}
                      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all
                        ${issue.hasUpvoted
                          ? 'bg-[#2a9d8f] text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-[#e8f7f5] hover:text-[#2a9d8f]'
                        }`}
                    >
                      <ThumbsUp size={11} /> {issue.upvotes}
                    </button>
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

export default CommunityScreen;
