/**
 * UUS.js DevTools - Browser Extension for Development
 * Provides component inspection, state debugging, and performance monitoring
 */

export interface DevToolsConfig {
  enabled: boolean;
  port?: number;
  theme?: 'light' | 'dark' | 'auto';
}

export interface ComponentInfo {
  id: string;
  name: string;
  element: HTMLElement;
  state: Record<string, any>;
  props?: Record<string, any>;
  children?: ComponentInfo[];
  directives: string[];
}

export interface StateChange {
  timestamp: number;
  component: string;
  property: string;
  oldValue: any;
  newValue: any;
  source: string;
}

export interface PerformanceMetric {
  component: string;
  metric: string;
  value: number;
  timestamp: number;
}

export class UusDevTools {
  private config: DevToolsConfig;
  private components: Map<string, ComponentInfo> = new Map();
  private stateHistory: StateChange[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private isConnected = false;
  private port: chrome.runtime.Port | null = null;

  constructor(config: DevToolsConfig = { enabled: true }) {
    this.config = config;
    
    if (this.config.enabled) {
      this.init();
    }
  }

  private init(): void {
    // Check if we're in a browser extension context
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      this.connectToExtension();
    } else {
      this.setupStandaloneMode();
    }

    // Inject global hook for UUS instances
    this.injectGlobalHook();
  }

  private connectToExtension(): void {
    try {
      // Connect to background script
      this.port = chrome.runtime.connect({ name: 'uus-devtools' });
      
      this.port.onMessage.addListener((msg) => {
        this.handleMessage(msg);
      });

      this.port.onDisconnect.addListener(() => {
        this.isConnected = false;
        console.log('[UUS DevTools] Disconnected from extension');
      });

      this.isConnected = true;
      console.log('[UUS DevTools] Connected to extension');
    } catch (error) {
      console.warn('[UUS DevTools] Failed to connect to extension:', error);
      this.setupStandaloneMode();
    }
  }

  private setupStandaloneMode(): void {
    // Fallback for development without extension
    console.log('[UUS DevTools] Running in standalone mode');
    
    // Create a simple UI overlay
    if (typeof document !== 'undefined') {
      this.createStandaloneUI();
    }
  }

