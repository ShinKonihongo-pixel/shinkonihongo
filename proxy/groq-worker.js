// Cloudflare Worker proxy for Groq API
// Hides API key from browser, adds CORS headers
//
// Deploy steps:
// 1. Go to https://dash.cloudflare.com → Workers & Pages → Create
// 2. Name it "shinko-groq-proxy"
// 3. Paste this code into the editor
// 4. Go to Settings → Variables → Add: GROQ_API_KEY = gsk_...
// 5. Deploy
// 6. Update .env: VITE_GROQ_PROXY_URL=https://shinko-groq-proxy.<your-subdomain>.workers.dev/v1/chat/completions

const GROQ_API = 'https://api.groq.com';
// Localhost dev origins; production domain is read from env.ALLOWED_ORIGIN
const DEV_ORIGINS = ['http://localhost:5173', 'http://localhost:4173'];

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request) });
    }

    // Only allow POST to /v1/chat/completions
    const url = new URL(request.url);
    if (request.method !== 'POST' || !url.pathname.endsWith('/v1/chat/completions')) {
      return new Response('Not Found', { status: 404 });
    }

    // Check origin
    const origin = request.headers.get('Origin') || '';
    if (!isAllowedOrigin(origin, env)) {
      return new Response('Forbidden', { status: 403 });
    }

    // Get API key from environment variable (never exposed to client)
    const apiKey = env.GROQ_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
      });
    }

    // Forward request to Groq
    try {
      const body = await request.text();

      const response = await fetch(`${GROQ_API}/openai/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body,
      });

      const responseBody = await response.text();

      return new Response(responseBody, {
        status: response.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
      });
    } catch {
      return new Response(JSON.stringify({ error: 'Proxy error' }), {
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
  if (DEV_ORIGINS.includes(origin)) return true;
  // Production domain set via Worker env var: ALLOWED_ORIGIN
  if (env.ALLOWED_ORIGIN && origin === env.ALLOWED_ORIGIN) return true;
  // Support comma-separated list for multiple domains
  if (env.ALLOWED_ORIGINS) {
    return env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).includes(origin);
  }
  return false;
}
