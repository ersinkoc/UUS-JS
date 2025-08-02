import { reactive } from '@uusjs/core';

/**
 * Create a shopping cart
 */
export function createCart() {
  const STORAGE_KEY = 'uus-cart';

  // Load cart from localStorage
  const savedCart = localStorage.getItem(STORAGE_KEY);
  const initialItems = savedCart ? JSON.parse(savedCart) : [];

  // Create reactive state
  const state = reactive({
    items: initialItems,

    // Computed
    get count() {
      return this.items.reduce((sum, item) => sum + item.quantity, 0);
    },

    get subtotal() {
      return this.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
    },
  });

  // Save to localStorage on change
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  }

  // Add item to cart
  function addItem(product) {
    const existing = state.items.find((item) => item.id === product.id);

    if (existing) {
      existing.quantity += product.quantity || 1;
    } else {
      state.items.push({
        ...product,
        quantity: product.quantity || 1,
      });
    }

    save();
  }

  // Update item quantity
  function updateQuantity(id, quantity) {
    const item = state.items.find((item) => item.id === id);
    if (item) {
      item.quantity = Math.max(1, quantity);
      save();
    }
  }

  // Remove item from cart
  function removeItem(id) {
    const index = state.items.findIndex((item) => item.id === id);
    if (index !== -1) {
      state.items.splice(index, 1);
      save();
    }
  }

  // Clear cart
  function clear() {
    state.items = [];
    save();
  }

  return {
    state,
    addItem,
    updateQuantity,
    removeItem,
    clear,
  };
}
