// ===== FAHD SHOP - Amazon-style App with Backend API =====

const API = '';

// --- Host credentials ---
const HOST_EMAIL = "fahdm19573@gmail.com";
const HOST_PASSWORD = "fahd19573";

// ===== API HELPERS =====
async function apiGet(url) {
  const res = await fetch(API + url);
  return res.json();
}
async function apiPost(url, body) {
  const res = await fetch(API + url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  });
  return res.json();
}
async function apiPut(url, body) {
  const res = await fetch(API + url, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  });
  return res.json();
}
async function apiDelete(url) {
  const res = await fetch(API + url, { method: 'DELETE' });
  return res.json();
}

// ===== AUTH =====
function getCurrentUser() {
  try { return JSON.parse(sessionStorage.getItem('user')); } catch { return null; }
}
function isLoggedIn() { return !!getCurrentUser(); }
function isHost() {
  const u = getCurrentUser();
  return u && u.email === HOST_EMAIL;
}

function login() {
  const email = document.getElementById('email').value.trim();
  const pw = document.getElementById('password').value;
  const msg = document.getElementById('msg');
  if (!email || !pw) { showMsg(msg, 'Please fill in all fields', 'error'); return; }
  if (email === HOST_EMAIL && pw === HOST_PASSWORD) {
    const user = { email, name: 'Fahd (Host)', role: 'host' };
    sessionStorage.setItem('user', JSON.stringify(user));
    showMsg(msg, 'Welcome back, Fahd! Redirecting...', 'success');
    setTimeout(() => location.href = 'admin.html', 1000);
  } else if (email && pw.length >= 4) {
    const user = { email, name: email.split('@')[0], role: 'customer' };
    sessionStorage.setItem('user', JSON.stringify(user));
    showMsg(msg, 'Welcome! Redirecting...', 'success');
    setTimeout(() => location.href = 'index.html', 1000);
  } else {
    showMsg(msg, 'Invalid credentials. Demo: fahdm19573@gmail.com / fahd19573', 'error');
  }
}

function signup() {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const pw = document.getElementById('password').value;
  const msg = document.getElementById('msg');
  if (!name || !email || !pw) { showMsg(msg, 'Please fill in all fields', 'error'); return; }
  if (pw.length < 4) { showMsg(msg, 'Password must be at least 4 characters', 'error'); return; }
  const user = { email, name, role: 'customer' };
  sessionStorage.setItem('user', JSON.stringify(user));
  showMsg(msg, 'Account created! Redirecting...', 'success');
  setTimeout(() => location.href = 'index.html', 1000);
}

function logout() {
  sessionStorage.removeItem('user');
  location.href = 'index.html';
}

function showMsg(el, text, type) {
  if (!el) return;
  el.className = 'msg msg-' + type;
  el.textContent = text;
}

