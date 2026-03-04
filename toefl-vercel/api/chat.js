// api/chat.js — Vercel Serverless Function
// Anthropic API Key는 Vercel 환경변수에서만 읽음 → 클라이언트에 절대 노출 안 됨

export default async function handler(req, res) {
  // CORS 허용 (같은 도메인에서만 호출 가능하도록 origin 체크)
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 환경변수에서 API Key 읽기 (Vercel Dashboard에서 설정)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  try {
    const { model, max_tokens, messages } = req.body;

    // 기본값 보정
    const safeModel = model || 'claude-sonnet-4-20250514';
    const safeTokens = Math.min(max_tokens || 3000, 8000); // 최대 8000 제한

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: safeModel,
        max_tokens: safeTokens,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: err.message });
  }
}
