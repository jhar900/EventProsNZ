/**
 * Animation Service
 * Handles smooth animations and transitions for map interactions
 */

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  iterations?: number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

export interface PinAnimation {
  id: string;
  type: 'scale' | 'fade' | 'slide' | 'bounce' | 'pulse';
  config: AnimationConfig;
  element: HTMLElement;
  startTime: number;
  isRunning: boolean;
}

export interface ClusterAnimation {
  id: string;
  type: 'expand' | 'collapse' | 'merge' | 'split';
  config: AnimationConfig;
  elements: HTMLElement[];
  startTime: number;
  isRunning: boolean;
}

export interface MapAnimation {
  id: string;
  type: 'zoom' | 'pan' | 'rotate' | 'tilt';
  config: AnimationConfig;
  startTime: number;
  isRunning: boolean;
}

class AnimationService {
  private pinAnimations: Map<string, PinAnimation> = new Map();
  private clusterAnimations: Map<string, ClusterAnimation> = new Map();
  private mapAnimations: Map<string, MapAnimation> = new Map();
  private animationFrameId: number | null = null;
  private isAnimating = false;

  // Default animation configurations
  private readonly DEFAULT_CONFIGS = {
    pin: {
      scale: { duration: 200, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
      fade: { duration: 150, easing: 'ease-in-out' },
      slide: { duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
      bounce: {
        duration: 400,
        easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      pulse: { duration: 1000, easing: 'ease-in-out', iterations: 'infinite' },
    },
    cluster: {
      expand: { duration: 400, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
      collapse: { duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
      merge: { duration: 500, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
      split: { duration: 400, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    },
    map: {
      zoom: { duration: 600, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
      pan: { duration: 500, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
      rotate: { duration: 800, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
      tilt: { duration: 400, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    },
  };

  /**
   * Animate pin scale (hover/selection effects)
   */
  animatePinScale(
    element: HTMLElement,
    scale: number = 1.1,
    config?: Partial<AnimationConfig>
  ): string {
    const animationId = `pin-scale-${Date.now()}-${Math.random()}`;
    const defaultConfig = this.DEFAULT_CONFIGS.pin.scale;
    const finalConfig = { ...defaultConfig, ...config };

    const animation: PinAnimation = {
      id: animationId,
      type: 'scale',
      config: finalConfig,
      element,
      startTime: Date.now(),
      isRunning: true,
    };

    this.pinAnimations.set(animationId, animation);

    // Apply CSS animation
    element.style.transition = `transform ${finalConfig.duration}ms ${finalConfig.easing}`;
    element.style.transform = `scale(${scale})`;

    // Clean up after animation
    setTimeout(() => {
      this.pinAnimations.delete(animationId);
      if (scale !== 1) {
        element.style.transform = 'scale(1)';
      }
    }, finalConfig.duration);

    this.startAnimationLoop();
    return animationId;
  }

  /**
   * Animate pin fade (show/hide effects)
   */
  animatePinFade(
    element: HTMLElement,
    opacity: number = 0,
    config?: Partial<AnimationConfig>
  ): string {
    const animationId = `pin-fade-${Date.now()}-${Math.random()}`;
    const defaultConfig = this.DEFAULT_CONFIGS.pin.fade;
    const finalConfig = { ...defaultConfig, ...config };

    const animation: PinAnimation = {
      id: animationId,
      type: 'fade',
      config: finalConfig,
      element,
      startTime: Date.now(),
      isRunning: true,
    };

    this.pinAnimations.set(animationId, animation);

    // Apply CSS animation
    element.style.transition = `opacity ${finalConfig.duration}ms ${finalConfig.easing}`;
    element.style.opacity = opacity.toString();

    // Clean up after animation
    setTimeout(() => {
      this.pinAnimations.delete(animationId);
    }, finalConfig.duration);

    this.startAnimationLoop();
    return animationId;
  }

  /**
   * Animate pin bounce (attention-grabbing effect)
   */
  animatePinBounce(
    element: HTMLElement,
    config?: Partial<AnimationConfig>
  ): string {
    const animationId = `pin-bounce-${Date.now()}-${Math.random()}`;
    const defaultConfig = this.DEFAULT_CONFIGS.pin.bounce;
    const finalConfig = { ...defaultConfig, ...config };

    const animation: PinAnimation = {
      id: animationId,
      type: 'bounce',
      config: finalConfig,
      element,
      startTime: Date.now(),
      isRunning: true,
    };

    this.pinAnimations.set(animationId, animation);

    // Apply CSS animation
    element.style.animation = `pinBounce ${finalConfig.duration}ms ${finalConfig.easing}`;

    // Clean up after animation
    setTimeout(() => {
      element.style.animation = '';
      this.pinAnimations.delete(animationId);
    }, finalConfig.duration);

    this.startAnimationLoop();
    return animationId;
  }

  /**
   * Animate pin pulse (ongoing attention effect)
   */
  animatePinPulse(
    element: HTMLElement,
    config?: Partial<AnimationConfig>
  ): string {
    const animationId = `pin-pulse-${Date.now()}-${Math.random()}`;
    const defaultConfig = this.DEFAULT_CONFIGS.pin.pulse;
    const finalConfig = { ...defaultConfig, ...config };

    const animation: PinAnimation = {
      id: animationId,
      type: 'pulse',
      config: finalConfig,
      element,
      startTime: Date.now(),
      isRunning: true,
    };

    this.pinAnimations.set(animationId, animation);

    // Apply CSS animation
    element.style.animation = `pinPulse ${finalConfig.duration}ms ${finalConfig.easing} infinite`;

    this.startAnimationLoop();
    return animationId;
  }

  /**
   * Animate cluster expansion
   */
  animateClusterExpansion(
    elements: HTMLElement[],
    config?: Partial<AnimationConfig>
  ): string {
    const animationId = `cluster-expand-${Date.now()}-${Math.random()}`;
    const defaultConfig = this.DEFAULT_CONFIGS.cluster.expand;
    const finalConfig = { ...defaultConfig, ...config };

    const animation: ClusterAnimation = {
      id: animationId,
      type: 'expand',
      config: finalConfig,
      elements,
      startTime: Date.now(),
      isRunning: true,
    };

    this.clusterAnimations.set(animationId, animation);

    // Apply staggered animations to elements
    elements.forEach((element, index) => {
      const delay = index * 50; // 50ms stagger
      setTimeout(() => {
        element.style.transition = `all ${finalConfig.duration}ms ${finalConfig.easing}`;
        element.style.transform = 'scale(1)';
        element.style.opacity = '1';
      }, delay);
    });

    // Clean up after animation
    setTimeout(
      () => {
        this.clusterAnimations.delete(animationId);
      },
      finalConfig.duration + elements.length * 50
    );

    this.startAnimationLoop();
    return animationId;
  }

  /**
   * Animate cluster collapse
   */
  animateClusterCollapse(
    elements: HTMLElement[],
    config?: Partial<AnimationConfig>
  ): string {
    const animationId = `cluster-collapse-${Date.now()}-${Math.random()}`;
    const defaultConfig = this.DEFAULT_CONFIGS.cluster.collapse;
    const finalConfig = { ...defaultConfig, ...config };

    const animation: ClusterAnimation = {
      id: animationId,
      type: 'collapse',
      config: finalConfig,
      elements,
      startTime: Date.now(),
      isRunning: true,
    };

    this.clusterAnimations.set(animationId, animation);

    // Apply staggered animations to elements
    elements.forEach((element, index) => {
      const delay = index * 30; // 30ms stagger
      setTimeout(() => {
        element.style.transition = `all ${finalConfig.duration}ms ${finalConfig.easing}`;
        element.style.transform = 'scale(0)';
        element.style.opacity = '0';
      }, delay);
    });

    // Clean up after animation
    setTimeout(
      () => {
        this.clusterAnimations.delete(animationId);
      },
      finalConfig.duration + elements.length * 30
    );

    this.startAnimationLoop();
    return animationId;
  }

  /**
   * Animate map zoom transition
   */
  animateMapZoom(
    mapInstance: any,
    targetZoom: number,
    config?: Partial<AnimationConfig>
  ): string {
    const animationId = `map-zoom-${Date.now()}-${Math.random()}`;
    const defaultConfig = this.DEFAULT_CONFIGS.map.zoom;
    const finalConfig = { ...defaultConfig, ...config };

    const animation: MapAnimation = {
      id: animationId,
      type: 'zoom',
      config: finalConfig,
      startTime: Date.now(),
      isRunning: true,
    };

    this.mapAnimations.set(animationId, animation);

    // Use Mapbox's built-in zoom animation
    mapInstance.zoomTo(targetZoom, {
      duration: finalConfig.duration,
      easing: this.mapboxEasingToCSS(finalConfig.easing),
    });

    // Clean up after animation
    setTimeout(() => {
      this.mapAnimations.delete(animationId);
    }, finalConfig.duration);

    this.startAnimationLoop();
    return animationId;
  }

  /**
   * Animate map pan transition
   */
  animateMapPan(
    mapInstance: any,
    targetCenter: [number, number],
    config?: Partial<AnimationConfig>
  ): string {
    const animationId = `map-pan-${Date.now()}-${Math.random()}`;
    const defaultConfig = this.DEFAULT_CONFIGS.map.pan;
    const finalConfig = { ...defaultConfig, ...config };

    const animation: MapAnimation = {
      id: animationId,
      type: 'pan',
      config: finalConfig,
      startTime: Date.now(),
      isRunning: true,
    };

    this.mapAnimations.set(animationId, animation);

    // Use Mapbox's built-in pan animation
    mapInstance.panTo(targetCenter, {
      duration: finalConfig.duration,
      easing: this.mapboxEasingToCSS(finalConfig.easing),
    });

    // Clean up after animation
    setTimeout(() => {
      this.mapAnimations.delete(animationId);
    }, finalConfig.duration);

    this.startAnimationLoop();
    return animationId;
  }

  /**
   * Stop specific animation
   */
  stopAnimation(animationId: string): void {
    // Stop pin animation
    if (this.pinAnimations.has(animationId)) {
      const animation = this.pinAnimations.get(animationId)!;
      animation.element.style.transition = '';
      animation.element.style.animation = '';
      animation.element.style.transform = '';
      animation.element.style.opacity = '';
      this.pinAnimations.delete(animationId);
    }

    // Stop cluster animation
    if (this.clusterAnimations.has(animationId)) {
      const animation = this.clusterAnimations.get(animationId)!;
      animation.elements.forEach(element => {
        element.style.transition = '';
        element.style.transform = '';
        element.style.opacity = '';
      });
      this.clusterAnimations.delete(animationId);
    }

    // Stop map animation
    if (this.mapAnimations.has(animationId)) {
      this.mapAnimations.delete(animationId);
    }
  }

  /**
   * Stop all animations
   */
  stopAllAnimations(): void {
    // Stop all pin animations
    this.pinAnimations.forEach(animation => {
      animation.element.style.transition = '';
      animation.element.style.animation = '';
      animation.element.style.transform = '';
      animation.element.style.opacity = '';
    });
    this.pinAnimations.clear();

    // Stop all cluster animations
    this.clusterAnimations.forEach(animation => {
      animation.elements.forEach(element => {
        element.style.transition = '';
        element.style.transform = '';
        element.style.opacity = '';
      });
    });
    this.clusterAnimations.clear();

    // Stop all map animations
    this.mapAnimations.clear();

    // Stop animation loop
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.isAnimating = false;
  }

  /**
   * Check if any animations are running
   */
  isAnyAnimationRunning(): boolean {
    return (
      this.pinAnimations.size > 0 ||
      this.clusterAnimations.size > 0 ||
      this.mapAnimations.size > 0
    );
  }

  /**
   * Get animation statistics
   */
  getAnimationStats(): {
    pinAnimations: number;
    clusterAnimations: number;
    mapAnimations: number;
    totalAnimations: number;
  } {
    return {
      pinAnimations: this.pinAnimations.size,
      clusterAnimations: this.clusterAnimations.size,
      mapAnimations: this.mapAnimations.size,
      totalAnimations:
        this.pinAnimations.size +
        this.clusterAnimations.size +
        this.mapAnimations.size,
    };
  }

  /**
   * Start animation loop for monitoring
   */
  private startAnimationLoop(): void {
    if (this.isAnimating) return;

    this.isAnimating = true;
    this.animationFrameId = requestAnimationFrame(() => {
      this.animationLoop();
    });
  }

  /**
   * Animation loop for monitoring and cleanup
   */
  private animationLoop(): void {
    if (!this.isAnyAnimationRunning()) {
      this.isAnimating = false;
      this.animationFrameId = null;
      return;
    }

    this.animationFrameId = requestAnimationFrame(() => {
      this.animationLoop();
    });
  }

  /**
   * Convert CSS easing to Mapbox easing
   */
  private mapboxEasingToCSS(easing: string): any {
    const easingMap: Record<string, any> = {
      ease: [0.25, 0.1, 0.25, 1],
      'ease-in': [0.42, 0, 1, 1],
      'ease-out': [0, 0, 0.58, 1],
      'ease-in-out': [0.42, 0, 0.58, 1],
      'cubic-bezier(0.4, 0, 0.2, 1)': [0.4, 0, 0.2, 1],
      'cubic-bezier(0.4, 0, 0.2, 1)': [0.4, 0, 0.2, 1],
    };

    return easingMap[easing] || [0.4, 0, 0.2, 1];
  }
}

export const animationService = new AnimationService();
