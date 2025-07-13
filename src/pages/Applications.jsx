import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Filter,
  Edit,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  UserPlus,
} from 'lucide-react';

const Applications = () => {
  const { user, isAdmin, isOfficer } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    branch_code: '',
    assigned_to: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 0,
  });
  const [selectedApp, setSelectedApp] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [officers, setOfficers] = useState([]);
  const [choices, setChoices] = useState({
    status_choices: [],
    card_choices: [],
    type_choices: [],
  });

  useEffect(() => {
    fetchApplications();
    fetchChoices();
    if (isAdmin()) {
      fetchOfficers();
    }
  }, [filters, pagination.page]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        per_page: pagination.per_page,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      });

      const response = await fetch(`/api/applications?${params}`, {
        credentials: 'include',
      });
      const data = await response.json();
      
      setApplications(data.applications || []);
      setPagination(prev => ({
        ...prev,
        total: data.total,
        pages: data.pages,
      }));
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChoices = async () => {
    try {
      const response = await fetch('/api/applications/choices', {
        credentials: 'include',
      });
      const data = await response.json();
      setChoices(data);
    } catch (error) {
      console.error('Failed to fetch choices:', error);
    }
  };

  const fetchOfficers = async () => {
    try {
      const response = await fetch('/api/users/officers', {
        credentials: 'include',
      });
      const data = await response.json();
      setOfficers(data.officers || []);
    } catch (error) {
      console.error('Failed to fetch officers:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleUpdateApplication = async (appId, updates) => {
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        fetchApplications();
        setEditDialogOpen(false);
        setSelectedApp(null);
      }
    } catch (error) {
      console.error('Failed to update application:', error);
    }
  };

  const handleAssignApplication = async (appId, officerId) => {
    try {
      const response = await fetch(`/api/applications/${appId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ officer_id: officerId }),
      });

      if (response.ok) {
        fetchApplications();
        setAssignDialogOpen(false);
        setSelectedApp(null);
      }
    } catch (error) {
      console.error('Failed to assign application:', error);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'UNTOUCH': return 'secondary';
      case 'PENDING': return 'default';
      case 'HOLD': return 'destructive';
      case 'DONE': return 'success';
      default: return 'secondary';
    }
  };

  const getCardTypeBadgeColor = (type) => {
    switch (type) {
      case 'CLASSIC': return 'bg-gray-100 text-gray-800';
      case 'GOLD': return 'bg-yellow-100 text-yellow-800';
      case 'PLATINUM': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600">
            Manage and track credit card applications
          </p>
        </div>
        <Button onClick={fetchApplications} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  {choices.status_choices.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type-filter">Card Type</Label>
              <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {choices.type_choices.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="branch-filter">Branch Code</Label>
              <Input
                id="branch-filter"
                placeholder="Enter branch code"
                value={filters.branch_code}
                onChange={(e) => handleFilterChange('branch_code', e.target.value)}
              />
            </div>

            {(isAdmin() || user?.role === 'VIEWER') && (
              <div>
                <Label htmlFor="officer-filter">Assigned Officer</Label>
                <Select value={filters.assigned_to} onValueChange={(value) => handleFilterChange('assigned_to', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All officers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All officers</SelectItem>
                    {officers.map(officer => (
                      <SelectItem key={officer.id} value={officer.id.toString()}>
                        {officer.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications ({pagination.total})</CardTitle>
          <CardDescription>
            {isOfficer() ? 'Your assigned applications' : 'All applications in the system'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>App ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Card</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.app_id}</TableCell>
                      <TableCell>{app.name}</TableCell>
                      <TableCell>{app.branch_code}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{app.card}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCardTypeBadgeColor(app.type)}>
                          {app.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(app.status)}>
                          {app.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {app.assigned_to ? app.assigned_to.username : 'Unassigned'}
                      </TableCell>
                      <TableCell>
                        {new Date(app.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedApp(app);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {isAdmin() && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedApp(app);
                                setAssignDialogOpen(true);
                              }}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.per_page) + 1} to{' '}
                  {Math.min(pagination.page * pagination.per_page, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.pages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Application Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
            <DialogDescription>
              Update application status and remarks
            </DialogDescription>
          </DialogHeader>
          {selectedApp && (
            <EditApplicationForm
              application={selectedApp}
              choices={choices}
              onSubmit={handleUpdateApplication}
              onCancel={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Application Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Application</DialogTitle>
            <DialogDescription>
              Assign this application to an officer
            </DialogDescription>
          </DialogHeader>
          {selectedApp && (
            <AssignApplicationForm
              application={selectedApp}
              officers={officers}
              onSubmit={handleAssignApplication}
              onCancel={() => setAssignDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Edit Application Form Component
const EditApplicationForm = ({ application, choices, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    status: application.status,
    remarks: application.remarks || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(application.id, formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {choices.status_choices.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="remarks">Remarks</Label>
        <Textarea
          id="remarks"
          value={formData.remarks}
          onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
          placeholder="Add remarks..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Update
        </Button>
      </div>
    </form>
  );
};

// Assign Application Form Component
const AssignApplicationForm = ({ application, officers, onSubmit, onCancel }) => {
  const [selectedOfficer, setSelectedOfficer] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedOfficer) {
      onSubmit(application.id, parseInt(selectedOfficer));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="officer">Select Officer</Label>
        <Select value={selectedOfficer} onValueChange={setSelectedOfficer}>
          <SelectTrigger>
            <SelectValue placeholder="Choose an officer" />
          </SelectTrigger>
          <SelectContent>
            {officers.map(officer => (
              <SelectItem key={officer.id} value={officer.id.toString()}>
                {officer.username} ({officer.employee_id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!selectedOfficer}>
          Assign
        </Button>
      </div>
    </form>
  );
};

export default Applications;

