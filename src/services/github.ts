import type { ModInfo } from '../types'
import { config } from '../config'

export class GitHubService {
  private readonly baseUrl = 'https://api.github.com'
  
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
  
  async getModsList(): Promise<string[]> {
    try {
      const contents = await this.fetchFromGitHub('mods')
      return contents
        .filter((item: any) => item.type === 'dir')
        .map((item: any) => item.name)
    } catch (error) {
      console.error('Error fetching mods list:', error)
      return []
    }
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
      const assetsDir = await this.fetchFromGitHub(`mods/${modId}/assets`)
      
      for (const item of assetsDir) {
        if (item.type === 'file') {
          try {
            const fileData = await this.fetchFromGitHub(`mods/${modId}/assets/${item.name}`)
            const buffer = Buffer.from(fileData.content, 'base64')
            assets.set(item.name, buffer)
          } catch (error) {
            console.error(`Error fetching asset ${item.name} for mod ${modId}:`, error)
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching assets for mod ${modId}:`, error)
    }
    
    return assets
  }
}