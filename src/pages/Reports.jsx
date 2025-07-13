import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Download,
  Calendar,
  Users,
  Building,
  TrendingUp,
  RefreshCw,
  FileText,
} from 'lucide-react';

const Reports = () => {
  const { user, isAdmin, isOfficer } = useAuth();
  const [activeTab, setActiveTab] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState({
    daily: null,
    branch: null,
    officer: null,
    custom: null,
  });
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    start_date: '',
    end_date: '',
    card_type: '',
    status: '',
    branch_code: '',
    officer_id: '',
  });

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailyReport();
    } else if (activeTab === 'branch') {
      fetchBranchReport();
    } else if (activeTab === 'officer') {
      fetchOfficerReport();
    }
  }, [activeTab, filters.date]);

  const fetchDailyReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/daily?date=${filters.date}`, {
        credentials: 'include',
      });
      const data = await response.json();
      setReports(prev => ({ ...prev, daily: data.daily_report }));
    } catch (error) {
      console.error('Failed to fetch daily report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchReport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reports/branch-wise', {
        credentials: 'include',
      });
      const data = await response.json();
      setReports(prev => ({ ...prev, branch: data.branch_wise_report }));
    } catch (error) {
      console.error('Failed to fetch branch report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficerReport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reports/officer-performance', {
        credentials: 'include',
      });
      const data = await response.json();
      setReports(prev => ({ ...prev, officer: data.officer_performance }));
    } catch (error) {
      console.error('Failed to fetch officer report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomReport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reports/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          start_date: filters.start_date,
          end_date: filters.end_date,
          card_type: filters.card_type,
          status: filters.status,
          branch_code: filters.branch_code,
          officer_id: filters.officer_id,
        }),
      });
      const data = await response.json();
      setReports(prev => ({ ...prev, custom: data.custom_report }));
    } catch (error) {
      console.error('Failed to fetch custom report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    try {
      const response = await fetch('/api/reports/export/excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(filters),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'credit_card_applications_report.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const statusColors = {
    UNTOUCH: '#94a3b8',
    PENDING: '#f59e0b',
    HOLD: '#ef4444',
    DONE: '#10b981',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">
            Comprehensive reporting and performance analytics
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={exportToExcel} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily">Daily Report</TabsTrigger>
          <TabsTrigger value="branch">Branch-wise</TabsTrigger>
          <TabsTrigger value="officer">Officer Performance</TabsTrigger>
          <TabsTrigger value="custom">Custom Report</TabsTrigger>
        </TabsList>

        {/* Daily Report */}
        <TabsContent value="daily" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Daily Task Report
              </CardTitle>
              <CardDescription>
                Summary of applications for a specific date
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div>
                  <Label htmlFor="report-date">Report Date</Label>
                  <Input
                    id="report-date"
                    type="date"
                    value={filters.date}
                    onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <Button onClick={fetchDailyReport} disabled={loading}>
                  {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <BarChart3 className="mr-2 h-4 w-4" />}
                  Generate Report
                </Button>
              </div>

              {reports.daily && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{reports.daily.total_applications}</div>
                        <p className="text-sm text-muted-foreground">Total Applications</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">
                          {Object.values(reports.daily.breakdown_by_type).reduce((acc, type) => acc + (type.DONE || 0), 0)}
                        </div>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-yellow-600">
                          {Object.values(reports.daily.breakdown_by_type).reduce((acc, type) => acc + (type.PENDING || 0), 0)}
                        </div>
                        <p className="text-sm text-muted-foreground">Pending</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Type Breakdown Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Breakdown by Card Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={Object.entries(reports.daily.breakdown_by_type).map(([type, statuses]) => ({
                          type,
                          ...statuses,
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="type" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="UNTOUCH" stackId="a" fill={statusColors.UNTOUCH} />
                          <Bar dataKey="PENDING" stackId="a" fill={statusColors.PENDING} />
                          <Bar dataKey="HOLD" stackId="a" fill={statusColors.HOLD} />
                          <Bar dataKey="DONE" stackId="a" fill={statusColors.DONE} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Officer Breakdown */}
                  {reports.daily.officer_breakdown && reports.daily.officer_breakdown.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Officer Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Officer</TableHead>
                              <TableHead>Untouched</TableHead>
                              <TableHead>Pending</TableHead>
                              <TableHead>Hold</TableHead>
                              <TableHead>Done</TableHead>
                              <TableHead>Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reports.daily.officer_breakdown.map((officer) => (
                              <TableRow key={officer.officer}>
                                <TableCell className="font-medium">{officer.officer}</TableCell>
                                <TableCell>{officer.stats.UNTOUCH || 0}</TableCell>
                                <TableCell>{officer.stats.PENDING || 0}</TableCell>
                                <TableCell>{officer.stats.HOLD || 0}</TableCell>
                                <TableCell>{officer.stats.DONE || 0}</TableCell>
                                <TableCell className="font-medium">
                                  {Object.values(officer.stats).reduce((a, b) => a + b, 0)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branch-wise Report */}
        <TabsContent value="branch" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="mr-2 h-5 w-5" />
                Branch-wise Performance
              </CardTitle>
              <CardDescription>
                Application statistics by branch
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : reports.branch ? (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={reports.branch.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="branch_code" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="total" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Branch Code</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Untouched</TableHead>
                        <TableHead>Pending</TableHead>
                        <TableHead>Hold</TableHead>
                        <TableHead>Done</TableHead>
                        <TableHead>Assigned Officers</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.branch.map((branch) => (
                        <TableRow key={branch.branch_code}>
                          <TableCell className="font-medium">{branch.branch_code}</TableCell>
                          <TableCell className="font-medium">{branch.total}</TableCell>
                          <TableCell>{branch.status_breakdown.UNTOUCH || 0}</TableCell>
                          <TableCell>{branch.status_breakdown.PENDING || 0}</TableCell>
                          <TableCell>{branch.status_breakdown.HOLD || 0}</TableCell>
                          <TableCell>{branch.status_breakdown.DONE || 0}</TableCell>
                          <TableCell>
                            {branch.assigned_officers.length > 0 ? (
                              <div className="space-y-1">
                                {branch.assigned_officers.slice(0, 3).map((officer, index) => (
                                  <Badge key={index} variant="outline" className="mr-1">
                                    {officer.officer} ({officer.count})
                                  </Badge>
                                ))}
                                {branch.assigned_officers.length > 3 && (
                                  <Badge variant="secondary">+{branch.assigned_officers.length - 3} more</Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500">None</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Click "Generate Report" to load branch data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Officer Performance */}
        <TabsContent value="officer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Officer Performance Report
              </CardTitle>
              <CardDescription>
                Individual officer productivity and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : reports.officer ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{reports.officer.length}</div>
                        <p className="text-sm text-muted-foreground">Active Officers</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {reports.officer.reduce((acc, officer) => acc + officer.total_assigned, 0)}
                        </div>
                        <p className="text-sm text-muted-foreground">Total Assigned</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {reports.officer.reduce((acc, officer) => acc + (officer.status_breakdown.DONE || 0), 0)}
                        </div>
                        <p className="text-sm text-muted-foreground">Total Completed</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Officer</TableHead>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Assigned</TableHead>
                        <TableHead>Pending</TableHead>
                        <TableHead>Done</TableHead>
                        <TableHead>Hold</TableHead>
                        <TableHead>Avg. Days</TableHead>
                        <TableHead>Oldest Pending</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.officer.map((officer) => (
                        <TableRow key={officer.officer_id}>
                          <TableCell className="font-medium">{officer.officer_name}</TableCell>
                          <TableCell>{officer.employee_id}</TableCell>
                          <TableCell>{officer.department}</TableCell>
                          <TableCell>{officer.total_assigned}</TableCell>
                          <TableCell>{officer.status_breakdown.PENDING || 0}</TableCell>
                          <TableCell className="text-green-600">{officer.status_breakdown.DONE || 0}</TableCell>
                          <TableCell className="text-red-600">{officer.status_breakdown.HOLD || 0}</TableCell>
                          <TableCell>{officer.avg_processing_days}</TableCell>
                          <TableCell>
                            {officer.oldest_pending_days > 0 ? (
                              <Badge variant={officer.oldest_pending_days > 7 ? "destructive" : "secondary"}>
                                {officer.oldest_pending_days} days
                              </Badge>
                            ) : (
                              <span className="text-gray-500">None</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading officer performance data...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Report */}
        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Custom Report
              </CardTitle>
              <CardDescription>
                Generate reports with custom date ranges and filters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="card-type">Card Type</Label>
                  <Select value={filters.card_type} onValueChange={(value) => setFilters(prev => ({ ...prev, card_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      <SelectItem value="CLASSIC">Classic</SelectItem>
                      <SelectItem value="GOLD">Gold</SelectItem>
                      <SelectItem value="PLATINUM">Platinum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="UNTOUCH">Untouched</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="HOLD">Hold</SelectItem>
                      <SelectItem value="DONE">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="branch">Branch Code</Label>
                  <Input
                    id="branch"
                    placeholder="Enter branch code"
                    value={filters.branch_code}
                    onChange={(e) => setFilters(prev => ({ ...prev, branch_code: e.target.value }))}
                  />
                </div>
              </div>

              <Button onClick={fetchCustomReport} disabled={loading} className="w-full">
                {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Generate Custom Report
              </Button>

              {reports.custom && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{reports.custom.summary.total_applications}</div>
                        <p className="text-sm text-muted-foreground">Total Applications</p>
                      </CardContent>
                    </Card>
                    {Object.entries(reports.custom.summary.status_breakdown).map(([status, count]) => (
                      <Card key={status}>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold" style={{ color: statusColors[status] }}>
                            {count}
                          </div>
                          <p className="text-sm text-muted-foreground">{status}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Status Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={Object.entries(reports.custom.summary.status_breakdown).map(([status, count]) => ({
                                name: status,
                                value: count,
                                fill: statusColors[status],
                              }))}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, value }) => `${name}: ${value}`}
                              outerRadius={80}
                              dataKey="value"
                            >
                              {Object.entries(reports.custom.summary.status_breakdown).map(([status], index) => (
                                <Cell key={`cell-${index}`} fill={statusColors[status]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Type Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={Object.entries(reports.custom.summary.type_breakdown).map(([type, count]) => ({
                            type,
                            count,
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="type" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;

