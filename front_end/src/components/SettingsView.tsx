import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Mail, UserCircle, Save, Loader2, LogOut, Bell, Shield, Globe, Crown, Zap, CheckCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { apiClient, type User as UserType, getStoredUser, setStoredUser } from '../services/api';

interface SettingsViewProps {
  onLogout?: () => void;
}

export function SettingsView({ onLogout }: SettingsViewProps) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [editing, setEditing] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const profileData = await apiClient.getProfile();
      setUser(profileData);
      setFormData({
        username: profileData.username,
        email: profileData.email,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
      });
      setStoredUser(profileData);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
      // Fallback to stored user if API fails
      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser);
        setFormData({
          username: storedUser.username,
          email: storedUser.email,
          first_name: storedUser.first_name,
          last_name: storedUser.last_name,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // Update profile via API
      const updatedUser = await apiClient.updateProfile(formData);
      setUser(updatedUser);
      setStoredUser(updatedUser);
      setEditing(false);
      setSuccess('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      });
    }
    setEditing(false);
    setError('');
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const handleUpgrade = async () => {
    try {
      setUpgrading(true);
      setError('');
      setSuccess('');
      
      // Create Stripe checkout session
      const response = await apiClient.createCheckoutSession();
      
      // Check if we got a checkout URL
      if (response.checkout_url) {
        // Redirect to Stripe checkout
        window.location.href = response.checkout_url;
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (err: any) {
      console.error('Upgrade error:', err);
      const errorMessage = err.message || 'Failed to create checkout session. Please try again.';
      setError(errorMessage);
      setUpgrading(false);
      
      // Show error for longer if it's a configuration issue
      if (errorMessage.includes('not configured') || errorMessage.includes('Stripe')) {
        setTimeout(() => setError(''), 10000);
      } else {
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  // Check for payment success on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const sessionId = urlParams.get('session_id');
    const canceled = urlParams.get('canceled');

    if (success === 'true' && sessionId) {
      // Verify payment and upgrade user
      apiClient.verifyPayment(sessionId)
        .then((response) => {
          setUser(response.user);
          setStoredUser(response.user);
          setSuccess('Successfully upgraded to Pro plan!');
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
          setTimeout(() => setSuccess(''), 5000);
        })
        .catch((err: any) => {
          setError(err.message || 'Failed to verify payment. Please contact support.');
        });
    } else if (canceled === 'true') {
      setError('Payment was canceled. You can try again anytime.');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setError(''), 5000);
    }
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">
          {success}
        </div>
      )}

      {/* Plan Status Card */}
      {user && (
        <Card className={`p-6 ${user.is_pro ? 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200' : 'border-blue-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${user.is_pro ? 'gradient-blue-purple' : 'bg-blue-100'}`}>
                {user.is_pro ? (
                  <Crown className="w-6 h-6 text-white" />
                ) : (
                  <Zap className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">
                    {user.is_pro ? 'Pro Plan' : 'Free Plan'}
                  </h3>
                  {user.is_pro && (
                    <Badge className="bg-purple-600 text-white">Active</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {user.is_pro 
                    ? 'Unlimited access to all features'
                    : 'Upgrade to Pro for unlimited features'
                  }
                </p>
              </div>
            </div>
            {!user.is_pro && (
              <Button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="gradient-blue-purple text-white border-0"
              >
                {upgrading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Upgrading...
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </>
                )}
              </Button>
            )}
          </div>
          
          {user.plan_limits && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Documents</p>
                <p className="text-sm font-semibold">
                  {user.plan_limits.documents.remaining === -1 ? '∞' : `${user.plan_limits.documents.remaining}/${user.plan_limits.documents.limit}`}
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Summaries</p>
                <p className="text-sm font-semibold">
                  {user.plan_limits.summaries.remaining === -1 ? '∞' : `${user.plan_limits.summaries.remaining}/${user.plan_limits.summaries.limit}`}
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Flashcards</p>
                <p className="text-sm font-semibold">
                  {user.plan_limits.flashcards.remaining === -1 ? '∞' : `${user.plan_limits.flashcards.remaining}/${user.plan_limits.flashcards.limit}`}
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">File Size</p>
                <p className="text-sm font-semibold">
                  {user.plan_limits.max_file_size_mb}MB
                </p>
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg gradient-blue-purple flex items-center justify-center">
                  <UserCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Profile Information</h3>
                  <p className="text-sm text-muted-foreground">Update your personal information</p>
                </div>
              </div>
              {!editing && (
                <Button
                  variant="outline"
                  onClick={() => setEditing(true)}
                >
                  Edit Profile
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    disabled={!editing}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    disabled={!editing}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={!editing}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!editing}
                  className="mt-1"
                />
              </div>

              {editing && (
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="gradient-blue-purple text-white border-0"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Account Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Account Settings</h3>
                <p className="text-sm text-muted-foreground">Manage your account security</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Change Password</p>
                  <p className="text-sm text-muted-foreground">Update your password to keep your account secure</p>
                </div>
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                </div>
                <Button variant="outline" size="sm">
                  Enable
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full gradient-blue-purple flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold">{user?.first_name} {user?.last_name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>@{user?.username}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Notifications</h3>
                <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Notifications</span>
                <Button variant="outline" size="sm">Enable</Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Study Reminders</span>
                <Button variant="outline" size="sm">Enable</Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-destructive">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-destructive">Danger Zone</h3>
                <p className="text-sm text-muted-foreground">Irreversible actions</p>
              </div>
            </div>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

