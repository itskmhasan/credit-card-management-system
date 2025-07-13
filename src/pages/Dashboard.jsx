import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

const Dashboard = () => {
  const { user, isAdmin, isOfficer } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    try {
      const response = await fetch('/api/reports/dashboard', {
        credentials: 'include',
      });
      const data = await response.json();
      setMetrics(data.dashboard_metrics);
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const statusColors = {
    UNTOUCH: '#94a3b8',
    PENDING: '#f59e0b',
    HOLD: '#ef4444',
    DONE: '#10b981',
  };

  const statusData = Object.entries(metrics?.status_counts || {}).map(([status, count]) => ({
    name: status,
    value: count,
    color: statusColors[status],
  }));

  const typeData = Object.entries(metrics?.type_counts || {}).map(([type, count]) => ({
    name: type,
    count,
  }));

  const branchData = metrics?.branch_counts?.slice(0, 10) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {user?.username}! Here's your overview.
          </p>
        </div>
        <Button onClick={fetchDashboardMetrics} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_applications || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.today_applications || 0} added today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {metrics?.status_counts?.PENDING || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.old_pending_count || 0} older than 3 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics?.status_counts?.DONE || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Applications processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Hold</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics?.status_counts?.HOLD || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>
              Current status breakdown of all applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Card Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Card Type Distribution</CardTitle>
            <CardDescription>
              Applications by card type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Branch Performance and Assignment Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Branches */}
        <Card>
          <CardHeader>
            <CardTitle>Top Branches</CardTitle>
            <CardDescription>
              Branches with most applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {branchData.map((branch, index) => (
                <div key={branch.branch_code} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <span className="font-medium">Branch {branch.branch_code}</span>
                  </div>
                  <Badge variant="secondary">{branch.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Assignment Statistics (Admin/Viewer only) */}
        {(isAdmin() || user?.role === 'VIEWER') && metrics?.assignment_stats && (
          <Card>
            <CardHeader>
              <CardTitle>Assignment Statistics</CardTitle>
              <CardDescription>
                Application assignment overview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Applications</span>
                  <Badge variant="outline">
                    {metrics.assignment_stats.total_applications}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Assigned</span>
                  <Badge variant="default">
                    {metrics.assignment_stats.assigned_applications}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Unassigned</span>
                  <Badge variant="destructive">
                    {metrics.assignment_stats.unassigned_applications}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity for Officers */}
        {isOfficer() && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your recent application updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics?.recent_activity?.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="flex-1">
                      {activity.action} - App #{activity.application_id}
                    </span>
                    <span className="text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                )) || (
                  <p className="text-gray-500 text-sm">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

