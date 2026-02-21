export type IssueCategory = 'Streetlights' | 'Roads & Infrastructure' | 'Waste Management' | 'Water Supply' | 'Other';

export type IssueStatus = 'Open' | 'In Progress' | 'Resolved' | 'Rejected';

export type IssueSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Issue {
  id: string;
  category: IssueCategory;
  description: string;
  location: string;
  status: IssueStatus;
  severity: IssueSeverity;
  imageUrl: string;
  reporterName: string;
  reporterEmail: string;
  upvotes: number;
  assignedOffice: string;
  createdAt: string;
  hasUpvoted?: boolean;
  severityVotes?: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  userSeverityVote?: IssueSeverity | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'community' | 'authority' | 'admin';
  location: string;
  joinDate: string;
  avatarUrl: string;
  totalReports: number;
  resolved: number;
  active: number;
  points: number;
}
