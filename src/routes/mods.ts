import { Elysia } from 'elysia'
import type { CacheStatus, CachedMod } from '../types'
import { ModsCache, CacheTaskStatus } from '../services/cache'
import { GitHubService } from '../services/github'
import { PLACEHOLDER_IMAGE } from '../utils/constants'

export const createModsRoutes = (cache: ModsCache, github: GitHubService) => {
  
  // Background caching function
  const cacheModInBackground = async (modId: string) => {
    try {
      console.log(`Starting background caching for mod: ${modId}`)
      
      cache.updateCacheTask(modId, { 
        status: CacheTaskStatus.IN_PROGRESS 
      })
      
      const [info, image, assets] = await Promise.all([
        github.getModInfo(modId),
        github.getModImage(modId),
        github.getModAssets(modId)
      ])
      
      if (!info) {
        cache.updateCacheTask(modId, {
          status: CacheTaskStatus.FAILED,
          error: 'Mod not found',
          completedAt: Date.now()
        })
        return
      }
      
      console.log(`Background caching completed for ${modId}: ${assets.size} assets`)
      
      const cachedMod: CachedMod = {
        info,
        assets,
        image,
        cachedAt: Date.now()
      }
      
      cache.set(modId, cachedMod)
      cache.updateCacheTask(modId, {
        status: CacheTaskStatus.COMPLETED,
        assetsCount: assets.size,
        completedAt: Date.now()
      })
      
      // Clean up the task after successful completion
      setTimeout(() => {
        cache.removeCacheTask(modId)
      }, 30000) // Remove task info after 30 seconds
      
    } catch (error) {
      console.error(`Background caching failed for mod ${modId}:`, error)
      cache.updateCacheTask(modId, {
        status: CacheTaskStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: Date.now()
      })
    }
  }

  return new Elysia({ prefix: '/mods' })
    .get('/', async () => {
      try {
        const modIds = github.getLoadedModIds()
        
        return {
          success: true,
          data: modIds
        }
      } catch (error) {
        console.error('Error in /mods endpoint:', error)
        return {
          success: false,
          error: 'Failed to fetch mods list'
        }
      }
    })
    
    .get('/:id', async ({ params }) => {
      try {
        const { id } = params
        
        let modInfo = null
        const cached = cache.get(id)
        
        if (cached) {
          modInfo = cached.info
        } else {
          modInfo = await github.getModInfo(id)
        }
        
        if (!modInfo) {
          return {
            success: false,
            error: 'Mod not found'
          }
        }
        
        return {
          success: true,
          data: modInfo
        }
      } catch (error) {
        console.error(`Error in /mods/${params.id} endpoint:`, error)
        return {
          success: false,
          error: 'Failed to fetch mod info'
        }
      }
    })
    
    .get('/:id/image', async ({ params, set }) => {
      try {
        const { id } = params
        
        let image = null
        const cached = cache.get(id)
        
        if (cached) {
          image = cached.image
        } else {
          image = await github.getModImage(id)
        }
        
        if (!image) {
          image = PLACEHOLDER_IMAGE
        }
        
        set.headers['Content-Type'] = 'image/png'
        set.headers['Cache-Control'] = 'public, max-age=3600'
        
        return image
      } catch (error) {
        console.error(`Error in /mods/${params.id}/image endpoint:`, error)
        set.headers['Content-Type'] = 'image/png'
        return PLACEHOLDER_IMAGE
      }
    })
    
    .post('/:id/cache', async ({ params }) => {
      try {
        const { id } = params
        
        // Check if already cached
        if (cache.isCached(id)) {
          const cached = cache.get(id)!
          return {
            success: true,
            message: 'Mod already cached',
            data: {
              modId: id,
              status: 'completed',
              cached: true,
              assetsCount: cached.assets.size,
              cachedAt: cached.cachedAt
            }
          }
        }
        
        // Check if currently being cached
        if (cache.isBeingCached(id)) {
          const task = cache.getCacheTask(id)!
          return {
            success: true,
            message: 'Mod is currently being cached',
            data: {
              modId: id,
              status: task.status,
              cached: false,
              startedAt: task.startedAt
            }
          }
        }
        
        // Start background caching
        const task = {
          modId: id,
          status: CacheTaskStatus.PENDING,
          startedAt: Date.now()
        }
        
        cache.setCacheTask(id, task)
        
        // Start the background process (don't await it)
        cacheModInBackground(id)
        
        return {
          success: true,
          message: 'Mod caching started in background',
          data: {
            modId: id,
            status: 'pending',
            cached: false,
            startedAt: task.startedAt
          }
        }
      } catch (error) {
        console.error(`Error in /mods/${params.id}/cache endpoint:`, error)
        return {
          success: false,
          error: 'Failed to start caching'
        }
      }
    })
    
    .get('/:id/cache-status', async ({ params }) => {
      try {
        const { id } = params
        
        // Check if fully cached
        if (cache.isCached(id)) {
          const cached = cache.get(id)!
          return {
            success: true,
            data: {
              modId: id,
              status: 'completed',
              cached: true,
              assetsCount: cached.assets.size,
              cachedAt: cached.cachedAt
            }
          }
        }
        
        // Check if being cached
        const task = cache.getCacheTask(id)
        if (task) {
          return {
            success: true,
            data: {
              modId: id,
              status: task.status,
              cached: false,
              startedAt: task.startedAt,
              completedAt: task.completedAt,
              error: task.error,
              assetsCount: task.assetsCount
            }
          }
        }
        
        // Not cached and no task
        return {
          success: true,
          data: {
            modId: id,
            status: 'not_cached',
            cached: false
          }
        }
      } catch (error) {
        console.error(`Error in /mods/${params.id}/cache-status endpoint:`, error)
        return {
          success: false,
          error: 'Failed to get cache status'
        }
      }
    })
    
    .post('/cache-status', async ({ body }) => {
      try {
        const { modIds } = body as { modIds: string[] }
        
        if (!Array.isArray(modIds)) {
          return {
            success: false,
            error: 'modIds must be an array'
          }
        }
        
        const statuses: CacheStatus[] = modIds.map(modId => {
          const cached = cache.get(modId)
          if (cached) {
            return {
              modId,
              cached: true,
              assetsCount: cached.assets.size,
              cachedAt: cached.cachedAt
            }
          } else {
            const task = cache.getCacheTask(modId)
            if (task) {
              return {
                modId,
                cached: false,
                status: task.status,
                startedAt: task.startedAt
              }
            }
            return {
              modId,
              cached: false
            }
          }
        })
        
        return {
          success: true,
          data: statuses
        }
      } catch (error) {
        console.error('Error in /mods/cache-status endpoint:', error)
        return {
          success: false,
          error: 'Failed to get cache status'
        }
      }
    })
    
    .get('/:id/assets/:filename', async ({ params, set }) => {
      try {
        const { id, filename } = params
        
        const cached = cache.get(id)
        if (!cached) {
          set.status = 404
          return {
            success: false,
            error: 'Mod not cached. Please cache the mod first.'
          }
        }
        
        const asset = cached.assets.get(filename)
        if (!asset) {
          set.status = 404
          return {
            success: false,
            error: 'Asset not found'
          }
        }
        
        set.headers['Content-Type'] = 'application/octet-stream'
        set.headers['Content-Disposition'] = `attachment; filename="${filename}"`
        set.headers['Cache-Control'] = 'public, max-age=3600'
        
        return asset
      } catch (error) {
        console.error(`Error in /mods/${params.id}/assets/${params.filename} endpoint:`, error)
        set.status = 500
        return {
          success: false,
          error: 'Failed to download asset'
        }
      }
    })
    
    .get('/:id/assets', async ({ params }) => {
      try {
        const { id } = params
        
        const cached = cache.get(id)
        if (!cached) {
          return {
            success: false,
            error: 'Mod not cached. Please cache the mod first.'
          }
        }
        
        const assetList = Array.from(cached.assets.keys()).map(filename => ({
          filename,
          size: cached.assets.get(filename)!.length
        }))
        
        return {
          success: true,
          data: {
            modId: id,
            assets: assetList,
            totalAssets: assetList.length,
            cachedAt: cached.cachedAt
          }
        }
      } catch (error) {
        console.error(`Error in /mods/${params.id}/assets endpoint:`, error)
        return {
          success: false,
          error: 'Failed to list assets'
        }
      }
    })
}