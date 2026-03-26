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
    console.log('Received initiate-payment request:', req.body);
    const { amount, installmentId, clientId, clientName } = req.body;
    const transactionId = `TXN_${Date.now()}`;

    const params = new URLSearchParams();
    params.append('store_id', STORE_ID!);
    params.append('store_passwd', STORE_PASSWORD!);
    params.append('total_amount', amount.toString());
    params.append('currency', 'BDT');
    params.append('tran_id', transactionId);
    params.append('success_url', `${process.env.APP_URL}/api/payment-success?installmentId=${installmentId}&clientId=${clientId}`);
    params.append('fail_url', `${process.env.APP_URL}/api/payment-fail`);
    params.append('cancel_url', `${process.env.APP_URL}/api/payment-fail`);
    params.append('cus_name', clientName);
    params.append('cus_email', 'test@test.com');
    params.append('shipping_method', 'NO');
    params.append('product_name', 'Installment Payment');
    params.append('product_category', 'Real Estate');
    params.append('product_profile', 'general');

    try {
      const response = await axios.post(`${BASE_URL}/gwprocess/v3/api.php`, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      console.log('SSLCommerz response:', response.data);
      res.json({ url: response.data.GatewayPageURL, transactionId });
    } catch (error) {
      console.error('SSLCommerz API error:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: "Failed to initiate payment", details: error.message });
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
