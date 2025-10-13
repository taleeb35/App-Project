import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: allVendors, error: vendorError } = await supabaseClient
      .from('vendors')
      .select('id, name, created_at, clinic_id')
      .order('name');
    
    if (vendorError) throw vendorError;
    
    // Group vendors by name and clinic_id to find duplicates
    const vendorGroups = new Map<string, any[]>();
    allVendors?.forEach(vendor => {
      const key = `${vendor.name.toLowerCase()}-${vendor.clinic_id}`;
      if (!vendorGroups.has(key)) {
        vendorGroups.set(key, []);
      }
      vendorGroups.get(key)!.push(vendor);
    });
    
    let totalDeleted = 0;
    let totalUpdated = 0;
    
    // Process each group of vendors
    for (const [key, vendors] of vendorGroups.entries()) {
      if (vendors.length <= 1) continue; // Not a duplicate
      
      // Sort by creation date to keep the oldest one
      vendors.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const keepVendor = vendors[0];
      const duplicateVendors = vendors.slice(1);
      const duplicateIds = duplicateVendors.map(v => v.id);
      
      // Update patient_vendors to point to the correct vendor
      const { error: updatePVError } = await supabaseClient
        .from('patient_vendors')
        .update({ vendor_id: keepVendor.id })
        .in('vendor_id', duplicateIds);

      if (updatePVError) {
        console.error(`Error updating patient_vendors for duplicates of "${keepVendor.name}":`, updatePVError);
      } else {
        totalUpdated += duplicateIds.length;
      }
      
      // Update patients' preferred_vendor_id
      const { error: updatePError } = await supabaseClient
        .from('patients')
        .update({ preferred_vendor_id: keepVendor.id })
        .in('preferred_vendor_id', duplicateIds);
      
      if (updatePError) {
        console.error(`Error updating patients' preferred vendor for duplicates of "${keepVendor.name}":`, updatePError);
      }
      
      // Delete the duplicate vendor records
      const { error: deleteError } = await supabaseClient
        .from('vendors')
        .delete()
        .in('id', duplicateIds);
      
      if (deleteError) {
        console.error(`Error deleting duplicate vendors for "${keepVendor.name}":`, deleteError);
      } else {
        totalDeleted += duplicateIds.length;
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleanup complete. Deleted ${totalDeleted} duplicate vendors and updated relevant records.`,
        details: {
          totalDeleted,
          totalUpdated
        }
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
    
  } catch (error) {
    console.error('Error during cleanup:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});