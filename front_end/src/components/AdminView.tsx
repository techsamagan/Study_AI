import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, FileText, Brain, TrendingUp, Crown, UserCircle, Search, Filter, ArrowUpDown, CheckCircle, XCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { apiClient, type User } from '../services/api';

interface AdminStats {
  users: {
    total: number;
    pro: number;
    free: number;
    recent_signups: number;
  };
  content: {
    total_documents: number;
    total_summaries: number;
    total_flashcards: number;
    recent_documents: number;
    recent_summaries: number;
    recent_flashcards: number;
  };
  subscriptions: {
    active_pro: number;
  };
}

interface AdminUser extends User {
  plan_limits?: any;
}

export function AdminView() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadDashboardStats();
    loadUsers();
  }, [planFilter, currentPage, searchTerm]);

  const loadDashboardStats = async () => {
    try {
      const data = await apiClient.getAdminDashboardStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load admin stats:', err);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: any = { page: currentPage };
      if (planFilter !== 'all') {
        params.plan_type = planFilter;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      const response = await apiClient.getAdminUsers(params);
      // Handle paginated response
      if (Array.isArray(response)) {
        setUsers(response);
        setTotalPages(1);
      } else {
        setUsers(response.results || []);
        if (response.count !== undefined) {
          setTotalPages(Math.ceil(response.count / 20));
        } else {
          setTotalPages(1);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeUser = async (userId: number) => {
    if (!confirm('Are you sure you want to upgrade this user to Pro?')) return;
    
    try {
      await apiClient.adminUpgradeUser(userId);
      await loadUsers();
      await loadDashboardStats();
    } catch (err: any) {
      setError(err.message || 'Failed to upgrade user');
    }
  };

  const handleDowngradeUser = async (userId: number) => {
    if (!confirm('Are you sure you want to downgrade this user to Free?')) return;
    
    try {
      await apiClient.adminDowngradeUser(userId);
      await loadUsers();
      await loadDashboardStats();
    } catch (err: any) {
      setError(err.message || 'Failed to downgrade user');
    }
  };

  if (loading && !stats) {
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
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage users, subscriptions, and content
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold mt-1">{stats.users.total}</p>
              </div>
              <UserCircle className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mt-4 flex gap-2 text-xs">
              <span className="text-green-600">{stats.users.pro} Pro</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">{stats.users.free} Free</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pro Subscriptions</p>
                <p className="text-2xl font-bold mt-1">{stats.subscriptions.active_pro}</p>
              </div>
              <Crown className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {stats.users.recent_signups} new users (30 days)
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold mt-1">{stats.content.total_documents}</p>
              </div>
              <FileText className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {stats.content.recent_documents} uploaded (30 days)
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Flashcards</p>
                <p className="text-2xl font-bold mt-1">{stats.content.total_flashcards}</p>
              </div>
              <Brain className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {stats.content.recent_flashcards} created (30 days)
            </p>
          </Card>
        </div>
      )}

      {/* Users Management */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Users Management</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-64"
            />
            <Select value={planFilter} onValueChange={(value) => {
              setPlanFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">User</th>
                    <th className="text-left p-3">Plan</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Joined</th>
                    <th className="text-right p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{user.email}</p>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        {user.is_pro ? (
                          <Badge className="bg-purple-600 text-white">
                            <Crown className="w-3 h-3 mr-1" />
                            Pro
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Free</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant={user.subscription_status === 'active' ? 'default' : 'secondary'}>
                          {user.subscription_status}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {new Date(user.date_joined || '').toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2 justify-end">
                          {!user.is_pro ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpgradeUser(user.id)}
                              className="text-green-600"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Upgrade
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDowngradeUser(user.id)}
                              className="text-red-600"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Downgrade
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No users found
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

