// @ts-nocheck
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Link2, UserPlus } from 'lucide-react';
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
  vendorId?: string;
  vendorName?: string;
  matchedBy?: 'client_id' | 'k_number' | 'name' | 'created';
  matchedPatient?: string;
  reason?: string;
};

type NewPatient = {
  rowNumber: number;
  name: string;
  kNumber: string;
  clientId: string | null;
  vendorName: string;
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
  const [showNewPatients, setShowNewPatients] = useState(false);
  const [result, setResult] = useState<{
    inserted: number;
    matched: MatchRow[];
    unmatched: MatchRow[];
    newPatients: NewPatient[];
    linksCreated: number;
    totalAmount: number;
    totalGrams: number;
    totalFee: number;
    replaced: number;
    vendorsInFile: string[];
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
        description: 'Please select the fallback vendor, month, and upload file',
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
        status: findIdx(headers, H.status),
        category: findIdx(headers, H.category),
      };

      // --- Load clinic patients + all vendor client-id links once ---
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
      const patientName = new Map<string, string>();
      const registerPatient = (p: any) => {
        patientIds.add(p.id);
        const k = normId(p.k_number);
        if (k && !byK.has(k)) byK.set(k, p.id);
        const n = normName(`${p.first_name || ''} ${p.last_name || ''}`);
        if (n) byName.set(n, [...(byName.get(n) || []), p.id]);
        patientName.set(p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim());
      };
      (patients || []).forEach(registerPatient);

      const vendorNameById = new Map<string, string>(vendors.map((v: any) => [v.id, v.name]));

      // Client ID -> all (patient, vendor) links for this clinic's patients
      const cidLinks = new Map<string, { patientId: string; vendorId: string; linkId: string }[]>();
      const linkByPatientVendor = new Map<string, { id: string; client_id: string | null }>();
      (links || []).forEach((l: any) => {
        if (!patientIds.has(l.patient_id)) return;
        linkByPatientVendor.set(`${l.patient_id}|${l.vendor_id}`, { id: l.id, client_id: l.client_id });
        const cid = normId(l.client_id);
        if (!cid) return;
        cidLinks.set(cid, [
          ...(cidLinks.get(cid) || []),
          { patientId: l.patient_id, vendorId: l.vendor_id, linkId: l.id },
        ]);
      });

      // --- Match each data row ---
      const matched: MatchRow[] = [];
      const unmatched: MatchRow[] = [];
      const newPatients: NewPatient[] = [];
      let linksCreated = 0;

      const ensureLink = async (patientId: string, vendorId: string, clientId: string | null) => {
        const key = `${patientId}|${vendorId}`;
        const existing = linkByPatientVendor.get(key);
        if (!existing) {
          const { data: inserted } = await (supabase as any)
            .from('patient_vendors')
            .insert({ patient_id: patientId, vendor_id: vendorId, client_id: clientId || null })
            .select('id')
            .single();
          linkByPatientVendor.set(key, { id: inserted?.id, client_id: clientId || null });
          linksCreated += 1;
        } else if (clientId && !normId(existing.client_id)) {
          await (supabase as any)
            .from('patient_vendors')
            .update({ client_id: clientId })
            .eq('id', existing.id);
          linkByPatientVendor.set(key, { id: existing.id, client_id: clientId });
        }
        const cid = normId(clientId);
        if (cid) {
          const list = cidLinks.get(cid) || [];
          if (!list.some((l) => l.patientId === patientId && l.vendorId === vendorId)) {
            cidLinks.set(cid, [...list, { patientId, vendorId, linkId: '' }]);
          }
        }
      };

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
        let vendorId: string | undefined;
        let matchedBy: MatchRow['matchedBy'];

        // 1) Auto-detect vendor + patient from the Client ID link
        const cid = normId(clientId);
        if (cid && cidLinks.has(cid)) {
          const candidates = cidLinks.get(cid)!;
          const distinctPatients = new Set(candidates.map((c) => c.patientId));
          const preferred =
            candidates.find((c) => c.vendorId === selectedVendor) ||
            (candidates.length === 1 ? candidates[0] : undefined);

          if (preferred) {
            patientId = preferred.patientId;
            vendorId = preferred.vendorId;
            matchedBy = 'client_id';
          } else if (distinctPatients.size > 1) {
            unmatched.push({
              ...base,
              reason:
                'This Client ID is registered with more than one patient/vendor — upload that vendor separately or fix the Client ID',
            });
            continue;
          } else {
            patientId = candidates[0].patientId;
            vendorId = candidates[0].vendorId;
            matchedBy = 'client_id';
          }
        }

        // 2) K Number (vendor falls back to the selected vendor)
        if (!patientId) {
          const k = normId(kNumber);
          if (k && byK.has(k)) {
            patientId = byK.get(k);
            vendorId = selectedVendor;
            matchedBy = 'k_number';
          }
        }

        // 3) Unique patient name
        if (!patientId && name) {
          const candidates = byName.get(normName(name));
          if (candidates && new Set(candidates).size === 1) {
            patientId = candidates[0];
            vendorId = selectedVendor;
            matchedBy = 'name';
          } else if (candidates && new Set(candidates).size > 1) {
            unmatched.push({ ...base, reason: 'Multiple patients share this name — add Client ID or K Number' });
            continue;
          }
        }

        // 4) Brand-new patient — create it against the selected (fallback) vendor
        if (!patientId) {
          if (!name && !kNumber) {
            unmatched.push({
              ...base,
              reason: 'New Client ID but no Patient Name or K Number to create the patient',
            });
            continue;
          }
          const parts = name.replace(/\./g, ' ').split(/\s+/).filter(Boolean);
          const firstName = parts[0] || 'Unknown';
          const lastName = parts.slice(1).join(' ') || '';
          const kValue = kNumber || (clientId ? `CID-${clientId}` : `AUTO-${Date.now()}-${i}`);
          const categoryRaw = idx.category !== -1 ? String(row[idx.category] ?? '') : '';
          const patientType = /vet/i.test(categoryRaw) ? 'Veteran' : 'Civilian';
          const statusRaw = idx.status !== -1 ? String(row[idx.status] ?? '').trim().toLowerCase() : '';

          const { data: created, error: createError } = await (supabase as any)
            .from('patients')
            .insert({
              clinic_id: selectedClinic.id,
              first_name: firstName,
              last_name: lastName,
              k_number: kValue,
              patient_type: patientType,
              prescription_status: statusRaw === 'inactive' ? 'inactive' : 'active',
              status: 'active',
              vendor_id: selectedVendor,
              preferred_vendor_id: selectedVendor,
            })
            .select('id, k_number, first_name, last_name')
            .single();

          if (createError || !created) {
            unmatched.push({
              ...base,
              reason: `Could not create new patient — ${createError?.message || 'unknown error'}`,
            });
            continue;
          }

          registerPatient(created);
          patientId = created.id;
          vendorId = selectedVendor;
          matchedBy = 'created';
          newPatients.push({
            rowNumber: i + 1,
            name: `${firstName} ${lastName}`.trim(),
            kNumber: kValue,
            clientId: clientId || null,
            vendorName: vendorNameById.get(selectedVendor) || 'Selected vendor',
          });
        }

        await ensureLink(patientId!, vendorId!, clientId || null);

        matched.push({
          ...base,
          patientId,
          vendorId,
          vendorName: vendorNameById.get(vendorId!) || '—',
          matchedBy,
          matchedPatient: patientName.get(patientId!) || '',
        });
      }

      if (matched.length === 0) {
        setResult({
          inserted: 0,
          matched,
          unmatched,
          newPatients,
          linksCreated,
          totalAmount: 0,
          totalGrams: 0,
          totalFee: 0,
          replaced: 0,
          vendorsInFile: [],
        });
        throw new Error(
          `No rows could be processed (${unmatched.length} row(s) need attention). Nothing was saved.`
        );
      }

      const monthStart = `${reportMonth}-01`;
      const vendorIdsInFile = Array.from(new Set(matched.map((m) => m.vendorId!)));

      // Re-upload safety: replace only the vendors present in this file, for this clinic + month
      let replaced = 0;
      for (const vId of vendorIdsInFile) {
        const { data: existingReports } = await supabase
          .from('vendor_reports')
          .select('id')
          .eq('vendor_id', vId)
          .eq('clinic_id', selectedClinic.id)
          .eq('report_month', monthStart);
        const count = existingReports?.length || 0;
        if (count === 0) continue;

        const { error: delError } = await supabase
          .from('vendor_reports')
          .delete()
          .eq('vendor_id', vId)
          .eq('clinic_id', selectedClinic.id)
          .eq('report_month', monthStart);
        if (delError) throw delError;

        const { count: leftover } = await supabase
          .from('vendor_reports')
          .select('id', { count: 'exact', head: true })
          .eq('vendor_id', vId)
          .eq('clinic_id', selectedClinic.id)
          .eq('report_month', monthStart);
        if ((leftover || 0) > 0) {
          throw new Error(
            'Existing records for this vendor and month could not be replaced. Nothing was saved — please contact support.'
          );
        }
        replaced += count;
      }

      // Aggregate per vendor + patient so one patient = one monthly record per vendor
      const perKey = new Map<string, { vendorId: string; patientId: string; grams: number; amount: number; fee: number }>();
      matched.forEach((m) => {
        const key = `${m.vendorId}|${m.patientId}`;
        const cur = perKey.get(key) || { vendorId: m.vendorId!, patientId: m.patientId!, grams: 0, amount: 0, fee: 0 };
        perKey.set(key, {
          ...cur,
          grams: cur.grams + m.grams,
          amount: cur.amount + m.amount,
          fee: cur.fee + m.fee,
        });
      });

      const records = Array.from(perKey.values()).map((v) => ({
        vendor_id: v.vendorId,
        clinic_id: selectedClinic.id,
        patient_id: v.patientId,
        report_month: monthStart,
        product_name: 'Medical Cannabis',
        grams_sold: v.grams,
        amount: v.amount,
        our_fee: v.fee,
      }));

      const { error: insertError } = await supabase.from('vendor_reports').insert(records);
      if (insertError) throw insertError;

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
        newPatients,
        linksCreated,
        totalAmount: matched.reduce((s, m) => s + m.amount, 0),
        totalGrams: matched.reduce((s, m) => s + m.grams, 0),
        totalFee: matched.reduce((s, m) => s + m.fee, 0),
        replaced,
        vendorsInFile: vendorIdsInFile.map((v) => vendorNameById.get(v) || '—'),
      });

      if (newPatients.length > 0) setShowNewPatients(true);

      toast({
        title: 'Sales Report Processed',
        description: `${records.length} patient records saved across ${vendorIdsInFile.length} vendor(s)${
          newPatients.length ? ` · ${newPatients.length} new patient(s) added` : ''
        }${unmatched.length ? ` · ${unmatched.length} row(s) need attention` : ''}`,
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
      ['Row', 'Client ID', 'K Number', 'Patient Name', 'Grams', 'Net Sales', 'Our Fee', 'Reason'],
      ...result.unmatched.map((r) => [
        r.rowNumber,
        r.clientId ?? '',
        r.kNumber ?? '',
        r.name ?? '',
        r.grams,
        r.amount,
        r.fee,
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
          Each row's vendor is detected automatically from its Client ID — mixed-vendor sheets are supported
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
          <CardDescription>Upload the Excel or CSV report received from the vendor(s)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor">Fallback Vendor</Label>
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
              <p className="text-xs text-muted-foreground">
                Used only for rows whose Client ID is new or missing
              </p>
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
                {result.vendorsInFile.length > 0 && (
                  <>Vendors detected: {result.vendorsInFile.join(', ')}. </>
                )}
                {result.replaced > 0
                  ? `${result.replaced} previously uploaded record(s) for these vendors & month were replaced`
                  : 'Fresh upload for this month'}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-7 gap-4">
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold">{result.matched.length}</p>
                <p className="text-sm text-muted-foreground">Rows processed</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold">{result.inserted}</p>
                <p className="text-sm text-muted-foreground">Records saved</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold">{result.newPatients.length}</p>
                <p className="text-sm text-muted-foreground">New patients added</p>
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
              <div className="rounded-lg border p-4">
                <p className="text-2xl font-bold">${result.totalFee.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total our fee</p>
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

          {result.newPatients.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    New Patients Added
                  </CardTitle>
                  <CardDescription>
                    These Client IDs were not in the patient list, so the patients were created automatically
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setShowNewPatients(true)}>
                  View
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>K Number</TableHead>
                      <TableHead>Client ID</TableHead>
                      <TableHead>Vendor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.newPatients.map((p) => (
                      <TableRow key={`new-${p.rowNumber}`}>
                        <TableCell>{p.rowNumber}</TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.kNumber}</TableCell>
                        <TableCell>{p.clientId || '—'}</TableCell>
                        <TableCell>{p.vendorName}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {result.matched.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Processed Rows</CardTitle>
                <CardDescription>How each row was identified and which vendor it was booked to</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Matched by</TableHead>
                      <TableHead>Client ID</TableHead>
                      <TableHead className="text-right">Grams</TableHead>
                      <TableHead className="text-right">Net Sales</TableHead>
                      <TableHead className="text-right">Our Fee</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.matched.map((m) => (
                      <TableRow key={m.rowNumber}>
                        <TableCell>{m.rowNumber}</TableCell>
                        <TableCell className="font-medium">{m.matchedPatient}</TableCell>
                        <TableCell>{m.vendorName}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              m.matchedBy === 'client_id'
                                ? 'secondary'
                                : m.matchedBy === 'created'
                                ? 'default'
                                : 'outline'
                            }
                          >
                            {m.matchedBy === 'client_id'
                              ? 'Client ID'
                              : m.matchedBy === 'k_number'
                              ? 'K Number'
                              : m.matchedBy === 'created'
                              ? 'New patient'
                              : 'Name'}
                          </Badge>
                        </TableCell>
                        <TableCell>{m.clientId || '—'}</TableCell>
                        <TableCell className="text-right">{m.grams}</TableCell>
                        <TableCell className="text-right">${m.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${m.fee.toLocaleString()}</TableCell>
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
                    These rows were not saved. Fix the Client ID / K Number / Name and re-upload.
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
              <strong>Client ID</strong> — vendor-specific patient ID (used to detect the vendor automatically)
            </li>
            <li>
              <strong>K Number</strong> — clinic patient number
            </li>
            <li>
              <strong>Patient Name</strong> — used when Client ID / K Number are missing
            </li>
            <li>
              <strong>Quantity Grams</strong>, <strong>Net Sales</strong>, <strong>Our Fee</strong> (optional),
              Patient Status, Patient Category
            </li>
          </ul>
          <p className="pt-2">
            <strong>Mixed vendors:</strong> one sheet can contain patients of several vendors. Each row's vendor is
            derived from its Client ID link. Rows with a new or missing Client ID are booked to the selected
            fallback vendor, and if the patient does not exist yet they are created automatically and listed above.
          </p>
          <p>
            <strong>Re-uploads:</strong> only the vendors present in the file are replaced for the chosen month —
            other vendors' data stays untouched, so month-end reports never double count.
          </p>
        </CardContent>
      </Card>

      <Dialog open={showNewPatients} onOpenChange={setShowNewPatients}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {result?.newPatients.length} new patient(s) added
            </DialogTitle>
            <DialogDescription>
              These Client IDs were not found in the patient list, so the patients were created and added to the
              sales report.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>K Number</TableHead>
                  <TableHead>Client ID</TableHead>
                  <TableHead>Vendor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(result?.newPatients || []).map((p) => (
                  <TableRow key={`dlg-${p.rowNumber}`}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.kNumber}</TableCell>
                    <TableCell>{p.clientId || '—'}</TableCell>
                    <TableCell>{p.vendorName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowNewPatients(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
