import type { ModInfo, CachedMod } from '../types'
import { config } from '../config'

export enum CacheTaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress', 
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface CacheTask {
  modId: string
  status: CacheTaskStatus
  startedAt: number
  completedAt?: number
  error?: string
  assetsCount?: number
}

export class ModsCache {
  private cache = new Map<string, CachedMod>()
  private cacheTasks = new Map<string, CacheTask>()
  
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
  
  // Cache task management
  getCacheTask(modId: string): CacheTask | null {
    return this.cacheTasks.get(modId) || null
  }
  
  setCacheTask(modId: string, task: CacheTask): void {
    this.cacheTasks.set(modId, task)
  }
  
  updateCacheTask(modId: string, updates: Partial<CacheTask>): void {
    const task = this.cacheTasks.get(modId)
    if (task) {
      Object.assign(task, updates)
    }
  }
  
  removeCacheTask(modId: string): void {
    this.cacheTasks.delete(modId)
  }
  
  isBeingCached(modId: string): boolean {
    const task = this.cacheTasks.get(modId)
    return task?.status === CacheTaskStatus.IN_PROGRESS
  }
}