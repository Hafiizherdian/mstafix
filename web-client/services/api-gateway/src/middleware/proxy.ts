import { RequestHandler } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

/**
 * Buat proxy middleware
 * @param prefix  base path di gateway (misal '/api/v1/auth')
 * @param target  URL service tujuan
 */
export default function proxy(prefix: string, target: string): RequestHandler {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: { [`^${prefix}`]: '' }
  })
} 