/**
 * Simple chart rendering using Canvas
 */
export function createChart(containerId, data, type = 'visitors') {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Clear previous chart
  container.innerHTML = '';

  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Set canvas size
  const containerRect = container.getBoundingClientRect();
  canvas.width = containerRect.width;
  canvas.height = 300;

  container.appendChild(canvas);

  // Chart configuration
  const padding = 40;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = canvas.height - padding * 2;

  // Prepare data
  const values = data.map((d) => d[type] || d.visitors);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue;

  // Draw background
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw grid lines
  ctx.strokeStyle = '#e9ecef';
  ctx.lineWidth = 1;

  // Horizontal grid lines
  for (let i = 0; i <= 5; i++) {
    const y = padding + (chartHeight / 5) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(canvas.width - padding, y);
    ctx.stroke();
  }

  // Vertical grid lines
  const stepX = chartWidth / (data.length - 1);
  for (let i = 0; i < data.length; i += Math.ceil(data.length / 6)) {
    const x = padding + stepX * i;
    ctx.beginPath();
    ctx.moveTo(x, padding);
    ctx.lineTo(x, canvas.height - padding);
    ctx.stroke();
  }

  // Draw line chart
  if (data.length > 0) {
    ctx.strokeStyle = type === 'revenue' ? '#2ecc71' : '#3498db';
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let i = 0; i < data.length; i++) {
      const x = padding + (chartWidth / (data.length - 1)) * i;
      const y =
        padding + chartHeight - ((values[i] - minValue) / range) * chartHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Draw points
    ctx.fillStyle = type === 'revenue' ? '#2ecc71' : '#3498db';
    for (let i = 0; i < data.length; i++) {
      const x = padding + (chartWidth / (data.length - 1)) * i;
      const y =
        padding + chartHeight - ((values[i] - minValue) / range) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fill area under curve
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = type === 'revenue' ? '#2ecc71' : '#3498db';
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);

    for (let i = 0; i < data.length; i++) {
      const x = padding + (chartWidth / (data.length - 1)) * i;
      const y =
        padding + chartHeight - ((values[i] - minValue) / range) * chartHeight;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Draw Y-axis labels
  ctx.fillStyle = '#6c757d';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  for (let i = 0; i <= 5; i++) {
    const value = minValue + (range / 5) * (5 - i);
    const y = padding + (chartHeight / 5) * i;
    const formatted =
      type === 'revenue'
        ? '$' + Math.round(value / 1000) + 'k'
        : Math.round(value / 1000) + 'k';
    ctx.fillText(formatted, padding - 10, y);
  }

  // Draw X-axis labels
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const labelStep = Math.ceil(data.length / 6);
  for (let i = 0; i < data.length; i += labelStep) {
    const x = padding + (chartWidth / (data.length - 1)) * i;
    const date = new Date(data[i].date);
    const label = date.getMonth() + 1 + '/' + date.getDate();
    ctx.fillText(label, x, canvas.height - padding + 10);
  }
}

/**
 * Create a simple donut chart
 */
export function createDonutChart(containerId, data, colors) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = 200;
  canvas.height = 200;

  container.appendChild(canvas);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 80;
  const innerRadius = 40;

  let currentAngle = -Math.PI / 2;
  const total = data.reduce((sum, item) => sum + item.value, 0);

  data.forEach((item, index) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;

    // Draw outer arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.arc(
      centerX,
      centerY,
      innerRadius,
      currentAngle + sliceAngle,
      currentAngle,
      true
    );
    ctx.closePath();

    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();

    currentAngle += sliceAngle;
  });
}
