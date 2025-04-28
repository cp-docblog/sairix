import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { email } = await req.json();
    const origin = req.headers.get('origin') || '';

    // Generate both possible reset URLs
    const resetUrls = [
      `${origin}/reset-password`,
      `${origin}/reset`
    ];

    // Try each reset URL until one works
    for (const redirectTo of resetUrls) {
      try {
        const { data, error } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email,
          options: {
            redirectTo,
          },
        });

        if (!error) {
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (e) {
        console.error(`Failed to generate link with redirectTo=${redirectTo}:`, e);
        continue;
      }
    }

    throw new Error('Failed to generate reset password link');
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});