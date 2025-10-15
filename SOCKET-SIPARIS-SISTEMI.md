# 🔔 Socket.io Sipariş Bildirim Sistemi

## Genel Bakış

Bu sistem, sipariş geldiğinde **Socket.io** üzerinden gerçek zamanlı bildirim gönderir.
Agent sistemi kaldırıldı, sadece bildirim altyapısı korundu.

## ✨ Mevcut Özellikler

### Socket.io Altyapısı
- ✅ WebSocket bağlantısı (gerçek zamanlı)
- ✅ HTTP polling fallback
- ✅ CORS desteği

### Sipariş Bildirimi
- ✅ Sipariş kaydedilince otomatik bildirim
- ✅ Restoran bazında gruplama
- ✅ Her restorana ayrı bildirim
- ✅ Socket.io rooms kullanımı

## 🔧 Nasıl Çalışır?

### 1. Sipariş Oluşturma

```javascript
// routes/orders.js
POST /api/orders

// Sipariş kaydedildikten sonra:
const restaurantOrdersForNotification = Array.from(restaurantGroups.values());
notifyNewOrder(orderId, restaurantOrdersForNotification);
```

### 2. Socket.io Bildirimi

```javascript
// services/socket-service.js
export async function notifyNewOrder(orderId, restaurantOrders) {
  for (const restaurantOrder of restaurantOrders) {
    const { restaurantId, items, subtotal } = restaurantOrder;
    
    // Yazdırma verisi hazırla
    const printData = {
      orderId,
      orderNumber,
      restaurantId,
      restaurantName,
      customerName,
      customerPhone,
      customerAddress,
      items,
      subtotal,
      totalAmount,
      ...
    };
    
    // Sadece o restorana bildirim gönder
    io.to(`restaurant:${restaurantId}`).emit('order:new', printData);
  }
}
```

### 3. Client Dinleme

```javascript
// Frontend veya Agent tarafında:
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// Belirli bir restorana katıl
socket.emit('join-restaurant', { restaurantId: 1 });

// Sipariş bildirimi dinle
socket.on('order:new', (orderData) => {
  console.log('Yeni sipariş:', orderData);
  // Burada ne yapılacağına karar verebilirsiniz:
  // - Desktop bildirim göster
  // - Ses çal
  // - Dashboard'a ekle
  // - Yazıcıya gönder
  // vb.
});
```

## 📊 Veri Yapısı

### Sipariş Bildirimi (order:new)

```javascript
{
  orderId: 123,
  orderNumber: "LG241015001",
  restaurantId: 1,
  restaurantName: "Lila Gourmet",
  customerName: "Ahmet Yılmaz",
  customerPhone: "0555 123 4567",
  customerAddress: "Atatürk Cad. No:123...",
  notes: "Acısız olsun",
  subtotal: 150.00,
  totalAmount: 130.00,
  discountAmount: 20.00,
  couponCode: "YENI20",
  items: [
    {
      productName: "Hamburger",
      variantName: "XL",
      quantity: 2,
      price: 75.00,
      subtotal: 150.00
    }
  ],
  createdAt: "2024-10-15T14:30:00.000Z"
}
```

## 🎯 Kullanım Senaryoları

### 1. Web Dashboard (Admin Panel)

```javascript
// Admin panelde gerçek zamanlı sipariş takibi
const socket = io();

socket.on('order:new', (order) => {
  // Dashboard'a sipariş ekle
  addOrderToList(order);
  
  // Ses çal
  playNotificationSound();
  
  // Browser notification
  new Notification('Yeni Sipariş!', {
    body: `${order.customerName} - ${order.totalAmount} TL`
  });
});
```

### 2. Mobil Uygulama

```javascript
// React Native veya Expo
import io from 'socket.io-client';

const socket = io('https://yourapi.com');

socket.on('order:new', (order) => {
  // Push notification gönder
  sendPushNotification({
    title: 'Yeni Sipariş',
    body: `${order.orderNumber} - ${order.restaurantName}`
  });
});
```

### 3. Özel Yazıcı Sistemi

```javascript
// Kendi yazıcı client'ınız
const socket = io('http://localhost:3000');

socket.on('order:new', async (order) => {
  // Fiş oluştur
  const receipt = generateReceipt(order);
  
  // Yazıcıya gönder
  await printToThermalPrinter(receipt);
  
  // Başarı bildirimi (opsiyonel)
  console.log('Yazdırıldı:', order.orderNumber);
});
```

## 🔐 Güvenlik

### CORS Yapılandırması

```javascript
// server.js
cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
})
```

Production'da mutlaka origin'i belirtin:
```env
CORS_ORIGIN=https://yourdomain.com
```

### Socket.io Authentication (Gelecek)

İhtiyaç halinde authentication eklenebilir:

```javascript
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (isValidToken(token)) {
    next();
  } else {
    next(new Error('Unauthorized'));
  }
});
```

## 📈 Performans

### Room Sistemi

Socket.io rooms kullanarak sadece ilgili client'lara mesaj gönderilir:

```javascript
// Sadece restaurant:1 odasındakilere
io.to('restaurant:1').emit('order:new', data);

// Herkese (kullanmayın!)
io.emit('order:new', data); // ❌
```

### Bağlantı Optimizasyonu

```javascript
// WebSocket öncelikli (daha hızlı)
transports: ['websocket', 'polling']

// Sadece polling (yavaş)
transports: ['polling'] // ❌
```

## 🚀 Genişletme

### Yeni Event'ler Eklemek

```javascript
// Backend (socket-service.js)
export function notifyOrderStatusUpdate(orderId, status) {
  io.emit('order:status-update', { orderId, status });
}

// Frontend
socket.on('order:status-update', ({ orderId, status }) => {
  updateOrderStatus(orderId, status);
});
```

### Çoklu Sunucu (Scaling)

Redis adapter kullanarak multiple server desteği:

```javascript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

## 📝 API Referansı

### notifyNewOrder(orderId, restaurantOrders)

Yeni sipariş bildirimi gönderir.

**Parametreler:**
- `orderId` (number): Sipariş ID
- `restaurantOrders` (array): Restoran bazında sipariş detayları

**Örnek:**
```javascript
notifyNewOrder(123, [
  {
    restaurantId: 1,
    items: [...],
    subtotal: 150
  }
]);
```

## 🎉 Özet

- ✅ Socket.io altyapısı hazır
- ✅ Sipariş bildirimleri çalışıyor
- ✅ Restoran bazında gruplama aktif
- ✅ Genişletilebilir yapı
- ❌ Agent sistemi kaldırıldı
- ⚠️ Authentication henüz yok (opsiyonel)

İhtiyacınıza göre bu altyapıyı kullanabilirsiniz:
- Web dashboard
- Mobil uygulama
- Özel yazıcı sistemi
- Desktop uygulama
- vb.

---

**Not:** Agent sistemi tamamen kaldırıldı. Sadece Socket.io bildirim altyapısı korundu.
Kendi client'ınızı yazmak için yukarıdaki örnekleri kullanabilirsiniz.

