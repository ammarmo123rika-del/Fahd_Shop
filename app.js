// ===== Fahd Shop - Premium Client App (Better than Amazon) =====
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

function renderStars(rating) {
  var stars = '';
  var r = Math.round(rating || 0);
  for (var i = 0; i < r; i++) stars += '\u2605';
  for (var j = r; j < 5; j++) stars += '\u2606';
  return stars;
}

// ===== Wishlist (Amazon doesn't have this!) =====
function getWishlist() { return JSON.parse(localStorage.getItem('fahd_wishlist') || '[]'); }
function toggleWishlist(id, e) {
  if (e) e.stopPropagation();
  var wl = getWishlist();
  var idx = wl.indexOf(id);
  if (idx >= 0) wl.splice(idx, 1); else wl.push(id);
  localStorage.setItem('fahd_wishlist', JSON.stringify(wl));
  // Update all heart icons for this product
  document.querySelectorAll('.heart-btn[data-id="' + id + '"]').forEach(function(btn) {
    btn.innerHTML = idx >= 0 ? '\u2661' : '\u2665';
    btn.classList.toggle('active', idx < 0);
  });
}
function isWishlisted(id) { return getWishlist().indexOf(id) >= 0; }

// ===== Recently Viewed (localStorage) =====
function addRecentlyViewed(id) {
  var rv = JSON.parse(localStorage.getItem('fahd_recently') || '[]');
  rv = rv.filter(function(x) { return x !== id; });
  rv.unshift(id);
  if (rv.length > 12) rv = rv.slice(0, 12);
  localStorage.setItem('fahd_recently', JSON.stringify(rv));
}
function renderRecentlyViewed(containerId, limit) {
  var el = document.getElementById(containerId);
  if (!el) return;
  var ids = JSON.parse(localStorage.getItem('fahd_recently') || '[]');
  if (!ids.length) { el.parentElement && (el.parentElement.style.display = 'none'); return; }
  loadProducts().then(function(products) {
    var items = ids.slice(0, limit || 6).map(function(id) { return products.find(function(p) { return p.id === id; }); }).filter(Boolean);
    if (!items.length) { el.parentElement && (el.parentElement.style.display = 'none'); return; }
    el.innerHTML = items.map(buildProductCard).join('');
  });
}

// ===== Product Card Builder (shared) =====
function buildProductCard(p) {
  var wishIcon = isWishlisted(p.id) ? '\u2665' : '\u2661';
  var wishActive = isWishlisted(p.id) ? ' active' : '';
  return '<div class="product-card" onclick="goToProduct(' + p.id + ')" onmouseenter="showQuickView(' + p.id + ')" onmouseleave="hideQuickView()">' +
    '<div class="img-wrap">' +
    '<button class="heart-btn' + wishActive + '" data-id="' + p.id + '" onclick="toggleWishlist(' + p.id + ',event)" title="Add to wishlist">' + wishIcon + '</button>' +
    imgTag(p.image, p.name, 160) +
    (p.onSale ? '<div class="sale-ribbon">-' + p.salePercent + '%</div>' : '') +
    '</div>' +
    '<div class="info">' +
    '<div class="title">' + esc(p.name) + '</div>' +
    '<div class="category">' + esc(p.category || '') + '</div>' +
    '<div class="stars"><span class="star-color">' + renderStars(p.rating) + '</span><span class="count">(' + (p.reviews || 0) + ')</span></div>' +
    '<div class="price">' +
    '<span class="current">$' + p.price + '</span>' +
    (p.oldPrice ? ' <span class="old">$' + p.oldPrice + '</span>' : '') +
    (p.onSale ? ' <span class="badge">-' + p.salePercent + '%</span>' : '') +
    '</div>' +
    (p.prime ? '<div class="prime">\u2713 Prime</div>' : '') +
    '<button class="btn-cart" onclick="event.stopPropagation();addToCart(' + p.id + ')">Add to Cart</button>' +
    '</div></div>';
}

function goToProduct(id) {
  addRecentlyViewed(id);
  location.href = 'product.html?id=' + id;
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
    container.innerHTML = filtered.map(buildProductCard).join('');
  });
}