  private createStandaloneUI(): void {
    const panel = document.createElement('div');
    panel.id = 'uus-devtools-panel';
    panel.innerHTML = `
      <style>
        #uus-devtools-panel {
          position: fixed;
          bottom: 0;
          right: 0;
          width: 400px;
          height: 300px;
          background: #1e1e1e;
          color: #fff;
          font-family: monospace;
          font-size: 12px;
          border: 1px solid #333;
          z-index: 999999;
          display: flex;
          flex-direction: column;
        }
        
        #uus-devtools-header {
          background: #252526;
          padding: 8px;
          border-bottom: 1px solid #333;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        #uus-devtools-tabs {
          display: flex;
          background: #2d2d30;
          border-bottom: 1px solid #333;
        }
        
        .uus-tab {
          padding: 8px 16px;
          cursor: pointer;
          border-right: 1px solid #333;
        }
        
        .uus-tab.active {
          background: #1e1e1e;
          color: #4ec9b0;
        }
        
        #uus-devtools-content {
          flex: 1;
          overflow: auto;
          padding: 8px;
        }
        
        .uus-component {
          margin: 4px 0;
          padding: 4px;
          border-left: 2px solid #4ec9b0;
        }
        
        .uus-state-item {
          margin: 2px 0;
          padding: 2px 8px;
        }
        
        .uus-state-key {
          color: #9cdcfe;
        }
        
        .uus-state-value {
          color: #ce9178;
        }
        
        .uus-close {
          cursor: pointer;
          padding: 4px 8px;
          background: #c73e3e;
        }
      </style>
      
      <div id="uus-devtools-header">
        <span>🔧 UUS DevTools</span>
        <span class="uus-close" onclick="this.parentElement.parentElement.remove()">✕</span>
      </div>
      
      <div id="uus-devtools-tabs">
        <div class="uus-tab active" data-tab="components">Components</div>
        <div class="uus-tab" data-tab="state">State</div>
        <div class="uus-tab" data-tab="performance">Performance</div>
      </div>
      
      <div id="uus-devtools-content">
        <div id="components-panel">Loading components...</div>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Setup tab switching
    panel.querySelectorAll('.uus-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        panel.querySelectorAll('.uus-tab').forEach(t => t.classList.remove('active'));
        (e.target as HTMLElement).classList.add('active');
        this.switchTab((e.target as HTMLElement).dataset.tab!);
      });
    });

    // Start updating UI
    this.updateStandaloneUI();
  }

  private switchTab(tab: string): void {
    const content = document.getElementById('uus-devtools-content');
    if (!content) return;

    switch (tab) {
      case 'components':
        content.innerHTML = this.renderComponentsPanel();
        break;
      case 'state':
        content.innerHTML = this.renderStatePanel();
        break;
      case 'performance':
        content.innerHTML = this.renderPerformancePanel();
        break;
    }
  }

  private renderComponentsPanel(): string {
    if (this.components.size === 0) {
      return '<div>No components detected</div>';
    }

    let html = '';
    this.components.forEach(component => {
      html += `
        <div class="uus-component">
          <div><strong>${component.name}</strong> #${component.id}</div>
          <div>Directives: ${component.directives.join(', ')}</div>
          <div>State keys: ${Object.keys(component.state).join(', ')}</div>
        </div>
      `;
    });
    
    return html;
  }

  private renderStatePanel(): string {
    if (this.stateHistory.length === 0) {
      return '<div>No state changes recorded</div>';
    }

    let html = '<div>';
    this.stateHistory.slice(-20).reverse().forEach(change => {
      const time = new Date(change.timestamp).toLocaleTimeString();
      html += `
        <div class="uus-state-item">
          <div>${time} - ${change.component}</div>
          <div>
            <span class="uus-state-key">${change.property}:</span>
            <span class="uus-state-value">${JSON.stringify(change.oldValue)} → ${JSON.stringify(change.newValue)}</span>
          </div>
        </div>
      `;
    });
    html += '</div>';
    
    return html;
  }

  private renderPerformancePanel(): string {
    if (this.performanceMetrics.length === 0) {
      return '<div>No performance metrics collected</div>';
    }

    const avgRenderTime = this.performanceMetrics
      .filter(m => m.metric === 'renderTime')
      .reduce((sum, m) => sum + m.value, 0) / this.performanceMetrics.length;

    return `
      <div>
        <div>Average Render Time: ${avgRenderTime.toFixed(2)}ms</div>
        <div>Total Components: ${this.components.size}</div>
        <div>State Changes: ${this.stateHistory.length}</div>
      </div>
    `;
  }

  private updateStandaloneUI(): void {
    if (!document.getElementById('uus-devtools-panel')) return;

    // Update current tab
    const activeTab = document.querySelector('.uus-tab.active') as HTMLElement;
    if (activeTab) {
      this.switchTab(activeTab.dataset.tab!);
    }

    // Schedule next update
    setTimeout(() => this.updateStandaloneUI(), 1000);
  }

  private injectGlobalHook(): void {
    // Inject hook into window for UUS instances to register
    if (typeof window !== 'undefined') {
      (window as any).__UUS_DEVTOOLS__ = {
        registerComponent: this.registerComponent.bind(this),
        updateState: this.recordStateChange.bind(this),
        recordMetric: this.recordMetric.bind(this),
        version: '0.0.1'
      };
    }
  }

  private handleMessage(msg: any): void {
    switch (msg.type) {
      case 'component-tree':
        this.updateComponentTree(msg.data);
        break;
      case 'state-change':
        this.recordStateChange(msg.data);
        break;
      case 'performance-metric':
        this.recordMetric(msg.data);
        break;
    }
  }

  public registerComponent(info: ComponentInfo): void {
    this.components.set(info.id, info);
    this.sendToExtension('component-registered', info);
  }

  public updateComponentTree(components: ComponentInfo[]): void {
    this.components.clear();
    components.forEach(c => this.components.set(c.id, c));
  }

  public recordStateChange(change: StateChange): void {
    this.stateHistory.push(change);
    
    // Keep only last 100 changes
    if (this.stateHistory.length > 100) {
      this.stateHistory.shift();
    }
    
    this.sendToExtension('state-change', change);
  }

  public recordMetric(metric: PerformanceMetric): void {
    this.performanceMetrics.push(metric);
    
    // Keep only last 100 metrics
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics.shift();
    }
    
    this.sendToExtension('performance-metric', metric);
  }

  private sendToExtension(type: string, data: any): void {
    if (this.isConnected && this.port) {
      this.port.postMessage({ type, data });
    }
  }

  public getComponents(): ComponentInfo[] {
    return Array.from(this.components.values());
  }

  public getStateHistory(): StateChange[] {
    return this.stateHistory;
  }

  public getPerformanceMetrics(): PerformanceMetric[] {
    return this.performanceMetrics;
  }

  public clearHistory(): void {
    this.stateHistory = [];
    this.performanceMetrics = [];
  }

  public destroy(): void {
    if (this.port) {
      this.port.disconnect();
    }
    
    // Remove standalone UI if exists
    const panel = document.getElementById('uus-devtools-panel');
    if (panel) {
      panel.remove();
    }
    
    // Remove global hook
    if (typeof window !== 'undefined') {
      delete (window as any).__UUS_DEVTOOLS__;
    }
  }
}

// Export for browser extension
if (typeof chrome !== 'undefined' && chrome.devtools) {
  chrome.devtools.panels.create(
    'UUS.js',
    'icon.png',
    'panel.html',
    (panel) => {
      console.log('[UUS DevTools] Panel created');
    }
  );
}

// Auto-initialize in development
if (process.env.NODE_ENV !== 'production') {
  const devtools = new UusDevTools();
  (window as any).__UUS_DEVTOOLS_INSTANCE__ = devtools;
}

export default UusDevTools;