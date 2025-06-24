import type { ModInfo } from '../types'
import { config } from '../config'

export class GitHubService {
  private readonly baseUrl = 'https://api.github.com'
  private loadedModIds: string[] = []
  
  private async fetchFromGitHub(path: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/repos/${config.github.owner}/${config.github.repo}/contents/${path}`, {
      headers: {
        'Authorization': `Bearer ${config.github.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  }
  
  async loadModsOnStartup(): Promise<void> {
    try {
      console.log('Loading mods from GitHub repository...')
      const contents = await this.fetchFromGitHub('mods')
      this.loadedModIds = contents
        .filter((item: any) => item.type === 'dir')
        .map((item: any) => item.name)
      
      console.log(`Loaded ${this.loadedModIds.length} mods: ${this.loadedModIds.join(', ')}`)
    } catch (error) {
      console.error('Error loading mods on startup:', error)
      this.loadedModIds = []
    }
  }
  
  getLoadedModIds(): string[] {
    return [...this.loadedModIds]
  }
  
  async getModsList(): Promise<string[]> {
    // Return the pre-loaded mod IDs
    return this.getLoadedModIds()
  }
  
  async getModInfo(modId: string): Promise<ModInfo | null> {
    try {
      const modJson = await this.fetchFromGitHub(`mods/${modId}/mod.json`)
      const content = Buffer.from(modJson.content, 'base64').toString('utf-8')
      return JSON.parse(content)
    } catch (error) {
      console.error(`Error fetching mod info for ${modId}:`, error)
      return null
    }
  }
  
  async getModImage(modId: string): Promise<Buffer | null> {
    try {
      const imageData = await this.fetchFromGitHub(`mods/${modId}/mod.png`)
      return Buffer.from(imageData.content, 'base64')
    } catch (error) {
      console.error(`Error fetching mod image for ${modId}:`, error)
      return null
    }
  }
  
  async getModAssets(modId: string): Promise<Map<string, Buffer>> {
    const assets = new Map<string, Buffer>()
    
    try {
      console.log(`Fetching assets for mod: ${modId}`)
      await this.fetchAssetsRecursively(`mods/${modId}/assets`, '', assets)
      console.log(`Successfully cached ${assets.size} assets for mod ${modId}`)
    } catch (error) {
      console.error(`Error fetching assets for mod ${modId}:`, error)
    }
    
    return assets
  }
  
  private async fetchAssetsRecursively(
    basePath: string, 
    relativePath: string, 
    assets: Map<string, Buffer>
  ): Promise<void> {
    try {
      const fullPath = relativePath ? `${basePath}/${relativePath}` : basePath
      console.log(`Exploring directory: ${fullPath}`)
      
      const contents = await this.fetchFromGitHub(fullPath)
      console.log(`Found ${contents.length} items in ${fullPath}`)
      
      for (const item of contents) {
        const itemRelativePath = relativePath ? `${relativePath}/${item.name}` : item.name
        
        if (item.type === 'file') {
          try {
            console.log(`Downloading asset: ${itemRelativePath}`)
            const fileData = await this.fetchFromGitHub(`${basePath}/${itemRelativePath}`)
            const buffer = Buffer.from(fileData.content, 'base64')
            assets.set(itemRelativePath, buffer)
            console.log(`Successfully cached asset: ${itemRelativePath} (${buffer.length} bytes)`)
          } catch (error) {
            console.error(`Error fetching asset ${itemRelativePath}:`, error)
          }
        } else if (item.type === 'dir') {
          console.log(`Entering subdirectory: ${itemRelativePath}`)
          await this.fetchAssetsRecursively(basePath, itemRelativePath, assets)
        }
      }
    } catch (error) {
      console.error(`Error exploring directory ${basePath}/${relativePath}:`, error)
    }
  }
}