// ===== Quick View Modal (Amazon doesn't have this!) =====
var quickViewTimer = null;
function showQuickView(id) {
  clearTimeout(quickViewTimer);
  quickViewTimer = setTimeout(function() {
    loadProducts().then(function(products) {
      var p = products.find(function(x) { return x.id === id; });
      if (!p) return;
      var modal = document.getElementById('quickViewModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'quickViewModal';
        modal.className = 'qv-overlay';
        modal.onclick = function(e) { if (e.target === modal) hideQuickView(); };
        document.body.appendChild(modal);
      }
      modal.innerHTML = '<div class="qv-panel">' +
        '<button class="qv-close" onclick="hideQuickView()">&times;</button>' +
        '<div class="qv-grid">' +
        '<div class="qv-img">' + imgTag(p.image, p.name, 300) + '</div>' +
        '<div class="qv-info">' +
        '<h2>' + esc(p.name) + '</h2>' +
        '<div class="stars" style="margin:8px 0"><span class="star-color">' + renderStars(p.rating) + '</span> <span class="count">(' + (p.reviews||0) + ' reviews)</span></div>' +
        '<div class="price" style="margin:12px 0"><span class="current" style="font-size:24px">$' + p.price + '</span>' + (p.oldPrice ? ' <span class="old" style="font-size:14px">$' + p.oldPrice + '</span>' : '') + (p.onSale ? ' <span class="badge">-' + p.salePercent + '%</span>' : '') + '</div>' +
        (p.prime ? '<div class="prime" style="font-size:14px">\u2713 Prime - FREE Delivery</div>' : '') +
        '<p style="color:#565959;margin:12px 0;font-size:14px;line-height:1.6">' + esc(p.desc || p.description || 'High quality product at the best price.') + '</p>' +
        '<div style="display:flex;gap:10px;margin-top:16px">' +
        '<button class="btn-cart" style="flex:1;padding:12px" onclick="addToCart(' + p.id + ');hideQuickView()">Add to Cart</button>' +
        '<button class="btn btn-sm" onclick="goToProduct(' + p.id + ')">View Details</button>' +
        '</div>' +
        '</div></div></div>';
      modal.style.display = 'flex';
    });
  }, 400);
}
function hideQuickView() {
  clearTimeout(quickViewTimer);
  var m = document.getElementById('quickViewModal');
  if (m) m.style.display = 'none';
}

// ===== Countdown Timer (Amazon doesn't have this!) =====
function startCountdown(elementId, endDate) {
  var el = document.getElementById(elementId);
  if (!el) return;
  function update() {
    var now = new Date().getTime();
    var end = new Date(endDate).getTime();
    var diff = end - now;
    if (diff <= 0) { el.innerHTML = '<span class="cd-expired">Deal ended!</span>'; return; }
    var d = Math.floor(diff / 86400000);
    var h = Math.floor((diff % 86400000) / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    el.innerHTML =
      '<div class="cd-unit"><span class="cd-num">' + d + '</span><span class="cd-label">Days</span></div>' +
      '<div class="cd-sep">:</div>' +
      '<div class="cd-unit"><span class="cd-num">' + h + '</span><span class="cd-label">Hours</span></div>' +
      '<div class="cd-sep">:</div>' +
      '<div class="cd-unit"><span class="cd-num">' + m + '</span><span class="cd-label">Min</span></div>' +
      '<div class="cd-sep">:</div>' +
      '<div class="cd-unit"><span class="cd-num">' + s + '</span><span class="cd-label">Sec</span></div>';
  }
  update();
  setInterval(update, 1000);
}

// ===== Live Autocomplete Search =====
function setupAutocomplete() {
  var input = document.getElementById('searchInput');
  if (!input) return;
  var dd = document.getElementById('searchDropdown');
  if (!dd) {
    dd = document.createElement('div');
    dd.id = 'searchDropdown';
    dd.className = 'search-dropdown';
    input.parentElement.appendChild(dd);
  }
  input.addEventListener('input', function() {
    var q = this.value.toLowerCase().trim();
    if (q.length < 2) { dd.style.display = 'none'; return; }
    loadProducts().then(function(products) {
      var matches = products.filter(function(p) {
        return p.name.toLowerCase().includes(q) || (p.category||'').toLowerCase().includes(q);
      }).slice(0, 8);
      if (!matches.length) { dd.style.display = 'none'; return; }
      dd.innerHTML = matches.map(function(p) {
        return '<div class="search-item" onclick="location.href=\'product.html?id=' + p.id + '\'">' +
          '<img src="' + (p.image || '') + '" style="width:36px;height:36px;object-fit:cover;border-radius:4px" onerror="this.style.display=\'none\'">' +
          '<div><div style="font-size:13px;font-weight:600">' + esc(p.name) + '</div>' +
          '<div style="font-size:12px;color:#565959">$' + p.price + ' · ' + esc(p.category||'') + '</div></div></div>';
      }).join('');
      dd.style.display = 'block';
    });
  });
  input.addEventListener('blur', function() { setTimeout(function() { dd.style.display = 'none'; }, 200); });
  input.addEventListener('focus', function() { if (dd.innerHTML) dd.style.display = 'block'; });
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
    showCartToast(product.name);
  });
}

