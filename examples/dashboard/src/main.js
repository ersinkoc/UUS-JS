import { Uus } from '@uusjs/core';

// Simple chart drawing utility
window.initCharts = function (page) {
  if (page === 'overview') {
    drawChart('traffic-chart');
  } else if (page === 'analytics') {
    drawChart('revenue-chart');
  }
};

function drawChart(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Clear previous chart
  container.innerHTML = '';

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = container.clientWidth || 400;
  canvas.height = 200;
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  // Sample data
  const data = [65, 59, 80, 81, 56, 55, 40];
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Draw simple line chart
  const margin = 40;
  const chartWidth = canvas.width - 2 * margin;
  const chartHeight = canvas.height - 2 * margin;

  // Background
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid lines
  ctx.strokeStyle = '#e9ecef';
  ctx.lineWidth = 1;

  for (let i = 0; i <= 5; i++) {
    const y = margin + (i * chartHeight) / 5;
    ctx.beginPath();
    ctx.moveTo(margin, y);
    ctx.lineTo(margin + chartWidth, y);
    ctx.stroke();
  }

  // Data line
  ctx.strokeStyle = containerId === 'revenue-chart' ? '#2ecc71' : '#3498db';
  ctx.lineWidth = 3;
  ctx.beginPath();

  const max = Math.max(...data);
  // BUG-NEW-021 FIX: Prevent division by zero when data.length <= 1
  const xStep = data.length > 1 ? chartWidth / (data.length - 1) : 0;

  data.forEach((value, index) => {
    const x = data.length > 1 ? margin + (index * xStep) : margin + chartWidth / 2;
    const y = margin + chartHeight - (value / max) * chartHeight;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  // Data points
  ctx.fillStyle = containerId === 'revenue-chart' ? '#2ecc71' : '#3498db';
  data.forEach((value, index) => {
    const x = data.length > 1 ? margin + (index * xStep) : margin + chartWidth / 2;
    const y = margin + chartHeight - (value / max) * chartHeight;

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
  });

  // Labels
  ctx.fillStyle = '#6c757d';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';

  labels.forEach((label, index) => {
    const x = data.length > 1 ? margin + (index * xStep) : margin + chartWidth / 2;
    ctx.fillText(label, x, canvas.height - 10);
  });
}

// Auto-refresh for realtime page
setInterval(() => {
  const currentPage = window.app?.state?.currentPage;
  if (currentPage === 'realtime') {
    // Simulate real-time data updates
    if (window.app?.state?.addRealtimeEvent) {
      // Only update occasionally to avoid spam
      if (Math.random() < 0.3) {
        window.app.state.addRealtimeEvent();
      }
    }
  }
}, 3000);

// Initialize UUS.js app
const app = new Uus();
window.app = app; // For debugging and realtime updates

// Mount the app
app.mount('#app');

// Initialize charts on load
setTimeout(() => {
  window.initCharts('overview');
}, 500);

console.log('📊 UUS.js Analytics Dashboard loaded successfully!');