// ===== PRODUCTS =====
async function renderProducts(containerId, limit) {
  const c = document.getElementById(containerId);
  if (!c) return;
  const search = document.getElementById('search');
  const q = search ? search.value.toLowerCase() : '';
  const catFilter = document.getElementById('catFilter');
  const cat = catFilter ? catFilter.value : '';
  const sort = document.getElementById('sortFilter');
  const sortBy = sort ? sort.value : '';

  let products = await apiGet('/api/products');
  if (q) products = products.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  if (cat) products = products.filter(p => p.category === cat);
  if (sortBy === 'price-low') products.sort((a, b) => a.price - b.price);
  if (sortBy === 'price-high') products.sort((a, b) => b.price - a.price);
  if (sortBy === 'rating') products.sort((a, b) => b.rating - a.rating);
  if (sortBy === 'name') products.sort((a, b) => a.name.localeCompare(b.name));
  if (sortBy === 'sale') products = products.filter(p => p.onSale);
  if (limit) products = products.slice(0, limit);

  if (!products.length) { c.innerHTML = '<div class="empty"><div class="icon">📦</div><p>No products found</p></div>'; return; }
  c.innerHTML = products.map(p => `
    <div class="card">
      <a href="product.html?id=${p.id}" class="card-img">
        <span class="placeholder">${p.image}</span>
        ${p.onSale ? '<span class="sale-badge">🔥 -' + p.salePercent + '%</span>' : ''}
      </a>
      <div class="card-body">
        <a href="product.html?id=${p.id}" class="title">${p.name}</a>
        <div class="rating">${'★'.repeat(Math.floor(p.rating))} <span style="color:#888">${p.rating} (${p.reviews.toLocaleString()})</span></div>
        <div class="price">
          $${p.price.toLocaleString()}
          ${p.oldPrice && p.oldPrice > p.price ? '<span class="old">$' + p.oldPrice.toLocaleString() + '</span>' : ''}
        </div>
        ${p.prime ? '<div class="prime">✓ prime FREE Delivery</div>' : ''}
        <div class="card-actions">
          <button class="btn" onclick="addToCart(${p.id})">🛒 Add to Cart</button>
          <button class="btn-sm btn-outline" onclick="addToWishlist(${p.id})">♡</button>
        </div>
      </div>
    </div>
  `).join('');
}

async function renderProductDetail() {
  const c = document.getElementById('productDetail');
  if (!c) return;
  const id = parseInt(new URLSearchParams(location.search).get('id'));
  const p = await apiGet('/api/products/' + id);
  if (!p || p.error) { c.innerHTML = '<div class="empty"><div class="icon">❓</div><p>Product not found</p></div>'; return; }
  document.title = p.name + ' - Fahd Shop';
  const savings = p.oldPrice && p.oldPrice > p.price ? p.oldPrice - p.price : 0;
  c.innerHTML = `
    <div style="display:flex;gap:40px;flex-wrap:wrap">
      <div style="flex:1;min-width:300px;background:linear-gradient(135deg,#f8f9ff,#f0f2ff);border-radius:20px;padding:50px;text-align:center;display:flex;align-items:center;justify-content:center;min-height:380px;position:relative;box-shadow:0 10px 40px rgba(0,0,0,0.06)">
        ${p.onSale ? '<span class="sale-badge" style="position:absolute;top:16px;left:16px">🔥 -' + p.salePercent + '% OFF</span>' : ''}
        <span style="font-size:140px">${p.image}</span>
      </div>
      <div style="flex:1;min-width:300px">
        <h1 style="font-size:28px;margin-bottom:12px;line-height:1.3">${p.name}</h1>
        <div class="rating" style="margin:8px 0;font-size:15px">${'★'.repeat(Math.floor(p.rating))} <span style="color:#888">${p.rating} · ${p.reviews.toLocaleString()} reviews</span></div>
        <div style="background:linear-gradient(135deg,#f8f9ff,#f0f2ff);border-radius:16px;padding:20px;margin:16px 0;border:1px solid rgba(102,126,234,0.1)">
          ${p.oldPrice && p.oldPrice > p.price ? '<span style="color:#888;text-decoration:line-through;margin-right:8px;font-size:16px">$' + p.oldPrice.toLocaleString() + '</span>' : ''}
          <span style="font-size:32px;font-weight:900;background:linear-gradient(135deg,#f5576c,#ff6b6b);-webkit-background-clip:text;-webkit-text-fill-color:transparent">$${p.price.toLocaleString()}</span>
          ${savings > 0 ? '<div style="color:#007600;margin-top:8px;font-weight:600">🎉 You save: $' + savings.toLocaleString() + ' (' + p.salePercent + '% off)</div>' : ''}
        </div>
        ${p.prime ? '<div class="prime" style="margin:8px 0">✓ prime FREE Delivery</div>' : ''}
        <p style="color:#555;margin:16px 0;line-height:1.7">${p.desc || ''}</p>
        <div style="display:flex;gap:12px;margin:8px 0;font-size:14px">
          <span>📂 <b>${p.category}</b></span>
          <span style="color:${p.stock > 0 ? '#007600' : '#b12704'}; font-weight:600">${p.stock > 0 ? '✅ In Stock (' + p.stock + ' available)' : '❌ Out of Stock'}</span>
        </div>
        <div style="display:flex;gap:14px;margin-top:24px">
          <button class="btn" onclick="addToCart(${p.id})" style="flex:1;padding:16px;font-size:16px">🛒 Add to Cart</button>
          <button class="btn-blue btn" onclick="buyNow(${p.id})" style="flex:1;padding:16px;font-size:16px;background:linear-gradient(135deg,#f0c14b,#f5a623);box-shadow:0 8px 25px rgba(245,166,35,0.3)">⚡ Buy Now</button>
        </div>
        <button class="btn-sm btn-outline" onclick="addToWishlist(${p.id})" style="margin-top:14px;padding:10px 18px">♡ Add to Wishlist</button>
      </div>
    </div>
  `;
}

