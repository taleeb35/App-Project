import { supabase } from '@/integrations/supabase/client';

export type VendorClientPair = { vendorName: string; clientId: string | null };

type ExistingPatientLink = { id: string; client_id: string | null };

const formatPatientLabel = (patient: any) => {
  const patientRecord = Array.isArray(patient) ? patient[0] : patient;
  const fullName = [patientRecord?.first_name, patientRecord?.last_name].filter(Boolean).join(' ').trim();
  const kNumber = patientRecord?.k_number ? ` (${patientRecord.k_number})` : '';
  return `${fullName || 'another patient'}${kNumber}`;
};

/**
 * Extracts vendor / client-id pairs from a normalized Excel row.
 * Supports any number of pairs: "Client ID 1"/"Vendor 1", "Client ID 2"/"Vendor 2", ...
 * (normalized keys: clientid1 / vendor1). Also supports the legacy single
 * "Vendors" column with comma-separated names (no client ids).
 */
export function extractVendorClientPairs(map: Record<string, unknown>): VendorClientPair[] {
  const pairs: VendorClientPair[] = [];
  const indexes = new Set<number>();

  Object.keys(map).forEach((key) => {
    const m = key.match(/^(?:clientid|vendor)(\d+)$/);
    if (m) indexes.add(parseInt(m[1], 10));
  });

  Array.from(indexes)
    .sort((a, b) => a - b)
    .forEach((n) => {
      const vendorRaw = map[`vendor${n}`];
      const clientRaw = map[`clientid${n}`];
      const vendorName = vendorRaw !== undefined && vendorRaw !== null ? String(vendorRaw).trim() : '';
      const clientId = clientRaw !== undefined && clientRaw !== null ? String(clientRaw).trim() : '';
      if (!vendorName) return;
      pairs.push({ vendorName, clientId: clientId || null });
    });

  // Legacy comma-separated "Vendors" column (only when no numbered pairs present)
  if (pairs.length === 0) {
    const legacy = (
      map['vendors'] ??
      map['vendor'] ??
      map['assignedvendors'] ??
      map['assignedvendor'] ??
      map['dispensary'] ??
      map['dispensaries'] ??
      map['pharmacy'] ??
      ''
    ) as string | undefined;
    const raw = legacy ? String(legacy).trim() : '';
    if (raw) {
      raw
        .replace(/&/g, ',')
        .split(/[;,|\n]+/)
        .map((v) => v.replace(/^["']|["']$/g, '').trim())
        .filter((v) => v.length > 0)
        .forEach((vendorName) => pairs.push({ vendorName, clientId: null }));
    }
  }

  const deduped = new Map<string, VendorClientPair>();
  pairs.forEach((pair) => {
    const key = normalizeVendorName(pair.vendorName);
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, pair);
      return;
    }
    if (!existing.clientId && pair.clientId) {
      deduped.set(key, pair);
    }
  });

  return Array.from(deduped.values());
}

/** Normalizes a vendor name for duplicate-safe comparison (case, spaces, punctuation, "inc"/"llc"). */
const normalizeVendorName = (name: string) =>
  name
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/(inc|llc|ltd|co|corp)$/, '');

// Per-clinic cache of existing vendors so one upload never creates the same vendor twice
const vendorCache = new Map<string, Map<string, string>>();

/** Clears the cached vendor lookup (call before starting a new upload run). */
export function resetVendorCache() {
  vendorCache.clear();
}

async function loadClinicVendors(clinicId: string): Promise<Map<string, string>> {
  const cached = vendorCache.get(clinicId);
  if (cached) return cached;

  const { data } = await (supabase as any)
    .from('vendors')
    .select('id, name')
    .eq('clinic_id', clinicId);

  const map = new Map<string, string>();
  (data || []).forEach((v: any) => {
    const key = normalizeVendorName(v.name || '');
    if (key && !map.has(key)) map.set(key, v.id);
  });
  vendorCache.set(clinicId, map);
  return map;
}

/**
 * Resolves a vendor for the clinic by name, reusing an existing vendor whenever one
 * matches (case/spacing/punctuation-insensitive). Only creates a vendor when none exists.
 */
