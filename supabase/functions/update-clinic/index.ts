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
    const body = await req.json();
    console.log('Received body:', JSON.stringify(body, null, 2));
    
    const { clinicId, userId, clinicName, fullName, email, phone, status } = body ?? {};

    console.log('Extracted fields:', { clinicId, userId, clinicName, fullName, email, phone, status });

    // Validate minimally: clinicId and clinicName are required
    if (!clinicId || !clinicName?.trim()) {
      console.log('Missing clinicId or clinicName');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: clinicId and clinicName are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    // Update clinic
    const { error: clinicError } = await supabaseClient
      .from('clinics')
      .update({ name: clinicName })
      .eq('id', clinicId);

    if (clinicError) throw clinicError;

    // Conditionally update profile if userId and any user fields provided
    if (userId && (fullName?.trim() || email?.trim() || phone?.trim() || status)) {
      const updates: Record<string, string> = {};
      if (fullName?.trim()) updates.full_name = fullName.trim();
      if (email?.trim()) updates.email = email.trim();
      if (phone?.trim()) updates.phone = phone.trim();
      if (status) updates.status = status;

      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (profileError) throw profileError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('update-clinic error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});