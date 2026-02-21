import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Issue, User, IssueStatus, IssueSeverity } from '@/types/issue';
import { authApi, reportApi } from '@/lib/api';
import { mapReportToIssue, mapUser } from '@/lib/mappers';

const DEFAULT_USER: User = {
  id: '',
  name: 'Guest',
  email: '',
  role: 'user',
  location: '',
  joinDate: '',
  avatarUrl: '',
  totalReports: 0,
  resolved: 0,
  active: 0,
  points: 0,
};

interface AppContextType {
  user: User;
  issues: Issue[];
  myIssues: Issue[];
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: string; message?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; role?: string; message?: string }>;
  firebaseGoogleLogin: (firebaseUser: { email: string; displayName: string; uid: string }) => Promise<{ success: boolean; role?: string; message?: string }>;
  logout: () => Promise<void>;
  addIssue: (issue: Omit<Issue, 'id' | 'createdAt' | 'upvotes' | 'status' | 'assignedOffice' | 'hasUpvoted'>) => Promise<boolean>;
  updateIssueStatus: (id: string, status: IssueStatus) => Promise<void>;
  resolveIssue: (id: string, proofImageUrl: string, notes: string) => Promise<void>;
  upvoteIssue: (id: string) => Promise<void>;
  voteSeverity: (id: string, severity: IssueSeverity) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [myIssues, setMyIssues] = useState<Issue[]>([]);

  const syncStats = useCallback((mine: Issue[]) => {
    const resolved = mine.filter(i => i.status === 'Resolved').length;
    const active = mine.filter(i => i.status === 'Open' || i.status === 'In Progress').length;
    setUser(prev => ({
      ...prev,
      totalReports: mine.length,
      resolved,
      active,
      points: resolved * 20,
    }));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { ok, data } = await authApi.login(email, password);
    if (!ok) {
      return { success: false, message: data?.message || 'Login failed' };
    }
    setUser(mapUser(data.user));
    setIsLoggedIn(true);
    return { success: true, role: data.user.role };
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const { ok, data } = await authApi.register(name, email, password, 'user');
    if (!ok) {
      return { success: false, message: data?.message || 'Signup failed' };
    }
    setUser(mapUser(data.user));
    setIsLoggedIn(true);
    return { success: true, role: data.user.role };
  }, []);

  const firebaseGoogleLogin = useCallback(async (firebaseUser: { email: string; displayName: string; uid: string }) => {
    const { ok, data } = await authApi.firebaseGoogleLogin(firebaseUser);
    if (!ok) {
      return { success: false, message: data?.message || 'Firebase Google login failed' };
    }
    setUser(mapUser(data.user));
    setIsLoggedIn(true);
    return { success: true, role: data.user.role };
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setIsLoggedIn(false);
    setUser(DEFAULT_USER);
    setIssues([]);
    setMyIssues([]);
  }, []);

  const loadReports = useCallback(async () => {
    const [publicRes, myRes] = await Promise.all([
      reportApi.getPublicReports(),
      reportApi.getUserReports(),
    ]);
    if (publicRes.ok) {
      const list = publicRes.data.reports.map(mapReportToIssue);
      setIssues(list);
    }
    if (myRes.ok) {
      const list = myRes.data.reports.map(mapReportToIssue);
      setMyIssues(list);
      syncStats(list);
    }
  }, [syncStats]);

  const addIssue = useCallback(async (issueData: Omit<Issue, 'id' | 'createdAt' | 'upvotes' | 'status' | 'assignedOffice' | 'hasUpvoted'>) => {
    const payload = {
      category: issueData.category,
      description: issueData.description,
      severity: issueData.severity,
      location: { address: issueData.location },
      imageUrl: issueData.imageUrl,
    };
    const { ok, data } = await reportApi.createReport(payload);
    if (!ok) return false;
    const newIssue = mapReportToIssue(data.report);
    setMyIssues(prev => [newIssue, ...prev]);
    setIssues(prev => [newIssue, ...prev]);
    syncStats([newIssue, ...myIssues]);
    return true;
  }, [myIssues, syncStats]);

  const updateIssueStatus = useCallback(async (id: string, status: IssueStatus) => {
    const { ok } = await reportApi.updateStatus(id, status);
    if (!ok) return;
    const updater = (list: Issue[]) => list.map(i => i.id === id ? { ...i, status } : i);
    const updatedMine = myIssues.map(i => i.id === id ? { ...i, status } : i);
    setIssues(updater);
    setMyIssues(updatedMine);
    syncStats(updatedMine);
  }, [myIssues, syncStats]);

  const resolveIssue = useCallback(async (id: string, proofImageUrl: string, notes: string) => {
    const { ok } = await reportApi.resolveReport(id, { proofImageUrl, notes });
    if (!ok) return;
    const updater = (list: Issue[]) => list.map(i => i.id === id ? { ...i, status: 'Resolved' as const } : i);
    const updatedMine = myIssues.map(i => i.id === id ? { ...i, status: 'Resolved' as const } : i);
    setIssues(updater);
    setMyIssues(updatedMine);
    syncStats(updatedMine);
  }, [myIssues, syncStats]);

  const upvoteIssue = useCallback(async (id: string) => {
    const { ok, data } = await reportApi.toggleVote(id);
    if (!ok) return;
    const updater = (list: Issue[]) => list.map(i =>
      i.id === id ? { ...i, upvotes: data.upvotes, hasUpvoted: data.hasUpvoted } : i
    );
    setIssues(updater);
    setMyIssues(updater);
  }, []);

  const voteSeverity = useCallback(async (id: string, severity: IssueSeverity) => {
    const { ok, data } = await reportApi.voteSeverity(id, severity);
    if (!ok) return;
    const updater = (list: Issue[]) => list.map(i =>
      i.id === id
        ? { ...i, severityVotes: data.severityVotes, userSeverityVote: data.userSeverityVote }
        : i
    );
    setIssues(updater);
    setMyIssues(updater);
  }, []);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return; // Only check if token exists
      
      const { ok, data } = await authApi.me();
      if (ok && data?.user) {
        setUser(mapUser(data.user));
        setIsLoggedIn(true);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadReports();
    }
  }, [isLoggedIn, loadReports]);

  return (
    <AppContext.Provider value={{ user, issues, myIssues, isLoggedIn, login, signup, firebaseGoogleLogin, logout, addIssue, updateIssueStatus, resolveIssue, upvoteIssue, voteSeverity }}>
      {children}
    </AppContext.Provider>
  );
};
