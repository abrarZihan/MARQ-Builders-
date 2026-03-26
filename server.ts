import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import { db } from "./src/firebase"; // Assuming firebase is initialized in src/firebase.ts
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // SSLCommerz Credentials
  const STORE_ID = process.env.SSLCOMMERZ_STORE_ID;
  const STORE_PASSWORD = process.env.SSLCOMMERZ_STORE_PASSWORD;
  const IS_SANDBOX = true;
  const BASE_URL = IS_SANDBOX ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com";

  // API routes
  app.post("/api/initiate-payment", async (req, res) => {
    const { amount, installmentId, clientId, clientName } = req.body;
    const transactionId = `TXN_${Date.now()}`;

    const payload = {
      store_id: STORE_ID,
      store_passwd: STORE_PASSWORD,
      total_amount: amount,
      currency: "BDT",
      tran_id: transactionId,
      success_url: `${process.env.APP_URL}/api/payment-success?installmentId=${installmentId}&clientId=${clientId}`,
      fail_url: `${process.env.APP_URL}/api/payment-fail`,
      cancel_url: `${process.env.APP_URL}/api/payment-fail`,
      cus_name: clientName,
      cus_email: "test@test.com",
      shipping_method: "NO",
      product_name: "Installment Payment",
      product_category: "Real Estate",
      product_profile: "general",
    };

    try {
      const response = await axios.post(`${BASE_URL}/gwprocess/v3/api.php`, payload, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      res.json({ url: response.data.GatewayPageURL, transactionId });
    } catch (error) {
      res.status(500).json({ error: "Failed to initiate payment" });
    }
  });

  app.post("/api/payment-success", async (req, res) => {
    const { installmentId, clientId, tran_id } = req.query;
    // In production, validate SSLCommerz IPN here
    try {
      const installmentRef = doc(db, "clients", clientId as string, "installments", installmentId as string);
      await updateDoc(installmentRef, {
        paid: true,
        paidAt: serverTimestamp(),
        transactionId: tran_id,
        paymentMethod: "SSLCommerz"
      });
      res.redirect(`${process.env.APP_URL}/payment-success?transactionId=${tran_id}`);
    } catch (error) {
      res.redirect(`${process.env.APP_URL}/payment-fail`);
    }
  });

  app.post("/api/payment-fail", (req, res) => {
    res.redirect(`${process.env.APP_URL}/payment-fail`);
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
