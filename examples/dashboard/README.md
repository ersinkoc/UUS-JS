# UUS.js Analytics Dashboard Example

A comprehensive analytics dashboard built with UUS.js, featuring:

- **Real-time Monitoring**: Live data updates and user activity tracking
- **Interactive Charts**: Custom canvas-based charts and visualizations
- **Single-page Application**: Dynamic page switching with reactive state
- **Responsive Design**: Mobile-optimized interface
- **Data Visualization**: Stats cards, charts, tables, and metrics

## Features

### 📊 Dashboard Pages
- **Overview**: Key metrics, traffic charts, and performance summaries
- **Analytics**: Detailed analysis with geographic data and conversion funnels
- **Real-time**: Live user activity and event monitoring
- **Reports**: Downloadable reports and custom report generation
- **Settings**: User preferences and configuration options

### 📈 Data Visualization
- Time-series line charts
- Device breakdown statistics
- Traffic source analysis
- Geographic distribution
- Conversion funnel visualization
- Real-time activity feed

### ⚡ Real-time Features
- Live user count updates
- Real-time event streaming
- Activity feed with recent events
- Auto-refreshing metrics
- WebSocket integration ready

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
├── components/       # Reusable dashboard components
├── data/            # Mock analytics data generators
├── utils/           # Formatting and chart utilities
├── main.js          # App entry point
└── style.css        # Dashboard styles
```

## Key Technologies

- **UUS.js Core**: Reactive state management with directive-based approach
- **Canvas API**: Custom chart rendering
- **Modern JavaScript**: ES6+ features and modules
- **CSS Grid & Flexbox**: Responsive layout design
- **Vite**: Development server and build tool

## Implementation Highlights

### Reactive Analytics State
```html
<div id="app" uus-state="{
  // Navigation state
  currentPage: 'overview',
  sidebarOpen: true,
  
  // Data state
  stats: {
    totalVisitors: 24532,
    totalPageViews: 89421,
    totalRevenue: 12456.78,
    conversionRate: 0.0785
  },
  
  // Methods
  navigateTo(page) {
    this.currentPage = page;
    this.initializeCharts();
  },
  
  formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
  }
}">
```

### Real-time Data Updates
```javascript
// Simulate real-time updates in main.js
setInterval(() => {
  updateDashboardData();
}, 5000);

function updateDashboardData() {
  // Access the UUS.js app state and update metrics
  const state = window.app._state || window.app.state;
  if (state) {
    state.stats.totalVisitors += Math.floor(Math.random() * 10);
    state.stats.totalPageViews += Math.floor(Math.random() * 50);
    state.lastUpdate = new Date().toLocaleTimeString();
  }
}
```

### Custom Chart Rendering
```javascript
export function createChart(containerId, data, type = 'visitors') {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Draw background grid
  ctx.strokeStyle = '#e9ecef';
  // ... grid rendering
  
  // Draw line chart
  ctx.strokeStyle = type === 'revenue' ? '#2ecc71' : '#3498db';
  ctx.lineWidth = 3;
  // ... chart rendering
}
```

### Page-based Chart Initialization
```javascript
// In the navigateTo method within uus-state
navigateTo(page) {
  this.currentPage = page;
  
  // Initialize charts based on current page
  setTimeout(() => {
    if (page === 'overview') {
      window.initCharts('overview');
    } else if (page === 'analytics') {
      window.initCharts('analytics');
    }
  }, 100);
}
```

## Dashboard Components

### Stats Cards
```html
<div class="stat-card">
  <div class="stat-icon">👥</div>
  <div class="stat-content">
    <div class="stat-label">Total Visitors</div>
    <div class="stat-value" uus-text="formatNumber(stats.totalVisitors)"></div>
    <div class="stat-change positive">
      ↑ 12.3% from last period
    </div>
  </div>
</div>
```

### Data Tables
```html
<table class="data-table">
  <tbody>
    <tr uus-for="source in trafficSources">
      <td uus-text="source.source"></td>
      <td uus-text="formatNumber(source.visits)"></td>
      <td>
        <span class="trend" uus-class="'trend-' + source.trend">
          <span uus-show="source.trend === 'up'">↑</span>
        </span>
      </td>
    </tr>
  </tbody>
</table>
```

### Real-time Events
```html
<div class="events-list">
  <div 
    uus-for="event in realtimeData.recentEvents"
    class="event-item"
  >
    <div class="event-icon" uus-class="'event-' + event.type">
      <span uus-show="event.type === 'conversion'">💰</span>
    </div>
    <div class="event-details">
      <div class="event-title">Conversion</div>
      <div class="event-info" uus-text="formatCurrency(event.value)"></div>
    </div>
  </div>
</div>
```

## Customization

### Adding New Metrics
Extend the analytics data structure:

```javascript
// In src/data/analytics.js
export const summaryStats = {
  totalVisitors: calculateTotal('visitors'),
  customMetric: calculateCustomMetric(),
  // Add your metrics here
};
```

### Custom Chart Types
Create new chart renderers:

```javascript
// In src/utils/charts.js
export function createBarChart(containerId, data) {
  // Custom bar chart implementation
}

export function createPieChart(containerId, data) {
  // Custom pie chart implementation  
}
```

### Theme Customization
Modify CSS variables for styling:

```css
:root {
  --primary-color: #3498db;
  --sidebar-bg: #1a202c;
  --text-color: #2c3e50;
  /* Custom dashboard colors */
}
```

### Real-time Integration
Connect to actual analytics APIs:

```javascript
// Replace mock data with real API calls
app.use(sse({
  url: '/api/analytics/stream',
  auth: () => ({ token: getAuthToken() })
}));

// Handle different event types
app.$sse.on('pageview', updatePageViews);
app.$sse.on('conversion', updateConversions);
app.$sse.on('user:join', updateActiveUsers);
```

## Data Sources

The dashboard supports multiple data integration patterns:

### REST API Integration
```javascript
// Fetch data from REST endpoints
async loadAnalytics() {
  const response = await fetch('/api/analytics');
  this.analyticsData = await response.json();
}
```

### WebSocket Integration
```javascript
// Real-time WebSocket updates
app.use(websocket({
  url: 'wss://analytics.example.com'
}));

app.$ws.on('metrics', (data) => {
  app.state.realtimeData = data;
});
```

### GraphQL Integration
```javascript
// GraphQL queries for complex data
const ANALYTICS_QUERY = `
  query GetAnalytics($dateRange: String!) {
    analytics(dateRange: $dateRange) {
      visitors
      pageViews
      revenue
    }
  }
`;
```

## Performance Optimization

- Efficient chart rendering with Canvas API
- Lazy loading of chart data
- Debounced real-time updates
- Virtual scrolling for large datasets
- Memoized computed properties

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers with Canvas support

## License

MIT