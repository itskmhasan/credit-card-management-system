import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload as UploadIcon,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const Upload = () => {
  const { isAdmin } = useAuth();
  const [cmsFile, setCmsFile] = useState(null);
  const [pfFile, setPfFile] = useState(null);
  const [cmsUploading, setCmsUploading] = useState(false);
  const [pfUploading, setPfUploading] = useState(false);
  const [cmsResult, setCmsResult] = useState(null);
  const [pfResult, setPfResult] = useState(null);

  const handleCmsUpload = async () => {
    if (!cmsFile) return;

    setCmsUploading(true);
    setCmsResult(null);

    const formData = new FormData();
    formData.append('file', cmsFile);

    try {
      const response = await fetch('/api/applications/bulk-upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();
      setCmsResult(data);
    } catch (error) {
      setCmsResult({ error: 'Upload failed: ' + error.message });
    } finally {
      setCmsUploading(false);
    }
  };

  const handlePfUpload = async () => {
    if (!pfFile) return;

    setPfUploading(true);
    setPfResult(null);

    const formData = new FormData();
    formData.append('file', pfFile);

    try {
      const response = await fetch('/api/pfcontinue/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();
      setPfResult(data);
    } catch (error) {
      setPfResult({ error: 'Upload failed: ' + error.message });
    } finally {
      setPfUploading(false);
    }
  };

  if (!isAdmin()) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">Only administrators can access the upload functionality.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Data Upload</h1>
        <p className="text-gray-600">
          Upload CMS data and PFContinue files for processing
        </p>
      </div>

      <Tabs defaultValue="cms" className="space-y-6">
        <TabsList>
          <TabsTrigger value="cms">CMS Data Upload</TabsTrigger>
          <TabsTrigger value="pfcontinue">PFContinue Upload</TabsTrigger>
        </TabsList>

        {/* CMS Data Upload */}
        <TabsContent value="cms">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileSpreadsheet className="mr-2 h-5 w-5" />
                CMS Data Upload
              </CardTitle>
              <CardDescription>
                Upload Excel files containing credit card application data from the CMS system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="cms-file" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Click to upload CMS Excel file
                      </span>
                      <input
                        id="cms-file"
                        type="file"
                        className="sr-only"
                        accept=".xlsx,.xls"
                        onChange={(e) => setCmsFile(e.target.files[0])}
                      />
                    </label>
                    <p className="mt-1 text-sm text-gray-500">
                      Excel files only (.xlsx, .xls)
                    </p>
                  </div>
                </div>
              </div>

              {cmsFile && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <FileSpreadsheet className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium">{cmsFile.name}</span>
                  </div>
                  <Button
                    onClick={() => setCmsFile(null)}
                    variant="ghost"
                    size="sm"
                  >
                    Remove
                  </Button>
                </div>
              )}

              <Button
                onClick={handleCmsUpload}
                disabled={!cmsFile || cmsUploading}
                className="w-full"
              >
                {cmsUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadIcon className="mr-2 h-4 w-4" />
                    Upload CMS Data
                  </>
                )}
              </Button>

              {cmsResult && (
                <Alert variant={cmsResult.error ? "destructive" : "default"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {cmsResult.error ? (
                      cmsResult.error
                    ) : (
                      <div>
                        <p className="font-medium">{cmsResult.message}</p>
                        {cmsResult.created_count > 0 && (
                          <p className="mt-1">Created {cmsResult.created_count} applications</p>
                        )}
                        {cmsResult.errors && cmsResult.errors.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium">Errors:</p>
                            <ul className="list-disc list-inside text-sm">
                              {cmsResult.errors.slice(0, 5).map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                              {cmsResult.errors.length > 5 && (
                                <li>... and {cmsResult.errors.length - 5} more</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Expected Format:</h4>
                <p className="text-sm text-gray-600 mb-2">
                  The Excel file should contain the following columns:
                </p>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li>DATE - Application date</li>
                  <li>Br Code - Branch code</li>
                  <li>App ID - Application ID</li>
                  <li>Name - Customer name</li>
                  <li>Card - Card type (MAIN/SUPPLE)</li>
                  <li>Type - Card category (CLASSIC/GOLD/PLATINUM)</li>
                  <li>Remarks - Optional remarks</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PFContinue Upload */}
        <TabsContent value="pfcontinue">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileSpreadsheet className="mr-2 h-5 w-5" />
                PFContinue Data Upload
              </CardTitle>
              <CardDescription>
                Upload Excel files from the PFContinue division for cross-checking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="pf-file" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Click to upload PFContinue Excel file
                      </span>
                      <input
                        id="pf-file"
                        type="file"
                        className="sr-only"
                        accept=".xlsx,.xls"
                        onChange={(e) => setPfFile(e.target.files[0])}
                      />
                    </label>
                    <p className="mt-1 text-sm text-gray-500">
                      Excel files only (.xlsx, .xls)
                    </p>
                  </div>
                </div>
              </div>

              {pfFile && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <FileSpreadsheet className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium">{pfFile.name}</span>
                  </div>
                  <Button
                    onClick={() => setPfFile(null)}
                    variant="ghost"
                    size="sm"
                  >
                    Remove
                  </Button>
                </div>
              )}

              <Button
                onClick={handlePfUpload}
                disabled={!pfFile || pfUploading}
                className="w-full"
              >
                {pfUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadIcon className="mr-2 h-4 w-4" />
                    Upload PFContinue Data
                  </>
                )}
              </Button>

              {pfResult && (
                <Alert variant={pfResult.error ? "destructive" : "default"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {pfResult.error ? (
                      pfResult.error
                    ) : (
                      <div>
                        <p className="font-medium">{pfResult.message}</p>
                        {pfResult.created_count > 0 && (
                          <p className="mt-1">Uploaded {pfResult.created_count} records</p>
                        )}
                        {pfResult.errors && pfResult.errors.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium">Errors:</p>
                            <ul className="list-disc list-inside text-sm">
                              {pfResult.errors.slice(0, 5).map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                              {pfResult.errors.length > 5 && (
                                <li>... and {pfResult.errors.length - 5} more</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Expected Format:</h4>
                <p className="text-sm text-gray-600 mb-2">
                  The Excel file should contain at minimum:
                </p>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li>App ID - Application ID (required)</li>
                  <li>Name - Customer name (required)</li>
                  <li>Br Code - Branch code (optional)</li>
                  <li>Additional columns will be stored as supplementary data</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Upload;

