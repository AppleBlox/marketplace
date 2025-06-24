import cors from '@elysiajs/cors'
import { config } from './config'
import { createModsRoutes } from './routes/mods'
import { createHealthRoutes } from './routes/health'
import { createSwaggerDocs } from './docs/swagger'
import { ModsCache } from './services/cache'
import { GitHubService } from './services/github'
import Elysia from 'elysia'

const cache = new ModsCache()
const github = new GitHubService()

async function startServer() {
  try {
    // Load mods on startup
    console.log('Initializing GitHub service...')
    await github.loadModsOnStartup()
    
    // Create the main API with prefix
    const apiRoutes = new Elysia({ prefix: '/api/v1' })
      .use(cors())
      .use(createModsRoutes(cache, github))
      .use(createHealthRoutes())

    // Create Swagger docs at /docs
    const swaggerDocs = new Elysia()
      .use(cors())
      .use(createSwaggerDocs())

    // Combine both apps and start server
    new Elysia()
      .use(swaggerDocs)  // Swagger at /docs
      .use(apiRoutes)    // API at /api/v1
      .listen(config.server.port, () => {
        console.log(`Marketplace API is running on port ${config.server.port}`)
        console.log(`Swagger documentation available at: http://localhost:${config.server.port}/docs`)
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
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Start the server
startServer()