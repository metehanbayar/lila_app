import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { getRestaurantBySlug, getProductsByRestaurant } from '../services/api';
import ProductRowCard from '../components/ProductRowCard';
import ProductDetailModal from '../components/ProductDetailModal';
import Loading from '../components/Loading';

// Navbar buton aktif/pasif class'ları - DOM API ile yönetilecek
const ACTIVE_CLASSES = `
  bg-gradient-to-r from-purple-600 to-pink-500
  text-white
  border border-transparent
  shadow-[0_12px_30px_rgba(168,85,247,0.5)]
`.trim().replace(/\s+/g, ' ');

const INACTIVE_CLASSES = `
  bg-gray-100
  text-gray-700
  border border-gray-200
  shadow-sm
`.trim().replace(/\s+/g, ' ');

function RestaurantMenu() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const categoryRefs = useRef({});
  const observerRef = useRef(null);
  const navbarRef = useRef(null);
  const stickyWrapperRef = useRef(null);
  const activeCategoryIdRef = useRef(null);
  const navButtonsRef = useRef(null); // NodeList snapshot
  const lastActiveBtnRef = useRef(null); // DOM node

  useEffect(() => {
    loadRestaurantData();
  }, [slug]);

  // Tüm ürünleri göster, kategorilere göre grupla - useMemo ile optimize et
  const productsByCategory = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category.Id] = products.filter(p => p.CategoryId === category.Id);
      return acc;
    }, {});
  }, [categories, products]);

  // Sadece ürünü olan kategorileri filtrele - useMemo ile optimize et
  const categoriesWithProducts = useMemo(() => {
    return categories.filter(category => {
      const categoryProducts = productsByCategory[category.Id] || [];
      return categoryProducts.length > 0;
    });
  }, [categories, productsByCategory]);

  // Tüm ürünleri kategorilere göre sırala - useMemo ile optimize et
  const allProducts = useMemo(() => {
    return categoriesWithProducts.flatMap(category => productsByCategory[category.Id] || []);
  }, [categoriesWithProducts, productsByCategory]);

  // Class array'lerini önceden hesapla (observer callback'inde her frame split yapmamak için)
  const activeClassArray = useMemo(() => ACTIVE_CLASSES.trim().split(/\s+/), []);
  const inactiveClassArray = useMemo(() => INACTIVE_CLASSES.trim().split(/\s+/), []);

  // Kategorileri çiftlere ayır (content-visibility overhead'ini azaltmak için)
  const categoryChunks = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < categoriesWithProducts.length; i += 2) {
      chunks.push(categoriesWithProducts.slice(i, i + 2));
    }
    return chunks;
  }, [categoriesWithProducts]);

  // Intersection Observer ile kategori takibi - DOM API ile highlight yönetimi (React re-render yok)
  useEffect(() => {
    if (categoriesWithProducts.length === 0) return;

    let rafId = null;
    const observer = new IntersectionObserver(
      (entries) => {
        // RAF ile throttle et - çok fazla callback'i önle
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          // En üstteki görünen kategoriyi bul
          const visible = entries
            .filter(e => e.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

          if (visible.length > 0) {
            const newActiveId = visible[0].target.dataset.categoryId;
            
            // Gereksiz DOM güncellemelerini önle - aynı kategori aktif kalıyorsa hiçbir şey yapma
            if (activeCategoryIdRef.current !== newActiveId) {
              activeCategoryIdRef.current = newActiveId;
              
              const btns = navButtonsRef.current;
              if (btns && btns.length) {
                // Hangi buton aktif olmalı?
                let newActiveBtn = null;

                btns.forEach(btn => {
                  const thisId = btn.getAttribute('data-category-button');
                  if (thisId === newActiveId) {
                    newActiveBtn = btn;
                  }
                });

                if (newActiveBtn && newActiveBtn !== lastActiveBtnRef.current) {
                  // 1. Eskiyi pasifleştir
                  if (lastActiveBtnRef.current) {
                    lastActiveBtnRef.current.classList.remove(...activeClassArray);
                    lastActiveBtnRef.current.classList.add(...inactiveClassArray);
                  }

                  // 2. Yeniyi aktifleştir
                  newActiveBtn.classList.remove(...inactiveClassArray);
                  newActiveBtn.classList.add(...activeClassArray);

                  // 3. Navbar'ı bu butona doğru kaydır
                  newActiveBtn.scrollIntoView({
                    behavior: 'auto', // smooth olursa her frame animasyon -> jitter yapabilir
                    block: 'nearest',
                    inline: 'center'
                  });

                  // 4. Referansı güncelle
                  lastActiveBtnRef.current = newActiveBtn;
                }
              }
            }
          }

          rafId = null;
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -60% 0px', // Daha stabil - jitter azaltır
        threshold: 0.0 // En basit hesaplama
      }
    );

    observerRef.current = observer;

    // Her kategori için observer ekle
    Object.values(categoryRefs.current).forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
      observerRef.current = null;
    };
  }, [categoriesWithProducts, activeClassArray, inactiveClassArray]);

  // Navbar butonlarını cache'le (her frame querySelectorAll yapmamak için)
  useEffect(() => {
    if (!navbarRef.current) return;
    navButtonsRef.current = navbarRef.current.querySelectorAll('[data-role="cat-btn"]');
  }, [categoriesWithProducts]);

  // Modal açıkken observer'ı durdur (performans için)
  useEffect(() => {
    if (!observerRef.current) return;
    if (isModalOpen) {
      observerRef.current.disconnect();
    } else {
      // Yeniden bağla
      Object.values(categoryRefs.current).forEach(ref => {
        if (ref) observerRef.current.observe(ref);
      });
    }
  }, [isModalOpen]);

  // Aktif kategori butonunu navbar'da görünür hale getir - useCallback ile optimize et
  const scrollToActiveCategory = useCallback((categoryId) => {
    if (!navbarRef.current) return;
    
    const activeButton = navbarRef.current.querySelector(`[data-category-button="${categoryId}"]`);
    if (activeButton) {
      activeButton.scrollIntoView({
        behavior: 'auto', // smooth yerine auto - iki smooth animasyon aynı anda jitter yaratabilir
        block: 'nearest',
        inline: 'center'
      });
    }
  }, []);

  // Kategoriye scroll et - useCallback ile optimize et
  const scrollToCategory = useCallback((categoryId) => {
    const el = categoryRefs.current[categoryId];
    if (!el) return;

    // Dinamik yükseklik hesapla (header 64px + kategori bar yüksekliği + küçük padding)
    const headerHeight = 64; // top-[64px] değeri
    const categoryBarHeight = stickyWrapperRef.current
      ? stickyWrapperRef.current.getBoundingClientRect().height
      : 40; // fallback
    const totalOffset = headerHeight + categoryBarHeight + 4; // 4px ek padding

    const elementTop = el.getBoundingClientRect().top + window.pageYOffset;
    const targetScroll = elementTop - totalOffset;

    window.scrollTo({
      top: Math.max(0, targetScroll), // Negatif değerleri önle
      behavior: 'smooth'
    });
  }, []);

  const loadRestaurantData = async () => {
    try {
      setLoading(true);
      
      // Restoran bilgisini al
      const restaurantResponse = await getRestaurantBySlug(slug);
      
      if (restaurantResponse.success) {
        setRestaurant(restaurantResponse.data);
        
        // Restoran ID'si ile ürünleri al
        const productsResponse = await getProductsByRestaurant(restaurantResponse.data.Id);
        
        if (productsResponse.success) {
          setCategories(productsResponse.data.categories);
          // Ürünlere restoran bilgisini ekle
          const productsWithRestaurant = productsResponse.data.allProducts.map(product => ({
            ...product,
            RestaurantName: restaurantResponse.data?.Name || 'Bilinmeyen Restoran'
          }));
          setProducts(productsWithRestaurant);
        }
      }
    } catch (err) {
      console.error('Veri yüklenemedi:', err);
      setError('Menü yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };


  const handleProductClick = useCallback((product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  }, []);

  const handleAddToCartGlobal = useCallback((product) => {
    setToast({ name: product.Name, quantity: 1 });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  }, []);

  const handlePreviousProduct = useCallback(() => {
    const currentIndex = allProducts.findIndex(p => p.Id === selectedProduct?.Id);
    if (currentIndex > 0) {
      setSelectedProduct(allProducts[currentIndex - 1]);
    }
  }, [allProducts, selectedProduct?.Id]);

  const handleNextProduct = useCallback(() => {
    const currentIndex = allProducts.findIndex(p => p.Id === selectedProduct?.Id);
    if (currentIndex < allProducts.length - 1) {
      setSelectedProduct(allProducts[currentIndex + 1]);
    }
  }, [allProducts, selectedProduct?.Id]);

  const canGoPrevious = useMemo(() => {
    if (!selectedProduct) return false;
    const currentIndex = allProducts.findIndex(p => p.Id === selectedProduct.Id);
    return currentIndex > 0;
  }, [allProducts, selectedProduct]);

  const canGoNext = useMemo(() => {
    if (!selectedProduct) return false;
    const currentIndex = allProducts.findIndex(p => p.Id === selectedProduct.Id);
    return currentIndex < allProducts.length - 1;
  }, [allProducts, selectedProduct]);

  if (loading) return <Loading />;

  if (error || !restaurant) {
    return (
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-gray-600 hover:text-primary mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Ana Sayfaya Dön</span>
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error || 'Restoran bulunamadı'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-gray-50">
      {/* Kategoriler */}
      {!isModalOpen && (
        <div ref={stickyWrapperRef} className="sticky top-[64px] z-50 bg-white border-b border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
        {categoriesWithProducts.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 py-2">
            <div
              ref={navbarRef}
              className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [touch-action:pan-x] overscroll-x-contain"
            >
              {categoriesWithProducts.map((category) => (
                <button
                  key={category.Id}
                  data-category-button={category.Id}
                  data-role="cat-btn"
                  onClick={() => {
                    // 1. Highlight'ı lokalde zorla (observer'ı bekleme) - önce yap ki yükseklik sabitlensin
                    const categoryIdStr = String(category.Id);
                    activeCategoryIdRef.current = categoryIdStr;

                    const btns = navButtonsRef.current;
                    if (btns && btns.length) {
                      // Hangi buton aktif olmalı?
                      let newActiveBtn = null;

                      btns.forEach(btn => {
                        const thisId = btn.getAttribute('data-category-button');
                        if (thisId === categoryIdStr) {
                          newActiveBtn = btn;
                        }
                      });

                      if (newActiveBtn && newActiveBtn !== lastActiveBtnRef.current) {
                        // Eski aktifi pasifleştir
                        if (lastActiveBtnRef.current) {
                          lastActiveBtnRef.current.classList.remove(...activeClassArray);
                          lastActiveBtnRef.current.classList.add(...inactiveClassArray);
                        }

                        // Yeniyi aktifleştir
                        newActiveBtn.classList.remove(...inactiveClassArray);
                        newActiveBtn.classList.add(...activeClassArray);

                        lastActiveBtnRef.current = newActiveBtn;
                      }
                    }

                    // 2. İçeri kaydır (highlight sonrası yükseklik doğru ölçülür)
                    scrollToCategory(category.Id);

                    // 3. Navbar'ı hizala
                    scrollToActiveCategory(category.Id);
                  }}
                  className={`
                    snap-start whitespace-nowrap px-3 py-1.5 rounded-xl
                    text-[13px] font-semibold
                    active:opacity-90 transition
                    ${INACTIVE_CLASSES}
                  `}
                >
                  {category.Name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      )}

      {/* Ürünler */}
      <div
        className="container mx-auto px-4 py-4 sm:py-6 md:py-8 mb-16 lg:mb-0"
        style={{ touchAction: 'pan-y' }}
      >
        {categoriesWithProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm sm:text-base text-gray-600">Ürün bulunmuyor</p>
          </div>
        ) : (
          <div className="space-y-8 sm:space-y-10 md:space-y-12">
            {categoryChunks.map((chunk, chunkIndex) => (
              <section
                key={chunkIndex}
                style={{
                  contentVisibility: 'auto',
                  containIntrinsicSize: '900px', // her chunk 2 kategori içerir, daha büyük tahmin - layout jump'ı önler
                }}
              >
                <div className="space-y-8 sm:space-y-10 md:space-y-12">
                  {chunk.map((category) => {
                    const categoryProducts = productsByCategory[category.Id] || [];
                    if (categoryProducts.length === 0) return null;

                    const hasFeaturedProducts = categoryProducts.some(p => p.IsFeatured);

                    return (
                      <div key={category.Id} className="space-y-4">
                        {/* Kategori Başlığı */}
                        <div className="mb-2">
                          <div className="flex items-center gap-2">
                            <h2
                              ref={(el) => {
                                if (el) {
                                  categoryRefs.current[category.Id] = el;
                                } else {
                                  delete categoryRefs.current[category.Id];
                                }
                              }}
                              data-category-id={category.Id}
                              className="text-[15px] font-bold text-gray-900"
                            >
                              {category.Name}
                            </h2>

                            <span className="text-[11px] font-medium text-gray-500">
                              {categoryProducts.length} ürün
                            </span>
                          </div>

                          {hasFeaturedProducts && (
                            <div className="mt-1 inline-flex items-center text-[10px] font-semibold text-purple-600 bg-purple-50 border border-purple-200 rounded-lg px-2 py-1 leading-none shadow-sm">
                              Popüler
                            </div>
                          )}
                        </div>

                        {/* Ürün Listesi */}
                        <div className="flex flex-col gap-3">
                          {categoryProducts.map((product) => (
                            <ProductRowCard
                              key={product.Id}
                              product={product}
                              onProductClick={handleProductClick}
                              onAddToCart={handleAddToCartGlobal}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Ürün Detay Modalı */}
      <ProductDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
        onPrevious={handlePreviousProduct}
        onNext={handleNextProduct}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
      />

      {/* Global Toast */}
      {toast && (
        <div className="fixed top-4 right-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 z-[70] animate-slideInRight max-w-sm">
          <div className="p-4 flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Check className="w-6 h-6 text-white" strokeWidth={3} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-gray-900 mb-1">Sepete Eklendi!</h4>
              <p className="text-xs text-gray-600 truncate">
                {toast.quantity} adet {toast.name}
              </p>
              <button
                onClick={() => {
                  setToast(null);
                  navigate('/cart');
                }}
                className="mt-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Sepete Git →
              </button>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Kapat"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RestaurantMenu;

// Tailwind safelist (build için; sakın silme)
// Bu class'lar runtime'da DOM API ile eklendiği için Tailwind purge edebilir
// Bu sabit Tailwind'in bu class'ları görmesini sağlar
const __tailwindSafelist = `
  bg-gradient-to-r from-purple-600 to-pink-500
  text-white
  border border-transparent
  shadow-[0_12px_30px_rgba(168,85,247,0.5)]
  bg-gray-100 text-gray-700 border-gray-200 shadow-sm
`;

