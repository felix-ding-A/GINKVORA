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
    const { name, email, company, interest, message, phone } = body;

    // --- Basic validation ---
    if (!name || !email || !company) {
      return new Response(
        JSON.stringify({ error: 'Name, email and company are required.' }),
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
      subject: `New B2B Inquiry from ${company} — GINKVORA`,
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
                <div class="label">Contact Name</div>
                <div class="value">${name}</div>
              </div>
              <div class="field">
                <div class="label">Company</div>
                <div class="value">${company}</div>
              </div>
              <div class="field">
                <div class="label">Email</div>
                <div class="value"><a href="mailto:${email}" style="color:#4a8a48;">${email}</a></div>
              </div>
              ${phone ? `<div class="field"><div class="label">Phone</div><div class="value">${phone}</div></div>` : ''}
              ${interest ? `<div class="field"><div class="label">Interested In</div><div class="value"><span class="tag">${interest}</span></div></div>` : ''}
              ${message ? `<div class="field"><div class="label">Message</div><div class="value" style="white-space:pre-wrap;">${message}</div></div>` : ''}
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
