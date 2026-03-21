import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve built frontend in production
app.use(express.static(join(__dirname, "dist")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", hasKey: !!process.env.ANTHROPIC_API_KEY });
});

// Proxy to Anthropic API
app.post("/api/chat", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: req.body.model || "claude-sonnet-4-20250514",
        max_tokens: req.body.max_tokens || 1000,
        system: req.body.system || "",
        messages: req.body.messages || [],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log("ANTHROPIC ERROR:", JSON.stringify(data));
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (err) {
    console.error("Proxy error:", err.message);
    res.status(500).json({ error: "Failed to reach Anthropic API" });
  }
});

// Escalation — sends Telegram notification + Email
app.post("/api/escalate", async (req, res) => {
  const { customerEmail, businessName, agentName, escalationEmail, messages } = req.body;

  // Format conversation transcript
  const transcript = messages
    .map((m) => `${m.role === "user" ? "Customer" : agentName}: ${m.content}`)
    .join("\n\n");

  const results = { telegram: false, email: false };

  // 1. Send Telegram notification
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (botToken && chatId) {
    try {
      const telegramMsg = [
        `🚨 *ESCALATION — ${businessName}*`,
        ``,
        `📧 Customer email: ${customerEmail || "Not provided"}`,
        `📩 Forward to: ${escalationEmail}`,
        `💬 Messages: ${messages.length}`,
        ``,
        `── Transcript ──`,
        ``,
        transcript.slice(0, 3500), // Telegram 4096 char limit
      ].join("\n");

      const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: telegramMsg,
          parse_mode: "Markdown",
        }),
      });

      if (tgRes.ok) {
        results.telegram = true;
        console.log("✅ Telegram escalation sent");
      } else {
        const err = await tgRes.json();
        console.error("Telegram error:", err);
      }
    } catch (err) {
      console.error("Telegram send failed:", err.message);
    }
  } else {
    console.log("⚠️ Telegram not configured (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID missing)");
  }

  // 2. Send Email via EmailJS
  const emailServiceId = process.env.EMAILJS_SERVICE_ID;
  const emailTemplateId = process.env.EMAILJS_TEMPLATE_ID;
  const emailPublicKey = process.env.EMAILJS_PUBLIC_KEY;

  if (emailServiceId && emailTemplateId && emailPublicKey) {
    try {
      const emailRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: emailServiceId,
          template_id: emailTemplateId,
          user_id: emailPublicKey,
          accessToken: process.env.EMAILJS_PRIVATE_KEY,
          template_params: {
            business_name: businessName,
            customer_email: customerEmail || "Not provided",
            escalation_email: escalationEmail,
            message_count: messages.length.toString(),
            transcript: transcript.slice(0, 5000),
            to_email: escalationEmail,
          },
        }),
      });

      if (emailRes.ok) {
        results.email = true;
        console.log("✅ Email escalation sent");
      } else {
        const errText = await emailRes.text();
        console.error("EmailJS error:", errText);
      }
    } catch (err) {
      console.error("Email send failed:", err.message);
    }
  } else {
    console.log("⚠️ EmailJS not configured (EMAILJS_SERVICE_ID / EMAILJS_TEMPLATE_ID / EMAILJS_PUBLIC_KEY missing)");
  }

  res.json({ success: results.telegram || results.email, ...results });
});

// Catch-all: serve frontend for any non-API route
app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n🤖 SupportBot running on port ${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("⚠️  WARNING: No ANTHROPIC_API_KEY found!\n");
  } else {
    console.log("✅ Anthropic API key loaded\n");
  }
});
