import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { FormSubmission } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Loader2, Download } from "lucide-react";
import { format } from "date-fns";

export default function Admin() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingJson, setExportingJson] = useState(false);

  const { data: submissions, isLoading, error } = useQuery<FormSubmission[]>({
    queryKey: ["/api/admin/submissions"],
    retry: false,
  });

  const handleExport = async (format: 'csv' | 'json') => {
    const setExporting = format === 'csv' ? setExportingCsv : setExportingJson;
    
    try {
      setExporting(true);
      
      const response = await fetch(`/api/admin/export/${format}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `submissions_${new Date().toISOString().split('T')[0]}.${format}`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export complete",
        description: "Check your downloads folder",
      });
    } catch (error) {
      console.error(`Error exporting ${format}:`, error);
      toast({
        title: "Export failed",
        description: `Failed to export as ${format.toUpperCase()}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  const filteredSubmissions = submissions?.filter((submission) => {
    const query = searchQuery.toLowerCase();
    return (
      submission.name.toLowerCase().includes(query) ||
      submission.email.toLowerCase().includes(query)
    );
  });

  if (authLoading || (!isAuthenticated && !error)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loading-auth" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Form Submissions</CardTitle>
          <CardDescription>View and search all form submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleExport('csv')}
                disabled={exportingCsv || exportingJson || !submissions || submissions.length === 0}
                data-testid="button-export-csv"
              >
                {exportingCsv ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export as CSV
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('json')}
                disabled={exportingCsv || exportingJson || !submissions || submissions.length === 0}
                data-testid="button-export-json"
              >
                {exportingJson ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export as JSON
                  </>
                )}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loading-submissions" />
            </div>
          ) : filteredSubmissions && filteredSubmissions.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Referral</TableHead>
                    <TableHead className="hidden md:table-cell">Additional Info</TableHead>
                    <TableHead>Submitted At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id} data-testid={`row-submission-${submission.id}`}>
                      <TableCell className="font-medium" data-testid={`text-name-${submission.id}`}>
                        {submission.name}
                      </TableCell>
                      <TableCell data-testid={`text-email-${submission.id}`}>
                        {submission.email}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell" data-testid={`text-referral-${submission.id}`}>
                        {submission.referralSource ? (
                          submission.referralSource === "Other" && submission.referralSourceOther ? (
                            <span className="line-clamp-1" title={submission.referralSourceOther}>
                              Other: {submission.referralSourceOther}
                            </span>
                          ) : (
                            submission.referralSource
                          )
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-md" data-testid={`text-info-${submission.id}`}>
                        <span className="line-clamp-2">{submission.additionalInfo}</span>
                      </TableCell>
                      <TableCell data-testid={`text-date-${submission.id}`}>
                        {format(new Date(submission.submittedAt), "MMM d, yyyy h:mm a")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground" data-testid="text-no-results">
              {searchQuery ? "No submissions found matching your search." : "No submissions yet."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
