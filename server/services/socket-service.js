import { Server } from 'socket.io';
import { getConnection, sql } from '../config/database.js';
import { createCorsOriginValidator } from '../config/runtime.js';

let io;

/**
 * Socket.io sunucusunu başlatır
 */
export function initializeSocketIO(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: createCorsOriginValidator(),
      methods: ['GET', 'POST'],
      allowedHeaders: ['Authorization'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', async (socket) => {
    console.log(`🔌 Yeni Socket.io bağlantısı: ${socket.id}`);
    
    // Buraya gelecekte farklı client'lar için event handler'lar eklenebilir
    // Örneğin: admin dashboard, mobile app vb.
    
    socket.on('disconnect', () => {
      console.log(`🔌 Bağlantı koptu: ${socket.id}`);
    });
  });

  console.log('✅ Socket.IO başlatıldı');

  return io;
}

/**
 * Yeni sipariş geldiğinde ilgili restoranların agent'larına bildirim gönderir
 */
export async function notifyNewOrder(orderId, restaurantOrders) {
  if (!io) {
    console.error('❌ Socket.IO başlatılmamış!');
    return;
  }

  try {
    const pool = await getConnection();

    // Sipariş detaylarını al
    const orderResult = await pool
      .request()
      .input('orderId', sql.Int, orderId)
      .query(`
        SELECT 
          o.*,
          (SELECT * FROM OrderItems WHERE OrderId = o.Id FOR JSON PATH) as ItemsJson
        FROM Orders o
        WHERE o.Id = @orderId
      `);

    if (orderResult.recordset.length === 0) {
      console.error(`❌ Sipariş bulunamadı: ${orderId}`);
      return;
    }

    const order = orderResult.recordset[0];
    const orderItems = JSON.parse(order.ItemsJson || '[]');

    // Her restoran için bildirim gönder
    for (const restaurantOrder of restaurantOrders) {
      const { restaurantId, items, subtotal } = restaurantOrder;

      // Restoran adını al
      const restaurantResult = await pool
        .request()
        .input('restaurantId', sql.Int, restaurantId)
        .query(`SELECT Name, AutoPrint FROM Restaurants WHERE Id = @restaurantId`);

      if (restaurantResult.recordset.length === 0) continue;

      const restaurant = restaurantResult.recordset[0];

      // AutoPrint kapalıysa bildirim gönderme
      if (!restaurant.AutoPrint) {
        console.log(`⏸️ AutoPrint kapalı: ${restaurant.Name}`);
        continue;
      }

      // Yazdırma verisini hazırla
      const printData = {
        orderId: order.Id,
        orderNumber: order.OrderNumber,
        restaurantId,
        restaurantName: restaurant.Name,
        customerName: order.CustomerName,
        customerPhone: order.CustomerPhone,
        customerAddress: order.CustomerAddress,
        notes: order.Notes,
        subtotal,
        totalAmount: order.TotalAmount,
        discountAmount: order.DiscountAmount || 0,
        couponCode: order.CouponCode,
        items: items.map(item => ({
          productName: item.productName,
          variantName: item.variantName,
          quantity: item.quantity,
          price: item.productPrice,
          subtotal: item.subtotal,
        })),
        createdAt: order.CreatedAt,
      };

      // Tüm bağlı client'lara gönder (her client kendi RestaurantId'sine göre filtreleyecek)
      io.emit('order:new', printData);

      console.log(`📤 Sipariş bildirimi gönderildi: ${order.OrderNumber} -> ${restaurant.Name}`);
    }

  } catch (error) {
    console.error('❌ Sipariş bildirimi hatası:', error);
  }
}


export { io };
