import gsap from 'gsap';

const TARGET_SELECTORS = ['[data-cart-target="modal"]', '[data-cart-target="header"]'];
const DURATION_MS = 580;
const SOURCE_PRESS_MS = 0.14;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getFallbackTargetRect = () => ({
  left: window.innerWidth - 68,
  top: 24,
  width: 44,
  height: 44,
});

const getSourceRect = (sourceElement) => {
  if (!sourceElement?.getBoundingClientRect) {
    return null;
  }

  const rect = sourceElement.getBoundingClientRect();

  if (!rect.width || !rect.height) {
    return null;
  }

  const size = clamp(Math.min(rect.width, rect.height), 56, 112);

  return {
    left: rect.left + (rect.width - size) / 2,
    top: rect.top + (rect.height - size) / 2,
    width: size,
    height: size,
  };
};

const getImageUrl = (sourceElement, imageUrl) => {
  if (imageUrl) {
    return imageUrl;
  }

  const image = sourceElement?.tagName === 'IMG' ? sourceElement : sourceElement?.querySelector?.('img');
  return image?.currentSrc || image?.src || '';
};

const isVisibleTarget = (element) => {
  if (!element?.getBoundingClientRect) {
    return false;
  }

  const rect = element.getBoundingClientRect();

  if (!rect.width || !rect.height) {
    return false;
  }

  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0;
};

const getTargetElement = () =>
  TARGET_SELECTORS.map((selector) => document.querySelector(selector)).find(isVisibleTarget) || null;

const lerp = (start, end, progress) => start + (end - start) * progress;

const getQuadraticPoint = (start, control, end, progress) => {
  const inverse = 1 - progress;
  return {
    x: inverse * inverse * start.x + 2 * inverse * progress * control.x + progress * progress * end.x,
    y: inverse * inverse * start.y + 2 * inverse * progress * control.y + progress * progress * end.y,
  };
};

