// AgentAegis beta waitlist signup endpoint
// POST /api/beta-signup { email, name?, company?, use_case? }
//
// Behavior:
// 1. Validate email
// 2. (If RESEND_AUDIENCE_ID set) add to Resend audience for future broadcast
// 3. Send notification email to Andrew so he sees signups in real time

export default async function handler(req, res) {
  // Set CORS headers (in case any external embed needs to call this)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, name, company, use_case } = req.body || {};

  // Validate email
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required" });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Sanitize string fields (trim + cap length)
  const safe = (s, max = 200) => (typeof s === "string" ? s.trim().slice(0, max) : "");
  const safeName = safe(name, 100);
  const safeCompany = safe(company, 100);
  const safeUseCase = safe(use_case, 1000);
  const safeEmail = email.trim().toLowerCase().slice(0, 200);

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  // Accept either env var name. The Resend API endpoint we hit
  // (POST /audiences/{id}/contacts) expects the AUDIENCE id (parent
  // container), not a segment id. If a segment id is passed, the
  // request will 404 — surfaced in the warnings array below.
  const RESEND_AUDIENCE_ID =
    process.env.RESEND_AUDIENCE_ID || process.env.RESEND_AUDIENCE_SEGMENT_ID;
  const NOTIFY_TO = process.env.BETA_SIGNUP_NOTIFY_TO || "admin@youraigroup.com";
  const FROM_ADDRESS = process.env.BETA_SIGNUP_FROM || "AgentAegis <onboarding@resend.dev>";

  if (!RESEND_API_KEY) {
    // Log the signup so it doesn't get lost while we wire up Resend
    console.log("[beta-signup] (no Resend configured)", { email: safeEmail, name: safeName, company: safeCompany, use_case: safeUseCase });
    return res.status(200).json({
      ok: true,
      message: "Signup received (email delivery not yet configured server-side)",
    });
  }

  const errors = [];
  const diagnostics = [];

  // 0. Probe whether the configured ID is actually an audience.
  //    Resend exposes GET /audiences/{id} which 200s for audiences.
  //    A segment ID will 404. This is purely diagnostic.
  if (RESEND_AUDIENCE_ID) {
    try {
      const probe = await fetch(`https://api.resend.com/audiences/${encodeURIComponent(RESEND_AUDIENCE_ID)}`, {
        headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
      });
      diagnostics.push(`probe_audience: HTTP ${probe.status} (200 = valid audience id, 404 = likely segment id)`);
    } catch (err) {
      diagnostics.push(`probe_audience: ${String(err).slice(0, 100)}`);
    }
  }

  // 1. Add to Resend audience (if configured)
  if (RESEND_AUDIENCE_ID) {
    try {
      const r = await fetch(`https://api.resend.com/audiences/${encodeURIComponent(RESEND_AUDIENCE_ID)}/contacts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: safeEmail,
          first_name: safeName.split(" ")[0] || undefined,
          last_name: safeName.split(" ").slice(1).join(" ") || undefined,
          unsubscribed: false,
        }),
      });

      if (!r.ok) {
        const body = await r.text().catch(() => "");
        errors.push(`audience_add: ${r.status} ${body.slice(0, 200)}`);
      } else {
        diagnostics.push("audience_add: 200 OK");
      }
    } catch (err) {
      errors.push(`audience_add: ${String(err).slice(0, 200)}`);
    }
  }

  // 2. Send notification email to Andrew
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [NOTIFY_TO],
        reply_to: safeEmail,
        subject: `🛡️ AgentAegis beta signup — ${safeEmail}`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
            <h2 style="color: #5b8def;">New beta signup</h2>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr><td style="padding: 8px 0; color: #5a6480; width: 120px;">Email</td><td style="padding: 8px 0;"><strong>${escapeHtml(safeEmail)}</strong></td></tr>
              ${safeName ? `<tr><td style="padding: 8px 0; color: #5a6480;">Name</td><td style="padding: 8px 0;">${escapeHtml(safeName)}</td></tr>` : ""}
              ${safeCompany ? `<tr><td style="padding: 8px 0; color: #5a6480;">Company</td><td style="padding: 8px 0;">${escapeHtml(safeCompany)}</td></tr>` : ""}
              ${safeUseCase ? `<tr><td style="padding: 8px 0; color: #5a6480; vertical-align: top;">Use case</td><td style="padding: 8px 0;">${escapeHtml(safeUseCase).replace(/\n/g, "<br/>")}</td></tr>` : ""}
              <tr><td style="padding: 8px 0; color: #5a6480;">Time</td><td style="padding: 8px 0; color: #5a6480; font-size: 12px;">${new Date().toISOString()}</td></tr>
            </table>
            <p style="color: #5a6480; font-size: 13px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
              Reply to this email to respond directly to the signup. They've been added to the AgentAegis beta waitlist audience.
            </p>
          </div>
        `,
        text: `New beta signup\n\nEmail: ${safeEmail}\nName: ${safeName || "—"}\nCompany: ${safeCompany || "—"}\nUse case: ${safeUseCase || "—"}\nTime: ${new Date().toISOString()}`,
      }),
    });

    if (!r.ok) {
      const body = await r.text().catch(() => "");
      errors.push(`notify: ${r.status} ${body.slice(0, 200)}`);
    }
  } catch (err) {
    errors.push(`notify: ${String(err).slice(0, 200)}`);
  }

  // Always emit a structured info log so we can audit signups in Vercel logs
  console.log("[beta-signup]", JSON.stringify({
    email: safeEmail,
    name: safeName || null,
    company: safeCompany || null,
    diagnostics,
    errors,
    audience_id_provided: !!RESEND_AUDIENCE_ID,
  }));

  if (errors.length > 0) {
    console.error("[beta-signup] partial failure", errors);
    return res.status(200).json({
      ok: true,
      message: "Signup received",
      warnings: errors,
      diagnostics,
    });
  }

  return res.status(200).json({ ok: true, message: "Signup received", diagnostics });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