// ===== CART =====
function getCart() { return JSON.parse(localStorage.getItem('cart') || '[]'); }
function saveCart(c) { localStorage.setItem('cart', JSON.stringify(c)); updateCartCount(); }

async function addToCart(id) {
  let cart = getCart();
  const item = cart.find(c => c.id === id);
  if (item) { item.qty++; } else { cart.push({ id, qty: 1 }); }
  saveCart(cart);
  toast('Added to cart! 🛒');
}

function removeFromCart(id) {
  let cart = getCart().filter(c => c.id !== id);
  saveCart(cart);
  renderCart();
}

function updateQty(id, delta) {
  let cart = getCart();
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty < 1) cart = cart.filter(c => c.id !== id);
  saveCart(cart);
  renderCart();
}

function updateCartCount() {
  const el = document.getElementById('cartCount');
  if (!el) return;
  const count = getCart().reduce((s, c) => s + c.qty, 0);
  el.textContent = count;
  el.style.display = count ? 'flex' : 'none';
}

async function renderCart() {
  const c = document.getElementById('cart');
  const totalEl = document.getElementById('cartTotal');
  if (!c) return;
  const cart = getCart();
  const products = await apiGet('/api/products');
  if (!cart.length) {
    c.innerHTML = '<div class="empty"><div class="icon">🛒</div><p>Your cart is empty</p><a href="products.html" class="btn" style="margin-top:20px;display:inline-block">🛍️ Continue Shopping</a></div>';
    if (totalEl) totalEl.innerHTML = '';
    return;
  }
  let total = 0;
  c.innerHTML = cart.map(ci => {
    const p = products.find(x => x.id === ci.id);
    if (!p) return '';
    const sub = p.price * ci.qty;
    total += sub;
    return `<div class="cart-item">
      <a href="product.html?id=${p.id}" class="cart-img"><span style="font-size:50px">${p.image}</span></a>
      <div class="cart-info">
        <div class="title"><a href="product.html?id=${p.id}">${p.name}</a></div>
        <div class="price">$${p.price.toLocaleString()}${p.onSale ? ' <span style="color:#007600;font-size:12px">🔥 SALE -'+p.salePercent+'%</span>' : ''}</div>
        ${p.prime ? '<div class="prime">✓ prime</div>' : ''}
        <div class="qty-control">
          <button onclick="updateQty(${p.id},-1)">−</button>
          <span>${ci.qty}</span>
          <button onclick="updateQty(${p.id},1)">+</button>
          <button class="btn-sm btn-outline" onclick="removeFromCart(${p.id})" style="margin-left:16px;color:#b12704">🗑️ Remove</button>
        </div>
      </div>
      <div style="text-align:right;min-width:100px">
        <div style="font-size:20px;font-weight:800;background:linear-gradient(135deg,#f5576c,#ff6b6b);-webkit-background-clip:text;-webkit-text-fill-color:transparent">$${sub.toLocaleString()}</div>
      </div>
    </div>`;
  }).join('');
  if (totalEl) {
    totalEl.innerHTML = `
      <h2 style="margin-bottom:16px;font-size:20px">Order Summary</h2>
      <p style="color:#666;margin-bottom:8px">Subtotal (${cart.reduce((s, c) => s + c.qty, 0)} items):</p>
      <div class="total">$${total.toLocaleString()}</div>
      <button class="btn-amazon btn-block" style="margin-top:20px;font-size:16px;padding:16px" onclick="checkout()">💳 Proceed to Checkout</button>
      <a href="products.html" style="display:block;margin-top:16px;font-size:14px;text-align:center">← Continue Shopping</a>
    `;
  }
}

