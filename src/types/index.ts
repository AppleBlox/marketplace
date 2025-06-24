export interface ModInfo {
  id: string
  name: string
  description: string
  author: string
  clientVersionUpload: string
  fileVersion: number
}

export interface CachedMod {
  info: ModInfo
  assets: Map<string, Buffer>
  image: Buffer | null
  cachedAt: number
}

export interface CacheStatus {
  modId: string
  cached: boolean
  assetsCount?: number
  cachedAt?: number
}
