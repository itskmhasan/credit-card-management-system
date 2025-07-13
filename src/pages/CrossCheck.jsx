import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Loader2,
} from 'lucide-react';

const CrossCheck = () => {
  const { isAdmin, isViewer } = useAuth();
  const [summary, setSummary] = useState(null);
  const [unmatched, setUnmatched] = useState({ applications: [], pf_data: [] });
  const [loading, setLoading] = useState(true);
  const [crossCheckLoading, setCrossCheckLoading] = useState(false);
  const [crossCheckDate, setCrossCheckDate] = useState(new Date().toISOString().split('T')[0]);
  const [crossCheckResult, setCrossCheckResult] = useState(null);

  useEffect(() => {
    fetchSummary();
    fetchUnmatched();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/pfcontinue/summary', {
        credentials: 'include',
      });
      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const fetchUnmatched = async () => {
    try {
      const response = await fetch('/api/applications/unmatched', {
        credentials: 'include',
      });
      const data = await response.json();
      setUnmatched({ applications: data.unmatched_applications || [], pf_data: [] });
    } catch (error) {
      console.error('Failed to fetch unmatched applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCrossCheck = async () => {
    setCrossCheckLoading(true);
    setCrossCheckResult(null);

    try {
      const response = await fetch('/api/pfcontinue/cross-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ upload_date: crossCheckDate }),
      });

      const data = await response.json();
      setCrossCheckResult(data);
      
      // Refresh data after cross-check
      await fetchSummary();
      await fetchUnmatched();
    } catch (error) {
      setCrossCheckResult({ error: 'Cross-check failed: ' + error.message });
    } finally {
      setCrossCheckLoading(false);
    }
  };

  if (!isAdmin() && !isViewer()) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">Only administrators and viewers can access cross-check functionality.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cross-check</h1>
          <p className="text-gray-600">
            Compare applications with PFContinue data and identify matches
          </p>
        </div>
        <Button onClick={() => { fetchSummary(); fetchUnmatched(); }} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_applications}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Matched</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.matched_applications}</div>
              <p className="text-xs text-muted-foreground">
                {summary.match_percentage}% match rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unmatched</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.unmatched_applications}</div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PF Records</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_pf_records}</div>
              <p className="text-xs text-muted-foreground">
                Available for matching
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cross-check Action */}
      {isAdmin() && (
        <Card>
          <CardHeader>
            <CardTitle>Run Cross-check</CardTitle>
            <CardDescription>
              Compare applications with PFContinue data for a specific date
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <Label htmlFor="cross-check-date">PFContinue Upload Date</Label>
                <Input
                  id="cross-check-date"
                  type="date"
                  value={crossCheckDate}
                  onChange={(e) => setCrossCheckDate(e.target.value)}
                />
              </div>
              <Button
                onClick={handleCrossCheck}
                disabled={crossCheckLoading}
                className="px-8"
              >
                {crossCheckLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Run Cross-check
                  </>
                )}
              </Button>
            </div>

            {crossCheckResult && (
              <Alert variant={crossCheckResult.error ? "destructive" : "default"}>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {crossCheckResult.error ? (
                    crossCheckResult.error
                  ) : (
                    <div>
                      <p className="font-medium">{crossCheckResult.message}</p>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">New matches found:</span> {crossCheckResult.matched_count}
                        </div>
                        <div>
                          <span className="font-medium">Total applications:</span> {crossCheckResult.total_applications}
                        </div>
                        <div>
                          <span className="font-medium">Unmatched applications:</span> {crossCheckResult.unmatched_applications?.length || 0}
                        </div>
                        <div>
                          <span className="font-medium">Unmatched PF records:</span> {crossCheckResult.unmatched_pf_data?.length || 0}
                        </div>
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Unmatched Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <XCircle className="mr-2 h-5 w-5 text-red-600" />
            Unmatched Applications
          </CardTitle>
          <CardDescription>
            Applications that don't have corresponding PFContinue records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : unmatched.applications.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <p className="text-gray-600">All applications have been matched!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>App ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unmatched.applications.map((app) => (
                  <TableRow key={app.app_id}>
                    <TableCell className="font-medium">{app.app_id}</TableCell>
                    <TableCell>{app.name}</TableCell>
                    <TableCell>{app.branch_code}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{app.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(app.status)}>
                        {app.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cross-check Results */}
      {crossCheckResult && crossCheckResult.unmatched_pf_data && crossCheckResult.unmatched_pf_data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-yellow-600" />
              Unmatched PFContinue Records
            </CardTitle>
            <CardDescription>
              PFContinue records that don't have corresponding applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>App ID</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Branch Code</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crossCheckResult.unmatched_pf_data.map((record, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{record.app_id}</TableCell>
                    <TableCell>{record.customer_name}</TableCell>
                    <TableCell>{record.branch_code}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const getStatusVariant = (status) => {
  switch (status) {
    case 'UNTOUCH': return 'secondary';
    case 'PENDING': return 'default';
    case 'HOLD': return 'destructive';
    case 'DONE': return 'success';
    default: return 'secondary';
  }
};

export default CrossCheck;

