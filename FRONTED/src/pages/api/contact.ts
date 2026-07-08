// src/pages/api/contact.ts — Contact form API endpoint (Resend)
import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false; // SSR endpoint

const resend = new Resend(import.meta.env.RESEND_API_KEY);

const FROM_EMAIL = import.meta.env.FROM_EMAIL || 'noreply@ginkvora.com';
const TO_EMAIL   = import.meta.env.TO_EMAIL   || 'inquiry@ginkvora.com';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, email, company, interest, message, phone, website, industry, productName, quantity, b_website, recaptchaToken } = body;

    // --- Extract tracking information ---
    const rawIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown';
    // If x-forwarded-for contains multiple IPs (e.g. client, proxy1, proxy2), take the first one which is the client
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
      console.warn('Spam bot detected via honeypot:', { b_website, ip });
      return new Response(
        JSON.stringify({ error: 'Suspicious activity detected.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- reCAPTCHA Validation ---
    const secretKey = process.env.RECAPTCHA_SECRET_KEY || import.meta.env.RECAPTCHA_SECRET_KEY;
    const isDev = import.meta.env.DEV;
    if (secretKey && country !== 'CN') {
      if (isDev) {
        console.info('reCAPTCHA validation bypassed in DEV mode.');
      } else {
        if (!recaptchaToken) {
          console.warn('reCAPTCHA validation failed: Token is missing for non-CN visitor.');
          return new Response(
            JSON.stringify({ error: 'Security verification failed. Please refresh the page and try again.' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        try {
          const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              secret: secretKey,
              response: recaptchaToken,
              remoteip: ip,
            }).toString(),
          });
          
          if (verifyRes.ok) {
            const verifyData = await verifyRes.json();
            if (!verifyData.success || (verifyData.score !== undefined && verifyData.score < 0.5)) {
              console.warn('reCAPTCHA validation failed:', verifyData);
              return new Response(
                JSON.stringify({ error: 'Failed security check. Your request was flagged as suspicious.' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
              );
            }
          } else {
            console.warn('reCAPTCHA server returned non-ok status');
          }
        } catch (recaptchaErr) {
          console.error('reCAPTCHA verification request error:', recaptchaErr);
        }
      }
    }

    // --- Basic validation ---
    if (!name || !email || !phone) {
      return new Response(
        JSON.stringify({ error: 'Name, email and phone are required.' }),
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

    // --- Send notification to GINKVORA team ---
    await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: email,
      subject: `New B2B Inquiry from ${name} — GINKVORA`,
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
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="logo">GINKVORA</div>
            </div>
            <div class="body">
              <h2>New Inquiry Received 🌿</h2>
              <div class="field">
                <div class="label">Name / Company Name</div>
                <div class="value">${name}</div>
              </div>
              <div class="field">
                <div class="label">Email</div>
                <div class="value"><a href="mailto:${email}" style="color:#4a8a48;">${email}</a></div>
              </div>
              <div class="field">
                <div class="label">Phone / WhatsApp</div>
                <div class="value">${phone}</div>
              </div>
              ${website && website !== 'None' ? `<div class="field"><div class="label">Company Website</div><div class="value"><a href="${website.startsWith('http') ? website : 'https://' + website}" target="_blank" style="color:#4a8a48;">${website}</a></div></div>` : ''}
              ${industry ? `<div class="field"><div class="label">Industry Sector</div><div class="value">${industry}</div></div>` : ''}
              ${productName ? `<div class="field"><div class="label">Target Ingredient</div><div class="value">${productName}</div></div>` : ''}
              ${quantity ? `<div class="field"><div class="label">Required Quantity</div><div class="value">${quantity}</div></div>` : ''}
              ${interest ? `<div class="field"><div class="label">Interested In</div><div class="value"><span class="tag">${interest}</span></div></div>` : ''}
              ${message ? `<div class="field"><div class="label">Message</div><div class="value" style="white-space:pre-wrap;">${message}</div></div>` : ''}

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
              This inquiry was submitted via ginkvora.com — ${new Date().toUTCString()}
            </div>
          </div>
        </body>
        </html>
      `,
    });

    // --- Send auto-reply to the customer ---
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `We received your inquiry — GINKVORA`,
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
                <h2>Thank you, ${name}! 🌿</h2>
                <p>We've received your inquiry and our team will get back to you within <span class="highlight">24 hours</span>.</p>
                <p>In the meantime, you can explore our full product catalog or learn more about our quality standards:</p>
                <a href="https://ginkvora.com/products" class="btn">Browse Our Products</a>
                <p>If you have urgent questions, you can also reach us directly at:</p>
                <p><strong>inquiry@ginkvora.com</strong></p>
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
      JSON.stringify({ success: true, message: 'Inquiry received!' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
