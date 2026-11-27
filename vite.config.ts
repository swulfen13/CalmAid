import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { callGemini, validateRequest } from './src/engine/aiShared.ts';

/**
 * Local twin of the Vercel function api/guide.ts, so `npm run dev` works the same way:
 * the key in GEMINI_API_KEY (.env.local) never reaches the browser.
 */
function aiDevProxy(key: string, model: string): Plugin {
  return {
    name: 'calmaid-ai-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/guide', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end();
        }
        let raw = '';
        for await (const chunk of req) raw += chunk;
        res.setHeader('Content-Type', 'application/json');
        try {
          const body = JSON.parse(raw);
          if (!validateRequest(body)) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'Invalid request' }));
          }
          const reply = await callGemini(body, key, model, AbortSignal.timeout(11500));
          res.end(JSON.stringify(reply));
        } catch (err) {
          res.statusCode = 502;
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const serverKey = env.GEMINI_API_KEY ?? '';
  const useProxy = serverKey.length > 0 || env.VITE_AI_PROXY === 'true';

  return {
    define: { __AI_PROXY__: JSON.stringify(useProxy) },
    plugins: [
      react(),
      ...(serverKey ? [aiDevProxy(serverKey, env.GEMINI_MODEL || 'gemini-3.5-flash-lite')] : []),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'CalmAid: calm first-aid guide',
          short_name: 'CalmAid',
          description: 'Calm, step-by-step first-aid guidance for lay people. Works offline.',
          theme_color: '#1f6f66',
          background_color: '#eef4f2',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          categories: ['medical', 'health', 'utilities'],
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2}'],
          navigateFallbackDenylist: [/^\/api\//],
        },
      }),
    ],
  };
});
