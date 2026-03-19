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
