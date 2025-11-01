import { useState, useRef } from 'react';

function TouchFeedback({ children, onClick, disabled, className = '', rippleColor = 'rgba(255, 255, 255, 0.3)', as: Component = 'button', ...props }) {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState([]);
  const elementRef = useRef(null);

  const handleTouchStart = (e) => {
    if (disabled) return;
    
    setIsPressed(true);
    
    // Ripple effect
    const element = elementRef.current;
    if (element) {
      const rect = element.getBoundingClientRect();
      const x = e.touches?.[0]?.clientX || e.clientX || 0;
      const y = e.touches?.[0]?.clientY || e.clientY || 0;
      
      const ripple = {
        x: x - rect.left,
        y: y - rect.top,
        id: Date.now(),
      };
      
      setRipples((prev) => [...prev, ripple]);
      
      // Haptic feedback (sadece mobilde desteklenir)
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    
    setIsPressed(false);
    
    // Ripple temizle
    setTimeout(() => {
      setRipples((prev) => prev.slice(1));
    }, 600);
  };

  const handleClick = (e) => {
    if (disabled) return;
    onClick?.(e);
  };

  return (
    <Component
      ref={elementRef}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={disabled}
      className={`relative overflow-hidden transition-transform duration-100 ${isPressed ? 'scale-95' : ''} ${className}`}
      style={{ touchAction: 'manipulation' }}
      {...props}
    >
      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: '100px',
            height: '100px',
            background: rippleColor,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
      
      {children}
    </Component>
  );
}

export default TouchFeedback;

