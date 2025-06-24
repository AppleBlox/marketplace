# Roblox Mods Marketplace API

ElysiaJS-based API for serving Roblox mods assets.

## Setup

1. Install dependencies:
```bash
bun install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Fill in your GitHub credentials in `.env`

4. Start development server:
```bash
bun run dev
```

## API Endpoints

- `GET /api/v1/mods` - List all mods
- `GET /api/v1/mods/:id` - Get mod info
- `GET /api/v1/mods/:id/image` - Get mod image
- `POST /api/v1/mods/:id/cache` - Cache mod assets
- `POST /api/v1/mods/cache-status` - Check cache status
- `GET /api/v1/mods/:id/assets` - List cached assets
- `GET /api/v1/mods/:id/assets/:filename` - Download asset
- `GET /api/v1/health` - Health check