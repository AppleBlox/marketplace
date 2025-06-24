import { Elysia } from 'elysia'
import type { CacheStatus, CachedMod } from '../types'
import { ModsCache } from '../services/cache'
import { GitHubService } from '../services/github'
import { PLACEHOLDER_IMAGE } from '../utils/constants'

export const createModsRoutes = (cache: ModsCache, github: GitHubService) => {
  return new Elysia({ prefix: '/mods' })
    .get('/', async () => {
      try {
        const modIds = await github.getModsList()
        const mods = []
        
        for (const modId of modIds) {
          const cached = cache.get(modId)
          if (cached) {
            mods.push(cached.info)
          } else {
            const info = await github.getModInfo(modId)
            if (info) {
              mods.push(info)
            }
          }
        }
        
        return {
          success: true,
          data: mods
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
        
        if (cache.isCached(id)) {
          const cached = cache.get(id)!
          return {
            success: true,
            message: 'Mod already cached',
            data: {
              modId: id,
              cached: true,
              assetsCount: cached.assets.size,
              cachedAt: cached.cachedAt
            }
          }
        }
        
        const [info, image, assets] = await Promise.all([
          github.getModInfo(id),
          github.getModImage(id),
          github.getModAssets(id)
        ])
        
        if (!info) {
          return {
            success: false,
            error: 'Mod not found'
          }
        }
        
        const cachedMod: CachedMod = {
          info,
          assets,
          image,
          cachedAt: Date.now()
        }
        
        cache.set(id, cachedMod)
        
        return {
          success: true,
          message: 'Mod cached successfully',
          data: {
            modId: id,
            cached: true,
            assetsCount: assets.size,
            cachedAt: cachedMod.cachedAt
          }
        }
      } catch (error) {
        console.error(`Error in /mods/${params.id}/cache endpoint:`, error)
        return {
          success: false,
          error: 'Failed to cache mod'
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