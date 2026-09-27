export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return res.status(500).json({ ok: false, error: 'TELEGRAM_BOT_TOKEN is not configured in Vercel.' });
  }

  const body = req.body || {};
  const action = body.action;

  async function telegram(method, payload = {}) {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));
    return { response, data };
  }

  try {
    if (action === 'sendMessage') {
      const chatId = String(body.chatId || '').trim();
      const text = String(body.text || '').trim();

      if (!chatId) return res.status(400).json({ ok: false, error: 'Missing Telegram Chat ID' });
      if (!text) return res.status(400).json({ ok: false, error: 'Message is empty' });

      const { response, data } = await telegram('sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      });

      return res.status(response.status).json(data);
    }

    if (action === 'sync') {
      const offset = Number.isFinite(Number(body.offset)) ? Number(body.offset) : 0;

      // Telegram forbids getUpdates while a webhook is active.
      // Remove the webhook but keep pending updates.
      const del = await telegram('deleteWebhook', { drop_pending_updates: false });
      if (!del.data.ok) {
        return res.status(del.response.status || 500).json({
          ok: false,
          error: 'Could not remove Telegram webhook.',
          description: del.data.description
        });
      }

      const { response, data } = await telegram('getUpdates', {
        offset: offset || undefined,
        limit: 100,
        timeout: 0,
        allowed_updates: ['message']
      });

      return res.status(response.status).json(data);
    }

    if (action === 'botInfo') {
      const { response, data } = await telegram('getMe');
      return res.status(response.status).json(data);
    }

    return res.status(400).json({ ok: false, error: 'Unknown Telegram action' });
  } catch (error) {
    console.error('Telegram API error:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Telegram server error' });
  }
}
