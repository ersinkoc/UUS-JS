import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Uus } from '../../src/uus';

describe('Directives Integration Tests', () => {
  let app: Uus;
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (app) {
      app.destroy();
    }
    document.body.innerHTML = '';
  });

  describe('Nested Directives', () => {
    it('should handle complex nested directive scenarios', async () => {
      container.innerHTML = `
        <div uus-state="{
          categories: [
            {
              name: 'Electronics',
              expanded: false,
              products: [
                { id: 1, name: 'Laptop', price: 999, inStock: true },
                { id: 2, name: 'Phone', price: 599, inStock: false }
              ]
            },
            {
              name: 'Books',
              expanded: true,
              products: [
                { id: 3, name: 'JavaScript Guide', price: 29, inStock: true },
                { id: 4, name: 'UUS.js Manual', price: 19, inStock: true }
              ]
            }
          ],
          cartItems: [],
          get cartTotal() {
            return this.cartItems.reduce((sum, item) => sum + item.price, 0);
          },
          toggleCategory(category) {
            category.expanded = !category.expanded;
          },
          addToCart(product) {
            if (product.inStock) {
              this.cartItems.push(product);
            }
          }
        }">
          <div uus-for="category in categories" class="category">
            <h3 
              uus-text="category.name"
              uus-on:click="toggleCategory(category)"
              uus-style="{ cursor: 'pointer' }"
            ></h3>
            
            <div uus-show="category.expanded" class="products">
              <div 
                uus-for="product in category.products" 
                class="product"
                uus-class="{ 'out-of-stock': !product.inStock }"
              >
                <span uus-text="product.name"></span>
                <span uus-text="'$' + product.price"></span>
                <button 
                  uus-on:click="addToCart(product)"
                  uus-bind:disabled="!product.inStock"
                  uus-text="product.inStock ? 'Add to Cart' : 'Out of Stock'"
                ></button>
              </div>
            </div>
          </div>
          
          <div class="cart" uus-show="cartItems.length > 0">
            <h3>Cart (<span uus-text="cartItems.length"></span> items)</h3>
            <p>Total: $<span uus-text="cartTotal"></span></p>
          </div>
        </div>
      `;

      app = new Uus();
      app.mount(container);

      await new Promise(resolve => setTimeout(resolve, 10));

      // Check initial render
      const categories = container.querySelectorAll('.category');
      expect(categories.length).toBe(2);

      // Electronics should be collapsed, Books expanded
      const electronicsProducts = categories[0].querySelector('.products');
      const booksProducts = categories[1].querySelector('.products');
      
      expect(electronicsProducts?.getAttribute('style')).toContain('display: none');
      expect(booksProducts?.getAttribute('style')).not.toContain('display: none');

      // Check product rendering
      const bookProducts = booksProducts?.querySelectorAll('.product');
      expect(bookProducts?.length).toBe(2);

      // Add in-stock product to cart
      const addButton = bookProducts?.[0].querySelector('button');
      addButton?.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Check cart updated
      expect(container.querySelector('.cart')).toBeTruthy();
      expect(container.textContent).toContain('Cart (1 items)');
      expect(container.textContent).toContain('Total: $29');

      // Toggle electronics category
      categories[0].querySelector('h3')?.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Check electronics expanded
      const electronicsProductsAfter = categories[0].querySelector('.products');
      expect(electronicsProductsAfter?.getAttribute('style')).not.toContain('display: none');

      // Check out-of-stock styling
      const phoneProduct = electronicsProductsAfter?.querySelectorAll('.product')[1];
      expect(phoneProduct?.classList.contains('out-of-stock')).toBe(true);
      
      const phoneButton = phoneProduct?.querySelector('button') as HTMLButtonElement;
      expect(phoneButton?.disabled).toBe(true);
      expect(phoneButton?.textContent).toBe('Out of Stock');
    });
  });

  describe('Dynamic Directive Updates', () => {
    it('should update directives when data changes dynamically', async () => {
      container.innerHTML = `
        <div uus-state="{
          mode: 'view',
          user: {
            name: 'John Doe',
            email: 'john@example.com',
            role: 'user'
          },
          permissions: {
            canEdit: false,
            canDelete: false
          },
          switchMode() {
            this.mode = this.mode === 'view' ? 'edit' : 'view';
          },
          updateRole(role) {
            this.user.role = role;
            this.permissions.canEdit = role === 'admin' || role === 'editor';
            this.permissions.canDelete = role === 'admin';
          }
        }">
          <div uus-if="mode === 'view'" class="view-mode">
            <h2 uus-text="user.name"></h2>
            <p uus-text="user.email"></p>
            <p>Role: <span uus-text="user.role"></span></p>
            <button uus-on:click="switchMode()">Edit</button>
          </div>
          
          <div uus-if="mode === 'edit'" class="edit-mode">
            <input uus-model="user.name" placeholder="Name">
            <input uus-model="user.email" placeholder="Email">
            <select uus-model="user.role" uus-on:change="updateRole($event.target.value)">
              <option value="user">User</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
            <button uus-on:click="switchMode()">Save</button>
          </div>
          
          <div class="permissions">
            <button 
              uus-bind:disabled="!permissions.canEdit"
              uus-class="{ enabled: permissions.canEdit }"
            >Edit Content</button>
            <button 
              uus-bind:disabled="!permissions.canDelete"
              uus-class="{ enabled: permissions.canDelete }"
            >Delete Content</button>
          </div>
        </div>
      `;

      app = new Uus();
      app.mount(container);

      await new Promise(resolve => setTimeout(resolve, 10));

      // Check initial view mode
      expect(container.querySelector('.view-mode')).toBeTruthy();
      expect(container.querySelector('.edit-mode')).toBeFalsy();

      // Check permissions disabled
      const buttons = container.querySelectorAll('.permissions button');
      expect((buttons[0] as HTMLButtonElement).disabled).toBe(true);
      expect((buttons[1] as HTMLButtonElement).disabled).toBe(true);

      // Switch to edit mode
      container.querySelector('.view-mode button')?.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Check edit mode active
      expect(container.querySelector('.view-mode')).toBeFalsy();
      expect(container.querySelector('.edit-mode')).toBeTruthy();

      // Change role to admin
      const select = container.querySelector('select') as HTMLSelectElement;
      select.value = 'admin';
      select.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 10));

      // Check permissions updated
      const permButtons = container.querySelectorAll('.permissions button');
      expect((permButtons[0] as HTMLButtonElement).disabled).toBe(false);
      expect((permButtons[1] as HTMLButtonElement).disabled).toBe(false);
      expect(permButtons[0].classList.contains('enabled')).toBe(true);
      expect(permButtons[1].classList.contains('enabled')).toBe(true);

      // Switch back to view mode
      container.querySelector('.edit-mode button')?.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Check role persisted
      expect(container.textContent).toContain('Role: admin');
    });
  });

  describe('Custom Directives', () => {
    it('should work with custom directives', async () => {
      let focusCount = 0;
      let tooltipElement: HTMLElement | null = null;

      // Register custom directives
      app = new Uus();
      
      app.registerDirective('focus', {
        name: 'focus' as any,
        bind(el) {
          (el as HTMLElement).focus();
          focusCount++;
        }
      });

      app.registerDirective('tooltip', {
        name: 'tooltip' as any,
        bind(el, binding) {
          el.addEventListener('mouseenter', () => {
            tooltipElement = document.createElement('div');
            tooltipElement.className = 'tooltip';
            tooltipElement.textContent = binding.value as string;
            document.body.appendChild(tooltipElement);
          });
          
          el.addEventListener('mouseleave', () => {
            if (tooltipElement) {
              tooltipElement.remove();
              tooltipElement = null;
            }
          });
        }
      });

      container.innerHTML = `
        <div uus-state="{ message: '' }">
          <input 
            uus-model="message" 
            uus-focus
            placeholder="This should be focused"
          >
          <button uus-tooltip="'Click me to submit'">Submit</button>
        </div>
      `;

      app.mount(container);

      await new Promise(resolve => setTimeout(resolve, 10));

      // Check focus directive worked
      expect(focusCount).toBe(1);
      expect(document.activeElement).toBe(container.querySelector('input'));

      // Test tooltip directive
      const button = container.querySelector('button');
      button?.dispatchEvent(new MouseEvent('mouseenter'));

      await new Promise(resolve => setTimeout(resolve, 10));

      // Check tooltip created
      expect(document.querySelector('.tooltip')?.textContent).toBe('Click me to submit');

      // Remove tooltip
      button?.dispatchEvent(new MouseEvent('mouseleave'));

      await new Promise(resolve => setTimeout(resolve, 10));

      // Check tooltip removed
      expect(document.querySelector('.tooltip')).toBeFalsy();
    });
  });

  describe('Performance with Many Elements', () => {
    it('should handle large lists efficiently', async () => {
      const itemCount = 1000;
      
      container.innerHTML = `
        <div uus-state="{
          items: Array.from({ length: ${itemCount} }, (_, i) => ({
            id: i,
            name: 'Item ' + i,
            checked: false
          })),
          searchTerm: '',
          get filteredItems() {
            if (!this.searchTerm) return this.items;
            return this.items.filter(item => 
              item.name.toLowerCase().includes(this.searchTerm.toLowerCase())
            );
          },
          get checkedCount() {
            return this.items.filter(item => item.checked).length;
          },
          toggleAll() {
            const allChecked = this.items.every(item => item.checked);
            this.items.forEach(item => item.checked = !allChecked);
          }
        }">
          <input 
            uus-model="searchTerm" 
            placeholder="Search items..."
          >
          <button uus-on:click="toggleAll()">Toggle All</button>
          <p>Checked: <span uus-text="checkedCount"></span> / <span uus-text="items.length"></span></p>
          
          <div class="list">
            <label uus-for="item in filteredItems" uus-bind:key="item.id">
              <input 
                type="checkbox" 
                uus-bind:checked="item.checked"
                uus-on:change="item.checked = $event.target.checked"
              >
              <span uus-text="item.name"></span>
            </label>
          </div>
        </div>
      `;

      const startTime = performance.now();
      
      app = new Uus();
      app.mount(container);

      const mountTime = performance.now() - startTime;

      // Check mount time is reasonable
      expect(mountTime).toBeLessThan(1000); // Should mount in less than 1 second

      await new Promise(resolve => setTimeout(resolve, 10));

      // Check all items rendered
      const labels = container.querySelectorAll('label');
      expect(labels.length).toBe(itemCount);

      // Test filtering performance
      const searchInput = container.querySelector('input[placeholder]') as HTMLInputElement;
      const filterStartTime = performance.now();
      
      searchInput.value = 'Item 5';
      searchInput.dispatchEvent(new Event('input'));

      await new Promise(resolve => setTimeout(resolve, 10));

      const filterTime = performance.now() - filterStartTime;
      expect(filterTime).toBeLessThan(2000); // Allow up to 2 seconds for filtering in test environment

      // Check filtered results
      const filteredLabels = container.querySelectorAll('label');
      expect(filteredLabels.length).toBeLessThan(120); // Items containing "5"

      // Test toggle all performance
      const toggleStartTime = performance.now();
      container.querySelector('button')?.click();

      await new Promise(resolve => setTimeout(resolve, 50));

      const toggleTime = performance.now() - toggleStartTime;
      expect(toggleTime).toBeLessThan(500); // Toggle all should be reasonably fast

      // Check count updated
      expect(container.textContent).toContain(`Checked: ${itemCount}`);
    });
  });
});