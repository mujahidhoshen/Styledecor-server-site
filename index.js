import { app } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

connectDB()
  .then(() => {
    if (process.env.VERCEL !== '1') {
      app.listen(env.port, () => {
        console.log(`[server] StyleDecor API listening on port ${env.port}`);
      });
    }
  })
  .catch((error) => {
    console.error('[db] Failed to connect MongoDB:', error.message);
    if (process.env.VERCEL !== '1') {
      process.exit(1);
    }
  });

export default app;
