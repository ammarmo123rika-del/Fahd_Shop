const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');
const app = express();
var PORT = 5000;
// ===== AI CONFIG =====
var OLLAMA = 'http://127.0.0.1:11434';
var DEFAULT_MODEL = process.env.FAHD_MODEL || 'llama3.2';
var SYSTEM_PROMPT = 'You are Fahd AI, a capable friendly AI assistant. Be accurate honest and helpful. Think step by step. Use Markdown. Answer in the same language the user writes in.';

function buildMessages(history, attachments, model) {
  var msgs = [{ role: "system", content: SYSTEM_PROMPT }];
  if (!history || !history.length) return msgs;
  for (var i = 0; i < history.slice(-20).length; i++) {
    var m = history.slice(-20)[i];
    if (m.role === "assistant" && !m.content) continue;
    msgs.push({ role: m.role, content: m.content || "" });
  }
  if (attachments && attachments.length) {
    var last = msgs[msgs.length - 1];
    if (last && last.role === "user") {
      var parts = [];
      for (var j = 0; j < attachments.length; j++) {
        var a = attachments[j];
        if (a.type === "text") parts.push("[File: " + a.name + "]\n" + Buffer.from(a.data || "", "base64").toString("utf8"));
        else parts.push("[Image: " + a.name + "]");
      }
      last.content = (last.content || "") + "\n\n--- Attachments ---\n" + parts.join("\n\n");
    }
  }
  return msgs;
}

function ollamaStream(res, model, messages) {
  return new Promise(function(resolve, reject) {
    var postData = JSON.stringify({ model: model || DEFAULT_MODEL, messages: messages, stream: true });
    var r = http.request(OLLAMA + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(postData) }
    }, function(ollRes) {
      var out = "";
      ollRes.on("data", function(chunk) {
        var str = chunk.toString();
        res.write(JSON.stringify({ d: str.replace(/\n/g, "") }) + "\n");
        out += str;
      });
      ollRes.on("end", function() { resolve(out); });
      ollRes.on("error", reject);
    });
    r.on("error", function(e) { res.write(JSON.stringify({ error: e.message }) + "\n"); res.end(); reject(e); });
    r.write(postData); r.end();
  });
}


app.use(express.json());

// ===== DATA STORE =====
const DATA_FILE = path.join(__dirname, 'data.json');

const DEFAULT_PRODUCTS = [
  {id:1,name:"Apple iPhone 15 Pro Max 256GB",price:1199,oldPrice:1299,image:"📱",category:"Electronics",rating:4.8,reviews:2340,prime:true,stock:25,desc:"Latest Apple iPhone with A17 Pro chip, titanium design, and 48MP camera system.",onSale:false,salePercent:0},
  {id:2,name:"Samsung Galaxy S24 Ultra 512GB",price:1099,oldPrice:1199,image:"📱",category:"Electronics",rating:4.7,reviews:1890,prime:true,stock:30,desc:"Samsung flagship with S Pen, AI features, and 200MP camera.",onSale:false,salePercent:0},
  {id:3,name:"Sony WH-1000XM5 Headphones",price:298,oldPrice:399,image:"🎧",category:"Electronics",rating:4.9,reviews:5670,prime:true,stock:50,desc:"Industry-leading noise cancellation with premium sound quality.",onSale:false,salePercent:0},
  {id:4,name:'Apple MacBook Pro 14" M3 Pro',price:1999,oldPrice:2199,image:"💻",category:"Electronics",rating:4.8,reviews:1230,prime:true,stock:15,desc:"Supercharged by M3 Pro chip, up to 18 hours battery life.",onSale:false,salePercent:0},
  {id:5,name:"Amazon Kindle Paperwhite",price:139,oldPrice:160,image:"📖",category:"Books",rating:4.6,reviews:8900,prime:true,stock:100,desc:'6.8" display, adjustable warm light, waterproof.',onSale:false,salePercent:0},
  {id:6,name:"Nike Air Max 270 Running Shoes",price:129,oldPrice:160,image:"👟",category:"Fashion",rating:4.5,reviews:3400,prime:true,stock:40,desc:"Maximum comfort with Max Air unit for all-day wear.",onSale:false,salePercent:0},
  {id:7,name:"Dyson V15 Detect Vacuum",price:649,oldPrice:749,image:"🧹",category:"Home",rating:4.7,reviews:2100,prime:true,stock:20,desc:"Laser reveals invisible dust, LCD screen shows particle count.",onSale:false,salePercent:0},
  {id:8,name:"PlayStation 5 Console",price:499,oldPrice:549,image:"🎮",category:"Gaming",rating:4.9,reviews:12000,prime:true,stock:10,desc:"Lightning-fast loading with SSD, 4K gaming, ray tracing.",onSale:false,salePercent:0},
  {id:9,name:"Nintendo Switch OLED",price:349,oldPrice:370,image:"🎮",category:"Gaming",rating:4.8,reviews:7800,prime:true,stock:25,desc:"7-inch OLED screen, wide adjustable stand, enhanced audio.",onSale:false,salePercent:0},
  {id:10,name:"Instant Pot Duo 7-in-1 6Qt",price:79,oldPrice:99,image:"🍲",category:"Home",rating:4.7,reviews:15000,prime:true,stock:60,desc:"Pressure cooker, slow cooker, rice cooker, steamer, sauté, yogurt maker, and warmer.",onSale:false,salePercent:0},
  {id:11,name:"Bose QuietComfort Ultra Earbuds",price:249,oldPrice:299,image:"🎧",category:"Electronics",rating:4.6,reviews:3200,prime:true,stock:35,desc:"World-class noise cancellation with Immersive Audio.",onSale:false,salePercent:0},
  {id:12,name:"Levi's 501 Original Fit Jeans",price:59,oldPrice:79,image:"👖",category:"Fashion",rating:4.4,reviews:6700,prime:true,stock:80,desc:"The original button fly jean since 1873. Iconic straight leg.",onSale:false,salePercent:0}
];