async function checkout() {
  let cart = getCart();
  if (!cart.length) { alert('Cart is empty!'); return; }
  const user = getCurrentUser();
  if (!user) { location.href = 'login.html'; return; }
  const products = await apiGet('/api/products');
  const items = cart.map(ci => {
    const p = products.find(x => x.id === ci.id);
    return p ? { name: p.name, price: p.price, qty: ci.qty, image: p.image } : null;
  }).filter(Boolean);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  await apiPost('/api/orders', { user: user.email, items, total });
  localStorage.removeItem('cart');
  toast('Order placed successfully! 🎉');
  updateCartCount();
  setTimeout(() => location.href = 'orders.html', 1000);
}

function buyNow(id) {
  addToCart(id);
  checkout();
}

// ===== WISHLIST =====
function getWishlist() { return JSON.parse(localStorage.getItem('wishlist') || '[]'); }
function addToWishlist(id) {
  let wl = getWishlist();
  if (wl.includes(id)) { toast('Already in wishlist ♡'); return; }
  wl.push(id);
  localStorage.setItem('wishlist', JSON.stringify(wl));
  toast('Added to wishlist! ❤️');
}

async function renderWishlist() {
  const c = document.getElementById('wishlist');
  if (!c) return;
  const wl = getWishlist();
  const products = await apiGet('/api/products');
  const items = products.filter(p => wl.includes(p.id));
  if (!items.length) { c.innerHTML = '<div class="empty"><div class="icon">❤️</div><p>Your wishlist is empty</p></div>'; return; }
  c.innerHTML = items.map(p => `
    <div class="cart-item">
      <a href="product.html?id=${p.id}" class="cart-img"><span style="font-size:50px">${p.image}</span></a>
      <div class="cart-info">
        <div class="title"><a href="product.html?id=${p.id}">${p.name}</a></div>
        <div class="price">$${p.price.toLocaleString()}</div>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn" onclick="addToCart(${p.id})">🛒 Add to Cart</button>
        <button class="btn-sm btn-outline btn-red" onclick="removeFromWishlist(${p.id})">✕</button>
      </div>
    </div>
  `).join('');
}

function removeFromWishlist(id) {
  localStorage.setItem('wishlist', JSON.stringify(getWishlist().filter(x => x !== id)));
  renderWishlist();
}

// ===== ORDERS =====
async function renderOrders() {
  const c = document.getElementById('orders');
  if (!c) return;
  let orders = await apiGet('/api/orders');
  const user = getCurrentUser();
  if (user && user.role !== 'host') orders = orders.filter(o => o.user === user.email);
  if (!orders.length) { c.innerHTML = '<div class="empty"><div class="icon">📦</div><p>No orders yet</p></div>'; return; }
  c.innerHTML = orders.map(o => `
    <div class="card" style="margin-bottom:16px;padding:24px">
      <div class="flex-between" style="margin-bottom:12px">
        <b style="font-size:16px">Order #${o.id}</b>
        <span class="badge ${o.status === 'Delivered' ? 'badge-green' : o.status === 'Shipped' ? 'badge-yellow' : 'badge-red'}">${o.status || 'Pending'}</span>
      </div>
      <p style="color:#888;font-size:13px">${new Date(o.date).toLocaleString()}</p>
      <p style="margin:10px 0">${o.items.map(it => it.image + ' ' + it.name + ' × ' + it.qty).join(', ')}</p>
      <p style="font-weight:800;font-size:18px;background:linear-gradient(135deg,#f5576c,#ff6b6b);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Total: $${(o.total || 0).toLocaleString()}</p>
    </div>
  `).join('');
}

