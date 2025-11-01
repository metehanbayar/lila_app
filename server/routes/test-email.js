import express from 'express';
import { testEmailConnection, sendTestEmail } from '../config/email.js';

const router = express.Router();

// Mail bağlantısını test et
router.get('/test-connection', async (req, res) => {
  try {
    console.log('🔍 Mail bağlantısı test ediliyor...');
    const result = await testEmailConnection();
    
    if (result) {
      res.json({ success: true, message: 'Mail sunucusu bağlantısı başarılı' });
    } else {
      res.status(500).json({ success: false, message: 'Mail sunucusu bağlantı hatası' });
    }
  } catch (error) {
    console.error('Mail test hatası:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Test maili gönder
router.get('/send-test', async (req, res) => {
  try {
    console.log('📧 Test maili gönderiliyor...');
    const result = await sendTestEmail();
    
    if (result) {
      res.json({ success: true, message: 'Test maili gönderildi' });
    } else {
      res.status(500).json({ success: false, message: 'Test maili gönderilemedi' });
    }
  } catch (error) {
    console.error('Mail gönderme hatası:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
