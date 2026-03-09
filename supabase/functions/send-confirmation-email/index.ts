// @ts-nocheck

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EmailPayload = {
  email?: string;
  firstName?: string;
  submissionCode?: string;
};

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: EmailPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const email = asText(payload.email).toLowerCase();
  const firstName = asText(payload.firstName);
  const submissionCode = asText(payload.submissionCode);

  if (!email || !submissionCode) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
  const fromEmail = Deno.env.get("RESEND_FROM") || "";

  if (!resendApiKey || !fromEmail) {
    return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY or RESEND_FROM" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const greeting = firstName ? `Czesc ${firstName},` : "Czesc,";
  const html = `
    <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.45;color:#1f2937;">
      <p>${greeting}</p>
      <p>Dziekujemy za wyslanie zgloszenia w konkursie Verbena.</p>
      <p><strong>Twoj numer zgloszenia:</strong> ${submissionCode}</p>
      <p>Zachowaj ten numer - bedzie potrzebny do sprawdzenia statusu zgloszenia.</p>
      <p>Pozdrawiamy,<br>Zespol konkursu Verbena</p>
    </div>
  `;

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [email],
      subject: "Potwierdzenie zgloszenia - Konkurs Verbena",
      html,
    }),
  });

  if (!resendResponse.ok) {
    const details = await resendResponse.text();
    return new Response(JSON.stringify({ error: "Email send failed", details }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