function showCartToast(name) {
  var toast = document.getElementById('cartToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cartToast';
    toast.className = 'cart-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = '\u2713 <b>' + esc(name) + '</b> added to cart';
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 2500);
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
  if (!cart.length) { container.innerHTML = '<div class="empty"><div class="icon">\uD83D\uDED2</div><h2>Your cart is empty</h2><p>Add items to start shopping!</p><a href="products.html" class="btn" style="margin-top:16px">Browse Products</a></div>'; return; }
  var total = cart.reduce(function(s, c) { return s + c.price * c.qty; }, 0);
  var savings = cart.reduce(function(s, c) { return s + (c.oldPrice ? (c.oldPrice - c.price) * c.qty : 0); }, 0);
  container.innerHTML = '<div class="cart-layout"><div class="cart-items">' +
    cart.map(function(c) {
      return '<div class="cart-row">' +
        '<div class="cart-img">' + imgTag(c.image, c.name, 100) + '</div>' +
        '<div class="cart-detail"><b>' + esc(c.name) + '</b>' +
        '<div class="cart-price">$' + c.price.toFixed(2) + '</div>' +
        '<div class="cart-qty"><button onclick="changeQty(' + c.id + ',-1)">-</button><span>' + c.qty + '</span><button onclick="changeQty(' + c.id + ',1)">+</button></div>' +
        '<button class="cart-remove" onclick="removeFromCart(' + c.id + ')">Remove</button>' +
        '</div><div class="cart-subtotal">$' + (c.price * c.qty).toFixed(2) + '</div></div>';
    }).join('') + '</div>' +
    '<div class="cart-summary">' +
    '<div class="card"><h3>Order Summary</h3>' +
    '<div class="summary-row"><span>Subtotal (' + cart.reduce(function(s,c){return s+c.qty},0) + ' items)</span><span>$' + total.toFixed(2) + '</span></div>' +
    (savings > 0 ? '<div class="summary-row savings"><span>You save</span><span>-$' + savings.toFixed(2) + '</span></div>' : '') +
    '<div class="summary-row"><span>Shipping</span><span style="color:#067d62">FREE</span></div>' +
    '<div class="summary-total"><span>Total</span><span>$' + total.toFixed(2) + '</span></div>' +
    '<button class="btn btn-block" onclick="checkout()" style="margin-top:12px">Proceed to Checkout</button>' +
    '<p style="font-size:12px;color:#565959;margin-top:8px;text-align:center">\uD83D\uDD12 Secure checkout guaranteed</p>' +
    '</div></div></div>';
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
  if (!local.length) { el.innerHTML = '<div class="empty"><div class="icon">\uD83D\uDCCB</div><h2>No orders yet</h2><p>Start shopping to see your orders here!</p></div>'; return; }
  el.innerHTML = local.map(function(o, i) {
    return '<div class="card order-card"><div class="order-header"><b>Order #' + (i+1) + '</b><span class="order-date">' + o.date + '</span></div><p style="color:#565959">' +
      o.items.map(function(x) { return esc(x.name) + ' x ' + x.qty; }).join(', ') +
      '</p><div class="order-footer"><b style="color:#b12704;font-size:18px">$' + (o.total||0).toFixed(2) + '</b><span class="order-status">Delivered</span></div></div>';
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
          '<div><b>' + esc(o.user||'Unknown') + '</b> <span style="color:#565959">' + (o.date ? new Date(o.date).toLocaleDateString() : '') + '</span></div>' +
          '<div><b>$' + (o.total||0).toFixed(2) + '</b> <span style="padding:2px 8px;border-radius:6px;font-size:12px;background:' +
          (o.status==='Delivered'?'#d1fae5':'#fef3c7') + '">' + (o.status||'Pending') + '</span></div></div>';
      }).join('') : '<p style="color:#565959">No orders yet.</p>';
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
    }).join('') || '<p style="padding:10px;color:#565959">No conversations</p>';
  } catch(e) { el.innerHTML = '<p style="padding:10px;color:#565959">Chat offline</p>'; }
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
        '<div style="font-size:12px;color:#565959">' + m.from + '</div><div>' + esc(m.text) + '</div>' +
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
    var icons = {Electronics:'\uD83D\uDCF1',Books:'\uD83D\uDCD6',Fashion:'\uD83E\uDD7E',Home:'\uD83C\uDFE0',Gaming:'\uD83C\uDFAE',Toys:'\uD83E\uDDF8',Health:'\uD83D\uDC8A',Sports:'\u26BD',Grocery:'\uD83D\uDED2'};
    var container = document.getElementById('categories');
    if (!container) return;
    container.innerHTML = cats.map(function(c) {
      var count = products.filter(function(p) { return p.category === c; }).length;
      return '<div class="cat-card" style="text-align:center;cursor:pointer" onclick="location.href=\'products.html?cat=' + encodeURIComponent(c) + '\'"><div class="icon" style="font-size:48px">' + (icons[c]||'\uD83D\uDCE6') + '</div><h3>' + esc(c) + '</h3><p style="color:#565959">' + count + ' products</p></div>';
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
  setupAutocomplete();
  var params = new URLSearchParams(location.search);
  var cat = params.get('cat');
  if (cat && document.getElementById('search')) document.getElementById('search').value = cat;
});
