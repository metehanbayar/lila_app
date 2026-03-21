await Promise.all([
  import('../config/payment.js'),
  import('../services/auth-token.js'),
  import('../routes/admin.js'),
  import('../routes/customer-auth.js'),
  import('../routes/payment.js'),
]);

console.log('Server smoke check passed.');
