import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, Brain, Clock, TrendingUp, Plus, MoreVertical, Calendar, Trash2, Loader2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { apiClient, type Document, type Summary, type DashboardStats } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

export function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [recentSummaries, setRecentSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingAllDocs, setDeletingAllDocs] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, documents, summaries] = await Promise.all([
        apiClient.getDashboardStats(),
        apiClient.getDocuments(),
        apiClient.getSummaries(),
      ]);

      setStats(statsData);
      setRecentDocuments(documents.slice(0, 4));
      setRecentSummaries(summaries.slice(0, 3));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  const handleDeleteAllDocuments = async () => {
    if (!stats?.documents_count || stats.documents_count === 0) return;

    if (!confirm(`Are you sure you want to delete ALL ${stats.documents_count} documents? This action cannot be undone and will also delete all associated summaries and flashcards!`)) {
      return;
    }

    try {
      setDeletingAllDocs(true);
      const result = await apiClient.deleteAllDocuments();
      
      // Refresh dashboard data
      await loadDashboardData();
      alert(result.message);
    } catch (error: any) {
      console.error('Failed to delete all documents:', error);
      alert(error.message || 'Failed to delete documents');
    } finally {
      setDeletingAllDocs(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  const statsData = stats ? [
    { label: 'Documents', value: stats.documents_count.toString(), icon: FileText, change: '' },
    { label: 'Flashcards', value: stats.flashcards_count.toString(), icon: Brain, change: '' },
    { label: 'Study Time', value: stats.study_time, icon: Clock, change: '' },
    { label: 'Mastery', value: `${stats.mastery}%`, icon: TrendingUp, change: '' },
  ] : [];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Welcome back!</h1>
          <p className="text-muted-foreground mt-1">Here's your learning progress</p>
        </div>
        <Button className="gradient-blue-purple text-white border-0">
          <Plus className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-muted-foreground">
                      {stat.label}
                    </p>
                    <h3 className="mt-2">{stat.value}</h3>
                    <p className="text-muted-foreground mt-1">
                      {stat.change}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3>Recent Documents</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">View all</Button>
              {stats && stats.documents_count > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAllDocuments}
                  disabled={deletingAllDocs}
                >
                  {deletingAllDocs ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-3">
            {recentDocuments.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <p>No documents yet. Upload your first document to get started!</p>
              </Card>
            ) : (
              recentDocuments.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="truncate">{doc.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                          {doc.pages && <span>{doc.pages} pages</span>}
                          {doc.pages && <span>•</span>}
                          <span>{formatDate(doc.uploaded_at)}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3>Recent Summaries</h3>
            <Button variant="ghost" size="sm">View all</Button>
          </div>
          <div className="space-y-3">
            {recentSummaries.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <p>No summaries yet. Generate summaries from your documents!</p>
              </Card>
            ) : (
              recentSummaries.map((summary, index) => (
              <motion.div
                key={summary.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="truncate">{summary.full_summary.substring(0, 50)}...</h4>
                      <p className="text-muted-foreground mt-1">
                        {formatDate(summary.created_at)}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100">
                          <Brain className="w-3 h-3 mr-1" />
                          {summary.key_points.length} key points
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      <Card className="p-6 gradient-blue-purple text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white">Study Session Reminder</h3>
            <p className="text-white/90 mt-1">
              You have 15 flashcards due for review today
            </p>
          </div>
          <Button variant="secondary" className="bg-white text-purple-700 hover:bg-white/90">
            <Calendar className="w-4 h-4 mr-2" />
            Start Review
          </Button>
        </div>
      </Card>
    </div>
  );
}
