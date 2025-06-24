import type { ModInfo, CachedMod } from '../types'
import { config } from '../config'

export class ModsCache {
  private cache = new Map<string, CachedMod>()
  
  isCached(modId: string): boolean {
    const cached = this.cache.get(modId)
    if (!cached) return false
    
    const isExpired = Date.now() - cached.cachedAt > config.cache.duration
    if (isExpired) {
      this.cache.delete(modId)
      return false
    }
    
    return true
  }
  
  get(modId: string): CachedMod | null {
    if (!this.isCached(modId)) return null
    return this.cache.get(modId) || null
  }
  
  set(modId: string, mod: CachedMod): void {
    this.cache.set(modId, mod)
  }
  
  getAll(): Map<string, CachedMod> {
    for (const [id, mod] of this.cache) {
      if (Date.now() - mod.cachedAt > config.cache.duration) {
        this.cache.delete(id)
      }
    }
    return new Map(this.cache)
  }
}
