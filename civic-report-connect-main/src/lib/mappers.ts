import type { Issue, IssueCategory, IssueSeverity, IssueStatus, User } from "@/types/issue";

type ReportApi = {
  _id: string;
  category: IssueCategory;
  description: string;
  status: IssueStatus;
  severity: IssueSeverity;
  imageUrl?: string;
  location?: { address?: string };
  assignedTo?: { department?: string };
  reportedBy?: { username?: string; email?: string };
  upvotes?: number;
  hasUpvoted?: boolean;
  severityVotes?: { low: number; medium: number; high: number; critical: number };
  userSeverityVote?: IssueSeverity | null;
  createdAt: string;
};

export const mapReportToIssue = (report: ReportApi): Issue => ({
  id: report._id,
  category: report.category,
  description: report.description,
  location: report.location?.address || "Unknown location",
  status: report.status,
  severity: report.severity,
  imageUrl: report.imageUrl || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400&h=300&fit=crop",
  reporterName: report.reportedBy?.username || "Anonymous",
  reporterEmail: report.reportedBy?.email || "",
  upvotes: report.upvotes || 0,
  assignedOffice: report.assignedTo?.department || "General Office",
  createdAt: report.createdAt,
  hasUpvoted: report.hasUpvoted || false,
  severityVotes: report.severityVotes || { low: 0, medium: 0, high: 0, critical: 0 },
  userSeverityVote: report.userSeverityVote || null,
});

export const mapUser = (user: { username: string; email: string; role: string; createdAt?: string; _id?: string; id?: string; location?: string }): User => ({
  id: user.id || user._id || "",
  name: user.username,
  email: user.email,
  role: (user.role as 'user' | 'community' | 'authority' | 'admin') || 'user',
  location: user.location || "",
  joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "",
  avatarUrl: "",
  totalReports: 0,
  resolved: 0,
  active: 0,
  points: 0,
});
