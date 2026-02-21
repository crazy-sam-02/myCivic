import type { Issue } from '@/types/issue';
import { MapPin, ThumbsUp, Clock } from 'lucide-react';

interface IssueCardProps {
  issue: Issue;
  onClick?: () => void;
  onUpvote?: () => void;
  onSeverityVote?: (severity: Issue['severity']) => void;
  showReporter?: boolean;
}

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

const IssueCard = ({ issue, onClick, onUpvote, onSeverityVote, showReporter = false }: IssueCardProps) => {
  const severityCounts = issue.severityVotes || { low: 0, medium: 0, high: 0, critical: 0 };
  const severityOptions = [
    { label: 'Low', key: 'low' },
    { label: 'Medium', key: 'medium' },
    { label: 'High', key: 'high' },
    { label: 'Critical', key: 'critical' },
  ] as const;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer overflow-hidden rounded-xl border border-[#e8edf2] bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md fade-in"
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

        <div className="mb-1 flex items-center gap-1 text-gray-400">
          <MapPin size={11} />
          <span className="max-w-[180px] truncate text-[11px]">{issue.location}</span>
        </div>

        {showReporter && (
          <p className="mb-1 text-[11px] text-gray-400">
            By <span className="font-medium text-gray-600">{issue.reporterName}</span>
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2.5">
          <div className="flex items-center gap-1 text-gray-400">
            <Clock size={11} />
            <span className="text-[11px]">{formatTimeAgo(issue.createdAt)}</span>
          </div>
          {onUpvote && (
            <button
              onClick={e => { e.stopPropagation(); onUpvote(); }}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all
                ${issue.hasUpvoted
                  ? 'bg-[#2a9d8f] text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-[#e8f7f5] hover:text-[#2a9d8f]'
                }`}
            >
              <ThumbsUp size={11} /> {issue.upvotes}
            </button>
          )}
        </div>

        {onSeverityVote && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {severityOptions.map(option => (
              <button
                key={option.key}
                onClick={e => { e.stopPropagation(); onSeverityVote(option.label); }}
                className={`rounded-full px-2 py-1 text-[10px] font-semibold transition-all
                  ${issue.userSeverityVote === option.label
                    ? 'bg-[#2a9d8f] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-[#e8f7f5] hover:text-[#2a9d8f]'
                  }`}
              >
                {option.label} {severityCounts[option.key]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueCard;
