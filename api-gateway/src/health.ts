import { Express, Request, Response } from 'express'

/**
 * Daftarkan endpoint health check
 */
export default function health(app: Express): void {
  app.get('/health', (req: Request, res: Response): void => {
    res.status(200).json({
      status: 'UP',
      service: 'api-gateway',
      timestamp: new Date().toISOString()
    })
  })
} 