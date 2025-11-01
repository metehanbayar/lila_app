import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

// Tailwind renk paleti
const colors = [
  { name: 'Mor', value: 'bg-purple-500' },
  { name: 'Pembe', value: 'bg-pink-500' },
  { name: 'Kırmızı', value: 'bg-red-500' },
  { name: 'Turuncu', value: 'bg-orange-500' },
  { name: 'Sarı', value: 'bg-yellow-500' },
  { name: 'Lime', value: 'bg-lime-500' },
  { name: 'Yeşil', value: 'bg-green-500' },
  { name: 'Zümrüt', value: 'bg-emerald-500' },
  { name: 'Turkuaz', value: 'bg-teal-500' },
  { name: 'Cyan', value: 'bg-cyan-500' },
  { name: 'Mavi', value: 'bg-blue-500' },
  { name: 'İndigo', value: 'bg-indigo-500' },
  { name: 'Menekşe', value: 'bg-violet-500' },
  { name: 'Fuşya', value: 'bg-fuchsia-500' },
  { name: 'Gül', value: 'bg-rose-500' },
  { name: 'Kahverengi', value: 'bg-amber-600' },
  { name: 'Gri', value: 'bg-gray-500' },
  { name: 'Koyu Gri', value: 'bg-slate-600' },
];

// Gradient renkler
const gradients = [
  { name: 'Mor-Pembe', value: 'bg-gradient-to-br from-purple-500 to-pink-500' },
  { name: 'Mavi-Cyan', value: 'bg-gradient-to-br from-blue-500 to-cyan-500' },
  { name: 'Turuncu-Kırmızı', value: 'bg-gradient-to-br from-orange-500 to-red-500' },
  { name: 'Yeşil-Zümrüt', value: 'bg-gradient-to-br from-green-500 to-emerald-500' },
  { name: 'İndigo-Mor', value: 'bg-gradient-to-br from-indigo-500 to-purple-500' },
  { name: 'Pembe-Turuncu', value: 'bg-gradient-to-br from-pink-500 to-orange-500' },
  // Kategori simgeleri için özel gradientler
  { name: 'Pizza Kırmızı', value: 'bg-gradient-to-br from-red-600 to-red-800' },
  { name: 'Et Kahverengi', value: 'bg-gradient-to-br from-amber-700 to-amber-900' },
  { name: 'Kahve Tonu', value: 'bg-gradient-to-br from-amber-800 to-amber-900' },
  { name: 'Tatlı Pembe', value: 'bg-gradient-to-br from-pink-600 to-purple-700' },
  { name: 'Kahvaltı Sarı', value: 'bg-gradient-to-br from-yellow-600 to-orange-700' },
  { name: 'Salata Yeşil', value: 'bg-gradient-to-br from-green-600 to-emerald-700' },
  { name: 'Çocuk Mavi', value: 'bg-gradient-to-br from-blue-500 to-cyan-600' },
  { name: 'Lila Altın', value: 'bg-gradient-to-br from-yellow-500 to-amber-600' },
  { name: 'Çorba Turuncu', value: 'bg-gradient-to-br from-orange-600 to-red-600' },
  { name: 'Makarna Kırmızı', value: 'bg-gradient-to-br from-red-600 to-orange-600' },
  { name: 'Menü Mor', value: 'bg-gradient-to-br from-purple-600 to-indigo-600' },
  { name: 'Ortaya Yeşil', value: 'bg-gradient-to-br from-green-600 to-emerald-600' },
  { name: 'İçecek Mavi', value: 'bg-gradient-to-br from-blue-500 to-cyan-500' },
  { name: 'Kış Kırmızı', value: 'bg-gradient-to-br from-red-600 to-pink-600' },
  { name: 'Dondurma Pembe', value: 'bg-gradient-to-br from-pink-600 to-purple-700' },
  { name: 'Banana Turuncu', value: 'bg-gradient-to-br from-orange-500 to-red-600' },
  { name: 'Utensils Gri', value: 'bg-gradient-to-br from-gray-600 to-gray-800' },
];

function ColorPicker({ value, onChange }) {
  const [showGradients, setShowGradients] = useState(false);

  // Gradient renk mi kontrol et
  const isGradient = value && value.includes('gradient');
  
  // Eğer gradient ise gradient tab'ini aç
  useEffect(() => {
    if (isGradient) {
      setShowGradients(true);
    }
  }, [isGradient]);

  const selectedColor = [...colors, ...gradients].find(c => c.value === value);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Renk Seçin *
      </label>

      {/* Seçili Renk Önizleme */}
      <div className="mb-3 p-3 border-2 border-gray-200 rounded-lg bg-gray-50">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg ${value || 'bg-gray-500'} shadow-md`} />
          <div>
            <p className="text-sm font-medium text-gray-700">
              {selectedColor?.name || (value ? 'Özel Renk' : 'Renk Seçilmedi')}
            </p>
            <p className="text-xs text-gray-500">{value || 'bg-gray-500'}</p>
          </div>
        </div>
      </div>

      {/* Tab'ler */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setShowGradients(false)}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            !showGradients
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Düz Renkler
        </button>
        <button
          type="button"
          onClick={() => setShowGradients(true)}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            showGradients
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Gradient
        </button>
      </div>

      {/* Renk Listesi */}
      <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
        {(showGradients ? gradients : colors).map((color) => {
          const isSelected = value === color.value;
          
          return (
            <button
              key={color.value}
              type="button"
              onClick={() => onChange(color.value)}
              className={`group relative p-1 rounded-lg transition-all hover:scale-110 ${
                isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
              }`}
              title={color.name}
            >
              <div className={`w-full h-12 rounded-md ${color.value} shadow-sm relative`}>
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-center text-gray-600 mt-1 truncate">
                {color.name}
              </p>
            </button>
          );
        })}
      </div>

      {/* Bilgi */}
      <p className="text-xs text-gray-500 mt-2">
        {showGradients ? gradients.length : colors.length} renk mevcut
      </p>
    </div>
  );
}

export default ColorPicker;

