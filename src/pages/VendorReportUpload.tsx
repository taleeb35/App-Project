// @ts-nocheck
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Link2 } from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';

type MatchRow = {
  rowNumber: number;
  clientId: string | null;
  kNumber: string | null;
  name: string | null;
  grams: number;
  amount: number;
  fee: number;
  patientId?: string;
  matchedBy?: 'client_id' | 'k_number' | 'name';
  matchedPatient?: string;
  reason?: string;
};

const normKey = (s: any) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const normName = (s: any) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const normId = (s: any) => String(s ?? '').trim().replace(/\s+/g, '').toUpperCase();

const num = (v: any) => {
  const n = parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

// Header aliases (normalized)
const H = {
  clientId: ['clientid', 'clientids', 'vendorclientid', 'clientnumber', 'clientno'],
  kNumber: ['knumber', 'kno', 'k', 'knum', 'patientid', 'patientknumber'],
  name: ['patientname', 'name', 'fullname', 'patient', 'patientinitals', 'patientinitials'],
  grams: ['quantitygrams', 'grams', 'gramssold', 'quantity', 'qtygrams', 'qty'],
  amount: ['netsales', 'net', 'amount', 'totalamount', 'sales', 'grosssales', 'total'],
  fee: ['ourfee', 'fee', 'fees'],
  status: ['patientstatus', 'status'],
  category: ['patientcategory', 'category', 'type', 'patienttype'],
};

const findIdx = (headers: string[], aliases: string[]) => {
  for (const a of aliases) {
    const i = headers.indexOf(a);
    if (i !== -1) return i;
  }
  return -1;
};

export default function VendorReportUpload() {
  const { toast } = useToast();
  const { selectedClinic } = useClinic();
  const { user } = useAuth();
  const [selectedVendor, setSelectedVendor] = useState('');
  const [reportMonth, setReportMonth] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [result, setResult] = useState<{
    inserted: number;
    matched: MatchRow[];
    unmatched: MatchRow[];
    linksCreated: number;
    totalAmount: number;
    totalGrams: number;
    replaced: number;
  } | null>(null);

  useEffect(() => {
    if (user) fetchVendors();
  }, [user, selectedClinic?.id]);

  const fetchVendors = async () => {
    if (!user) {
      setVendors([]);
      return;
    }
    try {
      let query = supabase.from('vendors').select('*').eq('status', 'active').order('name');
      if (selectedClinic?.id) query = query.eq('clinic_id', selectedClinic.id);
      const { data, error } = await query;
      if (error) throw error;
      const unique = Array.from(new Map((data || []).map((v: any) => [v.name, v])).values());
      setVendors(unique);
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to fetch vendors', variant: 'destructive' });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an Excel (.xlsx, .xls) or CSV (.csv) file',
        variant: 'destructive',
      });
      return;
    }
    setUploadFile(file);
    setResult(null);
  };

  const parseFile = (file: File): Promise<any[][]> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target?.result, { type: 'binary' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          resolve(XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][]);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });

  const handleUpload = async () => {
    if (!selectedClinic) {
      toast({ title: 'Error', description: 'Please select a clinic first', variant: 'destructive' });
      return;
    }
    if (!selectedVendor || !reportMonth || !uploadFile) {
      toast({
        title: 'Missing Information',
        description: 'Please select vendor, month, and upload file',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setResult(null);
    try {
      const rows = await parseFile(uploadFile);

      // --- Locate header row ---
      let headerIdx = -1;
      let headers: string[] = [];
      for (let i = 0; i < Math.min(rows.length, 30); i++) {
        const normalized = (rows[i] || []).map(normKey);
        const hasIdentity =
          findIdx(normalized, H.clientId) !== -1 ||
          findIdx(normalized, H.kNumber) !== -1 ||
          findIdx(normalized, H.name) !== -1;
        if (hasIdentity) {
          headers = normalized;
          headerIdx = i;
          break;
        }
      }
      if (headerIdx === -1) {
        throw new Error('Could not find a header row containing Client ID, K Number or Patient Name.');
      }

      const idx = {
        clientId: findIdx(headers, H.clientId),
        kNumber: findIdx(headers, H.kNumber),
        name: findIdx(headers, H.name),
        grams: findIdx(headers, H.grams),
        amount: findIdx(headers, H.amount),
        fee: findIdx(headers, H.fee),
      };

      // --- Load clinic patients + vendor client-id links once ---
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('id, k_number, first_name, last_name')
        .eq('clinic_id', selectedClinic.id);
      if (patientsError) throw patientsError;

      const { data: links, error: linksError } = await supabase
        .from('patient_vendors')
        .select('id, patient_id, vendor_id, client_id');
      if (linksError) throw linksError;

      const patientIds = new Set((patients || []).map((p: any) => p.id));
      const byK = new Map<string, string>();
      const byName = new Map<string, string[]>();
      (patients || []).forEach((p: any) => {
        const k = normId(p.k_number);
        if (k && !byK.has(k)) byK.set(k, p.id);
        const n = normName(`${p.first_name || ''} ${p.last_name || ''}`);
        if (n) byName.set(n, [...(byName.get(n) || []), p.id]);
        const first = normName(p.first_name);
        if (first && first !== n) byName.set(first, [...(byName.get(first) || []), p.id]);
      });
      const patientName = new Map(
        (patients || []).map((p: any) => [p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim()])
      );

      // Client ID index: this vendor first, then any vendor of this clinic's patients
      const clientIdThisVendor = new Map<string, string>();
      const clientIdAnyVendor = new Map<string, string>();
      const existingLinkKeys = new Set<string>();
      (links || []).forEach((l: any) => {
        if (!patientIds.has(l.patient_id)) return;
        existingLinkKeys.add(`${l.patient_id}|${l.vendor_id}`);
        const cid = normId(l.client_id);
        if (!cid) return;
        if (l.vendor_id === selectedVendor) clientIdThisVendor.set(cid, l.patient_id);
        else if (!clientIdAnyVendor.has(cid)) clientIdAnyVendor.set(cid, l.patient_id);
      });

      // --- Match each data row ---
      const matched: MatchRow[] = [];
      const unmatched: MatchRow[] = [];
      const newLinks: any[] = [];

      for (let i = headerIdx + 1; i < rows.length; i++) {
        const row = rows[i] || [];
        const clientId = idx.clientId !== -1 ? String(row[idx.clientId] ?? '').trim() : '';
        const kNumber = idx.kNumber !== -1 ? String(row[idx.kNumber] ?? '').trim() : '';
        const name = idx.name !== -1 ? String(row[idx.name] ?? '').trim() : '';
        if (!clientId && !kNumber && !name) continue;

        const base: MatchRow = {
          rowNumber: i + 1,
          clientId: clientId || null,
          kNumber: kNumber || null,
          name: name || null,
          grams: idx.grams !== -1 ? num(row[idx.grams]) : 0,
          amount: idx.amount !== -1 ? num(row[idx.amount]) : 0,
          fee: idx.fee !== -1 ? num(row[idx.fee]) : 0,
        };

        let patientId: string | undefined;
        let matchedBy: MatchRow['matchedBy'];

        const cid = normId(clientId);
        if (cid && clientIdThisVendor.has(cid)) {
          patientId = clientIdThisVendor.get(cid);
          matchedBy = 'client_id';
        }
        if (!patientId) {
          const k = normId(kNumber);
          if (k && byK.has(k)) {
            patientId = byK.get(k);
            matchedBy = 'k_number';
          }
        }
        if (!patientId && cid && clientIdAnyVendor.has(cid)) {
          patientId = clientIdAnyVendor.get(cid);
          matchedBy = 'client_id';
        }
        if (!patientId && name) {
          const candidates = byName.get(normName(name));
          if (candidates && candidates.length === 1) {
            patientId = candidates[0];
            matchedBy = 'name';
          } else if (candidates && candidates.length > 1) {
            unmatched.push({ ...base, reason: 'Multiple patients share this name — add Client ID or K Number' });
            continue;
          }
        }

        if (!patientId) {
          unmatched.push({ ...base, reason: 'No matching patient found in this clinic' });
          continue;
        }

        matched.push({ ...base, patientId, matchedBy, matchedPatient: patientName.get(patientId) || '' });

        // Backfill the vendor link / Client ID so future reports match instantly
        const linkKey = `${patientId}|${selectedVendor}`;
        if (!existingLinkKeys.has(linkKey)) {
          existingLinkKeys.add(linkKey);
          newLinks.push({ patient_id: patientId, vendor_id: selectedVendor, client_id: clientId || null });
          if (cid) clientIdThisVendor.set(cid, patientId);
        } else if (cid && !clientIdThisVendor.has(cid)) {
          const link = (links || []).find(
            (l: any) => l.patient_id === patientId && l.vendor_id === selectedVendor
          );
          if (link && !normId(link.client_id)) {
            await (supabase as any).from('patient_vendors').update({ client_id: clientId }).eq('id', link.id);
            clientIdThisVendor.set(cid, patientId);
          }
        }
      }

      if (matched.length === 0) {
        setResult({
          inserted: 0,
          matched,
          unmatched,
          linksCreated: 0,
          totalAmount: 0,
          totalGrams: 0,
          replaced: 0,
        });
        throw new Error(
          `No rows could be matched to existing patients (${unmatched.length} unmatched). Nothing was saved.`
        );
      }

      const monthStart = `${reportMonth}-01`;

      // Re-upload safety: replace this vendor/clinic/month batch instead of duplicating
      const { data: existingReports } = await supabase
        .from('vendor_reports')
        .select('id')
        .eq('vendor_id', selectedVendor)
        .eq('clinic_id', selectedClinic.id)
        .eq('report_month', monthStart);
      const replaced = existingReports?.length || 0;
      if (replaced > 0) {
        const { error: delError } = await supabase
          .from('vendor_reports')
          .delete()
          .eq('vendor_id', selectedVendor)
          .eq('clinic_id', selectedClinic.id)
          .eq('report_month', monthStart);
        if (delError) throw delError;

        // Guard against silent no-op deletes (permission issues) creating duplicates
        const { count: leftover } = await supabase
          .from('vendor_reports')
          .select('id', { count: 'exact', head: true })
          .eq('vendor_id', selectedVendor)
          .eq('clinic_id', selectedClinic.id)
          .eq('report_month', monthStart);
        if ((leftover || 0) > 0) {
          throw new Error(
            'Existing records for this vendor and month could not be replaced. Nothing was saved — please contact support.'
          );
        }
      }

      // Aggregate per patient so one patient = one monthly record
      const perPatient = new Map<string, { grams: number; amount: number; fee: number }>();
      matched.forEach((m) => {
        const cur = perPatient.get(m.patientId!) || { grams: 0, amount: 0, fee: 0 };
        perPatient.set(m.patientId!, {
          grams: cur.grams + m.grams,
          amount: cur.amount + m.amount,
          fee: cur.fee + m.fee,
        });
      });

      const records = Array.from(perPatient.entries()).map(([patient_id, v]) => ({
        vendor_id: selectedVendor,
        clinic_id: selectedClinic.id,
        patient_id,
        report_month: monthStart,
        product_name: 'Medical Cannabis',
        grams_sold: v.grams,
        amount: v.amount,
        our_fee: v.fee,
      }));

      const { error: insertError } = await supabase.from('vendor_reports').insert(records);
      if (insertError) throw insertError;

      if (newLinks.length > 0) {
        await (supabase as any).from('patient_vendors').insert(newLinks);
      }

      await supabase.from('data_uploads').insert({
        clinic_id: selectedClinic.id,
        uploaded_by: user?.id ?? null,
        upload_type: 'vendor_sales_report',
        file_name: uploadFile.name,
        records_count: records.length,
        status: unmatched.length > 0 ? 'completed_with_exceptions' : 'completed',
      } as any);

      setResult({
        inserted: records.length,
        matched,
        unmatched,
        linksCreated: newLinks.length,
        totalAmount: matched.reduce((s, m) => s + m.amount, 0),
        totalGrams: matched.reduce((s, m) => s + m.grams, 0),
        replaced,
      });

      toast({
        title: 'Sales Report Processed',
        description: `${records.length} patient records saved${
          unmatched.length ? ` · ${unmatched.length} row(s) need attention` : ''
        }`,
      });

      setUploadFile(null);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to process the sales report.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadUnmatched = () => {
    if (!result?.unmatched.length) return;
    const csv = [
      ['Row', 'Client ID', 'K Number', 'Patient Name', 'Grams', 'Net Sales', 'Reason'],
      ...result.unmatched.map((r) => [
        r.rowNumber,
        r.clientId ?? '',
        r.kNumber ?? '',
        r.name ?? '',
        r.grams,
        r.amount,
        r.reason ?? '',
      ]),
    ]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `unmatched-rows-${reportMonth || 'report'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Sales Report</h1>
        <p className="text-muted-foreground">
          Monthly vendor sales reports are matched to existing patients by Client ID, K Number or Name
        </p>
      </div>

      {!user && (
        <Card>
          <CardHeader>
            <CardTitle>Preview mode</CardTitle>
            <CardDescription>Sign in to enable data and uploads.</CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/auth">
              <Button>Go to Login</Button>
            </a>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Monthly Sales Report
          </CardTitle>
          <CardDescription>Upload the Excel or CSV report received from the vendor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor">Select Vendor</Label>
              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger id="vendor">
                  <SelectValue placeholder="Choose vendor..." />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="month">Report Month</Label>
              <Input
                id="month"
                type="month"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Upload Excel or CSV File</Label>
            <div className="flex items-center gap-4">
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="flex-1"
              />
              {uploadFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileSpreadsheet className="h-4 w-4" />
                  {uploadFile.name}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleUpload}
              disabled={!selectedVendor || !reportMonth || !uploadFile || uploading || !user}
              className="w-full"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Matching patients & saving...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Processing Summary
              </CardTitle>
              <CardDescription>
                {result.replaced > 0
                  ? `${result.replaced} previously uploaded record(s) for this vendor & month were replaced`
                  : 'Fresh upload for this vendor & month'}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold">{result.matched.length}</p>
                <p className="text-sm text-muted-foreground">Rows matched</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold">{result.inserted}</p>
                <p className="text-sm text-muted-foreground">Patient records saved</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold">{result.unmatched.length}</p>
                <p className="text-sm text-muted-foreground">Unmatched rows</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold">{result.totalGrams.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total grams</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold">${result.totalAmount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total net sales</p>
              </div>
            </CardContent>
            {result.linksCreated > 0 && (
              <CardContent className="pt-0">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Link2 className="h-4 w-4" />
                  {result.linksCreated} patient–vendor Client ID link(s) created for future matching
                </p>
              </CardContent>
            )}
          </Card>

          {result.matched.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Matched Patients</CardTitle>
                <CardDescription>How each row was identified</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Matched by</TableHead>
                      <TableHead>Client ID</TableHead>
                      <TableHead className="text-right">Grams</TableHead>
                      <TableHead className="text-right">Net Sales</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.matched.map((m) => (
                      <TableRow key={m.rowNumber}>
                        <TableCell>{m.rowNumber}</TableCell>
                        <TableCell className="font-medium">{m.matchedPatient}</TableCell>
                        <TableCell>
                          <Badge variant={m.matchedBy === 'name' ? 'outline' : 'secondary'}>
                            {m.matchedBy === 'client_id'
                              ? 'Client ID'
                              : m.matchedBy === 'k_number'
                              ? 'K Number'
                              : 'Name'}
                          </Badge>
                        </TableCell>
                        <TableCell>{m.clientId || '—'}</TableCell>
                        <TableCell className="text-right">{m.grams}</TableCell>
                        <TableCell className="text-right">${m.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {result.unmatched.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Unmatched Rows
                  </CardTitle>
                  <CardDescription>
                    These rows were not saved. Add the patient (or their Client ID / K Number) and re-upload.
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={downloadUnmatched}>
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Client ID</TableHead>
                      <TableHead>K Number</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Net Sales</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.unmatched.map((r) => (
                      <TableRow key={r.rowNumber}>
                        <TableCell>{r.rowNumber}</TableCell>
                        <TableCell>{r.clientId || '—'}</TableCell>
                        <TableCell>{r.kNumber || '—'}</TableCell>
                        <TableCell>{r.name || '—'}</TableCell>
                        <TableCell className="text-right">${r.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>File Format Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Supported columns (any order, at least one identifier required):</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Client ID</strong> — vendor-specific patient ID (best match)
            </li>
            <li>
              <strong>K Number</strong> — clinic patient number
            </li>
            <li>
              <strong>Patient Name</strong> — used only when Client ID / K Number are missing
            </li>
            <li>
              <strong>Quantity Grams</strong>, <strong>Net Sales</strong>, <strong>Our Fee</strong> (optional),
              Patient Status, Patient Category
            </li>
          </ul>
          <p className="pt-2">
            <strong>Matching order:</strong> Client ID for the selected vendor → K Number → Client ID from another
            vendor → unique Patient Name. Matched Client IDs are saved against the patient–vendor link, so the next
            month's report matches automatically. Re-uploading the same vendor &amp; month replaces the previous
            batch — no duplicates in month-end reports.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
