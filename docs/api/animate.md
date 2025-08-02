# Animate API Reference

The animate package (`@uusjs/animate`) provides a powerful animation system with presets, spring physics, and FLIP animations.

## Installation

```bash
npm install @uusjs/animate
```

## Basic Usage

```javascript
import { createAnimate } from '@uusjs/animate';

const animate = createAnimate();
app.use(animate);
```

## createAnimate()

Creates an animation instance.

```typescript
function createAnimate(options?: AnimateOptions): AnimatePlugin

interface AnimateOptions {
  duration?: number;        // Default duration (ms)
  easing?: string;         // Default easing function
  stagger?: number;        // Default stagger delay (ms)
}
```

**Example:**
```javascript
const animate = createAnimate({
  duration: 300,
  easing: 'ease-out'
});
```

## Animation Methods

### animate()

Animates an element with keyframes or presets.

```typescript
animate(
  element: Element,
  animation: string | Keyframes,
  options?: AnimationOptions
): Promise<void>

interface AnimationOptions {
  duration?: number;        // Animation duration (ms)
  delay?: number;          // Start delay (ms)
  easing?: string;         // Easing function
  fill?: 'forwards' | 'backwards' | 'both';
  iterations?: number;     // Repeat count
  direction?: 'normal' | 'reverse' | 'alternate';
  stagger?: number | ((index: number) => number);
  onStart?: () => void;    // Start callback
  onComplete?: () => void; // Complete callback
}
```

**Examples:**

```javascript
// Using preset
await animate(element, 'fadeIn');

// With options
await animate(element, 'slideIn', {
  duration: 500,
  easing: 'ease-out',
  delay: 100
});

// Custom keyframes
await animate(element, {
  from: { opacity: '0', transform: 'scale(0.8)' },
  to: { opacity: '1', transform: 'scale(1)' }
});

// Multiple keyframes
await animate(element, [
  { opacity: '0', transform: 'rotate(0deg)' },
  { opacity: '1', transform: 'rotate(180deg)' },
  { opacity: '0', transform: 'rotate(360deg)' }
]);
```

### spring()

Animates with spring physics.

```typescript
spring(
  from: number,
  to: number,
  options?: SpringOptions
): SpringAnimation

interface SpringOptions {
  stiffness?: number;      // Spring stiffness (default: 170)
  damping?: number;        // Spring damping (default: 26)
  mass?: number;          // Mass (default: 1)
  velocity?: number;      // Initial velocity (default: 0)
  precision?: number;     // Settling precision (default: 0.01)
  onUpdate?: (value: number) => void;
  onComplete?: () => void;
}
```

**Examples:**

```javascript
// Basic spring
spring(0, 100, {
  onUpdate: (value) => {
    element.style.transform = `translateX(${value}px)`;
  }
});

// Bouncy spring
spring(0, 1, {
  stiffness: 300,
  damping: 10,
  onUpdate: (value) => {
    element.style.opacity = value;
  }
});

// With initial velocity
spring(0, 200, {
  velocity: 1000,
  onUpdate: (value) => {
    element.style.width = `${value}px`;
  }
});
```

### flip()

FLIP (First, Last, Invert, Play) animation for smooth transitions.

```typescript
flip(
  element: Element,
  updateFn: () => void,
  options?: FlipOptions
): Promise<void>

interface FlipOptions {
  duration?: number;
  easing?: string;
  scale?: boolean;        // Animate scale changes
  opacity?: boolean;      // Animate opacity
}
```

**Examples:**

```javascript
// Position change
await animate.flip(element, () => {
  // Move element to new position
  element.style.left = '200px';
  element.style.top = '100px';
});

// Size change
await animate.flip(element, () => {
  element.style.width = '300px';
  element.style.height = '200px';
}, {
  scale: true
});

// Reorder list
await animate.flip(container, () => {
  // Reorder DOM elements
  items.sort((a, b) => b.value - a.value);
  items.forEach(item => container.appendChild(item));
});
```

### stagger()

Animates multiple elements with staggered timing.

```typescript
stagger(
  elements: Element[],
  animation: string | Keyframes,
  options?: StaggerOptions
): Promise<void>

interface StaggerOptions extends AnimationOptions {
  stagger?: number | ((index: number, total: number) => number);
  from?: 'start' | 'end' | 'center' | 'random';
}
```

**Examples:**

```javascript
// Fixed stagger
const items = document.querySelectorAll('.item');
await animate.stagger(items, 'fadeIn', {
  stagger: 50 // 50ms between each
});

// Dynamic stagger
await animate.stagger(items, 'slideIn', {
  stagger: (index) => index * 30,
  duration: 400
});

// From center
await animate.stagger(items, 'scaleIn', {
  stagger: 50,
  from: 'center'
});

// Random stagger
await animate.stagger(items, 'rotateIn', {
  stagger: () => Math.random() * 100,
  from: 'random'
});
```

### timeline()

Creates an animation timeline for sequencing.

```typescript
timeline(): Timeline

interface Timeline {
  add(
    element: Element,
    animation: string | Keyframes,
    options?: AnimationOptions,
    position?: string | number
  ): Timeline;
  
  play(): Promise<void>;
  pause(): void;
  reverse(): void;
  seek(time: number): void;
  clear(): void;
}
```

