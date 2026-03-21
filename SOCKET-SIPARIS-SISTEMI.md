# Socket.io Sipariş Bildirim Sistemi

Bu sistem sipariş oluştuğunda Socket.io üzerinden gerçek zamanlı `order:new` eventi yayınlar.

Legacy agent yapısı kaldırıldı. Aktif yazdırma akışı `LilaPrinterClient` veya bu event'i dinleyen başka client'lar üzerinden ilerler.

## Mevcut Davranış

- Socket.io sunucusu Express API ile aynı süreçte çalışır.
- Yeni sipariş geldiğinde backend siparişi restoran bazında gruplar.
- Event tüm bağlı client'lara broadcast edilir.
- Client tarafı kendi `restaurantId` değerine göre filtreleme yapar.

Önemli:

- Şu an room tabanlı `join-restaurant` akışı yok.
- Şu an event yetkilendirmesi yok.

## Backend Akışı

Sipariş oluşturma tamamlandıktan sonra bildirim tetiklenir:

```javascript
notifyNewOrder(orderId, restaurantOrdersForNotification);
```

`server/services/socket-service.js` içinde yayın mantığı:

```javascript
for (const restaurantOrder of restaurantOrders) {
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
    createdAt,
  };

  io.emit('order:new', printData);
}
```

## Event Veri Yapısı

`order:new` örnek yükü:

```json
{
  "orderId": 123,
  "orderNumber": "LG241015001",
  "restaurantId": 1,
  "restaurantName": "Lila Gourmet",
  "customerName": "Ahmet Yılmaz",
  "customerPhone": "0555 123 4567",
  "customerAddress": "Atatürk Cad. No:123",
  "notes": "Acısız olsun",
  "subtotal": 150,
  "totalAmount": 130,
  "discountAmount": 20,
  "couponCode": "YENI20",
  "items": [
    {
      "productName": "Hamburger",
      "variantName": "XL",
      "quantity": 2,
      "price": 75,
      "subtotal": 150
    }
  ],
  "createdAt": "2026-03-21T10:15:00.000Z"
}
```

## Client Tarafı

Örnek dinleyici:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');
const activeRestaurantId = 1;

socket.on('order:new', (order) => {
  if (order.restaurantId !== activeRestaurantId) {
    return;
  }

  console.log('Yeni sipariş:', order.orderNumber);
});
```

Bu model şu tip istemciler için uygundur:

- `LilaPrinterClient`
- admin dashboard
- özel masaüstü istemcileri
- mobil bildirim köprüleri

## CORS ve Ağ

Socket.io CORS davranışı backend runtime ayarlarını kullanır.

Production için:

```env
CORS_ORIGIN=https://yourdomain.com
```

Development ortamında `CORS_ORIGIN` boşsa local origin'lere izin verilir.

## Sınırlamalar

- Broadcast modeli nedeniyle tüm client'lar event'i alır.
- Filtreleme istemci tarafındadır.
- Socket auth middleware henüz yoktur.

## Gelecekte Yapılabilecekler

- room tabanlı abonelik
- token tabanlı socket auth
- Redis adapter ile çoklu sunucu desteği
- `order:status-update` gibi ek event'ler

## İlgili Dosyalar

- `server/services/socket-service.js`
- `server/server.js`
