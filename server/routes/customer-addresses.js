import express from 'express';
import sql from 'mssql';
import { getConnection } from '../config/database.js';
import { customerAuth } from './customer-auth.js';

const router = express.Router();

// Tüm adresleri getir
router.get('/', customerAuth, async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('customerId', sql.Int, req.customer.Id)
      .query(`
        SELECT Id, AddressName, FullAddress, IsDefault, CreatedAt, UpdatedAt
        FROM CustomerAddresses
        WHERE CustomerId = @customerId
        ORDER BY IsDefault DESC, CreatedAt DESC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('Adresler getirilemedi:', err);
    res.status(500).json({ success: false, message: 'Adresler yüklenirken hata oluştu' });
  }
});

// Yeni adres ekle
router.post('/', customerAuth, async (req, res) => {
  const { addressName, fullAddress, isDefault } = req.body;

  if (!addressName || !fullAddress) {
    return res.status(400).json({ success: false, message: 'Adres ismi ve tam adres gereklidir' });
  }

  if (addressName.length > 50) {
    return res.status(400).json({ success: false, message: 'Adres ismi en fazla 50 karakter olabilir' });
  }

  try {
    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Eğer bu adres default olacaksa, diğer default adresleri kaldır
      if (isDefault) {
        await transaction.request()
          .input('customerId', sql.Int, req.customer.Id)
          .query('UPDATE CustomerAddresses SET IsDefault = 0 WHERE CustomerId = @customerId');
      }

      // Yeni adresi ekle
      const result = await transaction.request()
        .input('customerId', sql.Int, req.customer.Id)
        .input('addressName', sql.NVarChar, addressName)
        .input('fullAddress', sql.NVarChar, fullAddress)
        .input('isDefault', sql.Bit, isDefault || false)
        .query(`
          INSERT INTO CustomerAddresses (CustomerId, AddressName, FullAddress, IsDefault)
          OUTPUT INSERTED.*
          VALUES (@customerId, @addressName, @fullAddress, @isDefault)
        `);

      await transaction.commit();

      res.json({ success: true, data: result.recordset[0], message: 'Adres başarıyla eklendi' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Adres eklenemedi:', err);
    res.status(500).json({ success: false, message: 'Adres eklenirken hata oluştu' });
  }
});

// Adres güncelle
router.put('/:id', customerAuth, async (req, res) => {
  const { id } = req.params;
  const { addressName, fullAddress, isDefault } = req.body;

  if (!addressName || !fullAddress) {
    return res.status(400).json({ success: false, message: 'Adres ismi ve tam adres gereklidir' });
  }

  try {
    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Adresin bu müşteriye ait olduğunu kontrol et
      const checkResult = await transaction.request()
        .input('id', sql.Int, id)
        .input('customerId', sql.Int, req.customer.Id)
        .query('SELECT Id FROM CustomerAddresses WHERE Id = @id AND CustomerId = @customerId');

      if (checkResult.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Adres bulunamadı' });
      }

      // Eğer bu adres default olacaksa, diğer default adresleri kaldır
      if (isDefault) {
        await transaction.request()
          .input('customerId', sql.Int, req.customer.Id)
          .input('id', sql.Int, id)
          .query('UPDATE CustomerAddresses SET IsDefault = 0 WHERE CustomerId = @customerId AND Id != @id');
      }

      // Adresi güncelle
      const result = await transaction.request()
        .input('id', sql.Int, id)
        .input('addressName', sql.NVarChar, addressName)
        .input('fullAddress', sql.NVarChar, fullAddress)
        .input('isDefault', sql.Bit, isDefault || false)
        .query(`
          UPDATE CustomerAddresses
          SET AddressName = @addressName, 
              FullAddress = @fullAddress, 
              IsDefault = @isDefault,
              UpdatedAt = GETDATE()
          OUTPUT INSERTED.*
          WHERE Id = @id
        `);

      await transaction.commit();

      res.json({ success: true, data: result.recordset[0], message: 'Adres başarıyla güncellendi' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Adres güncellenemedi:', err);
    res.status(500).json({ success: false, message: 'Adres güncellenirken hata oluştu' });
  }
});

// Adresi varsayılan yap
router.patch('/:id/set-default', customerAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Adresin bu müşteriye ait olduğunu kontrol et
      const checkResult = await transaction.request()
        .input('id', sql.Int, id)
        .input('customerId', sql.Int, req.customer.Id)
        .query('SELECT Id FROM CustomerAddresses WHERE Id = @id AND CustomerId = @customerId');

      if (checkResult.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Adres bulunamadı' });
      }

      // Diğer default adresleri kaldır
      await transaction.request()
        .input('customerId', sql.Int, req.customer.Id)
        .query('UPDATE CustomerAddresses SET IsDefault = 0 WHERE CustomerId = @customerId');

      // Bu adresi default yap
      const result = await transaction.request()
        .input('id', sql.Int, id)
        .query(`
          UPDATE CustomerAddresses
          SET IsDefault = 1, UpdatedAt = GETDATE()
          OUTPUT INSERTED.*
          WHERE Id = @id
        `);

      await transaction.commit();

      res.json({ success: true, data: result.recordset[0], message: 'Varsayılan adres güncellendi' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Varsayılan adres ayarlanamadı:', err);
    res.status(500).json({ success: false, message: 'Varsayılan adres ayarlanırken hata oluştu' });
  }
});

// Adres sil
router.delete('/:id', customerAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await getConnection();

    // Adresin bu müşteriye ait olduğunu kontrol et ve sil
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('customerId', sql.Int, req.customer.Id)
      .query('DELETE FROM CustomerAddresses WHERE Id = @id AND CustomerId = @customerId');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: 'Adres bulunamadı' });
    }

    res.json({ success: true, message: 'Adres başarıyla silindi' });
  } catch (err) {
    console.error('Adres silinemedi:', err);
    res.status(500).json({ success: false, message: 'Adres silinirken hata oluştu' });
  }
});

export default router;

