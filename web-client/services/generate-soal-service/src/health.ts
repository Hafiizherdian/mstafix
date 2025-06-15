import { Express, Request, Response } from 'express'

/**
 * Daftarkan endpoint health check
 */
export default function health(app: Express): void {
  app.get(
    '/health',
    (req: Request, res: Response): void => {
      res.status(200).send('OK')
    }
  )
} 