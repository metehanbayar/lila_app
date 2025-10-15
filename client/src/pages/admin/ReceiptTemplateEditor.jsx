import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReceiptTemplate, updateReceiptTemplate } from '../../services/adminApi';
import AdminLayout from '../../components/admin/AdminLayout';
import Loading from '../../components/Loading';

export default function ReceiptTemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [template, setTemplate] = useState(null);

  useEffect(() => {
    loadTemplate();
  }, [id]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const response = await getReceiptTemplate(id);
      setRestaurant({ id: response.data.restaurantId, name: response.data.restaurantName });
      setTemplate(response.data.template);
    } catch (error) {
      console.error('Template yükleme hatası:', error);
      alert('Template yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateReceiptTemplate(id, template);
      alert('Fiş template başarıyla kaydedildi!');
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert('Kaydetme hatası: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const updateTemplate = (path, value) => {
    setTemplate((prev) => {
      const newTemplate = { ...prev };
      const keys = path.split('.');
      let current = newTemplate;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newTemplate;
    });
  };

  const addFooterLine = () => {
    setTemplate((prev) => ({
      ...prev,
      footerText: [...prev.footerText, 'Yeni satır'],
    }));
  };

  const removeFooterLine = (index) => {
    setTemplate((prev) => ({
      ...prev,
      footerText: prev.footerText.filter((_, i) => i !== index),
    }));
  };

  const updateFooterLine = (index, value) => {
    setTemplate((prev) => ({
      ...prev,
      footerText: prev.footerText.map((line, i) => (i === index ? value : line)),
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <Loading />
      </AdminLayout>
    );
  }

  if (!template) {
    return (
      <AdminLayout>
        <div className="p-8">Template bulunamadı</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white shadow px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fiş Template Editörü</h1>
          <p className="text-sm text-gray-500">{restaurant?.name}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/admin/restaurants')}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editör Panel (Sol) */}
        <div className="w-1/2 border-r overflow-y-auto bg-gray-50">
          <div className="p-6 space-y-6">
            {/* Logo */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Logo</h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={template.showLogo}
                  onChange={(e) => updateTemplate('showLogo', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Logo göster</span>
              </label>
              {template.showLogo && (
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Logo URL (/uploads/logo.png)"
                    value={template.logoUrl || ''}
                    onChange={(e) => updateTemplate('logoUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              )}
            </div>

            {/* Font Boyutları */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Font Boyutları</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Başlık</label>
                  <input
                    type="number"
                    min="8"
                    max="20"
                    value={template.fontSize.title}
                    onChange={(e) => updateTemplate('fontSize.title', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Normal</label>
                  <input
                    type="number"
                    min="6"
                    max="16"
                    value={template.fontSize.normal}
                    onChange={(e) => updateTemplate('fontSize.normal', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kalın</label>
                  <input
                    type="number"
                    min="6"
                    max="16"
                    value={template.fontSize.bold}
                    onChange={(e) => updateTemplate('fontSize.bold', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Küçük</label>
                  <input
                    type="number"
                    min="5"
                    max="12"
                    value={template.fontSize.small}
                    onChange={(e) => updateTemplate('fontSize.small', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Gösterilecek Bilgiler */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Gösterilecek Bilgiler</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={template.showCustomerAddress}
                    onChange={(e) => updateTemplate('showCustomerAddress', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Müşteri Adresi</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={template.showCustomerPhone}
                    onChange={(e) => updateTemplate('showCustomerPhone', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Müşteri Telefonu</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={template.showNotes}
                    onChange={(e) => updateTemplate('showNotes', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Sipariş Notları</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={template.showItemPrices}
                    onChange={(e) => updateTemplate('showItemPrices', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Ürün Fiyatları</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={template.showDiscount}
                    onChange={(e) => updateTemplate('showDiscount', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>İndirim Bilgisi</span>
                </label>
              </div>
            </div>

            {/* QR Kod & Barcode */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">QR Kod & Barcode</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={template.showQRCode}
                    onChange={(e) => updateTemplate('showQRCode', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>QR Kod göster (Sipariş Takibi)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={template.showBarcode}
                    onChange={(e) => updateTemplate('showBarcode', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Barcode göster (Sipariş No)</span>
                </label>
              </div>
            </div>

            {/* Kapanış Metinleri */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Kapanış Metinleri</h3>
              <div className="space-y-2">
                {template.footerText.map((line, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={line}
                      onChange={(e) => updateFooterLine(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Kapanış metni"
                    />
                    <button
                      onClick={() => removeFooterLine(index)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={addFooterLine}
                  className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-blue-500 hover:text-blue-600"
                >
                  + Satır Ekle
                </button>
              </div>
            </div>

            {/* İletişim Bilgileri */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">İletişim Bilgileri</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Telefon</label>
                  <input
                    type="text"
                    placeholder="0850 XXX XX XX"
                    value={template.contactInfo.phone || ''}
                    onChange={(e) => updateTemplate('contactInfo.phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Website</label>
                  <input
                    type="text"
                    placeholder="www.lilagusto.com"
                    value={template.contactInfo.website || ''}
                    onChange={(e) => updateTemplate('contactInfo.website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Instagram</label>
                  <input
                    type="text"
                    placeholder="@lilagusto"
                    value={template.contactInfo.instagram || ''}
                    onChange={(e) => updateTemplate('contactInfo.instagram', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Adres</label>
                  <input
                    type="text"
                    placeholder="Restoran adresi"
                    value={template.contactInfo.address || ''}
                    onChange={(e) => updateTemplate('contactInfo.address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Gelişmiş Ayarlar */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Gelişmiş Ayarlar</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Kağıt Genişliği (mm)</label>
                  <input
                    type="number"
                    min="58"
                    max="80"
                    value={template.paperWidth}
                    onChange={(e) => updateTemplate('paperWidth', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Satır Aralığı (px)</label>
                  <input
                    type="number"
                    min="8"
                    max="20"
                    value={template.lineSpacing}
                    onChange={(e) => updateTemplate('lineSpacing', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Önizleme Panel (Sağ) */}
        <div className="w-1/2 overflow-y-auto bg-gray-100 p-6">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4 text-center">
              Önizleme (80mm Thermal)
            </h3>

            {/* 80mm Fiş Önizleme */}
            <div
              className="bg-white shadow-2xl mx-auto"
              style={{
                width: `${template.paperWidth * 3.78}px`, // mm to px conversion (96 DPI)
                fontFamily: 'Courier New, monospace',
                fontSize: '10px',
                padding: `${template.margins.top}px ${template.margins.left}px ${template.margins.bottom}px`,
              }}
            >
              {/* Logo */}
              {template.showLogo && template.logoUrl && (
                <div className="text-center mb-2">
                  <img
                    src={template.logoUrl}
                    alt="Logo"
                    className="mx-auto"
                    style={{ maxWidth: '100px', maxHeight: '50px' }}
                  />
                </div>
              )}

              {/* Başlık */}
              <div className="border-b-2 border-black pb-1 mb-1">
                <div
                  className="text-center font-bold"
                  style={{ fontSize: `${template.fontSize.title}px` }}
                >
                  {restaurant?.name || 'RESTORAN ADI'}
                </div>
              </div>
              <div className="border-b-2 border-black pb-1 mb-1"></div>

              {/* Sipariş Bilgileri */}
              <div style={{ fontSize: `${template.fontSize.normal}px` }} className="mb-1">
                <div>Sipariş: LG2510151234</div>
                <div style={{ fontSize: `${template.fontSize.small}px` }}>
                  Tarih: 15.10.2024 21:30
                </div>
              </div>

              <div className="border-t border-gray-400 my-1"></div>

              {/* Müşteri */}
              <div style={{ fontSize: `${template.fontSize.normal}px` }} className="mb-1">
                <div>Müşteri: Ahmet Yılmaz</div>
                {template.showCustomerPhone && (
                  <div style={{ fontSize: `${template.fontSize.small}px` }}>Tel: 0555 123 4567</div>
                )}
                {template.showCustomerAddress && (
                  <div style={{ fontSize: `${template.fontSize.small}px` }}>
                    Atatürk Cad. No:123, Kadıköy, İstanbul
                  </div>
                )}
              </div>

              <div className="border-t border-gray-400 my-1"></div>

              {/* Ürünler */}
              <div style={{ fontSize: `${template.fontSize.bold}px` }} className="font-bold mb-1">
                ÜRÜNLER:
              </div>
              <div className="border-t border-gray-400 mb-1"></div>

              <div style={{ fontSize: `${template.fontSize.normal}px` }} className="space-y-1">
                <div className="flex justify-between">
                  <span>2x Hamburger (XL)</span>
                  {template.showItemPrices && <span>150.00 TL</span>}
                </div>
                <div className="flex justify-between">
                  <span>1x Patates</span>
                  {template.showItemPrices && <span>50.00 TL</span>}
                </div>
                <div className="flex justify-between">
                  <span>1x Kola</span>
                  {template.showItemPrices && <span>35.00 TL</span>}
                </div>
              </div>

              <div className="border-t border-gray-400 my-1"></div>

              {/* Toplam */}
              <div style={{ fontSize: `${template.fontSize.normal}px` }} className="text-right">
                {template.showDiscount && (
                  <>
                    <div>Ara Toplam: 235.00 TL</div>
                    <div>İndirim: -20.00 TL</div>
                    <div style={{ fontSize: `${template.fontSize.small}px` }}>(YENI20)</div>
                  </>
                )}
              </div>

              <div className="border-b-2 border-black my-1"></div>

              <div
                className="text-right font-bold"
                style={{ fontSize: `${template.fontSize.title}px` }}
              >
                TOPLAM: 215.00 TL
              </div>

              <div className="border-b-2 border-black my-1"></div>

              {/* Notlar */}
              {template.showNotes && (
                <>
                  <div style={{ fontSize: `${template.fontSize.bold}px` }} className="font-bold mt-2">
                    Not:
                  </div>
                  <div style={{ fontSize: `${template.fontSize.small}px` }}>Acısız olsun lütfen</div>
                  <div className="border-t border-gray-400 my-1"></div>
                </>
              )}

              {/* Footer */}
              <div className="text-center mt-3 space-y-1">
                {template.footerText.map((line, index) => (
                  <div
                    key={index}
                    style={{ fontSize: `${template.fontSize.bold}px` }}
                    className="font-bold"
                  >
                    {line}
                  </div>
                ))}

                {/* İletişim Bilgileri */}
                {template.contactInfo.website && (
                  <div style={{ fontSize: `${template.fontSize.small}px` }}>
                    {template.contactInfo.website}
                  </div>
                )}
                {template.contactInfo.phone && (
                  <div style={{ fontSize: `${template.fontSize.small}px` }}>
                    Tel: {template.contactInfo.phone}
                  </div>
                )}
                {template.contactInfo.instagram && (
                  <div style={{ fontSize: `${template.fontSize.small}px` }}>
                    Instagram: {template.contactInfo.instagram}
                  </div>
                )}
                {template.contactInfo.address && (
                  <div style={{ fontSize: `${template.fontSize.small}px` }}>
                    {template.contactInfo.address}
                  </div>
                )}
              </div>

              {/* QR Kod */}
              {template.showQRCode && (
                <div className="text-center mt-3">
                  <div className="inline-block border-2 border-black p-2">
                    <div className="text-xs">QR KOD</div>
                    <div className="text-xs">(LG2510151234)</div>
                  </div>
                </div>
              )}

              {/* Barcode */}
              {template.showBarcode && (
                <div className="text-center mt-2">
                  <div className="text-xs">||||| LG2510151234 |||||</div>
                </div>
              )}
            </div>

            {/* Önizleme Açıklaması */}
            <div className="mt-4 text-center text-sm text-gray-600">
              <p>Gerçek fiş boyutunda önizleme</p>
              <p className="text-xs mt-1">
                Ekranda gördüğünüz boyut gerçek yazıcı çıktısına yakındır
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </AdminLayout>
  );
}