// ===== ADMIN =====
async function renderAdmin() {
  const user = getCurrentUser();
  if (!user || user.role !== 'host') {
    document.querySelector('main').innerHTML = '<div class="empty"><div class="icon">🔒</div><h2>Access Denied</h2><p>Please login as host (fahdm19573@gmail.com)</p><a href="login.html" class="btn mt-20">🔑 Go to Login</a></div>';
    return;
  }
  const [products, orders] = await Promise.all([apiGet('/api/products'), apiGet('/api/orders')]);
  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const onSale = products.filter(p => p.onSale).length;
  document.getElementById('statProducts').textContent = products.length;
  document.getElementById('statOrders').textContent = orders.length;
  document.getElementById('statRevenue').textContent = '$' + totalRevenue.toLocaleString();
  document.getElementById('statCustomers').textContent = new Set(orders.map(o => o.user)).size;
  document.getElementById('statSales').textContent = onSale;
  renderAdminProducts();
  renderAdminOrders();
}

async function renderAdminProducts() {
  const c = document.getElementById('adminProducts');
  if (!c) return;
  const products = await apiGet('/api/products');
  c.innerHTML = products.map(p => `
    <tr>
      <td>${p.image} ${p.name} ${p.onSale ? '<span class="badge badge-red" style="margin-left:6px">🔥 -'+p.salePercent+'%</span>' : ''}</td>
      <td><span style="font-weight:700">$${p.price}</span>${p.oldPrice && p.oldPrice > p.price ? ' <span style="text-decoration:line-through;color:#aaa;font-size:12px">$'+p.oldPrice+'</span>' : ''}</td>
      <td>${p.stock}</td>
      <td>${p.category}</td>
      <td style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn-sm btn-blue" onclick="openPriceModal(${p.id},'${p.name.replace(/'/g,"\\'")}',${p.price},${p.oldPrice||p.price})">💰 Price</button>
        <button class="btn-sm" onclick="openSaleModal(${p.id},'${p.name.replace(/'/g,"\\'")}',${p.salePercent||0})">🏷️ Sale</button>
        <button class="btn-sm btn-red" onclick="deleteProduct(${p.id})">🗑️</button>
      </td>
    </tr>
  `).join('');
}

async function renderAdminOrders() {
  const c = document.getElementById('adminOrders');
  if (!c) return;
  const orders = await apiGet('/api/orders');
  if (!orders.length) { c.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;padding:24px">No orders yet</td></tr>'; return; }
  c.innerHTML = orders.reverse().map(o => `
    <tr>
      <td>#${o.id}</td>
      <td>${o.user || 'Guest'}</td>
      <td style="font-weight:700">$${(o.total || 0).toLocaleString()}</td>
      <td>${o.items.length} item(s)</td>
      <td><select onchange="updateOrderStatus(${o.id},this.value)" style="padding:6px 10px;border-radius:8px;border:2px solid #e8e8e8;font-size:13px;cursor:pointer">
        <option ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
        <option ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
        <option ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
      </select></td>
    </tr>
  `).join('');
}

async function updateOrderStatus(id, status) {
  await apiPut('/api/orders/' + id + '/status', { status });
  renderAdminOrders();
}

async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  await apiDelete('/api/products/' + id);
  renderAdminProducts();
  const statEl = document.getElementById('statProducts');
  if (statEl) statEl.textContent = parseInt(statEl.textContent) - 1;
  toast('Product deleted');
}

