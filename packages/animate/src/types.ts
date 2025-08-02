export interface AnimationOptions {
  duration?: number;
  delay?: number;
  easing?: string | EasingFunction;
  fill?: 'none' | 'forwards' | 'backwards' | 'both';
  iterations?: number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
}

export type EasingFunction = (t: number) => number;

export interface AnimationPreset {
  name: string;
  keyframes: Keyframe[];
  options: AnimationOptions;
}

export interface SpringOptions {
  stiffness?: number;
  damping?: number;
  mass?: number;
  velocity?: number;
}

export interface AnimationController {
  play(): void;
  pause(): void;
  reverse(): void;
  finish(): void;
  cancel(): void;
  onfinish?: () => void;
  oncancel?: () => void;
}

export interface ScrollAnimationOptions extends AnimationOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

export interface StaggerOptions {
  delay?: number;
  direction?: 'normal' | 'reverse' | 'center' | 'random';
  easing?: string | EasingFunction;
}

export interface FlipOptions {
  duration?: number;
  easing?: string | EasingFunction;
  scale?: boolean;
  opacity?: boolean;
}