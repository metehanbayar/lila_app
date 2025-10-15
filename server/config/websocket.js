import { Server } from 'socket.io';

let io = null;

export function initializeWebSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
    path: '/socket.io/',
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`📡 Yeni bağlantı: ${socket.id}`);

    // Agent kimlik doğrulama
    socket.on('agent:register', (data) => {
      const { restaurantId, agentVersion } = data;
      
      // Socket'i restoran odasına ekle
      if (restaurantId) {
        socket.join(`restaurant:${restaurantId}`);
        socket.restaurantId = restaurantId;
        console.log(`🖨️  Agent kaydedildi - Restoran: ${restaurantId}, Socket: ${socket.id}`);
        
        socket.emit('agent:registered', {
          success: true,
          message: `Restoran ${restaurantId} için agent başarıyla kaydedildi`,
          restaurantId,
        });
      }
    });

    // Ping-Pong için heartbeat
    socket.on('ping', () => {
      socket.emit('pong');
    });

    socket.on('disconnect', () => {
      console.log(`📡 Bağlantı kesildi: ${socket.id} ${socket.restaurantId ? `(Restoran: ${socket.restaurantId})` : ''}`);
    });
  });

  console.log('✅ WebSocket sunucusu başlatıldı');
  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('WebSocket henüz başlatılmadı!');
  }
  return io;
}

export function emitNewOrder(orderData) {
  if (!io) {
    console.warn('WebSocket başlatılmamış, sipariş bildirimi gönderilemedi');
    return;
  }

  // Siparişteki her restoran için ayrı bildirim gönder
  const { restaurantOrders } = orderData;
  
  if (restaurantOrders && restaurantOrders.length > 0) {
    restaurantOrders.forEach((restaurantOrder) => {
      const { restaurantId, restaurantName, items, subtotal } = restaurantOrder;
      
      // Sadece ilgili restoranın odasına gönder
      io.to(`restaurant:${restaurantId}`).emit('new:order', {
        ...orderData,
        restaurantId,
        restaurantName,
        items, // Sadece bu restorana ait ürünler
        restaurantSubtotal: subtotal,
      });

      console.log(`📨 Sipariş bildirimi gönderildi - Restoran: ${restaurantId} (${restaurantName})`);
    });
  } else {
    // Eski siparişler için (tüm ürünler tek restoranda)
    io.emit('new:order', orderData);
    console.log('📨 Genel sipariş bildirimi gönderildi');
  }
}

export function emitOrderStatusUpdate(orderId, status) {
  if (!io) {
    console.warn('WebSocket başlatılmamış, durum güncellemesi gönderilemedi');
    return;
  }

  io.emit('order:status', { orderId, status });
  console.log(`📨 Sipariş durumu güncellendi - Order: ${orderId}, Status: ${status}`);
}