// ===== PRICE MODAL =====
function openPriceModal(id, name, price, oldPrice) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  modal.innerHTML = `
    <div class="modal-card">
      <h2>💰 Change Price</h2>
      <p style="color:#666;margin-bottom:16px">${name}</p>
      <label>New Price ($)</label>
      <input type="number" id="newPrice" value="${price}" step="0.01" min="0">
      <label>Original Price ($)</label>
      <input type="number" id="origPrice" value="${oldPrice}" step="0.01" min="0">
      <div style="display:flex;gap:10px;margin-top:16px">
        <button class="btn-amazon" style="flex:1" onclick="savePrice(${id})">💾 Save Price</button>
        <button class="btn btn-outline" style="flex:1" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function savePrice(id) {
  const price = parseFloat(document.getElementById('newPrice').value);
  const oldPrice = parseFloat(document.getElementById('origPrice').value);
  await apiPut('/api/products/' + id + '/price', { price, oldPrice });
  document.querySelector('.modal-overlay').remove();
  renderAdminProducts();
  toast('Price updated! 💰');
}

// ===== SALE MODAL =====
function openSaleModal(id, name, currentSale) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  modal.innerHTML = `
    <div class="modal-card">
      <h2>🏷️ Create Sale</h2>
      <p style="color:#666;margin-bottom:16px">${name}</p>
      <label>Sale Discount (%)</label>
      <input type="number" id="salePercent" value="${currentSale || 0}" min="0" max="90" step="5">
      <p style="font-size:13px;color:#888;margin-bottom:16px">Set to 0 to remove the sale</p>
      <div style="display:flex;gap:10px">
        <button class="btn-amazon" style="flex:1" onclick="applySale(${id})">🔥 Apply Sale</button>
        <button class="btn btn-outline" style="flex:1" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function applySale(id) {
  const salePercent = parseInt(document.getElementById('salePercent').value);
  await apiPost('/api/products/' + id + '/sale', { salePercent });
  document.querySelector('.modal-overlay').remove();
  renderAdminProducts();
  toast(salePercent > 0 ? 'Sale applied! 🔥 -' + salePercent + '%' : 'Sale removed');
}

// ===== ADD PRODUCT =====
async function addProduct() {
  const name = document.getElementById('pName').value.trim();
  const price = parseFloat(document.getElementById('pPrice').value);
  const oldPrice = parseFloat(document.getElementById('pOldPrice').value) || price;
  const image = document.getElementById('pImage').value.trim() || '📦';
  const category = document.getElementById('pCategory').value;
  const stock = parseInt(document.getElementById('pStock').value) || 0;
  const desc = document.getElementById('pDesc').value.trim();
  const msg = document.getElementById('msg');
  if (!name || !price) { showMsg(msg, 'Name and price are required', 'error'); return; }
  await apiPost('/api/products', { name, price, oldPrice, image, category, stock, desc, rating: 4.5, reviews: 0, prime: true });
  showMsg(msg, 'Product added successfully! ✓', 'success');
  document.getElementById('addProductForm').reset();
}

// ===== CHAT SYSTEM =====
let chatPollInterval = null;

async function renderChat() {
  const user = getCurrentUser();
  if (!user) { location.href = 'login.html'; return; }

  const isHostUser = user.role === 'host';
  const chatWith = isHostUser ? null : HOST_EMAIL; // customers chat with host

  if (isHostUser) {
    renderHostChat();
  } else {
    renderCustomerChat(user);
  }
}