**Examples:**

```javascript
const tl = animate.timeline();

// Sequential animations
tl.add(el1, 'fadeIn', { duration: 300 })
  .add(el2, 'slideIn', { duration: 400 })
  .add(el3, 'rotateIn', { duration: 500 });

// Parallel animations (start at same time)
tl.add(el1, 'fadeIn', { duration: 300 }, 0)
  .add(el2, 'slideIn', { duration: 400 }, 0);

// Relative positioning
tl.add(el1, 'fadeIn', { duration: 300 })
  .add(el2, 'slideIn', { duration: 400 }, '-=100'); // 100ms before previous ends
  .add(el3, 'scaleIn', { duration: 300 }, '+=50');  // 50ms after previous ends

// Play timeline
await tl.play();

// Control timeline
tl.pause();
tl.reverse();
tl.seek(500); // Jump to 500ms
```

## Animation Presets

### Built-in Presets

```javascript
// Fade animations
'fadeIn'      // opacity: 0 → 1
'fadeOut'     // opacity: 1 → 0

// Slide animations
'slideIn'     // translateX: -100% → 0
'slideOut'    // translateX: 0 → 100%
'slideInUp'   // translateY: 100% → 0
'slideInDown' // translateY: -100% → 0

// Scale animations
'scaleIn'     // scale: 0 → 1
'scaleOut'    // scale: 1 → 0
'scaleInUp'   // scale: 0 → 1.1 → 1
'scaleInDown' // scale: 1.2 → 1

// Rotate animations
'rotateIn'    // rotate: -180deg → 0
'rotateOut'   // rotate: 0 → 180deg

// Special effects
'bounce'      // Bouncing animation
'shake'       // Shake effect
'pulse'       // Pulsing effect
'flip'        // 3D flip
'swing'       // Swinging motion
'rubberBand'  // Rubber band effect
'flash'       // Flash effect
'headShake'   // Head shake
'jello'       // Jello wobble
'heartBeat'   // Heart beat pulse
```

### Using Presets

```javascript
// Simple preset
await animate(element, 'fadeIn');

// Preset with options
await animate(element, 'bounce', {
  duration: 800,
  iterations: 2
});

// Combine presets in timeline
const tl = animate.timeline();
tl.add(el, 'fadeIn', { duration: 300 })
  .add(el, 'bounce', { duration: 600 });
```

### Custom Presets

```javascript
// Register custom preset
animate.registerPreset('customSlide', {
  from: { 
    opacity: '0',
    transform: 'translateX(-50px) rotate(-5deg)'
  },
  to: { 
    opacity: '1',
    transform: 'translateX(0) rotate(0)'
  }
});

// Use custom preset
await animate(element, 'customSlide');
```

## Directives

### uus-animate

Animates element on mount.

```html
<!-- Simple animation -->
<div uus-animate="fadeIn">
  This fades in when mounted
</div>

<!-- With options -->
<div 
  uus-animate="slideIn"
  uus-duration="500"
  uus-delay="200"
  uus-easing="ease-out"
>
  Slides in with custom timing
</div>
```

### uus-animate-enter / uus-animate-leave

Enter/leave animations for conditional elements.

```html
<div 
  uus-show="isVisible"
  uus-animate-enter="fadeIn"
  uus-animate-leave="fadeOut"
>
  Animates in and out
</div>

<!-- With different animations -->
<div 
  uus-if="showPanel"
  uus-animate-enter="slideInUp"
  uus-animate-leave="slideOutDown"
  uus-duration="400"
>
  Panel content
</div>
```

### uus-stagger

Staggers animations for list items.

```html
<ul>
  <li 
    uus-for="item in items"
    uus-animate="fadeIn"
    uus-stagger="50"
  >
    <span uus-text="item"></span>
  </li>
</ul>

<!-- Dynamic stagger -->
<div 
  uus-for="(card, index) in cards"
  uus-animate="scaleIn"
  :uus-stagger="index * 30"
>
  Card content
</div>
```

### uus-flip

FLIP animation for layout changes.

```html
<div uus-flip="true">
  <div 
    uus-for="item in sortedItems"
    :key="item.id"
  >
    <span uus-text="item.name"></span>
  </div>
</div>
```

## Spring Physics

### Spring Configuration

```javascript
// Stiff spring (less bounce)
spring(0, 100, {
  stiffness: 400,
  damping: 40
});

// Loose spring (more bounce)
spring(0, 100, {
  stiffness: 100,
  damping: 10
});

// Heavy spring (slower)
spring(0, 100, {
  mass: 2,
  stiffness: 200
});

// Critical damping (no overshoot)
spring(0, 100, {
  stiffness: 170,
  damping: 26
});
```

### Common Spring Presets

