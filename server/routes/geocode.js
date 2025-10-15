import express from 'express';
import axios from 'axios';
import { Client } from '@googlemaps/google-maps-services-js';

const router = express.Router();
const googleMapsClient = new Client({});

// Reverse geocoding using Google Maps API
router.get('/reverse', async (req, res) => {
  try {
    const { lat, lon, language } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'lat ve lon zorunludur',
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Google Maps API Key tanımlanmamış. Lütfen .env dosyasına GOOGLE_MAPS_API_KEY ekleyin.',
      });
    }

    const response = await googleMapsClient.reverseGeocode({
      params: {
        latlng: { lat: parseFloat(lat), lng: parseFloat(lon) },
        key: apiKey,
        language: language || 'tr',
        result_type: 'street_address|route|neighborhood|sublocality|locality|administrative_area_level_1',
      },
      timeout: 10000,
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${response.data.status}`);
    }

    // Google Maps response'unu kullanıcı dostu formata çevir
    const result = response.data.results[0];
    
    return res.json({ 
      success: true, 
      data: {
        formatted_address: result.formatted_address,
        address_components: result.address_components,
        place_id: result.place_id,
        geometry: result.geometry,
      }
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const detail = error.response?.data || error.message;
    console.error('Google Maps Geocode reverse hatası:', detail);
    return res.status(status).json({
      success: false,
      message: 'Geocode isteği başarısız',
      error: process.env.NODE_ENV === 'development' ? detail : undefined,
    });
  }
});

// Search geocoding using Google Maps API
router.get('/search', async (req, res) => {
  try {
    const { q, limit, language, countrycodes } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'q (query) zorunludur' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Google Maps API Key tanımlanmamış.',
      });
    }

    const response = await googleMapsClient.geocode({
      params: {
        address: String(q),
        key: apiKey,
        language: language || 'tr',
        components: countrycodes ? { country: countrycodes } : undefined,
      },
      timeout: 10000,
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Maps API error: ${response.data.status}`);
    }

    const results = response.data.results.slice(0, parseInt(limit) || 5).map(result => ({
      place_id: result.place_id,
      formatted_address: result.formatted_address,
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      address_components: result.address_components,
    }));

    return res.json({ success: true, data: results });
  } catch (error) {
    const status = error.response?.status || 500;
    const detail = error.response?.data || error.message;
    console.error('Google Maps Geocode search hatası:', detail);
    return res.status(status).json({
      success: false,
      message: 'Geocode search isteği başarısız',
      error: process.env.NODE_ENV === 'development' ? detail : undefined,
    });
  }
});

export default router;
