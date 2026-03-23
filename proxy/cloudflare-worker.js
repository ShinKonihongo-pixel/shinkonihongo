// Cloudflare Worker proxy for Anthropic Claude API
// Hides API key from browser, adds CORS headers
//
// Deploy steps:
// 1. Go to https://dash.cloudflare.com → Workers & Pages → Create
// 2. Name it "shinko-claude-proxy"
// 3. Paste this code into the editor
// 4. Go to Settings → Variables → Add: ANTHROPIC_API_KEY = sk-ant-api03-...
// 5. Deploy
// 6. Update .env: VITE_ANTHROPIC_PROXY_URL=https://shinko-claude-proxy.<your-subdomain>.workers.dev/v1/messages

const ANTHROPIC_API = 'https://api.anthropic.com';
const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:4173'];
// Add your production domain: 'https://your-app.web.app'

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(request),
      });
    }

    // Only allow POST to /v1/messages
    const url = new URL(request.url);
    if (request.method !== 'POST' || !url.pathname.endsWith('/v1/messages')) {
      return new Response('Not Found', { status: 404 });
    }

    // Check origin
    const origin = request.headers.get('Origin') || '';
    if (!isAllowedOrigin(origin, env)) {
      return new Response('Forbidden', { status: 403 });
    }

    // Get API key from environment variable
    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
      });
    }

    // Forward request to Anthropic
    try {
      const body = await request.text();

      const response = await fetch(`${ANTHROPIC_API}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body,
      });

      const responseBody = await response.text();

      return new Response(responseBody, {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(request),
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Proxy error', detail: err.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
      });
    }
  },
};

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function isAllowedOrigin(origin, env) {
  // Check static list
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Check env var for production domain
  if (env.ALLOWED_ORIGIN && origin === env.ALLOWED_ORIGIN) return true;
  return false;
}
