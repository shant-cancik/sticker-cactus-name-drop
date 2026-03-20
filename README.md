# Sticker Cactus — Name Drop Tool

AI-powered sticker text replacement tool. Upload stickers, detect text automatically, and rebrand them with new text while preserving the original design.

## How It Works

1. **Upload** — Drop one or more sticker images
2. **Detect** — Claude Vision analyzes each sticker to find text and its styling (font, color, size, position)
3. **Replace** — Enter new text, then Gemini AI replaces it while keeping everything else identical
4. **Download** — Export the rebranded sticker

## Setup

### Prerequisites
- Node.js 18+
- Anthropic API key (Claude)
- Google AI API key (Gemini)

### Local Development

```bash
npm install
```

Create a `.env.local` file:

```
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_AI_API_KEY=your-google-ai-key
```

```bash
npm run dev
```

### Deploy to Vercel

1. Push to GitHub
2. Connect the repo to Vercel
3. Set environment variables:
   - `ANTHROPIC_API_KEY`
   - `GOOGLE_AI_API_KEY`
4. Deploy

## Tech Stack

- **Next.js 14** — React framework with API routes
- **Anthropic Claude** — Vision API for text detection and font analysis
- **Google Gemini** — Image generation for text replacement/inpainting
- **Tailwind CSS** — Styling
- **Vercel** — Hosting
