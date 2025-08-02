import { Uus } from '@uusjs/core';
import './style.css';

// App template
const template = `
  <div class="container" uus-state>
    <header>
      <h1>Uus.js + Vite</h1>
      <p>Fast development with HMR</p>
    </header>
    
    <main>
      <section class="card">
        <h2>Counter</h2>
        <div class="counter">
          <button @click="count--">-</button>
          <span class="count" uus-text="count"></span>
          <button @click="count++">+</button>
        </div>
      </section>
      
      <section class="card">
        <h2>Greeting</h2>
        <input 
          type="text" 
          uus-model="name" 
          placeholder="Enter your name"
        >
        <p uus-show="name" class="greeting">
          Hello, <strong uus-text="name"></strong>! 👋
        </p>
      </section>
      
      <section class="card">
        <h2>Features</h2>
        <ul>
          <li uus-for="feature in features" :key="feature">
            <span uus-text="feature"></span>
          </li>
        </ul>
      </section>
    </main>
  </div>
`;

// Create app
const app = new Uus({
  state: {
    count: 0,
    name: '',
    features: [
      '⚡ Lightning fast HMR',
      '🎯 Reactive data binding',
      '🎨 Scoped styling',
      '📦 Optimized builds',
      '🔧 Zero config'
    ]
  }
});

// Mount app
document.getElementById('app').innerHTML = template;
app.mount('#app');