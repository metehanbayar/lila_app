# Uygulama Hissi ve Animasyonlar - Kullanım Kılavuzu

## ✅ Eklenen Özellikler

### 1. **Splash Screen** 
Uygulama açılırken gösterilen hoş karşılama ekranı.

**Otomatik entegre edilmiştir**, main.jsx'de kullanıma hazır.

### 2. **TouchFeedback Component** 
Dokunsal geri bildirim ve ripple efekti sağlar.

#### Kullanım Örnekleri:

```jsx
import TouchFeedback from './components/TouchFeedback';

// Basit buton
<TouchFeedback onClick={handleClick}>
  Sepete Ekle
</TouchFeedback>

// Link olarak kullanım
<TouchFeedback as="div" onClick={handleLinkClick}>
  Tıklanabilir alan
</TouchFeedback>

// Farklı renk ripple
<TouchFeedback rippleColor="rgba(99, 102, 241, 0.3)">
  Mavi efektli buton
</TouchFeedback>

// Disabled durumu
<TouchFeedback disabled={isLoading} onClick={handleSubmit}>
  Gönder
</TouchFeedback>
```

### 3. **Gelişmiş Loading Component**
Farklı boyutlar ve varyantlarla kullanılabilir.

```jsx
import Loading from './components/Loading';

// Küçük boyut
<Loading size="sm" text="Kaydediliyor..." />

// Büyük boyut
<Loading size="lg" text="Yükleniyor..." />

// Beyaz varyant (koyu arka planda)
<Loading variant="white" text="İşleniyor..." />

// Gri varyant
<Loading variant="gray" text="Veriler hazırlanıyor..." />
```

### 4. **PageTransition Component**
Sayfa geçişlerinde animasyon sağlar.

```jsx
import PageTransition from './components/PageTransition';

function MyPage() {
  return (
    <PageTransition>
      {/* Sayfa içeriği */}
      <div>İçerik buraya</div>
    </PageTransition>
  );
}
```

## CSS Animasyonları

Tüm animasyonlar `index.css`'te tanımlanmıştır:

### Mevcut Animasyonlar:
- `animate-fadeIn` - Fade in efekti
- `animate-slideUp` - Yukarıdan kayma
- `animate-slideDown` - Aşağıdan kayma
- `animate-slideInLeft` - Sol taraftan gelme
- `animate-slideInRight` - Sağdan gelme
- `animate-scaleIn` - Büyüme efekti
- `animate-bounce-subtle` - Hafif zıplama
- `animate-ripple` - Ripple efekti
- `animate-pageEnter` - Sayfa girişi
- `animate-skeleton` - Loading skeleton efekti
- `animate-gradient` - Gradient animasyonu

### Kullanım:

```jsx
<div className="animate-fadeIn">
  Fade in animasyonu
</div>

<div className="animate-slideUp">
  Yukarıdan kayma
</div>

<div className="animate-skeleton">
  Skeleton yükleme efekti
</div>
```

## 🎨 Örnek Entegrasyonlar

### Butonlara TouchFeedback Eklemek:

```jsx
import TouchFeedback from './components/TouchFeedback';

// Öncesi
<button onClick={handleClick}>Sepete Ekle</button>

// Sonrası
<TouchFeedback onClick={handleClick}>
  Sepete Ekle
</TouchFeedback>
```

### Loading State'leri:

```jsx
import Loading from './components/Loading';

function MyComponent() {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return <Loading text="Ürünler yükleniyor..." />;
  }

  return <div>İçerik</div>;
}
```

## 📱 Dokunsal Geri Bildirim (Haptic Feedback)

TouchFeedback component'i otomatik olarak:
- Mobil cihazlarda titreşim sağlar
- Ripple efekti gösterir
- Basma efektini uygular (scale)

Bu özellikler sadece touch event'lerinde tetiklenir ve masaüstünde normal çalışır.

## 🚀 Performans İpuçları

1. **Animasyonlar:** CSS animasyonları GPU hızlandırması kullanır
2. **TouchFeedback:** Gereksiz render'ları önlemek için ref kullanır
3. **Splash Screen:** Tek seferlik çalışır, localStorage ile kontrol edilebilir

## 📦 Kullanım Alanları

- ✅ Tüm butonlar (Sepete Ekle, Gönder, vs.)
- ✅ Kartlar (ProductCard, RestaurantCard)
- ✅ Navigation (BottomNav, Header)
- ✅ Modal'lar ve açılır kapanır bileşenler
- ✅ Form elementleri
- ✅ Tıklanabilir tüm interaktif öğeler

## 🎯 Best Practices

1. **Loading States:** Her zaman kullanıcıya feedback verin
2. **TouchFeedback:** Interaktif öğelerde mutlaka kullanın
3. **Animasyonlar:** Aşırı kullanmayın, sadece önemli state değişimlerinde kullanın
4. **Performance:** Büyük animasyonları `will-change` ile optimize edin

## 🔧 Özelleştirme

### Splash Screen'i Devre Dışı Bırakmak:

`main.jsx`'te:

```jsx
const [showSplash, setShowSplash] = useState(false); // true yerine false
```

### Haptic Feedback'i Kapatmak:

`TouchFeedback.jsx` içinde:

```jsx
// Bu satırı yoruma alın
// if ('vibrate' in navigator) {
//   navigator.vibrate(10);
// }
```

---

**Not:** Tüm component'ler zaten index.jsx'e entegre edilmiştir ve kullanıma hazırdır.

