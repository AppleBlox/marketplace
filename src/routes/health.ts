import { Elysia } from 'elysia'

export const createHealthRoutes = () => {
  return new Elysia({ prefix: '/health' })
    .get('/', () => ({
      success: true,
      message: 'Marketplace API is running',
      timestamp: new Date().toISOString()
    }))
}