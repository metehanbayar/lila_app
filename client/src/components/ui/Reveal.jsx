import { useEffect, useRef, useState } from 'react';
import { cn } from './primitives';

function Reveal({
  as: Component = 'div',
  children,
  variant = 'reveal-up',
  delay = 0,
  once = true,
  threshold = 0.12,
  rootMargin = '0px 0px -10% 0px',
  disabled = false,
  className = '',
  style,
  ...props
}) {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(disabled);

  useEffect(() => {
    if (disabled || typeof window === 'undefined') {
      setIsVisible(true);
      return undefined;
    }

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const touchOptimized = window.matchMedia?.('(hover: none) and (pointer: coarse) and (max-width: 1024px)').matches;

    if (reduceMotion || touchOptimized) {
      setIsVisible(true);
      return undefined;
    }

    const node = elementRef.current;
    if (!node) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }

        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.disconnect();
          }
          return;
        }

        if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [disabled, once, rootMargin, threshold]);

  return (
    <Component
      ref={elementRef}
      className={cn('gm-reveal', variant, isVisible && 'is-visible', className)}
      style={{
        ...style,
        '--gm-reveal-delay': `${delay}ms`,
      }}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Reveal;
