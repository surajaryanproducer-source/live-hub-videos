import { getStore } from '@netlify/blobs';

const H = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: H, body: '' };
  }

  // Shared stores
  const videoStore = getStore('livehub-videos');
  const adminStore = getStore('livehub-admin');

  // Load videos
  let data = await videoStore.get('videos', { type: 'json' });
  if (!data || typeof data !== 'object' || !Array.isArray(data.items)) data = { items: [] };

  // Load or initialize admin credentials
  let admin = await adminStore.get('credentials', { type: 'json' });
  if (!admin || typeof admin !== 'object') {
    admin = { email: 'lmahadev50@gmail.com', password: 'changeMe123!' };
    await adminStore.set('credentials', JSON.stringify(admin), { contentType: 'application/json' });
  }

  const method = event.httpMethod;

  if (method === 'GET') {
    return { statusCode: 200, headers: H, body: JSON.stringify(data) };
  }

  if (method === 'POST') {
    try {
      const body = event.body ? JSON.parse(event.body) : {};
      const op = String(body.op || 'add');
      const items = Array.isArray(data.items) ? data.items : [];

      // Auth op
      if (op === 'auth') {
        const email = String(body.email || '').trim().toLowerCase();
        const password = String(body.password || '');
        const ok = email === String(admin.email || '').toLowerCase() && password === String(admin.password || '');
        return { statusCode: 200, headers: H, body: JSON.stringify({ ok }) };
      }
      if (op === 'setadmin') {
        const email = String(body.email || '').trim().toLowerCase();
        const password = String(body.password || '');
        if (!email || !password) return { statusCode: 400, headers: H, body: JSON.stringify({ error: 'missing fields' }) };
        admin = { email, password };
        await adminStore.set('credentials', JSON.stringify(admin), { contentType: 'application/json' });
        return { statusCode: 200, headers: H, body: JSON.stringify({ ok: true }) };
      }

      if (op === 'add') {
        const maxId = items.reduce((m, it) => Math.max(m, Number(it.id) || 0), 0);
        const item = {
          id: maxId + 1,
          createdAt: Date.now(),
          title: String(body.title || ''),
          link: String(body.url || body.link || ''),
          profile: String(body.profile || ''),
          duration: String(body.duration || ''),
          category: String(body.category || ''),
          thumbnail: String(body.thumbnail || ''),
          description: String(body.description || ''),
        };
        data.items = [...items, item];
        await videoStore.set('videos', JSON.stringify(data), { contentType: 'application/json' });
        return { statusCode: 200, headers: H, body: JSON.stringify({ ok: true, item }) };
      }

      if (op === 'update') {
        const id = String(body.id || '');
        let updated = null;
        data.items = items.map(it => {
          if (String(it.id) === id) {
            updated = {
              ...it,
              title: String(body.title ?? it.title ?? ''),
              link: String(body.url ?? body.link ?? it.link ?? ''),
              profile: String(body.profile ?? it.profile ?? ''),
              duration: String(body.duration ?? it.duration ?? ''),
              category: String(body.category ?? it.category ?? ''),
              thumbnail: String(body.thumbnail ?? it.thumbnail ?? ''),
              description: String(body.description ?? it.description ?? ''),
            };
            return updated;
          }
          return it;
        });
        await videoStore.set('videos', JSON.stringify(data), { contentType: 'application/json' });
        return { statusCode: 200, headers: H, body: JSON.stringify({ ok: true, item: updated }) };
      }

      if (op === 'delete') {
        const id = String(body.id || '');
        data.items = items.filter(it => String(it.id) !== id);
        await videoStore.set('videos', JSON.stringify(data), { contentType: 'application/json' });
        return { statusCode: 200, headers: H, body: JSON.stringify({ ok: true }) };
      }

      return { statusCode: 400, headers: H, body: JSON.stringify({ error: 'bad op' }) };
    } catch (e) {
      return { statusCode: 500, headers: H, body: JSON.stringify({ error: 'server error', detail: String(e && e.message || e) }) };
    }
  }

  return { statusCode: 405, headers: H, body: JSON.stringify({ error: 'method not allowed' }) };
}
