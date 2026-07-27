import { env } from './config/env.js';
import { createApp } from './api.js';
import { startWorkers, stopWorkers } from './worker.js';
import { StorageService } from './features/storage/storage.service.js';
import { SupabaseStorageProvider } from './features/storage/providers/supabase.provider.js';

async function bootstrap() {
  try {
    // Initialize application services
    StorageService.setProvider(new SupabaseStorageProvider());

    // Start background workers
    await startWorkers();

    // Create Express app
    const app = createApp();

    // Start HTTP server
    app.listen(env.PORT, () => {
      console.log(`🚀 Server listening on port ${env.PORT}`);
    });

    const shutdown = async () => {
      console.log('🛑 Gracefully shutting down...');

      await stopWorkers();

      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('❌ Failed to bootstrap application:', error);
    process.exit(1);
  }
}

bootstrap();