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

    // Find all duplicate vendors
    const { data: duplicates, error: dupError } = await supabaseClient.rpc('get_duplicate_vendors');
    
    if (dupError) {
      console.error('Error finding duplicates:', dupError);
      // Fallback to manual query
      const { data: allVendors, error: vendorError } = await supabaseClient
        .from('vendors')
        .select('id, name, created_at, clinic_id')
        .order('name');
      
      if (vendorError) throw vendorError;
      
      // Group by name and clinic_id
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
      
      // Process each group
      for (const [key, vendors] of vendorGroups.entries()) {
        if (vendors.length <= 1) continue; // No duplicates
        
        // Keep the first created vendor
        vendors.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const keepVendor = vendors[0];
        const duplicateVendors = vendors.slice(1);
        const duplicateIds = duplicateVendors.map(v => v.id);
        
        console.log(`Processing ${vendors.length} duplicates for vendor \"${keepVendor.name}\"`);
        console.log(`Keeping: ${keepVendor.id}, Deleting: ${duplicateIds.join(', ')}`);
        
        // Update patient_vendors junction table
        for (const dupId of duplicateIds) {
          const { error: updatePVError } = await supabaseClient
            .from('patient_vendors')
            .update({ vendor_id: keepVendor.id })
            .eq('vendor_id', dupId);
          
          if (updatePVError) {
            console.error(`Error updating patient_vendors for ${dupId}:`, updatePVError);
          } else {
            totalUpdated++;
          }
        }
        
        // Update patients preferred_vendor_id
        for (const dupId of duplicateIds) {
          const { error: updatePError } = await supabaseClient
            .from('patients')
            .update({ preferred_vendor_id: keepVendor.id })
            .eq('preferred_vendor_id', dupId);
          
          if (updatePError) {
            console.error(`Error updating patients for ${dupId}:`, updatePError);
          }
        }
        
        // Delete duplicate vendors
        const { error: deleteError } = await supabaseClient
          .from('vendors')
          .delete()
          .in('id', duplicateIds);
        
        if (deleteError) {
          console.error(`Error deleting duplicates:`, deleteError);
        } else {
          totalDeleted += duplicateIds.length;
        }
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Cleaned up ${totalDeleted} duplicate vendors and updated ${totalUpdated} patient-vendor links`,
          details: {
            totalDeleted,
            totalUpdated
          }
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    return new Response(
      JSON.stringify({ success: true, message: 'No duplicates found' }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
    
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});

