# UUS.js Deployment Guide

This directory contains deployment configurations and scripts for UUS.js applications.

## Quick Start

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
./deploy/deploy.sh vercel production
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
./deploy/deploy.sh netlify production
```

### Deploy with Docker

```bash
# Build and run locally
docker-compose -f deploy/docker-compose.yml up

# Deploy to production
./deploy/deploy.sh docker production
```

### Deploy to Kubernetes

```bash
# Apply Kubernetes configuration
kubectl apply -f deploy/k8s/deployment.yaml

# Check deployment status
kubectl get pods -l app=uusjs
```

## Deployment Options

### 1. Static Hosting (Vercel/Netlify)

Best for:
- Static websites
- JAMstack applications
- Serverless functions

Configuration files:
- `vercel.json` - Vercel configuration
- `netlify.toml` - Netlify configuration

### 2. Container Deployment (Docker)

Best for:
- Full-stack applications
- Microservices
- Custom server requirements

Files:
- `docker/Dockerfile` - Multi-stage Docker build
- `docker-compose.yml` - Local development setup

### 3. Kubernetes Deployment

Best for:
- Large-scale applications
- High availability requirements
- Auto-scaling needs

Files:
- `k8s/deployment.yaml` - Kubernetes manifests

### 4. NPM Publishing

For publishing UUS.js packages to npm:

```bash
# Publish packages
./deploy/deploy.sh npm production
```

## Environment Variables

### Required for Production

```env
NODE_ENV=production
```

### Optional

```env
# Analytics
ANALYTICS_ID=your-analytics-id

# API Configuration
API_URL=https://api.example.com

# Feature Flags
ENABLE_DEBUG=false
```

## CI/CD with GitHub Actions

The repository includes GitHub Actions workflows for:

1. **CI Pipeline** (`.github/workflows/ci.yml`)
   - Linting
   - Type checking
   - Testing
   - Building
   - Benchmarking

2. **Release Pipeline** (`.github/workflows/release.yml`)
   - Automated versioning
   - Package publishing
   - Release notes generation

3. **Deploy Pipeline** (`.github/workflows/deploy.yml`)
   - Documentation deployment
   - Demo site deployment
   - Production deployment

## Security Considerations

1. **Environment Variables**
   - Never commit sensitive data
   - Use secrets management
   - Rotate credentials regularly

2. **Container Security**
   - Use minimal base images
   - Run as non-root user
   - Scan for vulnerabilities

3. **Network Security**
   - Use HTTPS everywhere
   - Implement proper CORS
   - Add security headers

## Performance Optimization

1. **Build Optimization**
   - Tree shaking enabled
   - Code splitting configured
   - Compression enabled

2. **Runtime Optimization**
   - Lazy loading
   - Resource hints
   - Service workers

3. **CDN Configuration**
   - Static assets cached
   - Geographic distribution
   - Compression at edge

## Monitoring

### Recommended Services

1. **Error Tracking**
   - Sentry
   - Rollbar
   - Bugsnag

2. **Performance Monitoring**
   - DataDog
   - New Relic
   - AppDynamics

3. **Uptime Monitoring**
   - Pingdom
   - UptimeRobot
   - StatusCake

## Rollback Strategy

### Vercel/Netlify
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]
```

### Docker/Kubernetes
```bash
# Kubernetes rollback
kubectl rollout undo deployment/uusjs-app

# Docker tag management
docker tag uusjs/core:latest uusjs/core:backup
```

## Troubleshooting

### Build Failures
1. Check Node.js version (requires 18+)
2. Clear cache: `pnpm store prune`
3. Reinstall dependencies: `pnpm install --force`

### Deployment Failures
1. Check environment variables
2. Review build logs
3. Verify API endpoints

### Performance Issues
1. Run benchmarks: `pnpm bench`
2. Check bundle size: `pnpm size`
3. Profile with DevTools

## Support

For deployment support:
- Documentation: https://uusjs.dev/docs/deployment
- GitHub Issues: https://github.com/uusjs/uus/issues
- Discord: https://discord.gg/uusjs