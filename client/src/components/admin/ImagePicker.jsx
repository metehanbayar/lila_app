import { useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Search, Trash2 } from 'lucide-react';
import {
  getMediaFiles,
  uploadMediaFile,
  deleteMediaFile,
} from '../../services/adminApi';

function ImagePicker({ value, onChange, label = 'Görsel Seç' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('library'); // 'library' or 'upload'

  useEffect(() => {
    if (isOpen) {
      loadMediaFiles();
    }
  }, [isOpen]);

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
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      const response = await uploadMediaFile(file, setUploadProgress);
      
      if (response.success) {
        onChange(response.data.FileUrl);
        await loadMediaFiles();
        setActiveTab('library');
      }
      
      e.target.value = '';
    } catch (err) {
      console.error('Yükleme hatası:', err);
      alert(err.response?.data?.message || 'Dosya yüklenirken bir hata oluştu');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSelectImage = (media) => {
    onChange(media.FileUrl);
    setIsOpen(false);
  };

  const handleRemoveImage = () => {
    onChange('');
  };

  const handleDelete = async (media, e) => {
    e.stopPropagation();
    if (window.confirm(`${media.OriginalName} dosyasını silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteMediaFile(media.Id);
        await loadMediaFiles();
        
        // Eğer silinen görsel seçili ise temizle
        if (value && value.includes(media.FileUrl)) {
          onChange('');
        }
      } catch (err) {
        console.error('Silme hatası:', err);
        alert(err.response?.data?.message || 'Dosya silinirken bir hata oluştu');
      }
    }
  };

  const filteredMedia = mediaFiles.filter((media) =>
    media.OriginalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      
      {/* Preview / Select Button */}
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Seçili görsel"
            className="w-48 h-32 object-cover rounded-lg border-2 border-gray-300"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
          >
            <X size={16} />
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center"
          >
            <span className="opacity-0 hover:opacity-100 bg-white px-3 py-1.5 rounded text-sm font-medium">
              Değiştir
            </span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-48 h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-gray-50 transition-colors flex flex-col items-center justify-center gap-2"
        >
          <ImageIcon className="w-8 h-8 text-gray-400" />
          <span className="text-sm text-gray-600">Görsel Seç</span>
        </button>
      )}

      {/* Image Picker Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Görsel Seç</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('library')}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'library'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Görsel Kütüphanesi
                </button>
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'upload'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Yeni Yükle
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'library' ? (
                <>
                  {/* Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Görsel ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  {/* Media Grid */}
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-gray-600 mt-2">Yükleniyor...</p>
                    </div>
                  ) : filteredMedia.length === 0 ? (
                    <div className="text-center py-12">
                      <ImageIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                      <p className="text-gray-600">
                        {searchQuery ? 'Görsel bulunamadı' : 'Henüz görsel yüklenmemiş'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {filteredMedia.map((media) => (
                        <div
                          key={media.Id}
                          onClick={() => handleSelectImage(media)}
                          className="relative group cursor-pointer bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                        >
                          <div className="aspect-square">
                            <img
                              src={media.FileUrl}
                              alt={media.OriginalName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
                          <button
                            onClick={(e) => handleDelete(media, e)}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all shadow-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                            <p className="text-white text-xs truncate">{media.OriginalName}</p>
                            <p className="text-white/80 text-xs">{formatFileSize(media.FileSize)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8">
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col items-center justify-center">
                      <Upload className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-semibold text-primary">Dosya seç</span> veya sürükle bırak
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF, WebP (Maks. 5MB)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>

                  {/* Upload Progress */}
                  {uploading && (
                    <div className="mt-4">
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImagePicker;

