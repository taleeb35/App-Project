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
    const { clinicName, fullName, email, phone, password, status } = body ?? {};

    if (!clinicName || !fullName || !email || !phone || !password || !status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
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

    // 1) Create clinic
    const { data: clinic, error: clinicError } = await supabaseClient
      .from('clinics')
      .insert({ name: clinicName })
      .select()
      .single();

    if (clinicError || !clinic) throw clinicError ?? new Error('Failed to create clinic');

    // 2) Create user account (email confirmed so they can login immediately if status is active)
    const { data: newUserResponse, error: userError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (userError || !newUserResponse?.user) throw userError ?? new Error('Failed to create user');

    const newUser = newUserResponse.user;

    // 3) Upsert profile for the new user
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({
        id: newUser.id,
        clinic_id: clinic.id,
        full_name: fullName,
        email,
        phone,
        status,
      }, { onConflict: 'id' });

    if (profileError) throw profileError;

    // 4) Assign user to clinic
    const { error: assignError } = await supabaseClient
      .from('clinic_employees')
      .insert({ user_id: newUser.id, clinic_id: clinic.id });

    if (assignError) throw assignError;

    return new Response(
      JSON.stringify({ success: true, clinicId: clinic.id, userId: newUser.id }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('create-clinic error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});