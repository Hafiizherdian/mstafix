import { Request, Response, NextFunction } from 'express'

/**
 * Stub circuit‐breaker middleware
 * (langsung next; jika butuh opossum, Anda bisa import dan wrap di sini)
 */
export default function circuitBreaker() {
  return (req: Request, res: Response, next: NextFunction): void => {
    next()
  }
} 