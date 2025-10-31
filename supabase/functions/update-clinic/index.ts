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
    const { clinicId, userId, clinicName, fullName, email, phone, status } = body ?? {};

    if (!clinicId || !userId || !clinicName || !fullName || !email || !phone || !status) {
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

    // Update clinic
    const { error: clinicError } = await supabaseClient
      .from('clinics')
      .update({ name: clinicName })
      .eq('id', clinicId);

    if (clinicError) throw clinicError;

    // Update profile
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ full_name: fullName, email, phone, status })
      .eq('id', userId);

    if (profileError) throw profileError;

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