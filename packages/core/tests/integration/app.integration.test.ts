import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Uus } from '../../src/uus';
import { i18nPlugin } from '../../src/i18n';

describe('Uus App Integration Tests', () => {
  let app: Uus;
  let container: HTMLElement;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Cleanup
    if (app) {
      app.destroy();
    }
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Complete Todo App', () => {
    it('should create a functional todo app with all features', async () => {
      // Create app HTML
      container.innerHTML = `
        <div uus-state="{
          todos: [],
          newTodo: '',
          filter: 'all',
          get filteredTodos() {
            if (this.filter === 'all') return this.todos;
            if (this.filter === 'active') return this.todos.filter(t => !t.completed);
            if (this.filter === 'completed') return this.todos.filter(t => t.completed);
            return this.todos;
          },
          get remaining() {
            return this.todos.filter(t => !t.completed).length;
          },
          addTodo() {
            if (this.newTodo.trim()) {
              this.todos.push({
                id: Date.now(),
                text: this.newTodo.trim(),
                completed: false
              });
              this.newTodo = '';
            }
          },
          toggleTodo(id) {
            const todo = this.todos.find(t => t.id === id);
            if (todo) todo.completed = !todo.completed;
          },
          removeTodo(id) {
            const index = this.todos.findIndex(t => t.id === id);
            if (index > -1) this.todos.splice(index, 1);
          },
          clearCompleted() {
            this.todos = this.todos.filter(t => !t.completed);
          }
        }">
          <h1>Todo App</h1>
          
          <form uus-on:submit.prevent="addTodo()">
            <input 
              uus-model="newTodo"
              placeholder="What needs to be done?"
              autofocus
            >
          </form>
          
          <ul uus-show="todos.length > 0">
            <li uus-for="todo in filteredTodos" uus-class="{ completed: todo.completed }">
              <input 
                type="checkbox"
                uus-bind:checked="todo.completed"
                uus-on:change="toggleTodo(todo.id)"
              >
              <span uus-text="todo.text"></span>
              <button uus-on:click="removeTodo(todo.id)">Delete</button>
            </li>
          </ul>
          
          <footer uus-show="todos.length > 0">
            <span uus-text="remaining + ' items left'"></span>
            
            <div class="filters">
              <button 
                uus-on:click="filter = 'all'"
                uus-class="{ active: filter === 'all' }"
              >All</button>
              <button 
                uus-on:click="filter = 'active'"
                uus-class="{ active: filter === 'active' }"
              >Active</button>
              <button 
                uus-on:click="filter = 'completed'"
                uus-class="{ active: filter === 'completed' }"
              >Completed</button>
            </div>
            
            <button 
              uus-on:click="clearCompleted()"
              uus-show="todos.some(t => t.completed)"
            >Clear completed</button>
          </footer>
        </div>
      `;

      // Create and mount app
      app = new Uus();
      app.mount(container);

      // Get elements
      const input = container.querySelector('input[placeholder]') as HTMLInputElement;
      const form = container.querySelector('form') as HTMLFormElement;

      // Add todos
      input.value = 'Learn UUS.js';
      input.dispatchEvent(new Event('input'));
      form.dispatchEvent(new Event('submit'));
      
      await new Promise(resolve => setTimeout(resolve, 10));

      input.value = 'Build an app';
      input.dispatchEvent(new Event('input'));
      form.dispatchEvent(new Event('submit'));

      await new Promise(resolve => setTimeout(resolve, 10));

      // Check todos were added
      const todoItems = container.querySelectorAll('li');
      expect(todoItems.length).toBe(2);
      expect(todoItems[0].textContent).toContain('Learn UUS.js');
      expect(todoItems[1].textContent).toContain('Build an app');

      // Toggle first todo
      const firstCheckbox = todoItems[0].querySelector('input[type="checkbox"]') as HTMLInputElement;
      firstCheckbox.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Check todo is completed
      expect(todoItems[0].classList.contains('completed')).toBe(true);
      expect(container.textContent).toContain('1 items left');

      // Filter completed
      const completedButton = Array.from(container.querySelectorAll('button'))
        .find(btn => btn.textContent === 'Completed');
      completedButton?.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Check only completed shown
      const visibleTodos = container.querySelectorAll('li:not([style*="display: none"])');
      expect(visibleTodos.length).toBe(1);

      // Clear completed
      const clearButton = container.querySelector('button:last-child') as HTMLButtonElement;
      clearButton.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Check completed todos removed
      const remainingTodos = container.querySelectorAll('li');
      expect(remainingTodos.length).toBe(1);
      expect(remainingTodos[0].textContent).toContain('Build an app');
    });
  });

  describe('i18n Integration', () => {
    it('should integrate i18n plugin and translate content', async () => {
      // Create app with i18n
      app = new Uus({
        plugins: [i18nPlugin]
      });

      // Setup i18n
      app.setupI18n({
        defaultLocale: 'en',
        messages: {
          en: {
            welcome: 'Welcome {name}!',
            items: {
              zero: 'No items',
              one: 'One item',
              other: '{count} items'
            }
          },
          es: {
            welcome: '¡Bienvenido {name}!',
            items: {
              zero: 'Sin elementos',
              one: 'Un elemento',
              other: '{count} elementos'
            }
          }
        }
      });

      // Create HTML with i18n directives
      container.innerHTML = `
        <div uus-state="{ name: 'John', count: 0 }">
          <h1 uus-t="welcome" :name="name"></h1>
          <p uus-text="$i18n.tc('items', count, { count })"></p>
          <button uus-on:click="count++">Add</button>
        </div>
      `;

      // Mount app
      app.mount(container);

      await new Promise(resolve => setTimeout(resolve, 10));

      // Check English translation
      expect(container.querySelector('h1')?.textContent).toBe('Welcome John!');
      expect(container.querySelector('p')?.textContent).toBe('No items');

      // Add items
      const button = container.querySelector('button') as HTMLButtonElement;
      button.click();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(container.querySelector('p')?.textContent).toBe('One item');

      button.click();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(container.querySelector('p')?.textContent).toBe('2 items');

      // Switch to Spanish
      app.$i18n?.setLocale('es');
      await new Promise(resolve => setTimeout(resolve, 10));

      // Check Spanish translation
      expect(container.querySelector('h1')?.textContent).toBe('¡Bienvenido John!');
      expect(container.querySelector('p')?.textContent).toBe('2 elementos');
    });
  });

  describe('Complex Data Flow', () => {
    it('should handle complex reactive data flow correctly', async () => {
      container.innerHTML = `
        <div uus-state="{
          users: [
            { id: 1, name: 'Alice', age: 25, active: true },
            { id: 2, name: 'Bob', age: 30, active: false }
          ],
          selectedUser: null,
          filter: '',
          get filteredUsers() {
            if (!this.filter) return this.users;
            return this.users.filter(u => 
              u.name.toLowerCase().includes(this.filter.toLowerCase())
            );
          },
          get activeCount() {
            return this.users.filter(u => u.active).length;
          },
          selectUser(user) {
            this.selectedUser = user;
          },
          updateAge(userId, age) {
            const user = this.users.find(u => u.id === userId);
            if (user) user.age = age;
          }
        }">
          <input uus-model="filter" placeholder="Filter users">
          
          <div class="user-list">
            <div 
              uus-for="user in filteredUsers"
              uus-on:click="selectUser(user)"
              uus-class="{ selected: selectedUser && selectedUser.id === user.id }"
            >
              <span uus-text="user.name"></span> - 
              <span uus-text="user.age"></span> years old
              <span uus-show="user.active"> (Active)</span>
            </div>
          </div>
          
          <div uus-if="selectedUser" class="user-details">
            <h3>Selected: <span uus-text="selectedUser.name"></span></h3>
            <input 
              type="number"
              uus-bind:value="selectedUser.age"
              uus-on:input="updateAge(selectedUser.id, $event.target.value)"
            >
          </div>
          
          <p>Active users: <span uus-text="activeCount"></span></p>
        </div>
      `;

      app = new Uus();
      app.mount(container);

      await new Promise(resolve => setTimeout(resolve, 10));

      // Check initial render
      const userDivs = container.querySelectorAll('.user-list > div');
      expect(userDivs.length).toBe(2);
      expect(container.textContent).toContain('Active users: 1');

      // Filter users
      const filterInput = container.querySelector('input[placeholder]') as HTMLInputElement;
      filterInput.value = 'bob';
      filterInput.dispatchEvent(new Event('input'));

      await new Promise(resolve => setTimeout(resolve, 10));

      // Check filtered results
      const filteredDivs = container.querySelectorAll('.user-list > div');
      expect(filteredDivs.length).toBe(1);
      expect(filteredDivs[0].textContent).toContain('Bob');

      // Select user
      filteredDivs[0].click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Check selection
      expect(container.querySelector('.user-details')?.textContent).toContain('Selected: Bob');
      
      // Update age
      const ageInput = container.querySelector('input[type="number"]') as HTMLInputElement;
      ageInput.value = '35';
      ageInput.dispatchEvent(new Event('input'));

      await new Promise(resolve => setTimeout(resolve, 10));

      // Check age updated
      expect(filteredDivs[0].textContent).toContain('35 years old');
    });
  });

  describe('Memory Management Integration', () => {
    it('should properly clean up resources on destroy', async () => {
      const cleanupSpy = vi.fn();
      
      container.innerHTML = `
        <div uus-state="{
          timerId: null,
          counter: 0,
          mounted() {
            this.timerId = setInterval(() => {
              this.counter++;
            }, 100);
          },
          beforeDestroy() {
            if (this.timerId) {
              clearInterval(this.timerId);
              ${cleanupSpy.name}();
            }
          }
        }">
          <p>Counter: <span uus-text="counter"></span></p>
        </div>
      `;

      // Make spy available globally
      (window as any)[cleanupSpy.name] = cleanupSpy;

      app = new Uus();
      app.mount(container);

      await new Promise(resolve => setTimeout(resolve, 250));

      // Check counter incremented
      const initialCount = parseInt(container.querySelector('span')?.textContent || '0');
      expect(initialCount).toBeGreaterThan(0);

      // Get memory stats before destroy
      const statsBefore = app.getMemoryStats();
      expect(statsBefore.resources.totalResources).toBeGreaterThan(0);

      // Destroy app
      app.destroy();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Check cleanup was called
      expect(cleanupSpy).toHaveBeenCalled();

      // Cleanup
      delete (window as any)[cleanupSpy.name];
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle errors gracefully without breaking the app', async () => {
      const errorHandler = vi.fn();
      
      container.innerHTML = `
        <div uus-state="{
          value: 'test',
          throwError() {
            throw new Error('Test error');
          },
          safeOperation() {
            try {
              this.throwError();
            } catch (e) {
              this.value = 'Error handled';
            }
          }
        }">
          <p uus-text="value"></p>
          <button id="throw" uus-on:click="throwError()">Throw Error</button>
          <button id="safe" uus-on:click="safeOperation()">Safe Operation</button>
        </div>
      `;

      app = new Uus({
        onError: errorHandler
      });
      
      app.mount(container);

      await new Promise(resolve => setTimeout(resolve, 10));

      // Click button that throws error
      const throwButton = container.querySelector('#throw') as HTMLButtonElement;
      throwButton.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Check error was caught
      expect(errorHandler).toHaveBeenCalled();
      expect(errorHandler.mock.calls[0][0].message).toContain('Test error');

      // App should still be functional
      const safeButton = container.querySelector('#safe') as HTMLButtonElement;
      safeButton.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Check safe operation worked
      expect(container.querySelector('p')?.textContent).toBe('Error handled');
    });
  });
});