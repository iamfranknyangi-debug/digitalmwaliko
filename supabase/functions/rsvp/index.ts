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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const url = new URL(req.url);

    if (req.method === "GET") {
      // Fetch invitation by ID
      const invitationId = url.searchParams.get("id");
      if (!invitationId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invitationId)) {
        return new Response(JSON.stringify({ error: "Invalid invitation ID" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: invitation, error } = await supabase
        .from("invitations")
        .select("id, rsvp_status, attendee_count, event_id, contact_id")
        .eq("id", invitationId)
        .single();

      if (error || !invitation) {
        return new Response(JSON.stringify({ error: "Invitation not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch event and contact details
      const [eventRes, contactRes] = await Promise.all([
        supabase.from("events").select("title, host, venue, date, time, description, image_url, template_id").eq("id", invitation.event_id).single(),
        supabase.from("contacts").select("name").eq("id", invitation.contact_id).single(),
      ]);

      return new Response(JSON.stringify({
        id: invitation.id,
        rsvp_status: invitation.rsvp_status,
        attendee_count: invitation.attendee_count,
        event: eventRes.data || null,
        contact: contactRes.data || null,
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      // Update RSVP
      const body = await req.json();
      const { invitation_id, rsvp_status, attendee_count } = body;

      if (!invitation_id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invitation_id)) {
        return new Response(JSON.stringify({ error: "Invalid invitation ID" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!["confirmed", "declined"].includes(rsvp_status)) {
        return new Response(JSON.stringify({ error: "Invalid RSVP status" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const count = rsvp_status === "confirmed"
        ? Math.min(Math.max(parseInt(attendee_count) || 1, 1), 20)
        : 0;

      // Verify invitation exists
      const { data: existing } = await supabase
        .from("invitations")
        .select("id")
        .eq("id", invitation_id)
        .single();

      if (!existing) {
        return new Response(JSON.stringify({ error: "Invitation not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateError } = await supabase
        .from("invitations")
        .update({
          rsvp_status,
          attendee_count: count,
          responded_at: new Date().toISOString(),
        })
        .eq("id", invitation_id);

      if (updateError) {
        return new Response(JSON.stringify({ error: "Failed to update RSVP" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, rsvp_status, attendee_count: count }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("RSVP error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
