import { Request, Response } from 'express';
import { Redis } from 'ioredis';
import { env } from '../../../config/env.js';

export class SSEService {
  /**
   * Connect an Express request to a real-time SSE stream backed by Redis Pub/Sub
   */
  static connectSSEStream(req: Request, res: Response, sessionId: string): void {
    // 1. Set SSE Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering (Nginx/Cloudflare)
    res.flushHeaders();

    const channel = `chat:stream:${sessionId}`;
    const subscriber = new Redis(env.REDIS_URL);

    console.log(`📡 [SSE Service] Client connected to stream for session: ${sessionId}`);

    // Send initial connection ACK
    res.write(`data: ${JSON.stringify({ type: 'connected', payload: { sessionId } })}\n\n`);

    // 2. Subscribe to Redis channel
    subscriber.subscribe(channel, (err) => {
      if (err) {
        console.error(`❌ [SSE Service] Redis subscribe error for channel ${channel}:`, err);
        res.write(`data: ${JSON.stringify({ type: 'error', payload: { error: 'Failed to subscribe to stream' } })}\n\n`);
        res.end();
      }
    });

    // 3. Relay incoming Redis messages to SSE client
    subscriber.on('message', (_chan, message) => {
      try {
        const parsed = JSON.parse(message);
        res.write(`data: ${message}\n\n`);

        // Close stream on completion or terminal error
        if (parsed.type === 'complete' || parsed.type === 'error') {
          console.log(`🏁 [SSE Service] Closing stream for session: ${sessionId} (event: ${parsed.type})`);
          cleanup();
          res.end();
        }
      } catch (err) {
        console.error(`[SSE Service] Error parsing stream message:`, err);
      }
    });

    const cleanup = () => {
      subscriber.unsubscribe(channel);
      subscriber.quit();
    };

    // Handle client disconnect
    req.on('close', () => {
      console.log(`🔌 [SSE Service] Client closed connection for session: ${sessionId}`);
      cleanup();
    });
  }
}
