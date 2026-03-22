export function collectImageUrls(...groups) {
  return [...new Set(groups.flat().filter(Boolean))];
}

export function preloadImage(src, timeoutMs = 3500) {
  return new Promise((resolve) => {
    if (!src || typeof Image === 'undefined') {
      resolve();
      return;
    }

    const image = new Image();
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    image.onload = finish;
    image.onerror = finish;
    image.decoding = 'async';
    image.src = src;

    if (image.complete) {
      finish();
      return;
    }

    if (typeof image.decode === 'function') {
      image.decode().then(finish).catch(() => {});
    }

    window.setTimeout(finish, timeoutMs);
  });
}

export async function preloadImages(urls, options = {}) {
  const { batchSize = 6 } = options;
  const normalizedUrls = collectImageUrls(urls);

  for (let index = 0; index < normalizedUrls.length; index += batchSize) {
    const batch = normalizedUrls.slice(index, index + batchSize);
    await Promise.all(batch.map((url) => preloadImage(url)));
  }
}
