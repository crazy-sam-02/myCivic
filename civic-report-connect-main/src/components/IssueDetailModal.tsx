import { useState, useRef } from 'react';
import type { Issue, IssueStatus } from '@/types/issue';
import { getStatusClass, formatDate } from '@/lib/helpers';
import { X, MapPin, Calendar, AlertTriangle, Building2, Upload, Loader2 } from 'lucide-react';
import { aiApi } from '@/lib/api';

interface IssueDetailModalProps {
  issue: Issue;
  onClose: () => void;
  isAdmin?: boolean;
  onStatusChange?: (id: string, status: IssueStatus, proofUrl?: string, notes?: string) => void;
  onSeverityVote?: (id: string, severity: Issue['severity']) => void;
}

const IssueDetailModal = ({ issue, onClose, isAdmin = false, onStatusChange, onSeverityVote }: IssueDetailModalProps) => {
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [proofImage, setProofImage] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const severityCounts = issue.severityVotes || { low: 0, medium: 0, high: 0, critical: 0 };
  const severityOptions = [
    { label: 'Low', key: 'low' },
    { label: 'Medium', key: 'medium' },
    { label: 'High', key: 'high' },
    { label: 'Critical', key: 'critical' },
  ] as const;

  const handleProofImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setProofImage(previewUrl);

    setIsResolving(true);
    try {
      const uploadRes = await aiApi.uploadImage(file);
      if (uploadRes.ok && uploadRes.data?.imageUrl) {
        setProofImage(uploadRes.data.imageUrl);
      }
    } catch (err) {
      console.error('Error uploading proof image:', err);
    } finally {
      setIsResolving(false);
    }
  };

  const handleResolveSubmit = async () => {
    if (!proofImage && !notes) {
      alert('Please provide proof image or notes');
      return;
    }
    setIsResolving(true);
    try {
      if (onStatusChange) {
        onStatusChange(issue.id, 'Resolved', proofImage, notes);
      }
      setShowResolveForm(false);
      setProofImage('');
      setNotes('');
      onClose();
    } finally {
      setIsResolving(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-card rounded-t-3xl slide-up max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card z-10 flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-lg text-foreground">Issue Details</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="relative h-56 overflow-hidden">
          <img src={issue.imageUrl} alt={issue.category} className="w-full h-full object-cover" />
          <span className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold ${getStatusClass(issue.status)}`}>
            {issue.status}
          </span>
        </div>

        <div className="p-5 space-y-4">
          <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full">{issue.category}</span>

          <p className="text-foreground text-sm leading-relaxed">{issue.description}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MapPin size={15} className="text-primary" />
              <span>{issue.location}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar size={15} className="text-primary" />
              <span>{formatDate(issue.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <AlertTriangle size={15} className="text-primary" />
              <span>Severity: {issue.severity}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Building2 size={15} className="text-primary" />
              <span>{issue.assignedOffice}</span>
            </div>
          </div>

          {onSeverityVote && (
            <div className="pt-2">
              <p className="text-xs font-semibold text-foreground mb-2">Vote Severity</p>
              <div className="flex flex-wrap gap-2">
                {severityOptions.map(option => (
                  <button
                    key={option.key}
                    onClick={() => onSeverityVote(issue.id, option.label)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all
                      ${issue.userSeverityVote === option.label
                        ? 'bg-[#2a9d8f] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-[#e8f7f5] hover:text-[#2a9d8f]'
                      }`}
                  >
                    {option.label} {severityCounts[option.key]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">Reported by <span className="font-semibold text-foreground">{issue.reporterName}</span></p>

          {/* Show Resolution Details if Resolved */}
          {issue.status === 'Resolved' && (
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400">✓ Issue Resolved</p>
              </div>
            </div>
          )}

          {showResolveForm && (
            <div className="space-y-3 pt-2 border-t border-border">
              <h3 className="font-semibold text-foreground text-sm">Mark as Resolved</h3>

              {/* Proof Image Upload */}
              <div>
                {proofImage ? (
                  <div className="relative rounded-xl overflow-hidden h-32 mb-2">
                    <img src={proofImage} alt="Proof" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setProofImage('')}
                      className="absolute top-2 right-2 p-1.5 bg-foreground/80 rounded-full hover:bg-foreground transition-colors"
                    >
                      <X size={14} className="text-background" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 border-2 border-dashed border-primary/30 rounded-xl flex flex-col items-center justify-center gap-2 text-primary hover:bg-primary/5 transition-colors"
                  >
                    <Upload size={20} />
                    <span className="text-xs font-medium">Upload Proof Image</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProofImageSelect}
                />
              </div>

              {/* Notes */}
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add resolution notes..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none text-sm"
              />

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowResolveForm(false);
                    setProofImage('');
                    setNotes('');
                  }}
                  className="flex-1 h-10 rounded-lg bg-muted text-muted-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolveSubmit}
                  disabled={isResolving}
                  className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                >
                  {isResolving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Resolving...
                    </>
                  ) : (
                    'Confirm Resolve'
                  )}
                </button>
              </div>
            </div>
          )}

          {isAdmin && onStatusChange && issue.status !== 'Resolved' && issue.status !== 'Rejected' && !showResolveForm && (
            <div className="flex gap-2 pt-2">
              {issue.status === 'Open' && (
                <button
                  onClick={() => onStatusChange(issue.id, 'In Progress')}
                  className="flex-1 h-11 rounded-xl text-sm font-semibold status-progress border-0"
                >
                  Mark In Progress
                </button>
              )}
              <button
                onClick={() => setShowResolveForm(true)}
                className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
              >
                Resolve with Proof
              </button>
              <button
                onClick={() => onStatusChange(issue.id, 'Rejected')}
                className="flex-1 h-11 rounded-xl bg-muted text-muted-foreground text-sm font-semibold"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IssueDetailModal;
