import type { SpringOptions } from './types';

export interface SpringState {
  position: number;
  velocity: number;
}

export class Spring {
  private stiffness: number;
  private damping: number;
  private mass: number;

  constructor(options: SpringOptions = {}) {
    this.stiffness = options.stiffness ?? 180;
    this.damping = options.damping ?? 12;
    this.mass = options.mass ?? 1;
  }

  step(state: SpringState, target: number, dt: number): SpringState {
    const { position, velocity } = state;
    
    // Calculate spring force
    const springForce = -this.stiffness * (position - target);
    
    // Calculate damping force
    const dampingForce = -this.damping * velocity;
    
    // Calculate acceleration
    const acceleration = (springForce + dampingForce) / this.mass;
    
    // Update velocity and position
    const newVelocity = velocity + acceleration * dt;
    const newPosition = position + newVelocity * dt;
    
    return {
      position: newPosition,
      velocity: newVelocity
    };
  }

  isDone(state: SpringState, target: number, threshold = 0.001): boolean {
    const positionError = Math.abs(state.position - target);
    const velocityError = Math.abs(state.velocity);
    
    return positionError < threshold && velocityError < threshold;
  }
}

export function createSpringAnimation(
  from: number,
  to: number,
  options: SpringOptions = {},
  onUpdate: (value: number) => void,
  onComplete?: () => void
): () => void {
  const spring = new Spring(options);
  let state: SpringState = {
    position: from,
    velocity: options.velocity ?? 0
  };
  
  let lastTime = performance.now();
  let animationId: number;
  
  const animate = () => {
    const currentTime = performance.now();
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1); // Cap dt at 100ms
    lastTime = currentTime;
    
    state = spring.step(state, to, dt);
    onUpdate(state.position);
    
    if (spring.isDone(state, to)) {
      onUpdate(to);
      if (onComplete) onComplete();
    } else {
      animationId = requestAnimationFrame(animate);
    }
  };
  
  animationId = requestAnimationFrame(animate);
  
  // Return cancel function
  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  };
}