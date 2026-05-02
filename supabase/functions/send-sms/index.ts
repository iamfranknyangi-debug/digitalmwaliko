import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_RECIPIENTS = 500;
const MAX_MESSAGE_LENGTH = 1600;

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

    const { recipients, message, app_origin } = await req.json();

    // Validate message
    if (typeof message !== "string" || message.trim().length === 0) {
      throw new Error("message must be a non-empty string");
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`message must be at most ${MAX_MESSAGE_LENGTH} characters`);
    }

    // Validate recipients array structure
    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new Error("recipients must be a non-empty array");
    }
    if (recipients.length > MAX_RECIPIENTS) {
      throw new Error(`recipients must not exceed ${MAX_RECIPIENTS}`);
    }

    // Extract contact IDs and validate they are UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const contactIds: string[] = [];
    const invitationIds: string[] = [];
    for (const r of recipients) {
      if (!r.contact_id || !uuidRegex.test(r.contact_id)) {
        throw new Error("Each recipient must have a valid contact_id");
      }
      contactIds.push(r.contact_id);
      if (r.invitation_id) invitationIds.push(r.invitation_id);
    }

    // Server-side validation: fetch contacts that belong to this user
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: validContacts, error: contactsError } = await serviceClient
      .from("contacts")
      .select("id, phone, name")
      .eq("user_id", user.id)
      .in("id", contactIds);

    if (contactsError) throw new Error("Failed to validate contacts");
    if (!validContacts || validContacts.length === 0) {
      throw new Error("No valid contacts found for your account");
    }

    // Build a map of valid contacts
    const contactMap = new Map(validContacts.map((c) => [c.id, c]));

    // Build validated recipients from DB data, not client input
    const validatedRecipients = recipients
      .filter((r: { contact_id: string; invitation_id?: string }) => contactMap.has(r.contact_id))
      .map((r: { contact_id: string; invitation_id?: string }) => {
        const contact = contactMap.get(r.contact_id)!;
        return {
          phone: contact.phone,
          name: contact.name,
          invitation_id: r.invitation_id || "",
        };
      });

    if (validatedRecipients.length === 0) {
      throw new Error("No valid contacts matched your account");
    }

    // Send SMS to each validated recipient via Sprint API
    const results = await Promise.allSettled(
      validatedRecipients.map(async (r: { phone: string; name: string; invitation_id: string }) => {
        // Normalize Tanzanian phone numbers to international format (255XXXXXXXXX)
        let phone = r.phone.replace(/[^0-9]/g, "");
        if (phone.startsWith("00")) phone = phone.substring(2);
        if (phone.startsWith("0")) phone = "255" + phone.substring(1);
        if (!phone.startsWith("255")) phone = "255" + phone;

        const baseOrigin = (typeof app_origin === "string" && app_origin.startsWith("http"))
          ? app_origin.replace(/\/$/, "")
          : "https://digitalmwaliko.lovable.app";
        const rsvpLink = `${baseOrigin}/rsvp/${r.invitation_id}`;

        const personalizedMessage = message
          .replaceAll("{name}", r.name)
          .replaceAll("{rsvp_link}", rsvpLink);

        const smsPayload = {
          api_id: SPRINT_API_ID,
          api_password: SPRINT_API_PASSWORD,
          sms_type: "T",
          encoding: "T",
          sender_id: SPRINT_SENDER_ID,
          phonenumber: phone,
          textmessage: personalizedMessage,
        };

        const apiBase = SPRINT_API_URL.replace(/\/$/, "");
        const endpoint = apiBase.endsWith("/api") ? `${apiBase}/SendSMS` : `${apiBase}/api/SendSMS`;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(smsPayload),
        });

        const rawText = await response.text();
        let data: { status?: string; remarks?: string; message_id?: number | string } = {};
        try { data = JSON.parse(rawText); } catch { /* non-JSON response */ }

        if (!response.ok || data.status !== "S") {
          throw new Error(
            `SMS failed for ${phone}: ${data.remarks || rawText || `HTTP ${response.status}`}`
          );
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
      JSON.stringify({ sent, failed, total: validatedRecipients.length, errors }),
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
