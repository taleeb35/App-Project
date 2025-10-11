import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { importAvailHQData } from '@/utils/importAvailHQData';
import { Database, CheckCircle } from 'lucide-react';

export default function ImportData() {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  const handleImport = async () => {
    setImporting(true);
    try {
      await importAvailHQData();
      setImported(true);
      toast({
        title: 'Success',
        description: 'Avail HQ clinic and patient data imported successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import data',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import Initial Data</h1>
        <p className="text-muted-foreground">Set up Avail HQ clinic and patient data</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Avail HQ Data Import
          </CardTitle>
          <CardDescription>
            Import the Avail HQ clinic, patients, and October 2024 vendor report data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">This import will:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Create "Avail HQ" clinic</li>
              <li>Add 15 patients from the October report</li>
              <li>Create vendor reports for Green Valley Dispensary (October 2024)</li>
            </ul>
          </div>

          {imported && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
              <CheckCircle className="h-4 w-4" />
              Data has been imported successfully
            </div>
          )}

          <Button
            onClick={handleImport}
            disabled={importing || imported}
            className="w-full"
          >
            {importing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Importing...
              </>
            ) : imported ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Data Imported
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Import Avail HQ Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
