import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { event, submission_id, payload } = await req.json();

    // Fetch active webhook endpoints
    const { data: endpoints } = await supabase
      .from("webhook_endpoints")
      .select("*")
      .eq("is_active", true)
      .contains("events", [event]);

    if (!endpoints || endpoints.length === 0) {
      return new Response(JSON.stringify({ fired: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results = await Promise.allSettled(
      endpoints.map(async (ep: any) => {
        const body = JSON.stringify({
          event,
          submission_id,
          timestamp: new Date().toISOString(),
          data: payload,
        });

        // HMAC signature for verification
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw", encoder.encode(ep.secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
        );
        const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
        const signature = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");

        const res = await fetch(ep.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-ESGChain-Signature": signature,
            "X-ESGChain-Event": event,
          },
          body,
        });

        // Log delivery
        await supabase.from("webhook_logs").insert({
          endpoint_id: ep.id,
          event,
          payload: { submission_id, ...payload },
          status_code: res.status,
          response_body: (await res.text()).slice(0, 500),
        });

        // Update endpoint status
        await supabase.from("webhook_endpoints").update({
          last_triggered_at: new Date().toISOString(),
          last_status_code: res.status,
        }).eq("id", ep.id);

        return { endpoint: ep.id, status: res.status };
      })
    );

    return new Response(JSON.stringify({ fired: endpoints.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
