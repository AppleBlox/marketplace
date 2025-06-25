# Roblox Mods Marketplace API

ElysiaJS-based API for serving Roblox mods assets.

## Setup

1. You need to have bun installed: https://bun.sh
2. Clone the repo and install dependencies:
```bash
git clone https://github.com/AppleBlox/marketplace
cd marketplace
bun install
```
3. Create a `.env` file with the values from `.env.example`
4. Run the API: `bun run build && bun run dist/index.js`

## Adding mods

As a mod creator, you can add your own mods to this API by making a pull request to the repo.

1. Fork the repo
2. Create a folder in `/mods` with the id of your mod (ex: my-awesome-mod)
3. In this folder, add a `mod.json` file like so (you can modify these values):
```json
{
  "id": "my-awesome-mod",
  "name": "My Awesome Mod",
  "description": "Everything is awesome",
  "author": "Builderman",
  "clientVersionUpload": "version-33609a8a482e4108",
  "fileVersion": 677
}
```
4. (Optional) Add a thumbnail for your mod: Simply add an image named `mod.png` inside your mod folder.
5. Place all your mod's assets (ex: PlatformContent, content, etc...) inside an `asset` directory in your mod folder.
6. Create a pull request, we will review the mod and accept it in most cases.


## API Endpoints

- `GET /` - Root endpoint with documentation link
- `GET /api/v1/mods` - List all mods with full information
- `GET /api/v1/mods/:id` - Get mod info
- `GET /api/v1/mods/:id/image` - Get mod image
- `POST /api/v1/mods/:id/cache` - Cache mod assets
- `GET /api/v1/mods/:id/cache-status` - Check cache status for specific mod
- `POST /api/v1/mods/cache-status` - Check cache status for multiple mods
- `GET /api/v1/mods/:id/assets` - List cached assets
- `GET /api/v1/mods/:id/assets/:filename` - Download asset
- `GET /api/v1/health` - Health check