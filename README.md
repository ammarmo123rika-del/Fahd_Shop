# 🛒 My Store - Amazon-Style Online Store

A fully functional Amazon-style e-commerce store with real-time chat, host price management, and sales system. Built with Node.js/Express backend and vanilla HTML/CSS/JS frontend.

## ✨ Features

### 🛍️ Customer Features
- **Sign In / Sign Up** - Create an account or sign in
- **Product Browsing** - Browse products with search, category filters, and sort options
- **Product Details** - View detailed product pages with ratings, pricing, and descriptions
- **Shopping Cart** - Add/remove items, adjust quantities
- **Wishlist** - Save products for later
- **Checkout** - Place orders with order history tracking
- **Order History** - View all your past orders with status tracking
- **💬 Chat with Host** - Real-time messaging with the store host for support and price negotiation

### 🔧 Host (Admin) Features
- **Dashboard** - Overview with stats (products, orders, revenue, customers, active sales)
- **💰 Price Management** - Change product prices in real-time with modal editor
- **🏷️ Sale Creation** - Apply percentage discounts to any product (creates sale badges)
- **Add Products** - Create new products with name, price, category, stock, and description
- **Manage Products** - View and delete products from the store
- **Order Management** - View all orders and update their status (Pending → Shipped → Delivered)
- **💬 Customer Chat** - See all customers, view their order history, and message them directly

### 🔐 API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id/price` | Update product price |
| POST | `/api/products/:id/sale` | Apply/remove sale |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/messages` | Get chat messages |
| POST | `/api/messages` | Send chat message |
| GET | `/api/orders` | List all orders |
| POST | `/api/orders` | Place order |
| PUT | `/api/orders/:id/status` | Update order status |
| GET | `/api/customers` | List customers with stats |
| GET | `/api/sales` | List active sales |

## 🔑 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Host/Admin** | fahdm19573@gmail.com | [Contact owner] |
| **Customer** | Any email | Any password (4+ chars) |

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start the server
npm start

# Open in browser
# http://localhost:5000
```

## 📁 Pages

| Page | Description |
|------|-------------|
| `index.html` | Homepage with hero banner, categories, and featured products |
| `products.html` | All products with search, filter, and sort |
| `product.html` | Individual product detail page |
| `cart.html` | Shopping cart |
| `wishlist.html` | Saved products wishlist |
| `orders.html` | Order history |
| `checkout.html` | Checkout page |
| `login.html` | Sign in page |
| `signup.html` | Create account page |
| `account.html` | My account page |
| `chat.html` | 💬 Real-time chat with host |
| `admin.html` | Host dashboard (admin only) |
| `add-product.html` | Add new product (admin only) |
| `categories.html` | Browse by category |
| `books.html` | Books section |
| `contact.html` | Contact us |

## 🛠️ Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Storage:** JSON file (data.json)
- **Design:** Amazon-inspired with gradients and animations

## 🎨 Design

- Dark gradient header with purple/pink theme
- Product cards with hover lift effects and smooth transitions
- Gradient price text and sale badges
- Real-time chat with message animations
- Modal dialogs for price/sale management
- Responsive design for mobile and desktop
- Custom scrollbar and selection styling

---
Built with ❤️ by Fahd