export function playAddToCartFlight({ sourceElement, imageUrl = '' } = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return null;
  }

  const sourceRect = getSourceRect(sourceElement);

  if (!sourceRect) {
    return null;
  }

  const targetElement = getTargetElement();
  const sourceSurface = sourceElement?.closest?.('[data-product-card="true"]') || sourceElement;
  const targetRect = targetElement?.getBoundingClientRect?.() || getFallbackTargetRect();
  const targetSize = clamp(Math.min(targetRect.width, targetRect.height) * 0.46, 16, 24);
  const startImageUrl = getImageUrl(sourceElement, imageUrl);

  const sourceCenter = {
    x: sourceRect.left + sourceRect.width / 2,
    y: sourceRect.top + sourceRect.height / 2,
  };
  const targetCenter = {
    x: targetRect.left + targetRect.width / 2,
    y: targetRect.top + targetRect.height / 2,
  };
  const deltaX = targetCenter.x - sourceCenter.x;
  const deltaY = targetCenter.y - sourceCenter.y;
  const controlPoint = {
    x: sourceCenter.x + deltaX * 0.38,
    y:
      Math.min(sourceCenter.y, targetCenter.y) -
      clamp(Math.abs(deltaX) * 0.12 + Math.abs(deltaY) * 0.08, 46, 132),
  };

  const flyer = document.createElement('div');
  flyer.setAttribute('aria-hidden', 'true');
  flyer.style.position = 'fixed';
  flyer.style.left = `${sourceRect.left}px`;
  flyer.style.top = `${sourceRect.top}px`;
  flyer.style.width = `${sourceRect.width}px`;
  flyer.style.height = `${sourceRect.height}px`;
  flyer.style.pointerEvents = 'none';
  flyer.style.zIndex = '1195';
  flyer.style.borderRadius = '24px';
  flyer.style.overflow = 'hidden';
  flyer.style.border = '1px solid rgba(255,255,255,0.94)';
  flyer.style.boxShadow = '0 24px 52px -22px rgba(36,27,29,0.24)';
  flyer.style.background = startImageUrl
    ? `center / cover no-repeat url("${startImageUrl}")`
    : 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(236,239,238,0.96))';
  flyer.style.willChange = 'transform, opacity';

  const glow = document.createElement('div');
  glow.setAttribute('aria-hidden', 'true');
  glow.style.position = 'fixed';
  glow.style.left = `${targetCenter.x - 14}px`;
  glow.style.top = `${targetCenter.y - 14}px`;
  glow.style.width = '28px';
  glow.style.height = '28px';
  glow.style.pointerEvents = 'none';
  glow.style.zIndex = '1194';
  glow.style.borderRadius = '999px';
  glow.style.background = 'radial-gradient(circle, rgba(140,71,124,0.24) 0%, rgba(140,71,124,0.08) 60%, transparent 100%)';
  glow.style.opacity = '0';
  glow.style.willChange = 'transform, opacity';

  document.body.appendChild(glow);
  document.body.appendChild(flyer);

  const progressState = { value: 0 };

  const cleanup = () => {
    flyer.remove();
    glow.remove();
    gsap.killTweensOf(progressState);
    gsap.killTweensOf(sourceSurface);
    gsap.killTweensOf(targetElement);
    gsap.killTweensOf(targetElement?.querySelector?.('[data-cart-badge="true"]'));
    if (sourceSurface) {
      gsap.set(sourceSurface, { clearProps: 'transform,filter' });
    }
    if (targetElement) {
      gsap.set(targetElement, { clearProps: 'transform' });
    }
    const badge = targetElement?.querySelector?.('[data-cart-badge="true"]');
    if (badge) {
      gsap.set(badge, { clearProps: 'transform' });
    }
  };

  return new Promise((resolve) => {
    const timeline = gsap.timeline({
      defaults: {
        ease: 'power2.out',
      },
      onComplete: () => {
        cleanup();
        resolve();
      },
      onInterrupt: () => {
        cleanup();
        resolve();
      },
    });

    if (sourceSurface) {
      timeline.fromTo(
        sourceSurface,
        {
          scale: 1,
          filter: 'brightness(1)',
        },
        {
          scale: 0.982,
          filter: 'brightness(1.03)',
          duration: SOURCE_PRESS_MS,
          yoyo: true,
          repeat: 1,
          ease: 'power2.out',
          transformOrigin: '50% 50%',
        },
        0,
      );
    }

    timeline.to(
      progressState,
      {
        value: 1,
        duration: DURATION_MS / 1000,
        ease: 'power3.inOut',
        onUpdate: () => {
          const progress = progressState.value;
          const point = getQuadraticPoint(sourceCenter, controlPoint, targetCenter, progress);
          const translateX = point.x - sourceCenter.x;
          const translateY = point.y - sourceCenter.y;
          const scale = lerp(1, targetSize / sourceRect.width, Math.min(1, progress * 1.08));
          const rotation = lerp(-3, 8, progress);
          const opacity = progress < 0.82 ? 1 : lerp(1, 0.12, (progress - 0.82) / 0.18);
          const radius = lerp(24, 999, progress);

          gsap.set(flyer, {
            x: translateX,
            y: translateY,
            scale,
            rotation,
            opacity,
            borderRadius: `${radius}px`,
            filter: `saturate(${lerp(1.02, 1.12, Math.min(progress, 0.45))})`,
          });
        },
      },
      0,
    );

    if (targetElement) {
      timeline.fromTo(
        targetElement,
        {
          scale: 1,
        },
        {
          scale: 1.12,
          duration: 0.17,
          yoyo: true,
          repeat: 1,
          ease: 'back.out(2)',
          transformOrigin: '50% 50%',
        },
        0.31,
      );

      const badge = targetElement.querySelector?.('[data-cart-badge="true"]');
      if (badge) {
        timeline.fromTo(
          badge,
          {
            scale: 1,
          },
          {
            scale: 1.24,
            duration: 0.2,
            yoyo: true,
            repeat: 1,
            ease: 'back.out(2.2)',
            transformOrigin: '50% 50%',
          },
          0.34,
        );
      }

      timeline.fromTo(
        targetElement,
        {
          rotate: 0,
        },
        {
          keyframes: [{ rotate: -6, duration: 0.08 }, { rotate: 0, duration: 0.11 }],
          ease: 'power2.out',
          transformOrigin: '50% 50%',
        },
        0.34,
      );
    }

    timeline.fromTo(
      glow,
      {
        scale: 0.5,
        opacity: 0,
      },
      {
        keyframes: [
          { scale: 1.1, opacity: 0.55, duration: 0.12 },
          { scale: 2.2, opacity: 0, duration: 0.22 },
        ],
        ease: 'power2.out',
      },
      0.28,
    );
  });
}
