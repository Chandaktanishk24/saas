import Razorpay from "razorpay";

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

    const { amount, planName } = body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

    if (!keyId || !keySecret) {
      console.warn("[Razorpay Backend] Credentials missing, fallback to simulation mode");
      // Graceful fallback to simulated order ID if keys are not set up yet
      return res.status(200).json({
        id: `order_sim_${Date.now().toString().slice(-6)}`,
        amount: Math.round(amount * 100),
        currency: "INR",
        isSimulated: true,
      });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // in paise
      currency: "INR",
      receipt: `receipt_${planName || "saas"}_${Date.now().toString().slice(-6)}`,
    });

    return res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      isSimulated: false,
    });
  } catch (error: any) {
    console.error("[Razorpay Order Error]:", error);
    return res.status(500).json({
      error: error.message || "Failed to create Razorpay order",
    });
  }
}
