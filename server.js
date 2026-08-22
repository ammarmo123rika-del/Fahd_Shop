const express = require('express');
const fs = require('fs');
const path = require('path');

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
