const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');

const app = express();
const PORT = process.env.FAHD_PORT || 5000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Data layer
function loadData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return { products: [], messages: [], orders: [], sales: [] }; }
}
function saveData(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }

app.use(express.json());

// Products
app.get('/api/products', (_, res) => res.json(loadData().products));

app.get('/api/products/:id', (req, res) => {
  const p = loadData().products.find(p => p.id === +req.params.id);
  p ? res.json(p) : res.status(404).json({ error: 'Not found' });
});

app.post('/api/products', (req, res) => {
  const data = loadData();
  const id = data.products.reduce((m, p) => Math.max(m, p.id), 0) + 1;
  const product = { id, onSale: false, salePercent: 0, ...req.body };
  data.products.push(product);
  saveData(data);
  res.json(product);
});

app.put('/api/products/:id/price', (req, res) => {
  const data = loadData();
  const p = data.products.find(p => p.id === +req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  if (req.body.price !== undefined) p.price = +req.body.price;
  if (req.body.stock !== undefined) p.stock = +req.body.stock;
  if (req.body.oldPrice !== undefined) p.oldPrice = +req.body.oldPrice;
  saveData(data);
  res.json(p);
});

app.post('/api/products/:id/price', (req, res) => {
  const data = loadData();
  const p = data.products.find(p => p.id === +req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  for (const k of ['price', 'oldPrice', 'stock', 'name', 'category', 'desc', 'image'])
    if (req.body[k] !== undefined) p[k] = k === 'name' || k === 'category' || k === 'desc' || k === 'image' ? req.body[k] : +req.body[k];
  saveData(data);
  res.json(p);
});

app.post('/api/products/:id/sale', (req, res) => {
  const data = loadData();
  const p = data.products.find(p => p.id === +req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  const pct = +req.body.salePercent || 0;
  const orig = p.oldPrice || p.price;
  p.onSale = pct > 0;
  p.salePercent = pct;
  p.oldPrice = orig;
  p.price = Math.round(orig * (1 - pct / 100) * 100) / 100;
  data.sales.push({ productId: p.id, productName: p.name, salePercent: pct, oldPrice: orig, newPrice: p.price, date: new Date().toISOString() });
  saveData(data);
  res.json(p);
});

app.delete('/api/products/:id', (req, res) => {
  const data = loadData();
  data.products = data.products.filter(p => p.id !== +req.params.id);
  saveData(data);
  res.json({ ok: true });
});

// Messages
app.get('/api/messages', (req, res) => {
  let msgs = loadData().messages;
  if (req.query.from) msgs = msgs.filter(m => m.from === req.query.from);
  if (req.query.to) msgs = msgs.filter(m => m.to === req.query.to);
  res.json(msgs);
});

app.post('/api/messages', (req, res) => {
  const data = loadData();
  const msg = { id: data.messages.length + 1, from: req.body.from, to: req.body.to, text: req.body.text, date: new Date().toISOString(), read: false };
  data.messages.push(msg);
  saveData(data);
  res.json(msg);
});

app.put('/api/messages/read', (req, res) => {
  const data = loadData();
  data.messages.forEach(m => { if (m.from === req.body.from && m.to === req.body.to) m.read = true; });
  saveData(data);
  res.json({ ok: true });
});

app.get('/api/messages/unread/:email', (req, res) => {
  const count = loadData().messages.filter(m => m.to === req.params.email && !m.read).length;
  res.json({ count });
});

// Orders
app.get('/api/orders', (_, res) => res.json(loadData().orders));

app.post('/api/orders', (req, res) => {
  const data = loadData();
  const order = { id: data.orders.length + 1, user: req.body.user, items: req.body.items, total: req.body.total, date: new Date().toISOString(), status: 'Pending' };
  data.orders.push(order);
  saveData(data);
  res.json(order);
});

app.put('/api/orders/:id/status', (req, res) => {
  const data = loadData();
  const o = data.orders.find(o => o.id === +req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  o.status = req.body.status;
  saveData(data);
  res.json(o);
});

// ===== AI Endpoints =====
const OLLAMA = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const DEFAULT_MODEL = process.env.FAHD_MODEL || 'llama3.2';
const AI_PROMPT = `You are Fahd AI, an expert AI assistant built into Fahd Shop e-commerce platform. You are knowledgeable, friendly, and multilingual (Arabic, English, French, Spanish, etc).

Your capabilities:
- Answer ANY question: math, science, history, coding, writing, analysis, advice
- Write code in any language (Python, JavaScript, Java, C++, SQL, HTML/CSS, etc)
- Help with shopping: recommend products, compare items, find deals
- Translate between languages fluently
- Create essays, poems, stories, emails, resumes
- Explain complex topics simply
- Solve math problems step by step

Formatting rules:
- Use Markdown: ## headings, **bold**, inline code, triple-backtick code blocks with language tags
- Use tables for comparisons, bullet lists for steps
- Always be helpful, accurate, and concise
- Answer in the SAME language the user writes in
- For code: always provide complete, working, copy-paste ready code with brief explanation`;

app.get('/api/health', async (_, res) => {
  try { const r = await fetch(OLLAMA + '/api/tags'); if (!r.ok) throw 0; res.json({ ok: true }); }
  catch { res.status(503).json({ error: 'Ollama not available' }); }
});

app.get('/api/models', async (_, res) => {
  try {
    const r = await fetch(OLLAMA + '/api/tags');
    const d = await r.json();
    const models = (d.models || []).map(m => ({
      name: m.name,
      vision: m.name.includes('llava') || m.name.includes('vl') || m.name.includes('vision'),
      tools: (m.details && m.details.capabilities && m.details.capabilities.includes('tools')) || false,
      size: m.size,
      family: (m.details && m.details.family) || ''
    }));
    res.json({ models });
  } catch { res.json({ models: [] }); }
});

app.post('/api/pull', async (req, res) => {
  const model = req.body.model;
  if (!model) return res.status(400).json({ error: 'Model name required' });
  try {
    const r = await fetch(OLLAMA + '/api/pull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model })
    });
    res.setHeader('Content-Type', 'application/x-ndjson');
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
    res.end();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/chat', async (req, res) => {
  const { messages, model, attachments } = req.body;
  if (!messages || !messages.length) return res.status(400).json({ error: 'No messages' });
  const useModel = model || DEFAULT_MODEL;
  const data = loadData();
  const products = (data.products || []).slice(0, 30);
  const productContext = products.length ? '\n\nFahd Shop Products (for shopping help):\n' + products.map(p => `- ${p.name}: $${p.price}${p.onSale ? ' (SALE -' + p.salePercent + '%)' : ''} [${p.category}] ${p.prime ? '✓ Prime' : ''} (${p.reviews} reviews)`).join('\n') : '';
  const chatMsgs = [{ role: 'system', content: AI_PROMPT + productContext }];
  const hist = (messages || []).slice(-20);
  for (const m of hist) {
    if (m.role === 'assistant' && !m.content) continue;
    chatMsgs.push({ role: m.role, content: m.content || '' });
  }
  if (attachments && attachments.length) {
    const last = chatMsgs[chatMsgs.length - 1];
    if (last && last.role === 'user') {
      const parts = attachments.map(a => {
        if (a.type === 'text') return '[File: ' + a.name + ']\n' + Buffer.from(a.data || '', 'base64').toString('utf8');
        return '[Image: ' + a.name + ']';
      });
      last.content = (last.content || '') + '\n\n--- Attachments ---\n' + parts.join('\n\n');
    }
  }
  res.setHeader('Content-Type', 'application/x-ndjson');
  try {
    const postData = JSON.stringify({ model: useModel, messages: chatMsgs, stream: true });
    const oReq = http.request(OLLAMA + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    }, (oRes) => {
      oRes.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const obj = JSON.parse(line);
            if (obj.message && obj.message.content) {
              res.write(JSON.stringify({ d: obj.message.content }) + '\n');
            }
          } catch {}
        }
      });
      oRes.on('end', () => res.end());
    });
    oReq.on('error', (e) => { res.write(JSON.stringify({ error: e.message }) + '\n'); res.end(); });
    oReq.write(postData);
    oReq.end();
  } catch (e) { res.write(JSON.stringify({ error: e.message }) + '\n'); res.end(); }
});

// Derived: Customers
app.get('/api/customers', (_, res) => {
  const data = loadData();
  const map = {};
  data.orders.forEach(o => {
    if (!map[o.user]) map[o.user] = { email: o.user, orderCount: 0, totalSpent: 0 };
    map[o.user].orderCount++;
    map[o.user].totalSpent += o.total || 0;
  });
  res.json(Object.values(map));
});

// Sales
app.get('/api/sales', (_, res) => res.json(loadData().sales));

// Static + 404
app.use(express.static(__dirname, { fallthrough: true }));
app.use((_, res) => {
  try { res.status(404).type('html').send(fs.readFileSync(path.join(__dirname, '404.html'), 'utf8')); }
  catch { res.status(404).json({ error: 'Not found' }); }
});

app.listen(PORT, () => console.log('Fahd Shop running on http://localhost:' + PORT));
