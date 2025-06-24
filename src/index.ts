import cors from '@elysiajs/cors'
import { config } from './config'
import { createModsRoutes } from './routes/mods'
import { createHealthRoutes } from './routes/health'
import { ModsCache } from './services/cache'
import { GitHubService } from './services/github'
import Elysia from 'elysia'

const cache = new ModsCache()
const github = new GitHubService()

new Elysia({ prefix: '/api/v1' })
  .use(cors())
  .use(createModsRoutes(cache, github))
  .use(createHealthRoutes())
  .listen(config.server.port, () => {
    console.log(`Marketplace API is running on port ${config.server.port}`)
    console.log(`Available endpoints:`)
    console.log(`  GET  /api/v1/mods - List all mods`)
    console.log(`  GET  /api/v1/mods/:id - Get mod info`)
    console.log(`  GET  /api/v1/mods/:id/image - Get mod image`)
    console.log(`  POST /api/v1/mods/:id/cache - Cache mod assets`)
    console.log(`  POST /api/v1/mods/cache-status - Check cache status`)
    console.log(`  GET  /api/v1/mods/:id/assets - List cached assets`)
    console.log(`  GET  /api/v1/mods/:id/assets/:filename - Download asset`)
    console.log(`  GET  /api/v1/health - Health check`)
  })