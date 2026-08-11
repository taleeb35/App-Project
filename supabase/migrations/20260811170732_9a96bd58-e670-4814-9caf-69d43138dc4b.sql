DELETE FROM public.vendor_reports WHERE report_month = '2026-07-01';
DELETE FROM public.patient_vendors WHERE patient_id IN (SELECT id FROM public.patients WHERE k_number = 'K-NEW-TEST-001');
DELETE FROM public.patients WHERE k_number = 'K-NEW-TEST-001';