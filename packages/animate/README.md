# @uusjs/animate

Animation system for Uus.js with built-in presets, spring physics, and FLIP animations.

## Installation

```bash
npm install @uusjs/animate
```

## Usage

```javascript
import { Uus } from '@uusjs/core';
import { createAnimate } from '@uusjs/animate';

const app = new Uus();
app.use(createAnimate());
app.mount('#app');
```

### Basic Animations

```html
<!-- Fade in animation -->
<div uus-animate="fadeIn">Hello World</div>

<!-- With custom timing -->
<div uus-animate="slideInUp" 
     uus-duration="500" 
     uus-delay="200"
     uus-easing="ease-out">
  Slide content
</div>

<!-- Triggered on scroll -->
<div uus-animate="scaleIn" 
     uus-trigger="visible"
     uus-threshold="0.5">
  Appears on scroll
</div>
```

### Animation Presets

Built-in animations include:
- **Fade**: fadeIn, fadeOut
- **Slide**: slideInLeft, slideInRight, slideInUp, slideInDown
- **Scale**: scaleIn, scaleOut
- **Rotate**: rotateIn, rotateOut
- **Bounce**: bounceIn, bounceOut
- **Effects**: shake, pulse
- **Flip**: flipInX, flipInY

### Stagger Animations

Animate children elements with delays:

```html
<ul uus-stagger="50">
  <li uus-animate="fadeIn">Item 1</li>
  <li uus-animate="fadeIn">Item 2</li>
  <li uus-animate="fadeIn">Item 3</li>
</ul>

<!-- Different stagger directions -->
<div uus-stagger="100" uus-stagger-dir="reverse">
  <!-- Children animate in reverse order -->
</div>
```

### Spring Animations

Physics-based animations using spring dynamics:

```html
<div uus-state="{ x: 0 }">
  <div uus-spring="left:x" 
       uus-stiffness="180"
       uus-damping="12">
    Spring box
  </div>
  <button uus-on:click="x = 200">Move</button>
</div>
```

### FLIP Animations

Smooth layout transitions:

```html
<div uus-layout="grid" 
     uus-flip="true"
     uus-cols="repeat(auto-fit, minmax(200px, 1fr))">
  <div uus-for="item in items">
    <!-- Items animate smoothly when reordered -->
  </div>
</div>
```

### Custom Animations

Define your own animation presets:

```javascript
import { definePreset } from '@uusjs/animate';

definePreset('customSlide', [
  { transform: 'translateX(-50px) rotate(-5deg)', opacity: 0 },
  { transform: 'translateX(0) rotate(0)', opacity: 1 }
], {
  duration: 400,
  easing: 'ease-out'
});
```

### Custom Easings

Add custom easing functions:

```javascript
import { defineEasing } from '@uusjs/animate';

defineEasing('customEase', (t) => {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
});
```

## API Reference

### Directives

- `uus-animate`: Animation preset name
- `uus-duration`: Animation duration in ms
- `uus-delay`: Animation delay in ms
- `uus-easing`: Easing function name
- `uus-trigger`: Animation trigger (immediate, visible, hover, click)
- `uus-threshold`: Intersection observer threshold for visible trigger
- `uus-once`: Only animate once
- `uus-stagger`: Stagger delay for children
- `uus-spring`: Spring animation for property
- `uus-flip`: Enable FLIP animations
- `uus-layout`: Layout type (grid, flex)

### Spring Options

- `uus-stiffness`: Spring stiffness (default: 180)
- `uus-damping`: Spring damping (default: 12)
- `uus-mass`: Spring mass (default: 1)

## License

MIT