export async function resolveOrCreateVendor(clinicId: string, vendorName: string): Promise<string | null> {
  const name = vendorName.trim();
  if (!name) return null;

  const key = normalizeVendorName(name);
  if (!key) return null;

  const vendors = await loadClinicVendors(clinicId);
  const existing = vendors.get(key);
  if (existing) return existing;

  const { data: created, error } = await (supabase as any)
    .from('vendors')
    .insert({ clinic_id: clinicId, name, status: 'active' } as any)
    .select('id')
    .single();

  if (error) {
    // Possible race/unique conflict — re-check the database before giving up
    const { data: refetched } = await (supabase as any)
      .from('vendors')
      .select('id, name')
      .eq('clinic_id', clinicId)
      .ilike('name', name)
      .limit(1)
      .maybeSingle();
    if (refetched?.id) {
      vendors.set(key, refetched.id);
      return refetched.id;
    }
    console.error('Failed to auto-create vendor', name, error);
    return null;
  }

  if (created?.id) vendors.set(key, created.id);
  return created?.id ?? null;
}

async function findClientIdOwner(vendorId: string, clientId: string, patientId: string) {
  const { data, error } = await (supabase as any)
    .from('patient_vendors')
    .select('id, patient_id, patients(first_name, last_name, k_number)')
    .eq('vendor_id', vendorId)
    .eq('client_id', clientId)
    .neq('patient_id', patientId)
    .maybeSingle();

  if (error) return null;
  return data || null;
}

async function insertVendorLink(patientId: string, vendorId: string, clientId: string | null) {
  const { data, error } = await (supabase as any)
    .from('patient_vendors')
    .insert({ patient_id: patientId, vendor_id: vendorId, client_id: clientId })
    .select('id, client_id')
    .single();

  return { data, error };
}


/**
 * Links a patient to the given vendors and stores the vendor-specific Client ID.
 * Existing links are updated when a Client ID is supplied.
 */
export async function syncPatientVendorLinks(
  patientId: string,
  clinicId: string,
  pairs: VendorClientPair[]
): Promise<{ vendorIds: string[]; errors: string[] }> {
  const errors: string[] = [];
  const vendorIds: string[] = [];
  if (!patientId || pairs.length === 0) return { vendorIds, errors };

  const { data: existingLinks } = await (supabase as any)
    .from('patient_vendors')
    .select('id, vendor_id, client_id')
    .eq('patient_id', patientId);
  const existing = new Map<string, ExistingPatientLink>(
    (existingLinks || []).map((l: any) => [l.vendor_id, { id: l.id, client_id: l.client_id }])
  );

  for (const pair of pairs) {
    const vendorId = await resolveOrCreateVendor(clinicId, pair.vendorName);
    if (!vendorId) {
      errors.push(`Vendor "${pair.vendorName}" could not be resolved or created`);
      continue;
    }
    if (!vendorIds.includes(vendorId)) vendorIds.push(vendorId);

    const link = existing.get(vendorId);
    if (link) {
      if (pair.clientId && pair.clientId !== link.client_id) {
        const owner = await findClientIdOwner(vendorId, pair.clientId, patientId);
        if (owner) {
          errors.push(
            `Client ID "${pair.clientId}" for "${pair.vendorName}" already belongs to ${formatPatientLabel(owner.patients)}`
          );
          continue;
        }

        const { error } = await (supabase as any)
          .from('patient_vendors')
          .update({ client_id: pair.clientId })
          .eq('id', link.id);
        if (error) errors.push(`Failed to update Client ID for "${pair.vendorName}" - ${error.message}`);
        else existing.set(vendorId, { id: link.id, client_id: pair.clientId });
      }
    } else {
      if (pair.clientId) {
        const owner = await findClientIdOwner(vendorId, pair.clientId, patientId);
        if (owner) {
          const { data: insertedWithoutClientId, error: insertWithoutClientIdError } = await insertVendorLink(patientId, vendorId, null);
          if (!insertWithoutClientIdError && insertedWithoutClientId?.id) {
            existing.set(vendorId, { id: insertedWithoutClientId.id, client_id: null });
          }
          errors.push(
            `Linked "${pair.vendorName}" without Client ID because "${pair.clientId}" already belongs to ${formatPatientLabel(owner.patients)}`
          );
          continue;
        }
      }

      const { data: inserted, error } = await insertVendorLink(patientId, vendorId, pair.clientId);
      if (error) errors.push(`Failed to link vendor "${pair.vendorName}" - ${error.message}`);
      else existing.set(vendorId, { id: inserted.id, client_id: pair.clientId });
    }
  }

  return { vendorIds, errors };
}
