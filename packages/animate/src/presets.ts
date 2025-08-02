import type { AnimationPreset } from './types';

export const presets: Record<string, AnimationPreset> = {
  // Fade animations
  fadeIn: {
    name: 'fadeIn',
    keyframes: [
      { opacity: 0 },
      { opacity: 1 }
    ],
    options: { duration: 300, easing: 'ease-out' }
  },
  fadeOut: {
    name: 'fadeOut',
    keyframes: [
      { opacity: 1 },
      { opacity: 0 }
    ],
    options: { duration: 300, easing: 'ease-out' }
  },
  
  // Slide animations
  slideInLeft: {
    name: 'slideInLeft',
    keyframes: [
      { transform: 'translateX(-100%)', opacity: 0 },
      { transform: 'translateX(0)', opacity: 1 }
    ],
    options: { duration: 300, easing: 'ease-out' }
  },
  slideInRight: {
    name: 'slideInRight',
    keyframes: [
      { transform: 'translateX(100%)', opacity: 0 },
      { transform: 'translateX(0)', opacity: 1 }
    ],
    options: { duration: 300, easing: 'ease-out' }
  },
  slideInUp: {
    name: 'slideInUp',
    keyframes: [
      { transform: 'translateY(100%)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 }
    ],
    options: { duration: 300, easing: 'ease-out' }
  },
  slideInDown: {
    name: 'slideInDown',
    keyframes: [
      { transform: 'translateY(-100%)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 }
    ],
    options: { duration: 300, easing: 'ease-out' }
  },
  
  // Scale animations
  scaleIn: {
    name: 'scaleIn',
    keyframes: [
      { transform: 'scale(0)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ],
    options: { duration: 300, easing: 'ease-out' }
  },
  scaleOut: {
    name: 'scaleOut',
    keyframes: [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(0)', opacity: 0 }
    ],
    options: { duration: 300, easing: 'ease-out' }
  },
  
  // Rotate animations
  rotateIn: {
    name: 'rotateIn',
    keyframes: [
      { transform: 'rotate(-180deg) scale(0)', opacity: 0 },
      { transform: 'rotate(0) scale(1)', opacity: 1 }
    ],
    options: { duration: 500, easing: 'ease-out' }
  },
  rotateOut: {
    name: 'rotateOut',
    keyframes: [
      { transform: 'rotate(0) scale(1)', opacity: 1 },
      { transform: 'rotate(180deg) scale(0)', opacity: 0 }
    ],
    options: { duration: 500, easing: 'ease-out' }
  },
  
  // Bounce animations
  bounceIn: {
    name: 'bounceIn',
    keyframes: [
      { transform: 'scale(0)', opacity: 0, offset: 0 },
      { transform: 'scale(1.2)', opacity: 1, offset: 0.5 },
      { transform: 'scale(0.9)', offset: 0.8 },
      { transform: 'scale(1)', offset: 1 }
    ],
    options: { duration: 600, easing: 'ease-out' }
  },
  bounceOut: {
    name: 'bounceOut',
    keyframes: [
      { transform: 'scale(1)', opacity: 1, offset: 0 },
      { transform: 'scale(0.9)', offset: 0.2 },
      { transform: 'scale(1.1)', offset: 0.5 },
      { transform: 'scale(0)', opacity: 0, offset: 1 }
    ],
    options: { duration: 600, easing: 'ease-in' }
  },
  
  // Shake animation
  shake: {
    name: 'shake',
    keyframes: [
      { transform: 'translateX(0)', offset: 0 },
      { transform: 'translateX(-10px)', offset: 0.1 },
      { transform: 'translateX(10px)', offset: 0.2 },
      { transform: 'translateX(-10px)', offset: 0.3 },
      { transform: 'translateX(10px)', offset: 0.4 },
      { transform: 'translateX(-10px)', offset: 0.5 },
      { transform: 'translateX(10px)', offset: 0.6 },
      { transform: 'translateX(-10px)', offset: 0.7 },
      { transform: 'translateX(10px)', offset: 0.8 },
      { transform: 'translateX(-10px)', offset: 0.9 },
      { transform: 'translateX(0)', offset: 1 }
    ],
    options: { duration: 500, easing: 'ease-in-out' }
  },
  
  // Pulse animation
  pulse: {
    name: 'pulse',
    keyframes: [
      { transform: 'scale(1)', offset: 0 },
      { transform: 'scale(1.05)', offset: 0.5 },
      { transform: 'scale(1)', offset: 1 }
    ],
    options: { duration: 1000, easing: 'ease-in-out', iterations: Infinity }
  },
  
  // Flip animations
  flipInX: {
    name: 'flipInX',
    keyframes: [
      { transform: 'rotateX(-90deg)', opacity: 0, offset: 0 },
      { transform: 'rotateX(0)', opacity: 1, offset: 1 }
    ],
    options: { duration: 600, easing: 'ease-out' }
  },
  flipInY: {
    name: 'flipInY',
    keyframes: [
      { transform: 'rotateY(-90deg)', opacity: 0, offset: 0 },
      { transform: 'rotateY(0)', opacity: 1, offset: 1 }
    ],
    options: { duration: 600, easing: 'ease-out' }
  }
};