// src/pages/api/coa-lead.ts — COA Lead Capture API endpoint (Resend)
import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false; // SSR endpoint

const resend = new Resend(import.meta.env.RESEND_API_KEY);

const FROM_EMAIL = import.meta.env.FROM_EMAIL || 'noreply@ginkvora.com';
const TO_EMAIL   = import.meta.env.TO_EMAIL   || 'inquiry@ginkvora.com';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { 
      name, 
      company, 
      email, 
      phone, 
      role, 
      demand, 
      application, 
      productName, 
      coaUrl, 
      b_website 
    } = body;

    // --- Extract tracking information ---
    const rawIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown';
    // If x-forwarded-for contains multiple IPs, take the first one
    const ip = rawIp.split(',')[0].trim();

    // Default to Vercel geo headers as fallback
    let country = request.headers.get('x-vercel-ip-country') || 'Unknown';
    let region = request.headers.get('x-vercel-ip-country-region') || 'Unknown';
    let city = request.headers.get('x-vercel-ip-city') || 'Unknown';
    let timezone = request.headers.get('x-vercel-ip-timezone') || 'Unknown';
    let latitude = request.headers.get('x-vercel-ip-latitude') || 'Unknown';
    let longitude = request.headers.get('x-vercel-ip-longitude') || 'Unknown';

    // Fetch real location from ip-api if it is a public IP
    if (ip !== 'Unknown' && ip !== '127.0.0.1' && ip !== '::1' && !ip.startsWith('192.168.') && !ip.startsWith('10.')) {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.status === 'success') {
            country = geoData.countryCode || geoData.country || country;
            region = geoData.regionName || geoData.region || region;
            city = geoData.city || city;
            timezone = geoData.timezone || timezone;
            latitude = geoData.lat ? String(geoData.lat) : latitude;
            longitude = geoData.lon ? String(geoData.lon) : longitude;
          }
        }
      } catch (geoErr) {
        console.warn('Failed to fetch user geolocation from ip-api:', geoErr);
      }
    }

    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const referer = request.headers.get('referer') || 'Unknown';
    const acceptLanguage = request.headers.get('accept-language') || 'Unknown';
    const submissionId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

    const mapsLink = (latitude !== 'Unknown' && longitude !== 'Unknown')
      ? `<a href="https://www.google.com/maps?q=${latitude},${longitude}" target="_blank" style="color:#4a8a48;text-decoration:underline;">View on Google Maps</a>`
      : 'N/A';

    // --- Honeypot check ---
    if (b_website) {
      console.warn('Spam bot detected via honeypot field during COA request:', { b_website, ip });
      return new Response(
        JSON.stringify({ error: 'Suspicious activity detected.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- Basic validation ---
    if (!name || !email || !phone || !role || !demand) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const applicationStr = Array.isArray(application) && application.length > 0 
      ? application.join(', ') 
      : 'None specified';

    // --- Send notification to GINKVORA team ---
    await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: email,
      subject: `[COA Access] Lead: ${name} — ${productName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'DM Sans', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
            .card { background: white; border-radius: 12px; max-width: 600px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #0a1a0a, #132013); padding: 28px 32px; }
            .logo { color: #a8d5a6; font-size: 20px; font-weight: 700; letter-spacing: 4px; }
            .body { padding: 32px; }
            h2 { color: #1a2a1a; font-size: 22px; margin: 0 0 24px; }
            .field { margin-bottom: 16px; border-bottom: 1px solid #f0f0f0; padding-bottom: 16px; }
            .label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 4px; }
            .value { font-size: 15px; color: #1a1a1a; }
            .footer { background: #f9fafb; padding: 20px 32px; font-size: 13px; color: #999; border-top: 1px solid #eee; }
            .tag { display: inline-block; background: #e8f5e8; color: #2d7a2d; padding: 4px 10px; border-radius: 100px; font-size: 12px; font-weight: 500; }
            .tag-alt { display: inline-block; background: #fff8e8; color: #a07830; padding: 4px 10px; border-radius: 100px; font-size: 12px; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="logo">GINKVORA</div>
            </div>
            <div class="body">
              <h2>COA Document Accessed 🌿</h2>
              
              <div class="field">
                <div class="label">Target Product / Ingredient</div>
                <div class="value" style="font-weight: 600; color: #a07830;">${productName}</div>
              </div>

              <div class="field">
                <div class="label">Downloaded COA Link</div>
                <div class="value"><a href="${coaUrl}" target="_blank" style="color:#4a8a48; word-break: break-all;">${coaUrl}</a></div>
              </div>

              <div class="field">
                <div class="label">Contact Name</div>
                <div class="value">${name}</div>
              </div>

              <div class="field">
                <div class="label">Company Name</div>
                <div class="value">${company || 'Not Specified'}</div>
              </div>

              <div class="field">
                <div class="label">Email Address</div>
                <div class="value"><a href="mailto:${email}" style="color:#4a8a48;">${email}</a></div>
              </div>

              <div class="field">
                <div class="label">Phone / WhatsApp</div>
                <div class="value">${phone}</div>
              </div>

              <div class="field">
                <div class="label">Professional Role</div>
                <div class="value"><span class="tag">${role}</span></div>
              </div>

              <div class="field">
                <div class="label">Estimated Annual Demand</div>
                <div class="value"><span class="tag-alt">${demand}</span></div>
              </div>

              <div class="field">
                <div class="label">Intended Formulation Application</div>
                <div class="value" style="white-space:pre-wrap;">${applicationStr}</div>
              </div>

              <!-- Lead Tracking Metadata -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 2px dashed #a8d5a6; padding-bottom: 8px;">
                <div class="label" style="color: #2d7a2d; font-weight: bold; margin-bottom: 12px;">Lead Tracking Metadata</div>
                <table style="width: 100%; font-size: 13px; color: #444; border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 6px 0; font-weight: 600; width: 150px;">Submission ID</td><td style="padding: 6px 0; font-family: monospace; font-size: 11px;">${submissionId}</td></tr>
                  <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 6px 0; font-weight: 600;">Source Page</td><td style="padding: 6px 0; word-break: break-all;">${referer}</td></tr>
                  <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 6px 0; font-weight: 600;">Client IP</td><td style="padding: 6px 0; font-family: monospace;">${ip}</td></tr>
                  <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 6px 0; font-weight: 600;">Location</td><td style="padding: 6px 0;">${city}, ${region}, ${country}</td></tr>
                  <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 6px 0; font-weight: 600;">Timezone</td><td style="padding: 6px 0;">${timezone}</td></tr>
                  <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 6px 0; font-weight: 600;">Coordinates</td><td style="padding: 6px 0;">${latitude}, ${longitude} ${mapsLink !== 'N/A' ? `(${mapsLink})` : ''}</td></tr>
                  <tr style="border-bottom: 1px solid #f0f0f0;"><td style="padding: 6px 0; font-weight: 600;">Browser Lang</td><td style="padding: 6px 0;">${acceptLanguage}</td></tr>
                  <tr><td style="padding: 6px 0; font-weight: 600; vertical-align: top;">User Agent</td><td style="padding: 6px 0; font-size: 11px; word-break: break-all;">${userAgent}</td></tr>
                </table>
              </div>
            </div>
            <div class="footer">
              This lead was captured via ginkvora.com — ${new Date().toUTCString()}
            </div>
          </div>
        </body>
        </html>
      `,
    });

    // --- Send auto-reply to the customer with direct COA download link ---
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `Your requested COA for ${productName} — GINKVORA`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'DM Sans', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
              .card { background: white; border-radius: 12px; max-width: 600px; margin: 0 auto; overflow: hidden; }
              .header { background: linear-gradient(135deg, #0a1a0a, #132013); padding: 28px 32px; }
              .logo { color: #a8d5a6; font-size: 20px; font-weight: 700; letter-spacing: 4px; }
              .body { padding: 32px; line-height: 1.7; color: #333; }
              h2 { color: #1a2a1a; }
              .highlight { color: #4a8a48; font-weight: 500; }
              .btn { display: inline-block; background: linear-gradient(135deg, #7cb87a, #4a8a48); color: white !important; text-decoration: none; padding: 12px 28px; border-radius: 100px; font-weight: 500; margin: 20px 0; }
              .footer { background: #f9fafb; padding: 20px 32px; font-size: 13px; color: #999; border-top: 1px solid #eee; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="header">
                <div class="logo">GINKVORA</div>
              </div>
              <div class="body">
                <h2>Hello ${name},</h2>
                <p>Thank you for your interest in our active ingredients. We've compiled the requested technical documentation for you.</p>
                <p>You can access and download the Certificate of Analysis (COA) for <strong style="color: #a07830;">${productName}</strong> by clicking the button below:</p>
                
                <div style="text-align: center;">
                  <a href="${coaUrl}" target="_blank" class="btn">Download COA Document</a>
                </div>

                <p>If you require physical samples for R&D testing, custom formulation pricing, or specific compliance certificates (MSDS, kosher, halal, etc.), feel free to reply to this email directly or reach our commercial desk at <a href="mailto:inquiry@ginkvora.com" style="color:#4a8a48;">inquiry@ginkvora.com</a>.</p>
                <p>Best regards,<br/><strong>The GINKVORA Team</strong></p>
              </div>
              <div class="footer">
                Pure Nature, Proven Science · <a href="https://ginkvora.com" style="color:#4a8a48;">ginkvora.com</a>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    } catch (autoReplyError) {
      console.warn('Auto-reply email failed to send (likely due to Resend sandbox/domain verification limits):', autoReplyError);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Lead captured successfully!' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('COA Lead capture endpoint error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
