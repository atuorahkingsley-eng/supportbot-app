import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", hasKey: !!process.env.ANTHROPIC_API_KEY });
});

// Proxy to Anthropic API
app.post("/api/chat", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not set in .env file" });
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
console.log("API Response:", JSON.stringify(data).slice(0, 500));
    res.json(data);
  } catch (err) {
    console.error("Proxy error:", err.message);
    res.status(500).json({ error: "Failed to reach Anthropic API" });
  }
});

app.listen(PORT, () => {
  console.log(`\n🤖 SupportBot proxy server running at http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("⚠️  WARNING: No ANTHROPIC_API_KEY found in .env file!");
    console.log("   Create a .env file with: ANTHROPIC_API_KEY=your_key_here\n");
  } else {
    console.log("✅ Anthropic API key loaded\n");
  }
});
