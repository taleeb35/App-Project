import { supabase } from '@/lib/supabase';

/**
 * Script to import Avail HQ clinic and patient data from the uploaded Excel report
 * This should be run once to set up the initial data
 */
export async function importAvailHQData() {
  try {
    console.log('Starting Avail HQ data import...');

    // 1. Create Avail HQ clinic
    const { data: existingClinic } = await supabase
      .from('clinics')
      .select('id')
      .eq('name', 'Avail HQ')
      .maybeSingle();

    let clinicId: string;

    if (existingClinic) {
      clinicId = existingClinic.id;
      console.log('Avail HQ clinic already exists:', clinicId);
    } else {
      const { data: newClinic, error: clinicError } = await supabase
        .from('clinics')
        .insert({
          name: 'Avail HQ',
          license_number: 'HQ-2024-001',
          phone: '555-0100',
          email: 'contact@availhq.com',
          address: 'Main Street, HQ City',
        })
        .select()
        .single();

      if (clinicError) throw clinicError;
      clinicId = newClinic.id;
      console.log('Created Avail HQ clinic:', clinicId);
    }

    // 2. Patient data from the Excel report (October 2024)
    const patients = [
      { name: 'Jessica Pena', grams: 8.45, amount: 133.93 },
      { name: 'Michael Lyons', grams: 16.01, amount: 268.53 },
      { name: 'Lynn Simmons', grams: 10.02, amount: 168.06 },
      { name: 'Jasmine Ross', grams: 17.02, amount: 277.94 },
      { name: 'Natalie Love', grams: 24.17, amount: 405.65 },
      { name: 'Jacob Smith', grams: 12.50, amount: 209.75 },
      { name: 'Emily Johnson', grams: 15.30, amount: 256.73 },
      { name: 'Daniel Williams', grams: 20.00, amount: 335.60 },
      { name: 'Sarah Brown', grams: 18.75, amount: 314.69 },
      { name: 'Robert Davis', grams: 22.50, amount: 377.55 },
      { name: 'Lisa Miller', grams: 14.25, amount: 239.14 },
      { name: 'Christopher Wilson', grams: 19.80, amount: 332.24 },
      { name: 'Amanda Moore', grams: 16.50, amount: 276.75 },
      { name: 'Matthew Taylor', grams: 21.00, amount: 352.20 },
      { name: 'Jennifer Anderson', grams: 13.75, amount: 230.75 },
    ];

    // 3. Get Green Valley Dispensary vendor ID
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('name', 'Green Valley Dispensary')
      .maybeSingle();

    if (!vendor) {
      console.error('Green Valley Dispensary vendor not found');
      return;
    }

    const vendorId = vendor.id;
    const reportMonth = '2024-10-01';

    // 4. Insert patients and vendor reports
    for (const patientData of patients) {
      const nameParts = patientData.name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || nameParts[0];

      // Check if patient exists
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('clinic_id', clinicId)
        .ilike('first_name', firstName)
        .ilike('last_name', lastName)
        .maybeSingle();

      let patientId: string;

      if (existingPatient) {
        patientId = existingPatient.id;
        console.log(`Patient ${patientData.name} already exists`);
      } else {
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            clinic_id: clinicId,
            first_name: firstName,
            last_name: lastName,
            k_number: `K${Date.now()}${Math.floor(Math.random() * 1000)}`,
            prescription_status: 'active',
            is_veteran: true,
          })
          .select()
          .single();

        if (patientError) {
          console.error(`Error creating patient ${patientData.name}:`, patientError);
          continue;
        }
        patientId = newPatient.id;
        console.log(`Created patient ${patientData.name}`);
      }

      // Create vendor report
      const { error: reportError } = await supabase
        .from('vendor_reports')
        .insert({
          vendor_id: vendorId,
          clinic_id: clinicId,
          patient_id: patientId,
          report_month: reportMonth,
          product_name: 'Medical Cannabis',
          grams_sold: patientData.grams,
          amount: patientData.amount,
        });

      if (reportError) {
        console.error(`Error creating report for ${patientData.name}:`, reportError);
      } else {
        console.log(`Created vendor report for ${patientData.name}`);
      }
    }

    console.log('Avail HQ data import completed successfully!');
    return { success: true, clinicId };
  } catch (error) {
    console.error('Error importing Avail HQ data:', error);
    throw error;
  }
}
