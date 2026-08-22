// ===== Fahd Shop - Complete Client App =====
const API = '';
let productsData = [];

// ===== Auth =====
function getCurrentUser() { return JSON.parse(localStorage.getItem('fahd_user') || 'null'); }
function setCurrentUser(u) { localStorage.setItem('fahd_user', JSON.stringify(u)); }
function logout() { localStorage.removeItem('fahd_user'); location.href = 'login.html'; }

async function login() {
  const email = document.getElementById('email').value.trim();
  const pass = document.getElementById('password').value.trim();
  const msg = document.getElementById('msg');
  if (!email || !pass) { msg.textContent = 'Fill all fields'; msg.style.color = 'red'; return; }
  if (email === 'host@fahd.shop' && pass === 'admin123') {
    setCurrentUser({ email, name: 'Admin', role: 'admin' });
    msg.textContent = 'Login successful!'; msg.style.color = 'green';
    setTimeout(() => location.href = 'admin.html', 800);
    return;
  }
  setCurrentUser({ email, name: email.split('@')[0], role: 'customer' });
  msg.textContent = 'Welcome!'; msg.style.color = 'green';
  setTimeout(() => location.href = 'products.html', 800);
}

function signup() {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const pass = document.getElementById('password').value.trim();
  const msg = document.getElementById('msg');
  if (!name || !email || !pass) { msg.textContent = 'Fill all fields'; msg.style.color = 'red'; return; }
  setCurrentUser({ email, name, role: 'customer' });
  msg.textContent = 'Signed up!'; msg.style.color = 'green';
  setTimeout(() => location.href = 'products.html', 800);
}

// ===== Products =====
async function loadProducts() {
  try {
    const res = await fetch(API + '/api/products');
    productsData = await res.json();
  } catch(e) { productsData = []; }
  return productsData;
}
function imgTag(url, name, sz) {
  if (url && url.indexOf('http') === 0) return '<img src="' + url + '" style="max-width:100%;max-height:' + (sz||160) + 'px;object-fit:contain;border-radius:8px" alt="' + (name||'Product') + '">';
  return '<div style="font-size:' + (sz||48) + 'px">' + (url || '\uD83D\uDCE6') + '</div>';
}

