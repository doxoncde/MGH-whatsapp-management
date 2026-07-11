// Bearer token auth middleware for Cloudflare Worker

export function authMiddleware(request: Request): Response | null {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');

  const expectedToken = (globalThis as any).API_TOKEN || 'mgh-dashboard-secret-token-change-me';

  if (token !== expectedToken) {
    return new Response(JSON.stringify({
      error: true,
      message: 'Invalid or missing API token',
      code: 'UNAUTHORIZED',
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return null;
}

export function getApiToken(): string {
  return (globalThis as any).API_TOKEN || 'mgh-dashboard-secret-token-change-me';
}
