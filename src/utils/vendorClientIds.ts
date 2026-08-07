import { supabase } from '@/integrations/supabase/client';

export type VendorClientPair = { vendorName: string; clientId: string | null };

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

  return pairs;
}

/** Finds a vendor for the clinic by name (exact, then partial), auto-creating it when missing. */
export async function resolveOrCreateVendor(clinicId: string, vendorName: string): Promise<string | null> {
  const name = vendorName.trim();
  if (!name) return null;

  const { data: exact } = await (supabase as any)
    .from('vendors')
    .select('id')
    .eq('clinic_id', clinicId)
    .ilike('name', name)
    .limit(1)
    .maybeSingle();
  if (exact?.id) return exact.id;

  const { data: partial } = await (supabase as any)
    .from('vendors')
    .select('id')
    .eq('clinic_id', clinicId)
    .ilike('name', `%${name}%`)
    .limit(1)
    .maybeSingle();
  if (partial?.id) return partial.id;

  const { data: created, error } = await (supabase as any)
    .from('vendors')
    .insert({ clinic_id: clinicId, name, status: 'active' } as any)
    .select('id')
    .single();
  if (error) {
    console.error('Failed to auto-create vendor', name, error);
    return null;
  }
  return created?.id ?? null;
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
  const existing = new Map<string, { id: string; client_id: string | null }>(
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
        const { error } = await (supabase as any)
          .from('patient_vendors')
          .update({ client_id: pair.clientId })
          .eq('id', link.id);
        if (error) errors.push(`Failed to update Client ID for "${pair.vendorName}" - ${error.message}`);
        else existing.set(vendorId, { id: link.id, client_id: pair.clientId });
      }
    } else {
      const { data: inserted, error } = await (supabase as any)
        .from('patient_vendors')
        .insert({ patient_id: patientId, vendor_id: vendorId, client_id: pair.clientId })
        .select('id')
        .single();
      if (error) errors.push(`Failed to link vendor "${pair.vendorName}" - ${error.message}`);
      else existing.set(vendorId, { id: inserted.id, client_id: pair.clientId });
    }
  }

  return { vendorIds, errors };
}
