# UUS.js E-commerce Example

A fully-featured e-commerce store built with UUS.js, showcasing:

- **Product Catalog**: Browse products with filtering and search
- **Shopping Cart**: Add/remove items with persistent storage
- **Product Details**: Individual product pages with image gallery
- **Responsive Design**: Mobile-first responsive layout
- **Animations**: Smooth transitions and micro-interactions
- **Single Page Application**: Dynamic page switching with reactive state

## Features

### 🛍️ Shopping Experience

- Product grid with category filtering
- Price range filtering and sorting
- Product search functionality
- Detailed product pages
- Shopping cart with quantity management
- Persistent cart storage

### 🎨 User Interface

- Clean, modern design
- Responsive layout for all devices
- Loading states and empty states
- Toast notifications
- Smooth animations

### ⚡ Performance

- Efficient reactivity system
- Optimized images
- Fast filtering and search
- Minimal bundle size

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/       # Reusable UI components
├── data/            # Product data and mock API
├── utils/           # Utility functions
├── main.js          # App entry point
└── style.css        # Global styles
```

## Key Technologies

- **UUS.js Core**: Reactive state management with directive-based approach
- **Modern JavaScript**: ES6+ features and modules
- **CSS Grid & Flexbox**: Responsive layout design
- **Vite**: Build tool and dev server
- **Unsplash Images**: High-quality product images

## Implementation Highlights

### Reactive Shopping Cart

```html
<div
  id="app"
  uus-state="{
  // Cart state
  cartItems: [],
  
  // Computed properties
  get cartTotal() {
    return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },
  
  get shipping() {
    return this.cartTotal > 50 ? 0 : 9.99;
  },
  
  get orderTotal() {
    return this.cartTotal + this.shipping + this.tax;
  }
}"
></div>
```

### Product Filtering

```javascript
get filteredProducts() {
  let filtered = this.products;

  // Category filter
  if (this.selectedCategory !== 'all') {
    filtered = filtered.filter(p => p.category === this.selectedCategory);
  }

  // Price filter
  filtered = filtered.filter(p => p.price <= this.maxPrice);

  // Search filter
  if (this.searchQuery) {
    const query = this.searchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    );
  }

  return filtered;
}
```

### Page-based Product Loading

```javascript
// In the navigateTo method within uus-state
navigateTo(page, productId = null) {
  this.currentPage = page;
  if (page === 'product' && productId) {
    this.selectedProduct = this.products.find(p => p.id === productId);
    this.selectedQuantity = 1;
  }
  this.showMobileMenu = false;
  window.scrollTo(0, 0);
}
```

## Customization

### Adding New Products

Edit `src/data/products.js` to add new products or categories:

```javascript
{
  id: 11,
  name: 'New Product',
  price: 99.99,
  image: 'product-image-url',
  category: 'electronics',
  description: 'Product description',
  rating: 4.5,
  stock: 20,
  features: ['Feature 1', 'Feature 2']
}
```

### Styling

Customize the appearance by modifying CSS variables in `src/style.css`:

```css
:root {
  --primary-color: #3498db;
  --secondary-color: #2ecc71;
  --text-color: #2c3e50;
  /* ... */
}
```

### Adding Payment Integration

The checkout page is ready for payment integration:

```javascript
// In checkout component
async processPayment() {
  // Integrate with Stripe, PayPal, etc.
  const payment = await stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: window.location.origin + '/success'
    }
  });
}
```

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers

## License

MIT
