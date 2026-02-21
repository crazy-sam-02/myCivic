import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { authApi } from '@/lib/api';
import { MapPin, Calendar, FileText, CheckCircle, Clock, Star, Settings, LogOut, Edit, X, Save, Lock, Bell, Eye, EyeOff } from 'lucide-react';

interface ProfileScreenProps {
  onLogout: () => void;
}

const ProfileScreen = ({ onLogout }: ProfileScreenProps) => {
  const { user, logout } = useApp();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user.name,
    location: user.location,
    email: user.email,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [settingsForm, setSettingsForm] = useState({
    emailNotifications: true,
    reportReminders: true,
    communityUpdates: true,
  });

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const handleEditProfile = () => {
    setEditForm({
      name: user.name,
      location: user.location,
      email: user.email,
    });
    setEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      alert('Name is required');
      return;
    }
    
    try {
      setIsLoading(true);
      const result = await authApi.updateProfile(editForm.name, editForm.location);
      if (!result.ok) {
        alert(result.data?.message || 'Failed to update profile');
        return;
      }
      alert('Profile updated successfully');
      setEditModalOpen(false);
      // Refresh user data
      window.location.reload();
    } catch (error: any) {
      alert(error.message || 'Error updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert('Please fill in all password fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      setIsLoading(true);
      const result = await authApi.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
        passwordForm.confirmPassword
      );
      if (!result.ok) {
        alert(result.data?.message || 'Failed to change password');
        return;
      }
      alert('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (error: any) {
      alert(error.message || 'Error changing password');
    } finally {
      setIsLoading(false);
    }
  };

  const stats = [
    { label: 'Reports', value: user.totalReports, icon: FileText, color: 'text-primary' },
    { label: 'Resolved', value: user.resolved, icon: CheckCircle, color: 'text-primary' },
    { label: 'Active', value: user.active, icon: Clock, color: 'text-warning' },
    { label: 'Points', value: user.points, icon: Star, color: 'text-primary' },
  ];

  const achievements = [
    { emoji: '🏆', title: 'First Report', earned: true, description: 'Submitted your first report' },
    { emoji: '⭐', title: '10 Reports', earned: user.totalReports >= 10, description: 'Submitted 10 reports' },
    { emoji: '🔥', title: 'Active Citizen', earned: true, description: 'Actively reporting issues' },
    { emoji: '💎', title: 'Top Contributor', earned: user.points >= 300, description: 'Earned 300+ points' },
  ];

  return (
    <div className="min-h-screen bg-[#f6f7f9] px-4 py-6 fade-in">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 text-center mb-5">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
          <span className="text-3xl font-bold text-emerald-600">{user.name.charAt(0)}</span>
        </div>
        <h2 className="text-lg font-bold text-foreground">{user.name}</h2>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
          {user.location && <span className="flex items-center gap-1"><MapPin size={12} /> {user.location}</span>}
          <span className="flex items-center gap-1"><Calendar size={12} /> {user.joinDate}</span>
        </div>
        <div className="mt-3">
          <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">
            {user.role}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-border/60 p-3 text-center">
            <s.icon size={18} className={`text-emerald-600 mx-auto mb-1`} />
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Achievements</h3>
        <div className="grid grid-cols-4 gap-2">
          {achievements.map(a => (
            <div
              key={a.title}
              className={`bg-white rounded-xl border border-border/60 p-3 text-center group relative ${!a.earned ? 'opacity-40' : 'cursor-pointer'}`}
              title={a.earned ? a.description : 'Not earned yet'}
            >
              <span className="text-2xl">{a.emoji}</span>
              <p className="text-[10px] text-muted-foreground mt-1">{a.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={handleEditProfile}
          className="w-full h-12 bg-white border border-border/60 rounded-xl flex items-center gap-3 px-4 text-sm font-medium text-foreground hover:bg-emerald-50 transition-colors"
        >
          <Edit size={18} className="text-emerald-600" /> Edit Profile
        </button>
        <button
          onClick={() => setSettingsModalOpen(true)}
          className="w-full h-12 bg-white border border-border/60 rounded-xl flex items-center gap-3 px-4 text-sm font-medium text-foreground hover:bg-emerald-50 transition-colors"
        >
          <Settings size={18} className="text-emerald-600" /> Settings
        </button>
        <button
          onClick={handleLogout}
          className="w-full h-12 bg-red-50 rounded-xl flex items-center gap-3 px-4 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-background rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Edit Profile</h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  disabled
                  className="w-full h-12 px-4 rounded-xl border border-border bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="City, Country"
                  className="w-full h-12 px-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              {!showPasswordForm ? (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="w-full h-12 bg-card border border-border rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <Lock size={16} /> Change Password
                </button>
              ) : (
                <div className="space-y-3 p-3 bg-card border border-border rounded-xl">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">New Password</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                      className="flex-1 h-9 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleChangePassword}
                      disabled={isLoading}
                      className="flex-1 h-9 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {isLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setShowPasswordForm(false);
                }}
                className="flex-1 h-12 border border-border rounded-xl text-foreground font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="flex-1 h-12 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
              >
                <Save size={16} /> {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {settingsModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-background rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Settings</h3>
              <button
                onClick={() => setSettingsModalOpen(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <h4 className="text-sm font-semibold text-foreground">Notifications</h4>

              <div className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive updates via email</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.emailNotifications}
                  onChange={e => setSettingsForm({ ...settingsForm, emailNotifications: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Report Reminders</p>
                    <p className="text-xs text-muted-foreground">Get reminders to report issues</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.reportReminders}
                  onChange={e => setSettingsForm({ ...settingsForm, reportReminders: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Community Updates</p>
                    <p className="text-xs text-muted-foreground">Receive community news</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.communityUpdates}
                  onChange={e => setSettingsForm({ ...settingsForm, communityUpdates: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-3">Privacy & Security</h4>
                <button className="w-full h-12 bg-card border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  Privacy Policy
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSettingsModalOpen(false)}
                className="flex-1 h-12 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;
