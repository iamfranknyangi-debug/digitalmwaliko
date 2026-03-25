import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SPRINT_API_URL = Deno.env.get("SPRINT_API_URL");
    const SPRINT_API_ID = Deno.env.get("SPRINT_API_ID");
    const SPRINT_API_PASSWORD = Deno.env.get("SPRINT_API_PASSWORD");
    const SPRINT_SENDER_ID = Deno.env.get("SPRINT_SENDER_ID");

    if (!SPRINT_API_URL) throw new Error("SPRINT_API_URL is not configured");
    if (!SPRINT_API_ID) throw new Error("SPRINT_API_ID is not configured");
    if (!SPRINT_API_PASSWORD) throw new Error("SPRINT_API_PASSWORD is not configured");
    if (!SPRINT_SENDER_ID) throw new Error("SPRINT_SENDER_ID is not configured");

    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { recipients, message } = await req.json();

    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new Error("recipients must be a non-empty array");
    }
    if (typeof message !== "string" || message.trim().length === 0) {
      throw new Error("message must be a non-empty string");
    }

    // Send SMS to each recipient via Sprint API
    const results = await Promise.allSettled(
      recipients.map(async (r: { phone: string; name: string; invitation_id: string }) => {
        // Clean phone number - remove + sign, ensure country code
        let phone = r.phone.replace(/[^0-9]/g, "");
        // If starts with 0, assume Tanzania (+255)
        if (phone.startsWith("0")) {
          phone = "255" + phone.substring(1);
        }
        // If doesn't start with country code, add 255
        if (!phone.startsWith("255") && phone.length <= 10) {
          phone = "255" + phone;
        }

        const personalizedMessage = message
          .replace("{name}", r.name)
          .replace("{rsvp_link}", `${supabaseUrl.replace('.supabase.co', '')}-rsvp.lovable.app/rsvp/${r.invitation_id}`);

        const smsPayload = {
          api_id: SPRINT_API_ID,
          api_password: SPRINT_API_PASSWORD,
          sms_type: "T",
          encoding: "T",
          sender_id: SPRINT_SENDER_ID,
          phonenumber: phone,
          textmessage: personalizedMessage,
        };

        const response = await fetch(`${SPRINT_API_URL}/api/SendSMS`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(smsPayload),
        });

        const data = await response.json();

        if (data.status !== "S") {
          throw new Error(`SMS failed for ${phone}: ${data.remarks || "Unknown error"}`);
        }

        return { phone, message_id: data.message_id, status: "sent" };
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r) => r.reason?.message || "Unknown error");

    return new Response(
      JSON.stringify({ sent, failed, total: recipients.length, errors }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in send-sms:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
