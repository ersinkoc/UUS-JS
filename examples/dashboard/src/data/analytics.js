// Generate mock analytics data
function generateTimeSeriesData(days = 30) {
  const data = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    data.push({
      date: date.toISOString().split('T')[0],
      visitors: Math.floor(Math.random() * 1000) + 500,
      pageViews: Math.floor(Math.random() * 3000) + 1500,
      revenue: Math.floor(Math.random() * 5000) + 2000,
      conversions: Math.floor(Math.random() * 50) + 10,
    });
  }

  return data;
}

// Generate device data
export const deviceData = [
  { device: 'Desktop', sessions: 4523, percentage: 52.3 },
  { device: 'Mobile', sessions: 3234, percentage: 37.4 },
  { device: 'Tablet', sessions: 890, percentage: 10.3 },
];

// Generate traffic sources
export const trafficSources = [
  { source: 'Organic Search', visits: 5432, percentage: 35.2, trend: 'up' },
  { source: 'Direct', visits: 3210, percentage: 20.8, trend: 'up' },
  { source: 'Social Media', visits: 2987, percentage: 19.4, trend: 'down' },
  { source: 'Referral', visits: 2123, percentage: 13.8, trend: 'up' },
  { source: 'Email', visits: 1654, percentage: 10.8, trend: 'stable' },
];

// Generate top pages
export const topPages = [
  { page: '/home', views: 8234, avgTime: '2:45', bounceRate: 23.4 },
  { page: '/products', views: 6432, avgTime: '3:12', bounceRate: 31.2 },
  { page: '/about', views: 4321, avgTime: '1:54', bounceRate: 45.6 },
  { page: '/contact', views: 2134, avgTime: '4:23', bounceRate: 12.3 },
  { page: '/blog', views: 1923, avgTime: '5:43', bounceRate: 28.9 },
];

// Generate country data
export const countryData = [
  { country: 'United States', code: 'US', users: 12543, revenue: 45230 },
  { country: 'United Kingdom', code: 'GB', users: 8234, revenue: 32100 },
  { country: 'Germany', code: 'DE', users: 6543, revenue: 28900 },
  { country: 'France', code: 'FR', users: 5432, revenue: 21300 },
  { country: 'Canada', code: 'CA', users: 4321, revenue: 18700 },
];

// Export time series data
export const timeSeriesData = generateTimeSeriesData(30);

// Calculate summary stats
export const summaryStats = {
  totalVisitors: timeSeriesData.reduce((sum, day) => sum + day.visitors, 0),
  totalPageViews: timeSeriesData.reduce((sum, day) => sum + day.pageViews, 0),
  totalRevenue: timeSeriesData.reduce((sum, day) => sum + day.revenue, 0),
  totalConversions: timeSeriesData.reduce(
    (sum, day) => sum + day.conversions,
    0
  ),
  avgSessionDuration: '3:24',
  bounceRate: 34.5,
  conversionRate: 2.8,
};

// Real-time data generator
export function generateRealtimeData() {
  return {
    activeUsers: Math.floor(Math.random() * 200) + 100,
    pageViewsPerMinute: Math.floor(Math.random() * 50) + 20,
    currentTopPage: topPages[Math.floor(Math.random() * topPages.length)].page,
    recentEvents: [
      { type: 'pageview', page: '/products', time: 'Just now' },
      { type: 'conversion', value: 89.99, time: '1 min ago' },
      { type: 'signup', email: 'user@example.com', time: '2 min ago' },
      { type: 'pageview', page: '/home', time: '3 min ago' },
    ],
  };
}