function loadData() {
  try {
    var raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch(e) {
    return {
      products: DEFAULT_PRODUCTS,
      messages: [],
      orders: [],
      sales: []
    };
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ===== PRODUCTS API =====
app.get('/api/products', function(req, res) {
  var data = loadData();
  res.json(data.products);
});

app.get('/api/products/:id', function(req, res) {
  var data = loadData();
  var product = null;
  for (var i = 0; i < data.products.length; i++) {
    if (data.products[i].id === parseInt(req.params.id)) {
      product = data.products[i];
      break;
    }
  }
  if (!product) return res.status(404).json({error: 'Not found'});
  res.json(product);
});

app.post('/api/products', function(req, res) {
  var data = loadData();
  var newId = 1;
  for (var i = 0; i < data.products.length; i++) {
    if (data.products[i].id >= newId) newId = data.products[i].id + 1;
  }
  var product = { id: newId };
  var keys = Object.keys(req.body);
  for (var i = 0; i < keys.length; i++) {
    product[keys[i]] = req.body[keys[i]];
  }
  product.onSale = false;
  product.salePercent = 0;
  data.products.push(product);
  saveData(data);
  res.json(product);
});

app.put('/api/products/:id/price', function(req, res) {
  var data = loadData();
  for (var i = 0; i < data.products.length; i++) {
    if (data.products[i].id === parseInt(req.params.id)) {
      data.products[i].price = parseFloat(req.body.price);
      if (req.body.stock !== undefined) data.products[i].stock = parseInt(req.body.stock);
      if (req.body.oldPrice) data.products[i].oldPrice = parseFloat(req.body.oldPrice);
      saveData(data);
      return res.json(data.products[i]);
    }
  }
  res.status(404).json({error: 'Not found'});
});
app.post('/api/products/:id/price', function(req, res) {
  var data = loadData();
  for (var i = 0; i < data.products.length; i++) {
    if (data.products[i].id === parseInt(req.params.id)) {
      if (req.body.price !== undefined) data.products[i].price = parseFloat(req.body.price);
      if (req.body.oldPrice !== undefined) data.products[i].oldPrice = parseFloat(req.body.oldPrice);
      if (req.body.stock !== undefined) data.products[i].stock = parseInt(req.body.stock);
      if (req.body.name !== undefined) data.products[i].name = req.body.name;
      if (req.body.category !== undefined) data.products[i].category = req.body.category;
      if (req.body.desc !== undefined) data.products[i].desc = req.body.desc;
      if (req.body.image !== undefined) data.products[i].image = req.body.image;
      saveData(data);
      return res.json(data.products[i]);
    }
  }
  res.status(404).json({error: 'Not found'});
});

app.post('/api/products/:id/sale', function(req, res) {
  var data = loadData();
  for (var i = 0; i < data.products.length; i++) {
    if (data.products[i].id === parseInt(req.params.id)) {
      var pct = parseInt(req.body.salePercent) || 0;
      var orig = data.products[i].oldPrice || data.products[i].price;
      data.products[i].onSale = pct > 0;
      data.products[i].salePercent = pct;
      data.products[i].oldPrice = orig;
      data.products[i].price = Math.round(orig * (1 - pct / 100) * 100) / 100;
      data.sales.push({
        productId: data.products[i].id,
        productName: data.products[i].name,
        salePercent: pct,
        oldPrice: orig,
        newPrice: data.products[i].price,
        date: new Date().toISOString()
      });
      saveData(data);
      return res.json(data.products[i]);
    }
  }
  res.status(404).json({error: 'Not found'});
});

app.delete('/api/products/:id', function(req, res) {
  var data = loadData();
  data.products = data.products.filter(function(p) { return p.id !== parseInt(req.params.id); });
  saveData(data);
  res.json({ok: true});
});

// ===== CHAT API =====
app.get('/api/messages', function(req, res) {
  var data = loadData();
  var msgs = data.messages;
  if (req.query.from) {
    msgs = msgs.filter(function(m) { return m.from === req.query.from; });
  }
  if (req.query.to) {
    msgs = msgs.filter(function(m) { return m.to === req.query.to; });
  }
  res.json(msgs);
});

app.post('/api/messages', function(req, res) {
  var data = loadData();
  var msg = {
    id: data.messages.length + 1,
    from: req.body.from,
    to: req.body.to,
    text: req.body.text,
    date: new Date().toISOString(),
    read: false
  };
  data.messages.push(msg);
  saveData(data);
  res.json(msg);
});

app.put('/api/messages/read', function(req, res) {
  var data = loadData();
  for (var i = 0; i < data.messages.length; i++) {
    if (data.messages[i].from === req.body.from && data.messages[i].to === req.body.to) {
      data.messages[i].read = true;
    }
  }
  saveData(data);
  res.json({ok: true});
});

app.get('/api/messages/unread/:email', function(req, res) {
  var data = loadData();
  var count = 0;
  for (var i = 0; i < data.messages.length; i++) {
    if (data.messages[i].to === req.params.email && !data.messages[i].read) count++;
  }
  res.json({count: count});
});

// ===== ORDERS API =====
app.get('/api/orders', function(req, res) {
  var data = loadData();
  res.json(data.orders);
});

app.post('/api/orders', function(req, res) {
  var data = loadData();
  var order = {
    id: data.orders.length + 1,
    user: req.body.user,
    items: req.body.items,
    total: req.body.total,
    date: new Date().toISOString(),
    status: 'Pending'
  };
  data.orders.push(order);
  saveData(data);
  res.json(order);
});

app.put('/api/orders/:id/status', function(req, res) {
  var data = loadData();
  for (var i = 0; i < data.orders.length; i++) {
    if (data.orders[i].id === parseInt(req.params.id)) {
      data.orders[i].status = req.body.status;
      saveData(data);
      return res.json(data.orders[i]);
    }
  }
  res.status(404).json({error: 'Not found'});
});

// ===== CUSTOMERS API =====
app.get('/api/customers', function(req, res) {
  var data = loadData();
  var emailMap = {};
  for (var i = 0; i < data.orders.length; i++) {
    var e = data.orders[i].user;
    if (!emailMap[e]) emailMap[e] = {email: e, orderCount: 0, totalSpent: 0};
    emailMap[e].orderCount++;
    emailMap[e].totalSpent += (data.orders[i].total || 0);
  }
  var customers = [];
  var keys = Object.keys(emailMap);
  for (var i = 0; i < keys.length; i++) {
    customers.push(emailMap[keys[i]]);
  }
  res.json(customers);
});

// ===== SALES API =====
app.get('/api/sales', function(req, res) {
  var data = loadData();
  res.json(data.sales);
});


// ===== AI ROUTES =====
app.get('/api/health', async function(req, res) {
  try {
    var r = await fetch(OLLAMA + '/api/tags');
    if (!r.ok) throw 0;
    res.json({ status: 'OK', ollama: true });
  } catch(e) {
    res.status(503).json({ status: 'Ollama not reachable', ollama: false });
  }
});

app.get('/api/models', async function(req, res) {
  try {
    var r = await fetch(OLLAMA + '/api/tags');
    var d = await r.json();
    var models = (d.models || []).map(function(m) {
      return { name: m.name, size: m.size, vision: /llava|vision|bakllava/i.test(m.name), tools: /qwen|llama3/i.test(m.name) };
    });
    res.json({ models: models });
  } catch(e) {
    res.json({ models: [] });
  }
});

app.post('/api/pull', async function(req, res) {
  try {
    var r = await fetch(OLLAMA + '/api/pull', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: req.body.model })
    });
    res.writeHead(200, { 'Content-Type': 'text/plain', 'Transfer-Encoding': 'chunked' });
    var reader = r.body.getReader();
    var dec = new TextDecoder();
    while (true) {
      var result = await reader.read();
      if (result.done) break;
      res.write(dec.decode(result.value, { stream: true }));
    }
    res.end();
  } catch(e) {
    res.status(500).end('Error: ' + e.message);
  }
});

app.post('/api/chat', async function(req, res) {
  try {
    var history = req.body.messages || req.body.history || [];
    var atts = req.body.attachments || [];
    var model = req.body.model || DEFAULT_MODEL;
    res.writeHead(200, { 'Content-Type': 'application/x-ndjson', 'Transfer-Encoding': 'chunked', 'Cache-Control': 'no-cache' });
    await ollamaStream(res, model, buildMessages(history, atts, model));
    res.end();
  } catch(e) {
    if (!res.headersSent) res.status(500).json({ error: e.message });
    else res.end();
  }
});
// ===== STATIC FILES (after all API routes) =====
app.use(express.static(__dirname, { fallthrough: true }));

// ===== 404 CATCH-ALL =====
app.use(function(req, res) {
  res.status(404).type('html').send(fs.readFileSync(path.join(__dirname, '404.html'), 'utf8'));
});

// ===== START SERVER =====
app.listen(PORT, function() {
  console.log('Fahd Shop + AI running on http://localhost:' + PORT);
});
