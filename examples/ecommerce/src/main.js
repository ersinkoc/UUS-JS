import { Uus } from '@uusjs/core';

// Initialize UUS.js app
const app = new Uus();
window.app = app; // For debugging and state access

// Mount the app
app.mount('#app');

// Add helper methods to window for debugging
window.addToCart = function (product, quantity = 1) {
  console.log('Add to cart:', product, quantity);
  // For now, just log - we'll implement proper state management
};

window.navigateTo = function (page, productId = null) {
  console.log('Navigate to:', page, productId);
  // For now, just log
};

window.toggleCart = function () {
  console.log('Toggle cart');
};

window.toggleSearch = function () {
  console.log('Toggle search');
};

window.filterByCategory = function (categoryId) {
  console.log('Filter by category:', categoryId);
};

window.toggleMobileMenu = function () {
  console.log('Toggle mobile menu');
};

window.updateCartQuantity = function (itemId, newQuantity) {
  console.log('Update cart quantity:', itemId, newQuantity);
};

window.removeFromCart = function (itemId) {
  console.log('Remove from cart:', itemId);
};

window.decreaseQuantity = function () {
  console.log('Decrease quantity');
};

window.increaseQuantity = function () {
  console.log('Increase quantity');
};

window.submitOrder = function () {
  console.log('Submit order');
};

window.clearFilters = function () {
  console.log('Clear filters');
};

window.removeNotification = function (notificationId) {
  console.log('Remove notification:', notificationId);
};

console.log('🛍️ UUS.js E-commerce Store loaded successfully!');
