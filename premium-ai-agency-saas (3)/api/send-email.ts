import { Resend } from "resend";

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    const { email, name, type, details } = body;

    if (!email || !type) {
      return res.status(400).json({ error: "Email and notification type are mandatory properties." });
    }

    const resendApiKey = process.env.RESEND_API_KEY || "";
    if (!resendApiKey) {
      console.warn("[Resend Backend] RESEND_API_KEY is not configured yet. Simulating email dispatch.");
      return res.status(200).json({
        success: true,
        isSimulated: true,
        message: "Email dispatch simulated successfully. Configure RESEND_API_KEY to trigger live delivery.",
      });
    }

    const resend = new Resend(resendApiKey);

    let subject = "";
    let htmlContent = "";

    const brandingHeader = `
      <div style="background-color: #050816; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; font-family: 'Space Grotesk', sans-serif; font-size: 28px; margin: 0; font-weight: bold; letter-spacing: -1px;">
          VELOCE <span style="color: #3b82f6;">AI</span>
        </h1>
        <p style="color: #94a3b8; font-family: sans-serif; font-size: 12px; margin: 6px 0 0 0; letter-spacing: 2px; text-transform: uppercase;">
          Accelerated Strategic Delivery
        </p>
      </div>
    `;

    const brandingFooter = `
      <div style="background-color: #0B1220; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; margin-top: 30px; border-top: 1px solid #1e293b;">
        <p style="color: #64748b; font-family: sans-serif; font-size: 11px; margin: 0;">
          &copy; 2026 Veloce AI Strategic Solutions. All rights reserved.
        </p>
        <p style="color: #64748b; font-family: sans-serif; font-size: 10px; margin: 4px 0 0 0;">
          This is an automated notification. For support, access your client dashboard.
        </p>
      </div>
    `;

    const containerStyle = `
      max-width: 600px;
      margin: 0 auto;
      background-color: #fafbfd;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    `;

    if (type === "booking_confirmation") {
      subject = "⚡ Strategy Discovery Brief Locked — Veloce AI";
      htmlContent = `
        <div style="${containerStyle}">
          ${brandingHeader}
          <div style="padding: 30px; font-family: sans-serif; color: #1e293b; line-height: 1.6;">
            <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">Hi ${name || "Client"},</h2>
            <p>Your strategic consultation with <strong>Veloce AI</strong> is confirmed. Our automation engine has reserved your block and scheduled the meeting invite links.</p>
            
            <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #0f172a; text-transform: uppercase; letter-spacing: 1px;">Meeting Details</h3>
              <p style="margin: 0; font-size: 14px;"><strong>Date:</strong> ${details?.date || "Selected Date"}</p>
              <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>Time:</strong> ${details?.time || "Selected Time"} (${details?.timezone || "UTC"})</p>
              <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>Service:</strong> ${details?.service || "AI Consultation"}</p>
              ${details?.meetLink ? `<p style="margin: 8px 0 0 0; font-size: 14px;"><strong>Google Meet:</strong> <a href="${details.meetLink}" style="color: #3b82f6; font-weight: bold; text-decoration: none;">Join Video Call</a></p>` : ""}
            </div>

            <p style="margin-bottom: 24px;">Please come prepared with any existing technical architecture diagrams, process maps, or system flowcharts that we will audit in real-time during our strategy call.</p>
            
            <div style="text-align: center;">
              <a href="${details?.meetLink || "#"}" style="background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
                Add to Calendar & View Link
              </a>
            </div>
          </div>
          ${brandingFooter}
        </div>
      `;
    } else if (type === "payment_success") {
      subject = "🎉 Payment Authorized & Order Completed — Veloce AI";
      htmlContent = `
        <div style="${containerStyle}">
          ${brandingHeader}
          <div style="padding: 30px; font-family: sans-serif; color: #1e293b; line-height: 1.6;">
            <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">Dear ${name || "Client"},</h2>
            <p>Thank you for choosing <strong>Veloce AI</strong>. Your payment for the <strong>${details?.planName || "SaaS Program"}</strong> subscription is authorized and captured successfully.</p>
            
            <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <h3 style="margin: 0 0 10px 0; font-size: 13px; color: #475569; text-transform: uppercase; letter-spacing: 1px;">Transaction Audit</h3>
              <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Invoice ID:</td>
                  <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #0f172a;">${details?.invoiceId || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Transaction ID:</td>
                  <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #0f172a;">${details?.paymentId || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Amount Paid:</td>
                  <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #10b981;">₹${details?.amount?.toLocaleString("en-IN") || "0.00"}</td>
                </tr>
              </table>
            </div>

            <p>Your subscription is active immediately. You can now log in to the Client Dashboard to submit code specifications, review project wireframes, and view upcoming milestones.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${details?.dashboardUrl || "#"}" style="background-color: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
                Access Client Dashboard
              </a>
            </div>
          </div>
          ${brandingFooter}
        </div>
      `;
    } else if (type === "invoice") {
      subject = `📄 Invoice Issued: ${details?.invoiceNumber || "INV-NEW"}`;
      htmlContent = `
        <div style="${containerStyle}">
          ${brandingHeader}
          <div style="padding: 30px; font-family: sans-serif; color: #1e293b; line-height: 1.6;">
            <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">Tax Invoice</h2>
            <p>A new tax invoice has been generated for your recent payment on the Veloce agency platform.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px;">
              <thead>
                <tr style="border-bottom: 2px solid #e2e8f0; color: #475569;">
                  <th style="text-align: left; padding: 8px 0;">Description</th>
                  <th style="text-align: right; padding: 8px 0;">Net (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0;"><strong>${details?.planName || "Service Package"}</strong><br/><span style="font-size: 11px; color: #64748b;">Agency Delivery & Consultation</span></td>
                  <td style="padding: 10px 0; text-align: right;">₹${details?.originalAmount?.toLocaleString("en-IN") || "0.00"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; text-align: right;">Discount:</td>
                  <td style="padding: 6px 0; text-align: right; color: #ef4444;">-₹${details?.discount?.toLocaleString("en-IN") || "0.00"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; text-align: right;">18% GST (Agency Services):</td>
                  <td style="padding: 6px 0; text-align: right;">₹${details?.gstAmount?.toLocaleString("en-IN") || "0.00"}</td>
                </tr>
                <tr style="border-top: 2px solid #e2e8f0; font-size: 16px; font-weight: bold; color: #0f172a;">
                  <td style="padding: 12px 0; text-align: right;">Total Paid:</td>
                  <td style="padding: 12px 0; text-align: right; color: #3b82f6;">₹${details?.totalAmount?.toLocaleString("en-IN") || "0.00"}</td>
                </tr>
              </tbody>
            </table>

            <div style="font-size: 12px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 16px; margin-top: 16px;">
              <p style="margin: 0;"><strong>Billing Name:</strong> ${details?.billingName || "N/A"}</p>
              <p style="margin: 4px 0 0 0;"><strong>GST Number:</strong> ${details?.gstNumber || "N/A"}</p>
              <p style="margin: 4px 0 0 0;"><strong>Date Issued:</strong> ${details?.invoiceDate || "Today"}</p>
            </div>
          </div>
          ${brandingFooter}
        </div>
      `;
    } else if (type === "reminder") {
      subject = "⏰ Strategy Call Preparation Reminder — Veloce AI";
      htmlContent = `
        <div style="${containerStyle}">
          ${brandingHeader}
          <div style="padding: 30px; font-family: sans-serif; color: #1e293b; line-height: 1.6;">
            <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">Hi ${name || "Client"},</h2>
            <p>This is an automated reminder that your strategic AI alignment call with <strong>Veloce AI</strong> is starting shortly.</p>
            
            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #b45309; text-transform: uppercase;">Upcoming Call Details</h3>
              <p style="margin: 0; font-size: 14px;"><strong>Date:</strong> ${details?.date || "Selected Date"}</p>
              <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>Time:</strong> ${details?.time || "Selected Time"} (${details?.timezone || "UTC"})</p>
            </div>

            <p>If you need to reschedule or submit additional materials, please visit your client dashboard at least 2 hours before the start of the meeting.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${details?.meetLink || "#"}" style="background-color: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
                Join Google Meet
              </a>
            </div>
          </div>
          ${brandingFooter}
        </div>
      `;
    } else if (type === "cancellation") {
      subject = "🚫 Booking Cancellation Notice — Veloce AI";
      htmlContent = `
        <div style="${containerStyle}">
          ${brandingHeader}
          <div style="padding: 30px; font-family: sans-serif; color: #1e293b; line-height: 1.6;">
            <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">Dear ${name || "Client"},</h2>
            <p>As requested, your scheduled meeting has been cancelled. If there has been a scheduling error, you can reserve a new slot directly via your dashboard portal.</p>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 8px; margin: 24px 0; color: #991b1b;">
              <h3 style="margin: 0 0 4px 0; font-size: 14px; text-transform: uppercase;">Cancelled Meeting</h3>
              <p style="margin: 0; font-size: 13px;"><strong>Date:</strong> ${details?.date || "N/A"}</p>
              <p style="margin: 2px 0 0 0; font-size: 13px;"><strong>Time:</strong> ${details?.time || "N/A"}</p>
            </div>

            <p>Any payments made towards associated consultations remain credited to your profile balance, and can be redeemed for future strategic sessions.</p>
          </div>
          ${brandingFooter}
        </div>
      `;
    } else if (type === "admin_notification") {
      subject = "🚨 ADMIN ALERT: New System Action Recorded — Veloce AI";
      htmlContent = `
        <div style="${containerStyle}">
          ${brandingHeader}
          <div style="padding: 30px; font-family: sans-serif; color: #1e293b; line-height: 1.6;">
            <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">New System Event</h2>
            <p>Veloce's database listener has recorded a new transaction or booking registration requiring review.</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <h3 style="margin: 0 0 10px 0; font-size: 13px; color: #475569; text-transform: uppercase; letter-spacing: 1px;">Action Summary</h3>
              <p style="margin: 0; font-size: 14px;"><strong>Event Type:</strong> ${details?.eventType || "Action Record"}</p>
              <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>Client:</strong> ${details?.clientName || "N/A"} (${details?.clientEmail || "N/A"})</p>
              <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>Details:</strong> ${details?.summary || "N/A"}</p>
            </div>

            <p>Please log in as Administrator to review active records and trigger manual updates.</p>
          </div>
          ${brandingFooter}
        </div>
      `;
    } else if (type === "contact_form") {
      subject = "📬 New Discovery Message Submitted — Veloce AI";
      htmlContent = `
        <div style="${containerStyle}">
          ${brandingHeader}
          <div style="padding: 30px; font-family: sans-serif; color: #1e293b; line-height: 1.6;">
            <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">Hi ${name || "Client"},</h2>
            <p>Your message has been logged in our systems. Our strategic team will review your enquiry and respond within 12 hours.</p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <h3 style="margin: 0 0 8px 0; font-size: 13px; color: #047857; text-transform: uppercase;">Message Record</h3>
              <p style="margin: 0; font-size: 14px; font-style: italic; color: #475569;">"${details?.content || "No Message Body"}"</p>
            </div>
          </div>
          ${brandingFooter}
        </div>
      `;
    }

    const { data: resendResult, error: resendError } = await resend.emails.send({
      from: "Veloce AI <onboarding@resend.dev>", // Default sandbox verified email
      to: email,
      subject: subject,
      html: htmlContent,
    });

    if (resendError) {
      console.error("[Resend Delivery Error]:", resendError);
      return res.status(400).json({ success: false, error: resendError });
    }

    return res.status(200).json({
      success: true,
      isSimulated: false,
      message: "Resend email dispatched successfully.",
      data: resendResult,
    });
  } catch (error: any) {
    console.error("[Resend Function Exception]:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to process email delivery request.",
    });
  }
}
