// ===== FAHD SHOP - Amazon-style App =====

// --- Host credentials ---
const HOST_EMAIL = "fahdm19573@gmail.com";
const HOST_PASSWORD = "fahd19573";

// --- Default products ---
const DEFAULT_PRODUCTS = [
  {id:1,name:"Apple iPhone 15 Pro Max 256GB",price:1199,oldPrice:1299,image:"📱",category:"Electronics",rating:4.8,reviews:2340,prime:true,stock:25,desc:"Latest Apple iPhone with A17 Pro chip, titanium design, and 48MP camera system."},
  {id:2,name:"Samsung Galaxy S24 Ultra 512GB",price:1099,oldPrice:1199,image:"📱",category:"Electronics",rating:4.7,reviews:1890,prime:true,stock:30,desc:"Samsung flagship with S Pen, AI features, and 200MP camera."},
  {id:3,name:"Sony WH-1000XM5 Headphones",price:298,oldPrice:399,image:"🎧",category:"Electronics",rating:4.9,reviews:5670,prime:true,stock:50,desc:"Industry-leading noise cancellation with premium sound quality."},
  {id:4,name:"Apple MacBook Pro 14\" M3 Pro",price:1999,oldPrice:2199,image:"💻",category:"Electronics",rating:4.8,reviews:1230,prime:true,stock:15,desc:"Supercharged by M3 Pro chip, up to 18 hours battery life."},
  {id:5,name:"Amazon Kindle Paperwhite",price:139,oldPrice:160,image:"📖",category:"Books",rating:4.6,reviews:8900,prime:true,stock:100,desc:"6.8\" display, adjustable warm light, waterproof."},
  {id:6,name:"Nike Air Max 270 Running Shoes",price:129,oldPrice:160,image:"👟",category:"Fashion",rating:4.5,reviews:3400,prime:true,stock:40,desc:"Maximum comfort with Max Air unit for all-day wear."},
  {id:7,name:"Dyson V15 Detect Vacuum",price:649,oldPrice:749,image:"🧹",category:"Home",rating:4.7,reviews:2100,prime:true,stock:20,desc:"Laser reveals invisible dust, LCD screen shows particle count."},
  {id:8,name:"PlayStation 5 Console",price:499,oldPrice:549,image:"🎮",category:"Gaming",rating:4.9,reviews:12000,prime:true,stock:10,desc:"Lightning-fast loading with SSD, 4K gaming, ray tracing."},
  {id:9,name:"Nintendo Switch OLED",price:349,oldPrice:370,image:"🎮",category:"Gaming",rating:4.8,reviews:7800,prime:true,stock:25,desc:"7-inch OLED screen, wide adjustable stand, enhanced audio."},
  {id:10,name:"Instant Pot Duo 7-in-1 6Qt",price:79,oldPrice:99,image:"🍲",category:"Home",rating:4.7,reviews:15000,prime:true,stock:60,desc:"Pressure cooker, slow cooker, rice cooker, steamer, sauté, yogurt maker, and warmer."},
  {id:11,name:"Bose QuietComfort Ultra Earbuds",price:249,oldPrice:299,image:"🎧",category:"Electronics",rating:4.6,reviews:3200,prime:true,stock:35,desc:"World-class noise cancellation with Immersive Audio."},
  {id:12,name:"Levi's 501 Original Fit Jeans",price:59,oldPrice:79,image:"👖",category:"Fashion",rating:4.4,reviews:6700,prime:true,stock:80,desc:"The original button fly jean since 1873. Iconic straight leg."}
];

// --- Auth ---
function getCurrentUser(){
  try{return JSON.parse(sessionStorage.getItem('user'))}catch{return null}
}
function isLoggedIn(){return !!getCurrentUser()}
function isHost(){
  const u=getCurrentUser();
  return u&&u.email===HOST_EMAIL;
}

function login(){
  const email=document.getElementById('email').value.trim();
  const pw=document.getElementById('password').value;
  const msg=document.getElementById('msg');
  if(!email||!pw){showMsg(msg,'Please fill in all fields','error');return}
  if(email===HOST_EMAIL&&pw===HOST_PASSWORD){
    const user={email,name:"Fahd (Host)",role:"host"};
    sessionStorage.setItem('user',JSON.stringify(user));
    showMsg(msg,'Welcome back, Fahd! Redirecting...','success');
    setTimeout(()=>location.href='admin.html',1000);
  }else if(email&&pw.length>=4){
    const user={email,name:email.split('@')[0],role:"customer"};
    sessionStorage.setItem('user',JSON.stringify(user));
    showMsg(msg,'Welcome! Redirecting...','success');
    setTimeout(()=>location.href='index.html',1000);
  }else{
    showMsg(msg,'Invalid email or password. Demo: fahdm19573@gmail.com / fahd19573','error');
  }
}

