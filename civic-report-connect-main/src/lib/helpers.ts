import type { IssueStatus } from '@/types/issue';

export const getStatusClass = (status: IssueStatus): string => {
  switch (status) {
    case 'Open': return 'status-open';
    case 'In Progress': return 'status-progress';
    case 'Resolved': return 'status-resolved';
    case 'Rejected': return 'bg-muted text-muted-foreground';
    default: return '';
  }
};

export const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const simulateAIClassification = (imagePresent: boolean): { category: string; severity: string } | null => {
  if (!imagePresent) return null;
  const categories = ['Roads & Infrastructure', 'Streetlights', 'Waste Management', 'Water Supply'];
  const severities = ['Low', 'Medium', 'High', 'Critical'];
  return {
    category: categories[Math.floor(Math.random() * categories.length)],
    severity: severities[Math.floor(Math.random() * severities.length)],
  };
};

export const simulateLocation = (): string => {
  const locations = [
    '42 Park Avenue, Sector 12',
    '15 MG Road, City Center',
    '78 Ring Road, Ward 5',
    '23 Gandhi Nagar, Block B',
    '56 Station Road, Near Market',
  ];
  return locations[Math.floor(Math.random() * locations.length)];
};
