import { supabase } from '@/integrations/supabase/client';

/**
 * Seed initial data: Avail HQ clinic and Green Valley Dispensary vendor
 * This runs automatically on app initialization
 */
export async function seedInitialData() {
  try {
    // 1. Check if Avail HQ clinic exists
    const { data: existingClinic } = await supabase
      .from('clinics')
      .select('id')
      .eq('name', 'Avail HQ')
      .maybeSingle();

    if (!existingClinic) {
      // Create Avail HQ clinic
      const { error: clinicError } = await supabase
        .from('clinics')
        .insert({
          name: 'Avail HQ',
          license_number: 'HQ-2024-001',
          phone: '555-0100',
          email: 'contact@availhq.com',
          address: 'Main Street, HQ City',
        });

      if (clinicError) {
        console.error('Error creating Avail HQ clinic:', clinicError);
      } else {
        console.log('Avail HQ clinic created successfully');
      }
    }

    // 2. Check if Green Valley Dispensary exists
    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('name', 'Green Valley Dispensary')
      .maybeSingle();

    if (!existingVendor) {
      // Create Green Valley Dispensary vendor
      const { error: vendorError } = await supabase
        .from('vendors')
        .insert({
          name: 'Green Valley Dispensary',
          license_number: 'GVD-2024-001',
          contact_person: 'John Smith',
          phone: '555-0200',
          email: 'contact@greenvalley.com',
          address: '123 Green Valley Road',
          status: 'active',
        });

      if (vendorError) {
        console.error('Error creating Green Valley Dispensary:', vendorError);
      } else {
        console.log('Green Valley Dispensary vendor created successfully');
      }
    }
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
}