function esc(s) {
  return String(s || '').replace(/[&<>"]/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; });
}

function renderProducts(containerId, limit) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var searchEl = document.getElementById('search');
  var query = searchEl ? searchEl.value.toLowerCase() : '';
  loadProducts().then(function(products) {
    var filtered = query ? products.filter(function(p) {
      return p.name.toLowerCase().includes(query) || (p.category||'').toLowerCase().includes(query);
    }) : products;
    if (limit) filtered = filtered.slice(0, limit);
    if (!filtered.length) { container.innerHTML = '<p style="color:#666;text-align:center">No products found.</p>'; return; }
    container.innerHTML = filtered.map(function(p) {
      var stars = '';
      return '<div class="product-card" onclick="location.href=\'product.html?id=' + p.id + '\'">' +
        '<div class="img-wrap">' + imgTag(p.image, p.name, 160) + '</div>' +
        '<div class="info">' +
        '<div class="title">' + esc(p.name) + '</div>' +
        '<div class="category">' + esc(p.category || '') + '</div>' +
        '<div class="stars"><span class="star-color">' + stars + '</span><span class="count">(' + (p.reviews || 0) + ')</span></div>' +
        '<div class="price">' +
        '<span class="current">$' + p.price + '</span>' +
        (p.oldPrice ? ' <span class="old">$' + p.oldPrice + '</span>' : '') +
        (p.onSale ? ' <span class="badge">-' + p.salePercent + '%</span>' : '') +
        '</div>' +
        (p.prime ? '<div class="prime">\u2713 Prime</div>' : '') +
        '<button class="btn-cart" onclick="event.stopPropagation();addToCart(' + p.id + ')">Add to Cart</button>' +
        '</div></div>';
    }).join('');
  });
}

// ===== Cart =====
function getCart() { return JSON.parse(localStorage.getItem('fahd_cart') || '[]'); }
function saveCart(c) { localStorage.setItem('fahd_cart', JSON.stringify(c)); }

function addToCart(id) {
  loadProducts().then(function(products) {
    var product = products.find(function(p) { return p.id === id; });
    if (!product) return;
    var cart = getCart();
    var existing = cart.find(function(c) { return c.id === id; });
    if (existing) existing.qty++;
    else cart.push({ id: id, name: product.name, price: product.price, image: product.image, qty: 1 });
    saveCart(cart);
    updateCartCount();
    alert(product.name + ' added to cart!');
  });
}

function removeFromCart(id) {
  saveCart(getCart().filter(function(c) { return c.id !== id; }));
  renderCart();
  updateCartCount();
}

function updateCartCount() {
  var el = document.getElementById('cartCount');
  if (!el) return;
  var count = getCart().reduce(function(s, c) { return s + c.qty; }, 0);
  el.textContent = count;
  el.style.display = count ? 'inline' : 'none';
}

function renderCart() {
  var container = document.getElementById('cart');
  if (!container) return;
  var cart = getCart();
  if (!cart.length) { container.innerHTML = '<p style="text-align:center;color:#666">Your cart is empty.</p>'; return; }
  var total = cart.reduce(function(s, c) { return s + c.price * c.qty; }, 0);
  container.innerHTML = cart.map(function(c) {
    return '<div class="card" style="display:flex;align-items:center;gap:16px">' +
      imgTag(c.image, c.name, 80) +
      '<div style="flex:1"><b>' + esc(c.name) + '</b><div style="color:#666">$' + c.price + ' x ' + c.qty + ' = <b>$' + (c.price*c.qty).toFixed(2) + '</b></div></div>' +
      '<div style="display:flex;align-items:center;gap:8px">' +
      '<button onclick="changeQty(' + c.id + ',-1)" style="padding:4px 10px;font-size:16px">-</button>' +
      '<span style="font-weight:bold">' + c.qty + '</span>' +
      '<button onclick="changeQty(' + c.id + ',1)" style="padding:4px 10px;font-size:16px">+</button>' +
      '<button onclick="removeFromCart(' + c.id + ')" style="padding:4px 10px;background:#ef4444;color:#fff">X</button>' +
      '</div></div>';
  }).join('') + '<div style="text-align:right;margin-top:16px;font-size:20px"><b>Total: $' + total.toFixed(2) + '</b></div>';
}

function changeQty(id, delta) {
  var cart = getCart();
  var item = cart.find(function(c) { return c.id === id; });
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart(cart);
  renderCart();
}

function checkout() {
  var cart = getCart();
  if (!cart.length) { alert('Cart is empty'); return; }
  var user = getCurrentUser();
  if (!user) { alert('Please login first'); location.href = 'login.html'; return; }
  var total = cart.reduce(function(s, c) { return s + c.price * c.qty; }, 0);
  fetch(API + '/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: user.email, items: cart, total: total })
  }).catch(function() {});
  var orders = JSON.parse(localStorage.getItem('fahd_orders') || '[]');
  orders.push({ date: new Date().toLocaleString(), items: cart.slice(), total: total });
  localStorage.setItem('fahd_orders', JSON.stringify(orders));
  localStorage.removeItem('fahd_cart');
  alert('Order placed successfully!');
  location.href = 'orders.html';
}

// ===== Orders =====
function showOrders() {
  var el = document.getElementById('orders');
  if (!el) return;
  var local = JSON.parse(localStorage.getItem('fahd_orders') || '[]');
  if (!local.length) { el.innerHTML = '<p style="text-align:center;color:#666">No orders yet.</p>'; return; }
  el.innerHTML = local.map(function(o, i) {
    return '<div class="card"><b>Order #' + (i+1) + '</b><p style="color:#666">' + o.date + '</p><p>' +
      o.items.map(function(x) { return esc(x.name) + ' x ' + x.qty; }).join(', ') +
      '</p><b style="color:#e63946">$' + (o.total||0).toFixed(2) + '</b></div>';
  }).join('');
}

// ===== Admin =====
async function renderAdmin() {
  try {
    var custRes = await fetch(API + '/api/customers').catch(function() { return { json: function() { return []; } }; });
    var orderRes = await fetch(API + '/api/orders').catch(function() { return { json: function() { return []; } }; });
    var customers = await custRes.json();
    var orders = await orderRes.json();
    var ce = document.getElementById('customers');
    var oe = document.getElementById('orders');
    if (ce) ce.textContent = (customers||[]).length;
    if (oe) oe.textContent = (orders||[]).length;
    var ol = document.getElementById('ordersList');
    if (ol) {
      var list = orders || [];
      ol.innerHTML = list.length ? list.slice(-10).reverse().map(function(o) {
        return '<div class="card" style="display:flex;justify-content:space-between;align-items:center">' +
          '<div><b>' + esc(o.user||'Unknown') + '</b> <span style="color:#666">' + (o.date ? new Date(o.date).toLocaleDateString() : '') + '</span></div>' +
          '<div><b>$' + (o.total||0).toFixed(2) + '</b> <span style="padding:2px 8px;border-radius:6px;font-size:12px;background:' +
          (o.status==='Delivered'?'#d1fae5':'#fef3c7') + '">' + (o.status||'Pending') + '</span></div></div>';
      }).join('') : '<p style="color:#666">No orders yet.</p>';
    }
  } catch(e) { console.error('Admin error:', e); }
}

