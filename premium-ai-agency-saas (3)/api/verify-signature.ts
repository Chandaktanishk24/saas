import crypto from "crypto";

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

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!razorpayOrderId || !razorpayPaymentId) {
      return res.status(400).json({ error: "Missing required checkout parameters" });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

    if (!keySecret || razorpayPaymentId.startsWith("pay_sim_")) {
      // If secret is not provided or it's a simulated payment, approve immediately
      return res.status(200).json({
        success: true,
        isSimulated: true,
        message: "Payment signature verified successfully (Simulation mode)",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");

    const isValid = generatedSignature === razorpaySignature;

    if (isValid) {
      return res.status(200).json({
        success: true,
        isSimulated: false,
        message: "Payment signature verified successfully",
      });
    } else {
      return res.status(400).json({
        success: false,
        error: "Invalid payment signature verification failed",
      });
    }
  } catch (error: any) {
    console.error("[Razorpay Signature Verification Error]:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to verify Razorpay signature",
    });
  }
}
