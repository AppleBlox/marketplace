import { Elysia, t } from 'elysia'
import { swagger } from '@elysiajs/swagger'

export const createSwaggerDocs = () => {
  return new Elysia()
    .use(swagger({
      path: '/docs', // Use a dedicated path for Swagger UI
      documentation: {
        info: {
          title: 'Roblox Mods Marketplace API',
          version: '1.0.0',
          description: 'A RESTful API for serving Roblox mods with intelligent caching and asset management.'
        },
        servers: [
          {
            url: 'http://localhost:3000/api/v1',
            description: 'Development server'
          }
        ],
        tags: [
          {
            name: 'mods',
            description: 'Mod management and asset operations'
          },
          {
            name: 'health',
            description: 'API health and status'
          }
        ]
      }
    }))
    
    // List all mods
    .get('/mods', () => ({ success: true, data: [] }), {
      detail: {
        tags: ['mods'],
        summary: 'List all available mod IDs',
        description: 'Retrieves a list of all available mod IDs from the configured GitHub repository. This endpoint is optimized for speed by pre-loading mod IDs on startup.',
        responses: {
          200: {
            description: 'Successfully retrieved mod IDs list',
            content: {
              'application/json': {
                schema: t.Object({
                  success: t.Literal(true),
                  data: t.Array(t.String())
                }),
                example: {
                  success: true,
                  data: [
                    'bloxstrap-theme-old',
                    'another-mod',
                    'cool-ui-mod'
                  ]
                }
              }
            }
          },
          500: {
            description: 'Failed to fetch mods list',
            content: {
              'application/json': {
                schema: t.Object({
                  success: t.Literal(false),
                  error: t.String()
                }),
                example: {
                  success: false,
                  error: 'Failed to fetch mods list'
                }
              }
            }
          }
        }
      }
    })
    
    // Get mod by ID
    .get('/mods/:id', ({ params }) => ({ success: true, data: { id: params.id } }), {
      detail: {
        tags: ['mods'],
        summary: 'Get detailed information about a specific mod',
        description: 'Retrieves detailed information about a specific mod by its ID.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Unique mod identifier',
            example: 'bloxstrap-theme-old'
          }
        ],
        responses: {
          200: {
            description: 'Mod information retrieved successfully',
            content: {
              'application/json': {
                schema: t.Object({
                  success: t.Literal(true),
                  data: t.Object({
                    id: t.String(),
                    name: t.String(),
                    description: t.String(),
                    author: t.String(),
                    clientVersionUpload: t.String(),
                    fileVersion: t.Number()
                  })
                }),
                example: {
                  success: true,
                  data: {
                    id: 'bloxstrap-theme-old',
                    name: 'Bloxstrap theme (old)',
                    description: 'This mod changes the Roblox UI by giving it the old Bloxstrap gradient.',
                    author: 'TheKliko',
                    clientVersionUpload: 'version-33609a8a482e4108',
                    fileVersion: 677
                  }
                }
              }
            }
          },
          404: {
            description: 'Mod not found',
            content: {
              'application/json': {
                schema: t.Object({
                  success: t.Literal(false),
                  error: t.String()
                }),
                example: {
                  success: false,
                  error: 'Mod not found'
                }
              }
            }
          }
        }
      }
    })
    
    // Get mod image
    .get('/mods/:id/image', ({ params, set }) => {
      set.headers['Content-Type'] = 'image/png'
      return new Response()
    }, {
      detail: {
        tags: ['mods'],
        summary: 'Get mod thumbnail image',
        description: 'Retrieves the thumbnail image for a specific mod. Returns placeholder if no image exists.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Unique mod identifier'
          }
        ],
        responses: {
          200: {
            description: 'Mod image (or placeholder)',
            content: {
              'image/png': {
                schema: {
                  type: 'string',
                  format: 'binary'
                }
              }
            }
          }
        }
      }
    })
    
    // Cache mod assets
    .post('/mods/:id/cache', ({ params }) => ({ 
      success: true, 
      message: 'Mod cached successfully',
      data: { modId: params.id, cached: true, assetsCount: 0, cachedAt: Date.now() }
    }), {
      detail: {
        tags: ['mods'],
        summary: 'Cache mod assets',
        description: 'Triggers caching of all assets for a specific mod.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Unique mod identifier'
          }
        ],
        responses: {
          200: {
            description: 'Mod cached successfully or already cached',
            content: {
              'application/json': {
                schema: t.Object({
                  success: t.Literal(true),
                  message: t.String(),
                  data: t.Object({
                    modId: t.String(),
                    cached: t.Literal(true),
                    assetsCount: t.Number(),
                    cachedAt: t.Number()
                  })
                }),
                example: {
                  success: true,
                  message: 'Mod cached successfully',
                  data: {
                    modId: 'bloxstrap-theme-old',
                    cached: true,
                    assetsCount: 15,
                    cachedAt: 1703123456789
                  }
                }
              }
            }
          },
          404: {
            description: 'Mod not found',
            content: {
              'application/json': {
                schema: t.Object({
                  success: t.Literal(false),
                  error: t.String()
                }),
                example: {
                  success: false,
                  error: 'Mod not found'
                }
              }
            }
          }
        }
      }
    })
    
    // Check cache status for multiple mods
    .post('/mods/cache-status', ({ body }) => ({ 
      success: true, 
      data: (body as any).modIds?.map((id: string) => ({ modId: id, cached: false })) || []
    }), {
      detail: {
        tags: ['mods'],
        summary: 'Check cache status for multiple mods',
        description: 'Checks the cache status for multiple mods in a single request.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: t.Object({
                modIds: t.Array(t.String(), { description: 'Array of mod IDs to check' })
              }),
              example: {
                modIds: ['bloxstrap-theme-old', 'another-mod']
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Cache status retrieved successfully',
            content: {
              'application/json': {
                schema: t.Object({
                  success: t.Literal(true),
                  data: t.Array(t.Object({
                    modId: t.String(),
                    cached: t.Boolean(),
                    assetsCount: t.Optional(t.Number()),
                    cachedAt: t.Optional(t.Number())
                  }))
                }),
                example: {
                  success: true,
                  data: [
                    {
                      modId: 'bloxstrap-theme-old',
                      cached: true,
                      assetsCount: 15,
                      cachedAt: 1703123456789
                    },
                    {
                      modId: 'another-mod',
                      cached: false
                    }
                  ]
                }
              }
            }
          },
          400: {
            description: 'Invalid request body',
            content: {
              'application/json': {
                schema: t.Object({
                  success: t.Literal(false),
                  error: t.String()
                }),
                example: {
                  success: false,
                  error: 'modIds must be an array'
                }
              }
            }
          }
        }
      }
    })
    
    // List cached assets for a mod
    .get('/mods/:id/assets', ({ params }) => ({ 
      success: true, 
      data: { 
        modId: params.id, 
        assets: [], 
        totalAssets: 0, 
        cachedAt: Date.now() 
      }
    }), {
      detail: {
        tags: ['mods'],
        summary: 'List cached assets for a mod',
        description: 'Retrieves a list of all cached assets for a specific mod.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Unique mod identifier'
          }
        ],
        responses: {
          200: {
            description: 'Asset list retrieved successfully',
            content: {
              'application/json': {
                schema: t.Object({
                  success: t.Literal(true),
                  data: t.Object({
                    modId: t.String(),
                    assets: t.Array(t.Object({
                      filename: t.String(),
                      size: t.Number()
                    })),
                    totalAssets: t.Number(),
                    cachedAt: t.Number()
                  })
                }),
                example: {
                  success: true,
                  data: {
                    modId: 'bloxstrap-theme-old',
                    assets: [
                      { filename: 'CoreGui.rbxl', size: 15432 }
                    ],
                    totalAssets: 1,
                    cachedAt: 1703123456789
                  }
                }
              }
            }
          },
          404: {
            description: 'Mod not cached',
            content: {
              'application/json': {
                schema: t.Object({
                  success: t.Literal(false),
                  error: t.String()
                }),
                example: {
                  success: false,
                  error: 'Mod not cached. Please cache the mod first.'
                }
              }
            }
          }
        }
      }
    })
    
    // Download a specific mod asset
    .get('/mods/:id/assets/:filename', ({ params, set }) => {
      set.headers['Content-Type'] = 'application/octet-stream'
      set.headers['Content-Disposition'] = `attachment; filename="${params.filename}"`
      return new Response()
    }, {
      detail: {
        tags: ['mods'],
        summary: 'Download a specific mod asset',
        description: 'Downloads a specific asset file from a cached mod.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Unique mod identifier'
          },
          {
            name: 'filename',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Name of the asset file to download'
          }
        ],
        responses: {
          200: {
            description: 'Asset file downloaded successfully',
            content: {
              'application/octet-stream': {
                schema: {
                  type: 'string',
                  format: 'binary'
                }
              }
            }
          },
          404: {
            description: 'Mod not cached or asset not found',
            content: {
              'application/json': {
                schema: t.Object({
                  success: t.Literal(false),
                  error: t.String()
                }),
                example: {
                  success: false,
                  error: 'Asset not found'
                }
              }
            }
          }
        }
      }
    })
    
    // Health check
    .get('/health', () => ({
      success: true,
      message: 'Marketplace API is running',
      timestamp: new Date().toISOString()
    }), {
      detail: {
        tags: ['health'],
        summary: 'API health check',
        description: 'Returns the current health status of the API.',
        responses: {
          200: {
            description: 'API is healthy and running',
            content: {
              'application/json': {
                schema: t.Object({
                  success: t.Literal(true),
                  message: t.String(),
                  timestamp: t.String({ format: 'date-time' })
                }),
                example: {
                  success: true,
                  message: 'Marketplace API is running',
                  timestamp: '2024-12-20T10:30:00.000Z'
                }
              }
            }
          }
        }
      }
    })
}