```javascript
const presets = {
  // No wobble
  stiff: { stiffness: 400, damping: 40 },
  
  // Gentle wobble
  gentle: { stiffness: 120, damping: 14 },
  
  // Bouncy
  wobbly: { stiffness: 180, damping: 12 },
  
  // Very bouncy
  loose: { stiffness: 100, damping: 10 },
  
  // Slow and smooth
  molasses: { stiffness: 60, damping: 20 }
};

// Use preset
spring(0, 100, {
  ...presets.bouncy,
  onUpdate: (value) => {
    element.style.transform = `scale(${value})`;
  }
});
```

## Easing Functions

### Built-in Easings

```javascript
// CSS easings
'linear'
'ease'
'ease-in'
'ease-out'
'ease-in-out'

// Cubic bezier
'cubic-bezier(0.68, -0.55, 0.265, 1.55)'

// Custom easings
animate.registerEasing('bounce', (t) => {
  const n1 = 7.5625;
  const d1 = 2.75;
  
  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
});
```

## Performance

### GPU Acceleration

```javascript
// Properties that trigger GPU acceleration
await animate(element, {
  from: { transform: 'translateX(0) translateZ(0)' },
  to: { transform: 'translateX(100px) translateZ(0)' }
});

// Or use will-change
element.style.willChange = 'transform';
await animate(element, 'slideIn');
element.style.willChange = 'auto'; // Clean up
```

### Batch Animations

```javascript
// Batch DOM reads/writes
const positions = elements.map(el => el.getBoundingClientRect());

// Then batch animations
elements.forEach((el, i) => {
  animate(el, {
    from: { transform: `translateY(${positions[i].top}px)` },
    to: { transform: 'translateY(0)' }
  });
});
```

### Cancel Animations

```javascript
// Store animation reference
const animation = animate(element, 'fadeIn');

// Cancel if needed
animation.cancel();

// Or use AbortController
const controller = new AbortController();
animate(element, 'slideIn', {
  signal: controller.signal
});

// Cancel
controller.abort();
```

## Advanced Patterns

### Gesture-based Animation

```javascript
let startX = 0;
let currentX = 0;

element.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
});

element.addEventListener('touchmove', (e) => {
  currentX = e.touches[0].clientX;
  const diff = currentX - startX;
  
  element.style.transform = `translateX(${diff}px)`;
});

element.addEventListener('touchend', () => {
  const diff = currentX - startX;
  
  if (Math.abs(diff) > 100) {
    // Snap to new position
    spring(diff, diff > 0 ? 300 : -300, {
      onUpdate: (value) => {
        element.style.transform = `translateX(${value}px)`;
      }
    });
  } else {
    // Snap back
    spring(diff, 0, {
      onUpdate: (value) => {
        element.style.transform = `translateX(${value}px)`;
      }
    });
  }
});
```

### Scroll-triggered Animations

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animate(entry.target, 'fadeIn', {
        duration: 600,
        delay: entry.target.dataset.delay || 0
      });
      observer.unobserve(entry.target);
    }
  });
});

document.querySelectorAll('[data-scroll-animate]').forEach(el => {
  observer.observe(el);
});
```

### Morphing Animation

```javascript
async function morph(from, to) {
  const fromRect = from.getBoundingClientRect();
  const toRect = to.getBoundingClientRect();
  
  // Clone and position
  const clone = from.cloneNode(true);
  clone.style.position = 'fixed';
  clone.style.left = `${fromRect.left}px`;
  clone.style.top = `${fromRect.top}px`;
  clone.style.width = `${fromRect.width}px`;
  clone.style.height = `${fromRect.height}px`;
  document.body.appendChild(clone);
  
  // Hide originals
  from.style.opacity = '0';
  to.style.opacity = '0';
  
  // Animate morph
  await animate(clone, [
    {
      left: `${fromRect.left}px`,
      top: `${fromRect.top}px`,
      width: `${fromRect.width}px`,
      height: `${fromRect.height}px`
    },
    {
      left: `${toRect.left}px`,
      top: `${toRect.top}px`,
      width: `${toRect.width}px`,
      height: `${toRect.height}px`
    }
  ], {
    duration: 600,
    easing: 'ease-in-out'
  });
  
  // Cleanup
  clone.remove();
  to.style.opacity = '1';
}
```

## TypeScript Support

```typescript
import { 
  AnimatePlugin,
  AnimationOptions,
  SpringOptions,
  Timeline,
  Keyframes
} from '@uusjs/animate';

// Typed animations
const options: AnimationOptions = {
  duration: 500,
  easing: 'ease-out',
  delay: 100
};

// Typed keyframes
const keyframes: Keyframes = {
  from: { opacity: '0' },
  to: { opacity: '1' }
};

// Typed spring
const springOptions: SpringOptions = {
  stiffness: 200,
  damping: 20,
  onUpdate: (value: number) => {
    console.log(value);
  }
};
```

## Best Practices

1. **Use GPU-accelerated properties** (transform, opacity)
2. **Batch animations** to avoid layout thrashing
3. **Cancel unused animations** to free resources
4. **Use will-change sparingly** and clean up
5. **Prefer CSS animations** for simple cases
6. **Test on low-end devices** for performance
7. **Use spring animations** for natural motion

## Next Steps

- Explore [Forms API](./forms.md) for form animations
- See [Animation Guide](../guides/animations.md) for examples
- Learn [Performance Tips](../guides/performance.md)