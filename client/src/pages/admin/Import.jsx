import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Loading from '../../components/Loading';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import {
  parseXMLFile,
  importProducts,
  getAdminRestaurants,
  getAdminCategories,
  createCategory,
} from '../../services/adminApi';

function Import() {
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Result
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [categoryMapping, setCategoryMapping] = useState({});
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [restaurantsRes, categoriesRes] = await Promise.all([
        getAdminRestaurants(),
        getAdminCategories(),
      ]);
      setRestaurants(restaurantsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xml')) {
        alert('Lütfen .xml uzantılı bir dosya seçin');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Lütfen bir dosya seçin');
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage('XML dosyası işleniyor...');
      const response = await parseXMLFile(file);
      setParsedData(response.data);
      
      // Otomatik kategori eşleştirmesi
      const mapping = {};
      response.data.categories.forEach((cat) => {
        // Varolan kategoriyi bul
        const existing = categories.find(
          (c) => c.Name.toLowerCase() === cat.toLowerCase()
        );
        if (existing) {
          mapping[cat] = existing.Id;
        }
      });
      setCategoryMapping(mapping);
      
      setStep(2);
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      alert('Dosya yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleCreateCategory = async (categoryName, restaurantId) => {
    try {
      const response = await createCategory({
        restaurantId: parseInt(restaurantId),
        name: categoryName,
        displayOrder: 0,
        isActive: true,
      });
      
      // Kategori listesini güncelle
      await loadData();
      
      // Mapping'i güncelle
      setCategoryMapping({
        ...categoryMapping,
        [categoryName]: response.data.Id,
      });
      
      return response.data.Id;
    } catch (error) {
      console.error('Kategori oluşturma hatası:', error);
      throw error;
    }
  };

  const handleImport = async () => {
    if (!selectedRestaurant) {
      alert('Lütfen bir restoran seçin');
      return;
    }

    // Tüm kategorilerin eşleştirildiğinden emin ol
    const unmappedCategories = parsedData.categories.filter(
      (cat) => !categoryMapping[cat]
    );
    
    if (unmappedCategories.length > 0) {
      alert(`Lütfen tüm kategorileri eşleştirin: ${unmappedCategories.join(', ')}`);
      return;
    }

    try {
      setLoading(true);
      const productCount = parsedData.products.length;
      const imageCount = parsedData.products.filter(p => p.imageUrl).length;
      
      setLoadingMessage(
        `${productCount} ürün ve ${imageCount} görsel içe aktarılıyor...\n\n` +
        `Bu işlem ${Math.ceil(productCount / 10)} batch halinde yapılacak.\n` +
        `Lütfen sayfayı kapatmayın, işlem ${Math.ceil(productCount / 2)} dakika sürebilir.`
      );
      
      const response = await importProducts(
        parseInt(selectedRestaurant),
        parsedData.products,
        categoryMapping
      );
      setImportResult(response.data);
      setStep(3);
    } catch (error) {
      console.error('Import hatası:', error);
      const errorMsg = error.response?.data?.error || error.message;
      alert('Ürünler import edilirken bir hata oluştu:\n\n' + errorMsg);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleReset = () => {
    setStep(1);
    setFile(null);
    setParsedData(null);
    setSelectedRestaurant('');
    setCategoryMapping({});
    setImportResult(null);
  };

  const getRestaurantCategories = () => {
    if (!selectedRestaurant) return [];
    return categories.filter(
      (cat) => cat.RestaurantId === parseInt(selectedRestaurant)
    );
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ürün İçe Aktarma</h1>
          <p className="text-gray-600">
            WordPress XML dosyasından ürünleri sisteme aktarın
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Dosya Yükle' },
              { num: 2, label: 'Eşleştir' },
              { num: 3, label: 'Sonuç' },
            ].map((s, idx) => (
              <div key={s.num} className="flex-1 flex items-center">
                <div className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step >= s.num
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {s.num}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      step >= s.num ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div
                    className={`h-1 flex-1 mx-4 ${
                      step > s.num ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">XML Dosyası Yükle</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="mb-4">
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Dosya Seç
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".xml"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                {file && (
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <FileText className="mr-2 h-4 w-4" />
                    {file.name}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Yükleniyor...' : 'İlerle'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Mapping */}
        {step === 2 && parsedData && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Kategori Eşleştirme</h2>
              
              {/* Restaurant Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restoran Seçin *
                </label>
                <select
                  value={selectedRestaurant}
                  onChange={(e) => setSelectedRestaurant(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                >
                  <option value="">Restoran seçin...</option>
                  {restaurants.map((r) => (
                    <option key={r.Id} value={r.Id}>
                      {r.Name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Toplam {parsedData.totalCount} ürün bulundu</p>
                    <p className="mb-1">{parsedData.categories.length} farklı kategori tespit edildi</p>
                    <p>
                      {parsedData.products.filter(p => p.imageUrl).length} ürünün görseli mevcut
                      {parsedData.products.filter(p => p.imageUrl).length > 0 && 
                        ' (otomatik indirilecek)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Category Mapping */}
              <div className="space-y-4 mb-6">
                {parsedData.categories.map((cat) => {
                  const restaurantCategories = getRestaurantCategories();
                  const isMapped = !!categoryMapping[cat];
                  
                  return (
                    <div key={cat} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          {isMapped ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 mr-2" />
                          )}
                          <span className="font-medium">{cat}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {parsedData.products.filter((p) => p.category === cat).length} ürün
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <select
                          value={categoryMapping[cat] || ''}
                          onChange={(e) =>
                            setCategoryMapping({
                              ...categoryMapping,
                              [cat]: e.target.value ? parseInt(e.target.value) : null,
                            })
                          }
                          disabled={!selectedRestaurant}
                          className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary disabled:bg-gray-100"
                        >
                          <option value="">
                            {selectedRestaurant
                              ? 'Kategori seçin veya yeni oluşturun...'
                              : 'Önce restoran seçin...'}
                          </option>
                          {restaurantCategories.map((c) => (
                            <option key={c.Id} value={c.Id}>
                              {c.Name}
                            </option>
                          ))}
                        </select>
                        
                        {selectedRestaurant && !categoryMapping[cat] && (
                          <button
                            onClick={() => handleCreateCategory(cat, selectedRestaurant)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
                          >
                            Yeni Oluştur
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Product Preview */}
              <div className="mt-6 border-t pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Ürün Önizlemesi (İlk 5 ürün)
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {parsedData.products.slice(0, 5).map((product, idx) => (
                    <div key={idx} className="bg-gray-50 rounded p-3 flex gap-3">
                      {/* Ürün Görseli */}
                      {product.imageUrl ? (
                        <div className="flex-shrink-0">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/64?text=No+Image';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                          Görsel Yok
                        </div>
                      )}
                      
                      {/* Ürün Bilgileri */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        {product.description && (
                          <div className="text-gray-600 text-xs mt-1 line-clamp-2">
                            {product.description}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">Varyantlar:</span>
                          {product.variants.length > 0 ? (
                            product.variants.map((v, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                {v.name || 'Normal'}: {v.price}₺
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-red-600">Varyant yok!</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={handleReset}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Başa Dön
              </button>
              <button
                onClick={handleImport}
                disabled={loading || !selectedRestaurant}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'İçe Aktarılıyor...' : 'İçe Aktar'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 3 && importResult && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center mb-6">
              {importResult.imported > 0 ? (
                <>
                  <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    İçe Aktarma Tamamlandı!
                  </h2>
                </>
              ) : (
                <>
                  <AlertCircle className="mx-auto h-16 w-16 text-yellow-600 mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    İçe Aktarma Tamamlandı
                  </h2>
                </>
              )}
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 mb-2">
                  <span className="font-semibold">{importResult.imported}</span> ürün başarıyla içe aktarıldı
                </p>
                <div className="text-sm text-green-700 space-y-1">
                  {importResult.downloadedImages > 0 && (
                    <p>• {importResult.downloadedImages} ürün görseli indirildi</p>
                  )}
                  {parsedData && (
                    <p>• {parsedData.products.reduce((acc, p) => acc + (p.variants?.length || 0), 0)} ürün varyantı eklendi</p>
                  )}
                </div>
              </div>

              {importResult.skipped > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 mb-2">
                    <span className="font-semibold">{importResult.skipped}</span> ürün atlandı
                  </p>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-3 max-h-48 overflow-y-auto">
                      <p className="text-sm font-medium text-yellow-900 mb-2">Hatalar:</p>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        {importResult.errors.map((error, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleReset}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Yeni İçe Aktarma
              </button>
              <button
                onClick={() => (window.location.href = '/admin/products')}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                Ürünleri Görüntüle
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <Loading />
              <div className="mt-4 text-center">
                <p className="text-gray-600 whitespace-pre-line">
                  {loadingMessage || 'İşleniyor...'}
                </p>
              </div>
              {step === 2 && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-800 text-center">
                    ⏱️ Lütfen bekleyin, işlem devam ediyor...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default Import;

