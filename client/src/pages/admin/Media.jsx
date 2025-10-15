import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Loading from '../../components/Loading';
import { Upload, Trash2, Search, Image as ImageIcon, X } from 'lucide-react';
import {
  getMediaFiles,
  uploadMediaFile,
  uploadMultipleMediaFiles,
  deleteMediaFile,
} from '../../services/adminApi';

function Media() {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    loadMediaFiles();
  }, []);

  const loadMediaFiles = async () => {
    try {
      setLoading(true);
      const response = await getMediaFiles();
      if (response.success) {
        setMediaFiles(response.data);
      }
    } catch (err) {
      console.error('Media dosyaları yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      if (files.length === 1) {
        await uploadMediaFile(files[0], setUploadProgress);
      } else {
        await uploadMultipleMediaFiles(files, setUploadProgress);
      }

      await loadMediaFiles();
      e.target.value = '';
    } catch (err) {
      console.error('Yükleme hatası:', err);
      alert(err.response?.data?.message || 'Dosya yüklenirken bir hata oluştu');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (media) => {
    if (window.confirm(`${media.OriginalName} dosyasını silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteMediaFile(media.Id);
        await loadMediaFiles();
      } catch (err) {
        console.error('Silme hatası:', err);
        alert(err.response?.data?.message || 'Dosya silinirken bir hata oluştu');
      }
    }
  };

  const handleCopyUrl = (url) => {
    // Development ve production için doğru base URL'i al
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    // API URL'den /api kısmını çıkar
    const baseUrl = API_BASE_URL.replace('/api', '');
    const fullUrl = `${baseUrl}${url}`;
    
    navigator.clipboard.writeText(fullUrl);
    alert('URL kopyalandı!');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredMedia = mediaFiles.filter((media) =>
    media.OriginalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <AdminLayout><Loading /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 truncate">
              Görsel Kütüphanesi
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Görsel yönetimi ve yükleme
            </p>
          </div>
          <label className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark active:bg-primary-dark text-white px-4 py-2.5 sm:py-2 rounded-lg transition-colors text-sm sm:text-base font-medium whitespace-nowrap cursor-pointer">
            <Upload size={20} className="flex-shrink-0" />
            <span>Görsel Yükle</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="bg-white rounded-lg shadow-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Yükleniyor...</span>
              <span className="text-sm font-medium text-primary">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Görsel ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Media Grid */}
        {filteredMedia.length === 0 ? (
          <div className="bg-white rounded-lg shadow-card p-8 sm:p-12 text-center">
            <ImageIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'Görsel bulunamadı' : 'Henüz görsel yüklenmemiş'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery
                ? 'Arama kriterlerinize uygun görsel bulunamadı'
                : 'Yukarıdaki butonu kullanarak görsel yükleyebilirsiniz'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredMedia.map((media) => (
              <div
                key={media.Id}
                className="bg-white rounded-lg shadow-card overflow-hidden group hover:shadow-card-hover transition-shadow"
              >
                <div
                  className="aspect-square bg-gray-100 relative cursor-pointer"
                  onClick={() => setSelectedImage(media)}
                >
                  <img
                    src={media.FileUrl}
                    alt={media.OriginalName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 truncate mb-1">
                    {media.OriginalName}
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    {formatFileSize(media.FileSize)}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyUrl(media.FileUrl)}
                      className="flex-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                    >
                      URL Kopyala
                    </button>
                    <button
                      onClick={() => handleDelete(media)}
                      className="px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Image Preview Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors z-10"
              >
                <X size={20} />
              </button>
              <img
                src={selectedImage.FileUrl}
                alt={selectedImage.OriginalName}
                className="max-w-full max-h-[80vh] object-contain"
              />
              <div className="p-4 bg-white border-t">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {selectedImage.OriginalName}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Dosya Boyutu:</span>{' '}
                    {formatFileSize(selectedImage.FileSize)}
                  </div>
                  <div>
                    <span className="font-medium">Tip:</span> {selectedImage.MimeType}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">URL:</span>{' '}
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs break-all">
                      {(() => {
                        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                        const baseUrl = API_BASE_URL.replace('/api', '');
                        return `${baseUrl}${selectedImage.FileUrl}`;
                      })()}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default Media;

