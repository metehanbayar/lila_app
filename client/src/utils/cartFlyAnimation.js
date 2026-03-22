const TARGET_SELECTORS = ['[data-cart-target="modal"]', '[data-cart-target="header"]'];
const DURATION_MS = 760;

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

const getTargetElement = () => TARGET_SELECTORS.map((selector) => document.querySelector(selector)).find(isVisibleTarget) || null;

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
  const targetRect = targetElement?.getBoundingClientRect?.() || getFallbackTargetRect();
  const targetSize = clamp(Math.min(targetRect.width, targetRect.height) * 0.48, 16, 24);
  const startImageUrl = getImageUrl(sourceElement, imageUrl);

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
  flyer.style.border = '1px solid rgba(255,255,255,0.9)';
  flyer.style.boxShadow = '0 28px 52px -24px rgba(36,27,29,0.28)';
  flyer.style.background = startImageUrl
    ? `center / cover no-repeat url("${startImageUrl}")`
    : 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(236,239,238,0.96))';

  const glow = document.createElement('div');
  glow.setAttribute('aria-hidden', 'true');
  glow.style.position = 'fixed';
  glow.style.left = `${targetRect.left + targetRect.width / 2 - 10}px`;
  glow.style.top = `${targetRect.top + targetRect.height / 2 - 10}px`;
  glow.style.width = '20px';
  glow.style.height = '20px';
  glow.style.pointerEvents = 'none';
  glow.style.zIndex = '1194';
  glow.style.borderRadius = '999px';
  glow.style.background = 'rgba(140, 71, 124, 0.16)';
  glow.style.border = '1px solid rgba(140, 71, 124, 0.22)';

  document.body.appendChild(glow);
  document.body.appendChild(flyer);

  const deltaX = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
  const deltaY = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);
  const curveLift = Math.max(26, Math.abs(deltaX) * 0.08);

  targetElement?.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(1.12)' },
      { transform: 'scale(0.94)' },
      { transform: 'scale(1.06)' },
      { transform: 'scale(1)' },
    ],
    {
      duration: 520,
      delay: 330,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'none',
    },
  );

  targetElement?.querySelector?.('[data-cart-badge="true"]')?.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(1.28)' },
      { transform: 'scale(0.92)' },
      { transform: 'scale(1.08)' },
      { transform: 'scale(1)' },
    ],
    {
      duration: 480,
      delay: 360,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'none',
    },
  );

  glow.animate(
    [
      { opacity: 0, transform: 'scale(0.4)' },
      { opacity: 0.65, transform: 'scale(1.55)' },
      { opacity: 0, transform: 'scale(2.4)' },
    ],
    {
      duration: 460,
      delay: 320,
      easing: 'ease-out',
      fill: 'forwards',
    },
  );

  const animation = flyer.animate(
    [
      {
        opacity: 1,
        transform: 'translate3d(0, 0, 0) scale(1) rotate(0deg)',
        borderRadius: '24px',
      },
      {
        opacity: 1,
        transform: `translate3d(${deltaX * 0.44}px, ${deltaY * 0.24 - curveLift}px, 0) scale(0.92) rotate(-7deg)`,
        offset: 0.52,
        borderRadius: '22px',
      },
      {
        opacity: 0.14,
        transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${targetSize / sourceRect.width}) rotate(10deg)`,
        borderRadius: '999px',
      },
    ],
    {
      duration: DURATION_MS,
      easing: 'cubic-bezier(0.2, 0.9, 0.25, 1)',
      fill: 'forwards',
    },
  );

  const cleanup = () => {
    flyer.remove();
    glow.remove();
  };

  return animation.finished
    .catch(() => undefined)
    .finally(cleanup);
}