function signup(){
  const name=document.getElementById('name').value.trim();
  const email=document.getElementById('email').value.trim();
  const pw=document.getElementById('password').value;
  const msg=document.getElementById('msg');
  if(!name||!email||!pw){showMsg(msg,'Please fill in all fields','error');return}
  if(pw.length<4){showMsg(msg,'Password must be at least 4 characters','error');return}
  const user={email,name,role:"customer"};
  sessionStorage.setItem('user',JSON.stringify(user));
  showMsg(msg,'Account created! Redirecting...','success');
  setTimeout(()=>location.href='index.html',1000);
}

function logout(){
  sessionStorage.removeItem('user');
  location.href='index.html';
}

function showMsg(el,text,type){
  if(!el)return;
  el.className='msg msg-'+type;
  el.textContent=text;
}

// --- Products ---
function getProducts(){
  let p=localStorage.getItem('shop_products');
  if(p)return JSON.parse(p);
  localStorage.setItem('shop_products',JSON.stringify(DEFAULT_PRODUCTS));
  return DEFAULT_PRODUCTS;
}
function saveProducts(products){
  localStorage.setItem('shop_products',JSON.stringify(products));
}

function renderProducts(containerId,limit){
  const c=document.getElementById(containerId);
  if(!c)return;
  const search=document.getElementById('search');
  const q=search?search.value.toLowerCase():'';
  const catFilter=document.getElementById('catFilter');
  const cat=catFilter?catFilter.value:'';
  const sort=document.getElementById('sortFilter');
  const sortBy=sort?sort.value:'';
  let products=getProducts();
  if(q)products=products.filter(p=>p.name.toLowerCase().includes(q)||p.category.toLowerCase().includes(q));
  if(cat)products=products.filter(p=>p.category===cat);
  if(sortBy==='price-low')products.sort((a,b)=>a.price-b.price);
  if(sortBy==='price-high')products.sort((a,b)=>b.price-a.price);
  if(sortBy==='rating')products.sort((a,b)=>b.rating-a.rating);
  if(sortBy==='name')products.sort((a,b)=>a.name.localeCompare(b.name));
  if(limit)products=products.slice(0,limit);
  if(!products.length){c.innerHTML='<div class="empty"><div class="icon">📦</div><p>No products found</p></div>';return}
  c.innerHTML=products.map(p=>`
    <div class="card">
      <a href="product.html?id=${p.id}" class="card-img"><span class="placeholder">${p.image}</span></a>
      <div class="card-body">
        <a href="product.html?id=${p.id}" class="title">${p.name}</a>
        <div class="rating">${'★'.repeat(Math.floor(p.rating))}${p.rating%1>=0.5?'½':''} <span style="color:#555">${p.rating} (${p.reviews.toLocaleString()})</span></div>
        <div class="price">$${p.price.toLocaleString()} <span class="old">$${(p.oldPrice||p.price).toLocaleString()}</span></div>
        ${p.prime?'<div class="prime">✓ prime FREE Delivery</div>':''}
        <div class="card-actions">
          <button class="btn" onclick="addToCart(${p.id})">Add to Cart</button>
          <button class="btn-sm btn-outline" onclick="addToWishlist(${p.id})">♡</button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderProductDetail(){
  const c=document.getElementById('productDetail');
  if(!c)return;
  const id=parseInt(new URLSearchParams(location.search).get('id'));
  const products=getProducts();
  const p=products.find(x=>x.id===id);
  if(!p){c.innerHTML='<div class="empty"><div class="icon">❓</div><p>Product not found</p></div>';return}
  document.title=p.name+' - Fahd Shop';
  c.innerHTML=`
    <div style="display:flex;gap:40px;flex-wrap:wrap">
      <div style="flex:1;min-width:280px;background:#fff;border-radius:12px;padding:40px;text-align:center;display:flex;align-items:center;justify-content:center;min-height:350px">
        <span style="font-size:120px">${p.image}</span>
      </div>
      <div style="flex:1;min-width:280px">
        <h1 style="font-size:26px;margin-bottom:8px">${p.name}</h1>
        <div class="rating" style="margin:8px 0">${'★'.repeat(Math.floor(p.rating))} <span style="color:#555">${p.rating} · ${p.reviews.toLocaleString()} reviews</span></div>
        <div style="border-top:1px solid #eee;border-bottom:1px solid #eee;padding:12px 0;margin:12px 0">
          <span style="color:#555;text-decoration:line-through;margin-right:8px">$${(p.oldPrice||p.price).toLocaleString()}</span>
          <span style="font-size:28px;font-weight:700;color:#b12704">$${p.price.toLocaleString()}</span>
          <div style="color:#007600;margin-top:4px">You save: $${((p.oldPrice||p.price)-p.price).toLocaleString()}</div>
        </div>
        ${p.prime?'<div class="prime" style="margin:8px 0">✓ prime FREE Delivery</div>':''}
        <p style="color:#555;margin:12px 0">${p.desc||''}</p>
        <p style="margin:8px 0">Category: <b>${p.category}</b></p>
        <p style="margin:8px 0;color:${p.stock>0?'#007600':'#b12704'}">${p.stock>0?'In Stock ('+p.stock+' available)':'Out of Stock'}</p>
        <div style="display:flex;gap:12px;margin-top:20px">
          <button class="btn" onclick="addToCart(${p.id})" style="flex:1;padding:14px">Add to Cart</button>
          <button class="btn-blue btn" onclick="buyNow(${p.id})" style="flex:1;padding:14px;background:#ff9900">Buy Now</button>
        </div>
        <button class="btn-sm btn-outline" onclick="addToWishlist(${p.id})" style="margin-top:12px">♡ Add to Wishlist</button>
      </div>
    </div>
  `;
}

// --- Cart ---
function getCart(){return JSON.parse(localStorage.getItem('cart')||'[]')}
function saveCart(c){localStorage.setItem('cart',JSON.stringify(c));updateCartCount()}
function addToCart(id){
  let cart=getCart();
  const item=cart.find(c=>c.id===id);
  if(item){item.qty++}else{cart.push({id,qty:1})}
  saveCart(cart);
  toast('Added to cart! 🛒');
}
function removeFromCart(id){
  let cart=getCart().filter(c=>c.id!==id);
  saveCart(cart);
  renderCart();
}
function updateQty(id,delta){
  let cart=getCart();
  const item=cart.find(c=>c.id===id);
  if(!item)return;
  item.qty+=delta;
  if(item.qty<1){cart=cart.filter(c=>c.id!==id)}
  saveCart(cart);
  renderCart();
}
function updateCartCount(){
  const el=document.getElementById('cartCount');
  if(!el)return;
  const count=getCart().reduce((s,c)=>s+c.qty,0);
  el.textContent=count;
  el.style.display=count?'flex':'none';
}
function renderCart(){
  const c=document.getElementById('cart');
  const totalEl=document.getElementById('cartTotal');
  if(!c)return;
  const cart=getCart();
  const products=getProducts();
  if(!cart.length){
    c.innerHTML='<div class="empty"><div class="icon">🛒</div><p>Your cart is empty</p><a href="products.html" class="btn" style="margin-top:16px;display:inline-block">Continue Shopping</a></div>';
    if(totalEl)totalEl.innerHTML='';
    return;
  }
  let total=0;
  c.innerHTML=cart.map(ci=>{
    const p=products.find(x=>x.id===ci.id);
    if(!p)return'';
    const sub=p.price*ci.qty;
    total+=sub;
    return`<div class="cart-item">
      <a href="product.html?id=${p.id}" class="cart-img"><span style="font-size:50px">${p.image}</span></a>
      <div class="cart-info">
        <div class="title"><a href="product.html?id=${p.id}">${p.name}</a></div>
        <div class="price">$${p.price.toLocaleString()}</div>
        ${p.prime?'<div class="prime">✓ prime</div>':''}
        <div class="qty-control">
          <button onclick="updateQty(${p.id},-1)">−</button>
          <span>${ci.qty}</span>
          <button onclick="updateQty(${p.id},1)">+</button>
          <button class="btn-sm btn-outline" onclick="removeFromCart(${p.id})" style="margin-left:12px;color:#b12704">Remove</button>
        </div>
      </div>
      <div style="text-align:right;min-width:80px">
        <div style="font-size:18px;font-weight:700">$${sub.toLocaleString()}</div>
      </div>
    </div>`
  }).join('');
  if(totalEl){
    totalEl.innerHTML=`
      <p style="margin-bottom:8px;color:#555">Subtotal (${cart.reduce((s,c)=>s+c.qty,0)} items):</p>
      <div class="total">$${total.toLocaleString()}</div>
      <button class="btn btn-amazon btn-block" style="margin-top:16px" onclick="checkout()">Proceed to Checkout</button>
      <a href="products.html" style="display:block;margin-top:12px;font-size:13px">← Continue Shopping</a>
    `;
  }
}

function checkout(){
  let cart=getCart();
  if(!cart.length){alert('Cart is empty!');return}
  const user=getCurrentUser();
  if(!user){location.href='login.html';return}
  let orders=JSON.parse(localStorage.getItem('orders')||'[]');
  const products=getProducts();
  const items=cart.map(ci=>{const p=products.find(x=>x.id===ci.id);return p?{name:p.name,price:p.price,qty:ci.qty,image:p.image}:null}).filter(Boolean);
  const total=items.reduce((s,i)=>s+i.price*i.qty,0);
  orders.push({id:orders.length+1,date:new Date().toLocaleString(),user:user.email,items,total,status:'Delivered'});
  localStorage.setItem('orders',JSON.stringify(orders));
  localStorage.removeItem('cart');
  toast('Order placed successfully! 🎉');
  updateCartCount();
  setTimeout(()=>location.href='orders.html',1000);
}

function buyNow(id){
  addToCart(id);
  checkout();
}

// --- Wishlist ---
function getWishlist(){return JSON.parse(localStorage.getItem('wishlist')||'[]')}
function addToWishlist(id){
  let wl=getWishlist();
  if(wl.includes(id)){toast('Already in wishlist ♡');return}
  wl.push(id);
  localStorage.setItem('wishlist',JSON.stringify(wl));
  toast('Added to wishlist! ❤️');
}
function renderWishlist(){
  const c=document.getElementById('wishlist');
  if(!c)return;
  const wl=getWishlist();
  const products=getProducts();
  const items=products.filter(p=>wl.includes(p.id));
  if(!items.length){c.innerHTML='<div class="empty"><div class="icon">❤️</div><p>Your wishlist is empty</p></div>';return}
  c.innerHTML=items.map(p=>`
    <div class="cart-item">
      <a href="product.html?id=${p.id}" class="cart-img"><span style="font-size:50px">${p.image}</span></a>
      <div class="cart-info">
        <div class="title"><a href="product.html?id=${p.id}">${p.name}</a></div>
        <div class="price">$${p.price.toLocaleString()}</div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn" onclick="addToCart(${p.id})">Add to Cart</button>
        <button class="btn-sm btn-outline btn-red" onclick="removeFromWishlist(${p.id})">✕</button>
      </div>
    </div>
  `).join('');
}
function removeFromWishlist(id){
  localStorage.setItem('wishlist',JSON.stringify(getWishlist().filter(x=>x!==id)));
  renderWishlist();
}

// --- Orders ---
function renderOrders(){
  const c=document.getElementById('orders');
  if(!c)return;
  let orders=JSON.parse(localStorage.getItem('orders')||'[]');
  const user=getCurrentUser();
  if(user&&user.role!=='host'){orders=orders.filter(o=>o.user===user.email)}
  if(!orders.length){c.innerHTML='<div class="empty"><div class="icon">📦</div><p>No orders yet</p></div>';return}
  c.innerHTML=orders.map((o,i)=>`
    <div class="card" style="margin-bottom:16px">
      <div class="flex-between" style="margin-bottom:8px">
        <b>Order #${o.id||i+1}</b>
        <span class="badge ${o.status==='Delivered'?'badge-green':o.status==='Shipped'?'badge-yellow':'badge-red'}">${o.status||'Pending'}</span>
      </div>
      <p style="color:#555;font-size:13px">${o.date}</p>
      <p style="margin:8px 0">${o.items.map(it=>`${it.name} × ${it.qty}`).join(', ')}</p>
      <p style="font-weight:700;color:#b12704">Total: $${(o.total||0).toLocaleString()}</p>
    </div>
  `).join('');
}

// --- Admin ---
function renderAdmin(){
  const user=getCurrentUser();
  if(!user||user.role!=='host'){document.querySelector('main').innerHTML='<div class="empty"><div class="icon">🔒</div><h2>Access Denied</h2><p>Please login as host (fahdm19573@gmail.com)</p><a href="login.html" class="btn mt-20">Go to Login</a></div>';return}
  const products=getProducts();
  const orders=JSON.parse(localStorage.getItem('orders')||'[]');
  const totalRevenue=orders.reduce((s,o)=>s+(o.total||0),0);
  document.getElementById('statProducts').textContent=products.length;
  document.getElementById('statOrders').textContent=orders.length;
  document.getElementById('statRevenue').textContent='$'+totalRevenue.toLocaleString();
  document.getElementById('statCustomers').textContent=new Set(orders.map(o=>o.user)).size;
  renderAdminProducts();
  renderAdminOrders();
}
function renderAdminProducts(){
  const c=document.getElementById('adminProducts');
  if(!c)return;
  const products=getProducts();
  c.innerHTML=products.map(p=>`
    <tr>
      <td>${p.image} ${p.name}</td>
      <td>$${p.price}</td>
      <td>${p.stock}</td>
      <td>${p.category}</td>
      <td><button class="btn-sm btn-red" onclick="deleteProduct(${p.id})">Delete</button></td>
    </tr>
  `).join('');
}
function renderAdminOrders(){
  const c=document.getElementById('adminOrders');
  if(!c)return;
  const orders=JSON.parse(localStorage.getItem('orders')||'[]');
  if(!orders.length){c.innerHTML='<tr><td colspan="4" style="text-align:center;color:#888">No orders yet</td></tr>';return}
  c.innerHTML=orders.map((o,i)=>`
    <tr>
      <td>#${o.id||i+1}</td>
      <td>${o.user||'Guest'}</td>
      <td>$${(o.total||0).toLocaleString()}</td>
      <td><select onchange="updateOrderStatus(${i},this.value)" style="padding:4px;border-radius:4px">
        <option ${o.status==='Pending'?'selected':''}>Pending</option>
        <option ${o.status==='Shipped'?'selected':''}>Shipped</option>
        <option ${o.status==='Delivered'?'selected':''}>Delivered</option>
      </select></td>
    </tr>
  `).join('');
}
function updateOrderStatus(idx,status){
  let orders=JSON.parse(localStorage.getItem('orders')||'[]');
  if(orders[idx]){orders[idx].status=status;localStorage.setItem('orders',JSON.stringify(orders));renderAdminOrders()}
}
function deleteProduct(id){
  if(!confirm('Delete this product?'))return;
  let products=getProducts().filter(p=>p.id!==id);
  saveProducts(products);
  renderAdminProducts();
  document.getElementById('statProducts').textContent=products.length;
  toast('Product deleted');
}

// --- Add Product ---
function addProduct(){
  const name=document.getElementById('pName').value.trim();
  const price=parseFloat(document.getElementById('pPrice').value);
  const oldPrice=parseFloat(document.getElementById('pOldPrice').value)||price;
  const image=document.getElementById('pImage').value.trim()||'📦';
  const category=document.getElementById('pCategory').value;
  const stock=parseInt(document.getElementById('pStock').value)||0;
  const desc=document.getElementById('pDesc').value.trim();
  const msg=document.getElementById('msg');
  if(!name||!price){showMsg(msg,'Name and price are required','error');return}
  let products=getProducts();
  const newId=products.length?Math.max(...products.map(p=>p.id))+1:1;
  products.push({id:newId,name,price,oldPrice,image,category,rating:4.5,reviews:0,prime:true,stock,desc});
  saveProducts(products);
  showMsg(msg,'Product added successfully! ✓','success');
  document.getElementById('addProductForm').reset();
}

// --- Utility ---
function toast(text){
  const t=document.createElement('div');
  t.className='toast';
  t.textContent=text;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),2500);
}

// --- Nav update ---
function updateNav(){
  const user=getCurrentUser();
  document.querySelectorAll('.loginLink').forEach(el=>{
    if(user){
      el.innerHTML=`<span style="font-size:11px;display:block">Hello, ${user.name}</span><span class="value" onclick="logout()" style="cursor:pointer">Sign Out</span>`;
      el.href='#';
      el.onclick=function(e){e.preventDefault();logout()};
    }
  });
  document.querySelectorAll('.hostLink').forEach(el=>{
    if(!user||user.role!=='host')el.style.display='none';
  });
}

// --- Categories ---
function renderCategories(){
  const c=document.getElementById('categories');
  if(!c)return;
  const cats=[{icon:'📱',name:'Electronics'},{icon:'💻',name:'Laptops'},{icon:'📖',name:'Books'},{icon:'👟',name:'Fashion'},{icon:'🧹',name:'Home'},{icon:'🎮',name:'Gaming'}];
  c.innerHTML=cats.map(cat=>`
    <div class="cat-card" onclick="location.href='products.html?cat=${cat.name}'">
      <div class="icon">${cat.icon}</div>
      <div class="name">${cat.name}</div>
    </div>
  `).join('');
}

// --- Init ---
document.addEventListener('DOMContentLoaded',function(){
  updateNav();
  updateCartCount();
  // Apply URL category filter
  const catParam=new URLSearchParams(location.search).get('cat');
  if(catParam){
    const sel=document.getElementById('catFilter');
    if(sel){sel.value=catParam}
  }
});