async function renderHostChat() {
  const users = await apiGet('/api/customers');
  const msgList = document.getElementById('chatMessages');
  const userList = document.getElementById('chatUsers');

  if (userList) {
    userList.innerHTML = '<h3 style="margin-bottom:12px">👥 Customers</h3>' +
      (users.length ? users.map(u => `
        <div class="chat-user-item" onclick="openChatWith('${u.email}')" id="chatUser-${u.email.replace(/[^a-zA-Z0-9]/g,'_')}">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px">${u.email.charAt(0).toUpperCase()}</div>
            <div>
              <div style="font-weight:600;font-size:14px">${u.email.split('@')[0]}</div>
              <div style="font-size:12px;color:#888">${u.orderCount} orders · $${u.totalSpent.toLocaleString()}</div>
            </div>
          </div>
        </div>
      `).join('') : '<p style="color:#888;padding:16px">No customers yet</p>');
  }

  window.openChatWith = async function(email) {
    window.currentChatWith = email;
    document.querySelectorAll('.chat-user-item').forEach(el => el.style.background = '');
    const el = document.getElementById('chatUser-' + email.replace(/[^a-zA-Z0-9]/g,'_'));
    if (el) el.style.background = 'linear-gradient(135deg,#f0f2ff,#e8ecff)';
    await loadMessages(email);
  };
}

async function renderCustomerChat(user) {
  window.currentChatWith = HOST_EMAIL;
  await loadMessages(HOST_EMAIL);
}

async function loadMessages(withEmail) {
  const msgList = document.getElementById('chatMessages');
  const user = getCurrentUser();
  if (!msgList || !user) return;

  const msgs = await apiGet('/api/messages?from=' + encodeURIComponent(user.email) + '&to=' + encodeURIComponent(withEmail));

  // Also get messages TO us FROM them
  const msgs2 = await apiGet('/api/messages?from=' + encodeURIComponent(withEmail) + '&to=' + encodeURIComponent(user.email));
  const allMsgs = [...msgs, ...msgs2].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Deduplicate
  const seen = new Set();
  const unique = allMsgs.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });

  if (!unique.length) {
    msgList.innerHTML = '<div class="empty" style="padding:40px"><div class="icon">💬</div><p>No messages yet. Say hello!</p></div>';
  } else {
    msgList.innerHTML = unique.map(m => {
      const isMe = m.from === user.email;
      return `<div class="chat-msg ${isMe ? 'chat-msg-me' : 'chat-msg-them'}">
        <div class="chat-msg-text">${m.text}</div>
        <div class="chat-msg-time">${new Date(m.date).toLocaleTimeString()}</div>
      </div>`;
    }).join('');
    msgList.scrollTop = msgList.scrollHeight;
  }
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const user = getCurrentUser();
  if (!input || !user || !input.value.trim()) return;
  const text = input.value.trim();
  const to = window.currentChatWith || HOST_EMAIL;
  await apiPost('/api/messages', { from: user.email, to, text });
  input.value = '';
  await loadMessages(to);
}

// ===== NAVIGATION =====
function updateNav() {
  const user = getCurrentUser();
  document.querySelectorAll('.loginLink').forEach(el => {
    if (user) {
      el.innerHTML = `<span class="label">Hello, ${user.name}</span><span class="value" style="cursor:pointer">Sign Out</span>`;
      el.href = '#';
      el.onclick = function(e) { e.preventDefault(); logout(); };
    }
  });
  document.querySelectorAll('.hostLink').forEach(el => {
    if (!user || user.role !== 'host') el.style.display = 'none';
  });
}

// ===== CATEGORIES =====
function renderCategories() {
  const c = document.getElementById('categories');
  if (!c) return;
  const cats = [
    {icon:'📱',name:'Electronics'},{icon:'💻',name:'Laptops'},{icon:'📖',name:'Books'},
    {icon:'👟',name:'Fashion'},{icon:'🧹',name:'Home'},{icon:'🎮',name:'Gaming'}
  ];
  c.innerHTML = cats.map(cat => `
    <div class="cat-card" onclick="location.href='products.html?cat=${cat.name}'">
      <div class="icon">${cat.icon}</div>
      <div class="name">${cat.name}</div>
    </div>
  `).join('');
}

// ===== TOAST =====
function toast(text) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  updateNav();
  updateCartCount();
  const catParam = new URLSearchParams(location.search).get('cat');
  if (catParam) {
    const sel = document.getElementById('catFilter');
    if (sel) sel.value = catParam;
  }
});
