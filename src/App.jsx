import { useState, useRef, useEffect, useCallback } from "react";

const DEFAULT_CONFIG = {
  businessName: "TechFlow Solutions",
  brandColor: "#0F766E",
  welcomeMessage: "Hi there! How can I help you today?",
  agentName: "Ava",
  escalationEmail: "support@techflow.com",
  faqs: [
    { q: "What are your pricing plans?", a: "We offer three plans: Starter ($29/mo), Growth ($79/mo), and Enterprise (custom). All plans include 24/7 support." },
    { q: "How do I reset my password?", a: "Go to Settings > Security > Change Password. You'll get a verification email. If locked out, use 'Forgot Password' on the login page." },
    { q: "What's your refund policy?", a: "Full refund within 30 days, no questions asked. After 30 days, we offer prorated refunds for annual plans." },
    { q: "Do you offer API access?", a: "Yes! API access is included in Growth and Enterprise plans. Documentation is at docs.techflow.com." },
    { q: "How do I contact human support?", a: "You can reach our team via email at support@techflow.com or schedule a call at techflow.com/support." },
  ],
};

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function darkenHex(hex, pct) {
  let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  r = Math.round(r * (1 - pct)); g = Math.round(g * (1 - pct)); b = Math.round(b * (1 - pct));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/* ─── ANALYTICS DASHBOARD ─── */
function AnalyticsDashboard({ conversations, config }) {
  const rgb = hexToRgb(config.brandColor);
  const totalConvos = conversations.length;
  const totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0);
  const escalations = conversations.filter((c) => c.escalated).length;
  const avgMessages = totalConvos > 0 ? (totalMessages / totalConvos).toFixed(1) : "0";
  const resolutionRate = totalConvos > 0 ? Math.round(((totalConvos - escalations) / totalConvos) * 100) : 0;
  const ratings = conversations.filter(c => c.rating).map(c => c.rating);
  const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "-";

  const questionCounts = {};
  conversations.forEach((c) => {
    c.messages.filter((m) => m.role === "user").forEach((m) => {
      const text = m.content.toLowerCase().trim();
      questionCounts[text] = (questionCounts[text] || 0) + 1;
    });
  });
  const topQuestions = Object.entries(questionCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const hourly = new Array(24).fill(0);
  conversations.forEach((c) => { const h = new Date(c.startedAt).getHours(); hourly[h]++; });
  const maxHourly = Math.max(...hourly, 1);

  const statCard = (label, value, sub) => (
    <div style={{ background: "white", borderRadius: 14, border: "1px solid #E4E4E7", padding: "20px 24px", flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "'Space Mono', monospace" }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: "#18181B", letterSpacing: "-0.03em" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#A1A1AA", marginTop: 4 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {statCard("Conversations", totalConvos, "total sessions")}
        {statCard("Messages", totalMessages, `${avgMessages} avg per convo`)}
        {statCard("Resolution Rate", `${resolutionRate}%`, `${escalations} escalated`)}
        {statCard("Avg Rating", avgRating, `${ratings.length} rated`)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #E4E4E7", padding: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#18181B", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Space Mono', monospace" }}>Hourly Activity</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 120 }}>
            {hourly.map((count, h) => (
              <div key={h} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: "100%", height: Math.max(4, (count / maxHourly) * 100), background: count > 0 ? `rgba(${rgb}, ${0.3 + (count / maxHourly) * 0.7})` : "#F4F4F5", borderRadius: 3 }} />
                {h % 4 === 0 && <span style={{ fontSize: 9, color: "#A1A1AA" }}>{h}h</span>}
              </div>
            ))}
          </div>
          {totalConvos === 0 && <div style={{ textAlign: "center", color: "#A1A1AA", fontSize: 13, marginTop: 12 }}>No data yet — start chatting in Demo mode</div>}
        </div>

        <div style={{ background: "white", borderRadius: 14, border: "1px solid #E4E4E7", padding: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#18181B", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Space Mono', monospace" }}>Top Questions</h3>
          {topQuestions.length === 0 ? (
            <div style={{ color: "#A1A1AA", fontSize: 13 }}>No questions asked yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topQuestions.map(([q, count], i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: `rgba(${rgb}, ${0.15 + i * 0.05})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: config.brandColor, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, fontSize: 13, color: "#3F3F46", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#71717A", fontFamily: "'Space Mono', monospace" }}>{count}x</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Conversation Log */}
      <div style={{ background: "white", borderRadius: 14, border: "1px solid #E4E4E7", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#18181B", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Space Mono', monospace", margin: 0 }}>Conversation Log</h3>
          {conversations.length > 0 && (
            <button onClick={() => {
              const csvRows = ["Timestamp,Session,Role,Message,Escalated,Rating"];
              conversations.forEach((c, ci) => {
                c.messages.forEach((m) => {
                  csvRows.push(`"${c.startedAt}","Session ${ci + 1}","${m.role}","${m.content.replace(/"/g, '""')}","${c.escalated || false}","${c.rating || ''}"`);
                });
              });
              const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url;
              a.download = `supportbot-conversations-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click(); URL.revokeObjectURL(url);
            }} style={{ background: "#18181B", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export CSV
            </button>
          )}
        </div>
        {conversations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#A1A1AA", fontSize: 14 }}>No conversations yet. Launch the demo to start collecting data.</div>
        ) : (
          <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
            {conversations.map((c, i) => (
              <div key={i} style={{ padding: "12px 16px", borderRadius: 10, background: "#FAFAF9", border: "1px solid #E4E4E7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#18181B" }}>
                    Session {i + 1}
                    {c.escalated && <span style={{ marginLeft: 8, fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#FEF3C7", color: "#92400E", fontWeight: 600 }}>Escalated</span>}
                    {c.rating && <span style={{ marginLeft: 8, fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#ECFDF5", color: "#065F46", fontWeight: 600 }}>{["","😞","😐","😊","🤩"][c.rating]} {c.rating}/4</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#71717A", marginTop: 2 }}>{c.messages.length} messages · {new Date(c.startedAt).toLocaleString()}</div>
                </div>
                <div style={{ fontSize: 12, color: "#A1A1AA", fontFamily: "'Space Mono', monospace" }}>{c.messages.filter((m) => m.role === "user").length} questions</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── ADMIN PANEL ─── */
function AdminPanel({ config, setConfig, onLaunchDemo, conversations, activeTab, setActiveTab }) {
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [serverOk, setServerOk] = useState(null);

  const update = (k, v) => setConfig((prev) => ({ ...prev, [k]: v }));
  const addFaq = () => {
    if (!newQ.trim() || !newA.trim()) return;
    setConfig((prev) => ({ ...prev, faqs: [...prev.faqs, { q: newQ.trim(), a: newA.trim() }] }));
    setNewQ(""); setNewA("");
  };
  const removeFaq = (i) => setConfig((prev) => ({ ...prev, faqs: prev.faqs.filter((_, idx) => idx !== i) }));

  useEffect(() => {
    fetch("/api/health").then((r) => r.json()).then((d) => setServerOk(d.hasKey)).catch(() => setServerOk(false));
  }, []);

  const rgb = hexToRgb(config.brandColor);
  const tabs = [
    { id: "config", label: "Configure", icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" },
    { id: "analytics", label: "Analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF9", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <div style={{ background: "#18181B", padding: "20px 0", borderBottom: "1px solid #27272A" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `rgba(${rgb}, 0.9)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div>
              <span style={{ color: "#F4F4F5", fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em" }}>SupportBot</span>
              <span style={{ color: "#71717A", fontSize: 12, marginLeft: 8, fontFamily: "'Space Mono', monospace" }}>studio</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, background: "#27272A", borderRadius: 10, padding: 4 }}>
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                background: activeTab === tab.id ? `rgba(${rgb}, 0.9)` : "transparent",
                color: activeTab === tab.id ? "white" : "#71717A",
                border: "none", borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={tab.icon}/></svg>
                {tab.label}
                {tab.id === "analytics" && conversations.length > 0 && (
                  <span style={{ background: activeTab === tab.id ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)", fontSize: 10, padding: "1px 6px", borderRadius: 4, fontFamily: "'Space Mono', monospace" }}>{conversations.length}</span>
                )}
              </button>
            ))}
          </div>
          <button onClick={onLaunchDemo} style={{ background: `rgba(${rgb}, 0.9)`, color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Launch Demo →</button>
        </div>
      </div>

      {serverOk !== null && (
        <div style={{ maxWidth: 1060, margin: "16px auto 0", padding: "0 24px" }}>
          <div style={{ padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500, background: serverOk ? "#ECFDF5" : "#FEF2F2", color: serverOk ? "#065F46" : "#991B1B", border: `1px solid ${serverOk ? "#A7F3D0" : "#FECACA"}`, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: serverOk ? "#22C55E" : "#EF4444" }} />
            {serverOk ? "Server connected — API key loaded. Ready to chat!" : "Server not running or API key missing."}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "32px 24px" }}>
        {activeTab === "analytics" ? (
          <>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: "#18181B", marginBottom: 6, letterSpacing: "-0.03em" }}>Analytics Dashboard</h1>
              <p style={{ color: "#71717A", fontSize: 15, margin: 0 }}>Track chatbot performance, popular questions, and escalation rates.</p>
            </div>
            <AnalyticsDashboard conversations={conversations} config={config} />
          </>
        ) : (
          <>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: "#18181B", marginBottom: 6, letterSpacing: "-0.03em" }}>Configure Your Chatbot</h1>
              <p style={{ color: "#71717A", fontSize: 15, margin: 0 }}>Set up your AI support agent. Customers get instant answers from your knowledge base.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ background: "white", borderRadius: 14, border: "1px solid #E4E4E7", padding: 24 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#18181B", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Space Mono', monospace" }}>Brand Settings</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {[["Business Name", "businessName"], ["Agent Name", "agentName"], ["Escalation Email", "escalationEmail"]].map(([label, key]) => (
                      <div key={key}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "#3F3F46", display: "block", marginBottom: 6 }}>{label}</label>
                        <input value={config[key]} onChange={(e) => update(key, e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D4D4D8", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
                      </div>
                    ))}
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: "#3F3F46", display: "block", marginBottom: 6 }}>Welcome Message</label>
                      <textarea value={config.welcomeMessage} onChange={(e) => update("welcomeMessage", e.target.value)} rows={2} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D4D4D8", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: "#3F3F46", display: "block", marginBottom: 6 }}>Brand Color</label>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <input type="color" value={config.brandColor} onChange={(e) => update("brandColor", e.target.value)} style={{ width: 44, height: 44, borderRadius: 8, border: "1px solid #D4D4D8", cursor: "pointer", padding: 2 }} />
                        <span style={{ fontSize: 13, color: "#71717A", fontFamily: "'Space Mono', monospace" }}>{config.brandColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ background: "white", borderRadius: 14, border: "1px solid #E4E4E7", padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#18181B", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Space Mono', monospace" }}>Knowledge Base</h3>
                <div style={{ maxHeight: 260, overflowY: "auto", marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  {config.faqs.map((faq, i) => (
                    <div key={i} style={{ padding: "10px 14px", borderRadius: 8, background: "#FAFAF9", border: "1px solid #E4E4E7", position: "relative" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#18181B", marginBottom: 3, paddingRight: 28 }}>{faq.q}</div>
                      <div style={{ fontSize: 12, color: "#71717A", lineHeight: 1.4 }}>{faq.a}</div>
                      <button onClick={() => removeFaq(i)} style={{ position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: 6, background: "#FEE2E2", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#DC2626", fontWeight: 700 }}>x</button>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: "1px solid #E4E4E7", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  <input value={newQ} onChange={(e) => setNewQ(e.target.value)} placeholder="Question..." style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #D4D4D8", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }} />
                  <textarea value={newA} onChange={(e) => setNewA(e.target.value)} placeholder="Answer..." rows={2} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #D4D4D8", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", resize: "none", boxSizing: "border-box" }} />
                  <button onClick={addFaq} style={{ background: "#18181B", color: "white", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", alignSelf: "flex-start" }}>+ Add FAQ</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── CHAT WIDGET ─── */
function ChatWidget({ config, onBack, onSaveConversation }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [escalated, setEscalated] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [escalationSent, setEscalationSent] = useState(false);
  const [rating, setRating] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (messages.length === 0) setMessages([{ role: "assistant", content: config.welcomeMessage }]);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping, showEscalation]);

  const handleBack = () => {
    if (messages.length > 1) onSaveConversation({ messages, startedAt: new Date().toISOString(), escalated, rating });
    onBack();
  };

  const handleEscalation = async () => {
    setEscalated(true); setEscalationSent(true); setShowEscalation(false);
    setMessages((prev) => [...prev, {
      role: "assistant",
      content: `I'm sending your conversation to our support team now...`
    }]);

    try {
      const res = await fetch("/api/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail,
          businessName: config.businessName,
          agentName: config.agentName,
          escalationEmail: config.escalationEmail,
          messages,
        }),
      });
      const data = await res.json();

      const channels = [];
      if (data.telegram) channels.push("Telegram");
      if (data.email) channels.push("email");

      const confirmMsg = channels.length > 0
        ? `Done! Your conversation has been sent to our team via ${channels.join(" and ")}. ${customerEmail ? `We'll follow up at ${customerEmail}.` : ""} A human agent will get back to you within 24 hours.`
        : `I've logged your request. Our team at ${config.escalationEmail} will follow up within 24 hours.${customerEmail ? ` We'll reach you at ${customerEmail}.` : ""}`;

      setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: confirmMsg }]);
    } catch (err) {
      setMessages((prev) => [...prev.slice(0, -1), {
        role: "assistant",
        content: `I've logged your request. Our team at ${config.escalationEmail} will follow up within 24 hours.${customerEmail ? ` We'll reach you at ${customerEmail}.` : ""}`
      }]);
    }
  };

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isTyping) return;
    const userMsg = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput(""); setIsTyping(true);

    try {
      const systemPrompt = `You are ${config.agentName}, a friendly customer support agent for ${config.businessName}.\n\nKnowledge base:\n${config.faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n")}\n\nRules:\n- Answer from the knowledge base when possible\n- Be concise and warm (2-3 sentences max)\n- If not covered, say you'll connect them with a human agent\n- Never make up info not in the knowledge base`;

      const history = [...messages.filter((m) => m.content !== config.welcomeMessage), userMsg].map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: systemPrompt, messages: history }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "API error");

      const reply = data.content?.map((c) => c.text || "").join("") || "Sorry, please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      if (reply.toLowerCase().includes("human agent") || reply.toLowerCase().includes("connect you")) {
        setTimeout(() => setShowEscalation(true), 500);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, having trouble connecting. Is the server running?" }]);
    }
    setIsTyping(false);
  }, [messages, isTyping, config]);

  const quickActions = config.faqs.slice(0, 3).map((f) => (f.q.length > 35 ? f.q.slice(0, 35) + "..." : f.q));
  const rgb = hexToRgb(config.brandColor);

  return (
    <div style={{ minHeight: "100vh", background: "#F0F0EC", fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <div style={{ background: "#18181B", padding: "12px 0", borderBottom: "1px solid #27272A" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={handleBack} style={{ background: "rgba(255,255,255,0.1)", color: "#A1A1AA", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>Back to Studio</button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 8px rgba(34,197,94,0.5)" }} />
            <span style={{ color: "#A1A1AA", fontSize: 12, fontFamily: "'Space Mono', monospace" }}>DEMO MODE</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative" }}>
        <div style={{ position: "absolute", top: 40, left: "50%", transform: "translateX(-50%)", width: 700, opacity: 0.3, pointerEvents: "none" }}>
          <div style={{ background: "white", borderRadius: 16, padding: 40 }}>
            <div style={{ width: 200, height: 20, background: "#D4D4D8", borderRadius: 6, marginBottom: 16 }} />
            <div style={{ width: "100%", height: 12, background: "#E4E4E7", borderRadius: 4, marginBottom: 8 }} />
            <div style={{ width: "80%", height: 12, background: "#E4E4E7", borderRadius: 4, marginBottom: 24 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              {[1, 2, 3].map((i) => <div key={i} style={{ height: 100, background: "#F4F4F5", borderRadius: 10 }} />)}
            </div>
          </div>
        </div>

        {isOpen ? (
          <div style={{ position: "fixed", bottom: 24, right: 24, width: 390, height: 580, background: "white", borderRadius: 20, boxShadow: "0 24px 80px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 100, border: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ background: `linear-gradient(135deg, ${config.brandColor}, ${darkenHex(config.brandColor, 0.2)})`, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "white" }}>{config.agentName[0]}</div>
                <div>
                  <div style={{ color: "white", fontWeight: 600, fontSize: 15 }}>{config.agentName}</div>
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80" }} />Online now
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 16, fontWeight: 700 }}>-</button>
            </div>

            <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 6 }}>
                  {msg.role === "assistant" && <div style={{ width: 24, height: 24, borderRadius: 8, background: `rgba(${rgb}, 0.15)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: config.brandColor, flexShrink: 0 }}>{config.agentName[0]}</div>}
                  <div style={{
                    maxWidth: "78%", padding: "10px 14px", borderRadius: 14,
                    ...(msg.role === "user" ? { background: config.brandColor, color: "white", borderBottomRightRadius: 4 } : { background: "#F4F4F5", color: "#18181B", borderBottomLeftRadius: 4 }),
                    fontSize: 14, lineHeight: 1.5, wordBreak: "break-word",
                  }}>{msg.content}</div>
                </div>
              ))}

              {isTyping && (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 8, background: `rgba(${rgb}, 0.15)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: config.brandColor, flexShrink: 0 }}>{config.agentName[0]}</div>
                  <div style={{ background: "#F4F4F5", borderRadius: 14, borderBottomLeftRadius: 4, padding: "12px 18px", display: "flex", gap: 5 }}>
                    {[0, 1, 2].map((i) => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#A1A1AA", animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite` }} />)}
                  </div>
                </div>
              )}

              {showEscalation && !escalationSent && (
                <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: 16, margin: "4px 0" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#92400E", marginBottom: 8 }}>Connect with a human agent?</div>
                  <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Your email (optional)" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #FDE68A", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", marginBottom: 10, boxSizing: "border-box", background: "white" }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleEscalation} style={{ flex: 1, background: "#F59E0B", color: "white", border: "none", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Yes, escalate</button>
                    <button onClick={() => setShowEscalation(false)} style={{ flex: 1, background: "white", color: "#71717A", border: "1px solid #D4D4D8", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>No thanks</button>
                  </div>
                </div>
              )}

              {messages.length === 1 && !isTyping && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                  {quickActions.map((q, i) => (
                    <button key={i} onClick={() => sendMessage(config.faqs[i].q)} style={{ background: "white", border: `1px solid ${config.brandColor}22`, borderRadius: 10, padding: "8px 14px", fontSize: 13, color: config.brandColor, cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{q}</button>
                  ))}
                </div>
              )}
            </div>

            {messages.length > 4 && !rating && (
              <div style={{ padding: "8px 16px", background: "#FAFAF9", borderTop: "1px solid #E4E4E7", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#71717A" }}>Rate this chat:</span>
                {["\uD83D\uDE1E", "\uD83D\uDE10", "\uD83D\uDE0A", "\uD83E\uDD29"].map((emoji, i) => (
                  <button key={i} onClick={() => setRating(i + 1)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", padding: "2px 4px", opacity: 0.6 }}>{emoji}</button>
                ))}
              </div>
            )}
            {rating && <div style={{ padding: "8px 16px", background: "#ECFDF5", borderTop: "1px solid #A7F3D0", textAlign: "center", fontSize: 12, color: "#065F46", fontWeight: 500 }}>Thanks for your feedback!</div>}

            <div style={{ padding: "12px 16px 16px", borderTop: "1px solid #E4E4E7" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage(input)} placeholder="Type your message..." style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid #D4D4D8", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
                <button onClick={() => sendMessage(input)} disabled={isTyping} style={{ width: 42, height: 42, borderRadius: 10, background: config.brandColor, border: "none", cursor: isTyping ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: isTyping ? 0.5 : 1, flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
              <div style={{ textAlign: "center", marginTop: 8 }}>
                <span style={{ fontSize: 11, color: "#A1A1AA" }}>Powered by <span style={{ fontWeight: 600, color: "#71717A" }}>SupportBot</span></span>
              </div>
            </div>
          </div>
        ) : (
          <button onClick={() => setIsOpen(true)} style={{ position: "fixed", bottom: 24, right: 24, width: 60, height: 60, borderRadius: 18, background: config.brandColor, border: "none", cursor: "pointer", boxShadow: "0 8px 30px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </button>
        )}
      </div>

      <style>{`
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D4D4D8; border-radius: 10px; }
      `}</style>
    </div>
  );
}

/* ─── APP ─── */
export default function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [view, setView] = useState("admin");
  const [conversations, setConversations] = useState([]);
  const [activeTab, setActiveTab] = useState("config");

  const saveConversation = (convo) => setConversations((prev) => [...prev, convo]);

  return view === "admin"
    ? <AdminPanel config={config} setConfig={setConfig} onLaunchDemo={() => setView("chat")} conversations={conversations} activeTab={activeTab} setActiveTab={setActiveTab} />
    : <ChatWidget config={config} onBack={() => setView("admin")} onSaveConversation={saveConversation} />;
}
