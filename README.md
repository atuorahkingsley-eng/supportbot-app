# SupportBot Studio

A white-label AI customer support chatbot powered by Claude. Configure it for any business, deploy it anywhere.

## Quick Start (3 steps)

### 1. Install dependencies
```bash
npm install
```

### 2. Add your API key
```bash
cp .env.example .env
```
Open `.env` and paste your Anthropic API key:
```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

### 3. Run it
```bash
npm run dev
```

This starts both:
- **Frontend** → http://localhost:3000
- **API proxy** → http://localhost:3001

Open http://localhost:3000 in your browser. Done!

## How It Works

1. **Admin Panel** — Configure business name, brand color, agent name, and FAQ knowledge base
2. **Launch Demo** — See the live chatbot widget in action
3. **Chat** — Claude answers customer questions based on the knowledge base you set up

## Project Structure

```
supportbot-studio/
├── server.js          # Express proxy (keeps API key safe)
├── src/
│   ├── App.jsx        # Main app (Admin Panel + Chat Widget)
│   └── main.jsx       # React entry point
├── index.html
├── vite.config.js
├── package.json
├── .env               # Your API key (create from .env.example)
└── .env.example
```

## Selling This as a Service

- **Setup fee**: $300–$800 per client
- **Monthly maintenance**: $50–$150/month (includes API costs)
- **Target clients**: Small e-commerce, SaaS startups, service businesses
- **Customization**: Swap colors, agent name, and knowledge base per client

## License

MIT
