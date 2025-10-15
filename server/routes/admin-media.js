import express from 'express';
import { getConnection, sql } from '../config/database.js';
import { adminAuth } from './admin.js';
import { upload } from '../config/multer.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Tüm media dosyalarını getir
router.get('/', adminAuth, async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        Id, FileName, OriginalName, FilePath, FileUrl,
        FileSize, MimeType, Width, Height, UploadedBy, CreatedAt
      FROM Media
      ORDER BY CreatedAt DESC
    `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Media listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Media dosyaları yüklenirken bir hata oluştu',
    });
  }
});

// Tek media detayı
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          Id, FileName, OriginalName, FilePath, FileUrl,
          FileSize, MimeType, Width, Height, UploadedBy, CreatedAt
        FROM Media
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Media dosyası bulunamadı',
      });
    }

    res.json({
      success: true,
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Media detay hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Media dosyası yüklenirken bir hata oluştu',
    });
  }
});

// Dosya yükleme
router.post('/upload', adminAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Dosya yüklenmedi',
      });
    }

    const pool = await getConnection();
    const file = req.file;
    
    // Dosya URL'i oluştur
    const fileUrl = `/uploads/${file.filename}`;
    
    // Görsel boyutlarını al (sharp kullanmadan basit yaklaşım)
    let width = null;
    let height = null;

    // Veritabanına kaydet
    const result = await pool
      .request()
      .input('fileName', sql.NVarChar, file.filename)
      .input('originalName', sql.NVarChar, file.originalname)
      .input('filePath', sql.NVarChar, file.path)
      .input('fileUrl', sql.NVarChar, fileUrl)
      .input('fileSize', sql.Int, file.size)
      .input('mimeType', sql.NVarChar, file.mimetype)
      .input('width', sql.Int, width)
      .input('height', sql.Int, height)
      .input('uploadedBy', sql.NVarChar, 'admin')
      .query(`
        INSERT INTO Media (
          FileName, OriginalName, FilePath, FileUrl, 
          FileSize, MimeType, Width, Height, UploadedBy
        )
        OUTPUT INSERTED.*
        VALUES (
          @fileName, @originalName, @filePath, @fileUrl,
          @fileSize, @mimeType, @width, @height, @uploadedBy
        )
      `);

    res.status(201).json({
      success: true,
      message: 'Dosya başarıyla yüklendi',
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Dosya yükleme hatası:', error);
    
    // Hata durumunda dosyayı sil
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Dosya silme hatası:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Dosya yüklenirken bir hata oluştu',
    });
  }
});

// Çoklu dosya yükleme
router.post('/upload-multiple', adminAuth, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Dosya yüklenmedi',
      });
    }

    const pool = await getConnection();
    const uploadedFiles = [];

    for (const file of req.files) {
      const fileUrl = `/uploads/${file.filename}`;
      
      const result = await pool
        .request()
        .input('fileName', sql.NVarChar, file.filename)
        .input('originalName', sql.NVarChar, file.originalname)
        .input('filePath', sql.NVarChar, file.path)
        .input('fileUrl', sql.NVarChar, fileUrl)
        .input('fileSize', sql.Int, file.size)
        .input('mimeType', sql.NVarChar, file.mimetype)
        .input('uploadedBy', sql.NVarChar, 'admin')
        .query(`
          INSERT INTO Media (
            FileName, OriginalName, FilePath, FileUrl, 
            FileSize, MimeType, UploadedBy
          )
          OUTPUT INSERTED.*
          VALUES (
            @fileName, @originalName, @filePath, @fileUrl,
            @fileSize, @mimeType, @uploadedBy
          )
        `);

      uploadedFiles.push(result.recordset[0]);
    }

    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} dosya başarıyla yüklendi`,
      data: uploadedFiles,
    });
  } catch (error) {
    console.error('Çoklu dosya yükleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Dosyalar yüklenirken bir hata oluştu',
    });
  }
});

// Media sil
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Önce dosya bilgilerini al
    const fileResult = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT FilePath FROM Media WHERE Id = @id');

    if (fileResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Media dosyası bulunamadı',
      });
    }

    const filePath = fileResult.recordset[0].FilePath;

    // Veritabanından sil
    await pool
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Media WHERE Id = @id');

    // Fiziksel dosyayı sil
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (unlinkError) {
      console.error('Dosya silme hatası:', unlinkError);
    }

    res.json({
      success: true,
      message: 'Media dosyası başarıyla silindi',
    });
  } catch (error) {
    console.error('Media silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Media dosyası silinirken bir hata oluştu',
    });
  }
});

export default router;