// ===== Chat =====
window.currentChatWith = 'fahdm19573@gmail.com';

function renderChat() {
  loadChatUsers();
  var user = getCurrentUser();
  if (user && user.role === 'admin') {
    window.currentChatWith = 'customer@test.com';
    loadMessages(window.currentChatWith);
  }
}

async function loadChatUsers() {
  var el = document.getElementById('chatUsers');
  if (!el) return;
  try {
    var res = await fetch(API + '/api/messages');
    var msgs = await res.json();
    var emailSet = {};
    msgs.forEach(function(m) { if(m.from) emailSet[m.from]=1; if(m.to) emailSet[m.to]=1; });
    var users = Object.keys(emailSet);
    el.innerHTML = users.map(function(u) {
      var active = u === window.currentChatWith;
      return '<div style="padding:10px;cursor:pointer;border-bottom:1px solid #eee;' + (active?'background:#e0e7ff;font-weight:bold':'') + '" onclick="window.currentChatWith=\'' + u + '\';loadMessages(\'' + u + '\');renderChat()">' + esc(u) + '</div>';
    }).join('') || '<p style="padding:10px;color:#666">No conversations</p>';
  } catch(e) { el.innerHTML = '<p style="padding:10px;color:#666">Chat offline</p>'; }
}

async function loadMessages(withUser) {
  var el = document.getElementById('chatMessages');
  if (!el) return;
  try {
    var res = await fetch(API + '/api/messages');
    var msgs = await res.json();
    var user = getCurrentUser();
    var myEmail = user ? user.email : '';
    var filtered = msgs.filter(function(m) {
      return (m.from===myEmail && m.to===withUser) || (m.from===withUser && m.to===myEmail);
    });
    el.innerHTML = filtered.map(function(m) {
      var isMe = m.from === myEmail;
      return '<div style="padding:10px;margin:6px 0;border-radius:10px;max-width:70%;' + (isMe?'margin-left:auto;background:#dbeafe;text-align:right':'background:#f3f4f6') + '">' +
        '<div style="font-size:12px;color:#666">' + m.from + '</div><div>' + esc(m.text) + '</div>' +
        '<div style="font-size:11px;color:#999;margin-top:4px">' + (m.date ? new Date(m.date).toLocaleString() : '') + '</div></div>';
    }).join('') || '<p style="text-align:center;color:#999">No messages yet. Say hello!</p>';
    el.scrollTop = el.scrollHeight;
  } catch(e) { el.innerHTML = '<p style="text-align:center;color:#999">Chat unavailable</p>'; }
}

async function sendChatMessage() {
  var input = document.getElementById('chatInput');
  var text = input.value.trim();
  if (!text) return;
  var user = getCurrentUser();
  if (!user) { alert('Please login first'); location.href = 'login.html'; return; }
  input.value = '';
  try {
    await fetch(API + '/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: user.email, to: window.currentChatWith || 'fahdm19573@gmail.com', text: text })
    });
    loadMessages(window.currentChatWith);
  } catch(e) { alert('Failed to send'); }
}

// ===== Categories =====
function renderCategories() {
  loadProducts().then(function(products) {
    var catSet = {};
    products.forEach(function(p) { if(p.category) catSet[p.category]=1; });
    var cats = Object.keys(catSet);
    var container = document.getElementById('categories');
    if (!container) return;
    container.innerHTML = cats.map(function(c) {
      var count = products.filter(function(p) { return p.category === c; }).length;
      return '<div class="card" style="text-align:center;cursor:pointer" onclick="location.href=\'products.html?cat=' + encodeURIComponent(c) + '\'"><h3>' + esc(c) + '</h3><p style="color:#666">' + count + ' products</p></div>';
    }).join('') || '<p>No categories found.</p>';
  });
}

// ===== Contact =====
function sendContact() {
  var name = document.getElementById('cname').value.trim();
  var email = document.getElementById('cemail').value.trim();
  var text = document.getElementById('ctext').value.trim();
  var msg = document.getElementById('cmsg');
  if (!name || !email || !text) { msg.textContent = 'Fill all fields'; msg.style.color = 'red'; return; }
  fetch(API + '/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: email, to: 'fahdm19573@gmail.com', text: '[' + name + '] ' + text })
  }).then(function() {
    msg.textContent = 'Message sent!'; msg.style.color = 'green';
  }).catch(function() { msg.textContent = 'Sent locally'; msg.style.color = 'green'; });
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', function() {
  updateCartCount();
  var params = new URLSearchParams(location.search);
  var cat = params.get('cat');
  if (cat && document.getElementById('search')) document.getElementById('search').value = cat;
});
