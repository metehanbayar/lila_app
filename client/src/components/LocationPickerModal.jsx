import { useEffect, useState, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { X, Check, Loader2 } from 'lucide-react';
import { safeSetTimeout, safeClearTimeout, debounce } from '../utils/performance';

// LoadScript için sabit libraries dizisi
const libraries = ['places'];

// Google Maps address_components'ten belirli bir type'ı bul
function getAddressComponent(addressComponents, type) {
  const component = addressComponents?.find(c => c.types.includes(type));
  return component?.long_name || '';
}

// Google Maps address_components'ten adres detaylarını çıkar
function parseGoogleMapsAddress(addressComponents) {
  if (!addressComponents) return null;

  // Türkiye'de mahalle bilgisi farklı type'larda gelebilir
  const neighbourhood = getAddressComponent(addressComponents, 'sublocality_level_1') ||
                        getAddressComponent(addressComponents, 'sublocality_level_2') ||
                        getAddressComponent(addressComponents, 'sublocality_level_3') ||
                        getAddressComponent(addressComponents, 'sublocality') ||
                        getAddressComponent(addressComponents, 'neighborhood') ||
                        getAddressComponent(addressComponents, 'political');

  return {
    street: getAddressComponent(addressComponents, 'route'),
    buildingNo: getAddressComponent(addressComponents, 'street_number'),
    neighbourhood: neighbourhood,
    district: getAddressComponent(addressComponents, 'administrative_area_level_2') ||
              getAddressComponent(addressComponents, 'locality'),
    city: getAddressComponent(addressComponents, 'administrative_area_level_1'),
    postcode: getAddressComponent(addressComponents, 'postal_code'),
  };
}

// Google Maps API Key'i environment variable'dan alın
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'your_api_key_here';

function LocationPickerModal({ isOpen, onClose, onConfirm }) {
  // Google Maps API'yi yükle (sadece bir kez)
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries,
    language: 'tr',
    preventGoogleFontsLoading: true
  });

  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Detaylı adres bilgileri
  const [addressDetails, setAddressDetails] = useState({
    street: '',
    buildingNo: '',
    apartmentNo: '',
    neighbourhood: '',
    district: '',
    city: '',
    postcode: '',
    notes: ''
  });

  const watchIdRef = useRef(null);
  const watchTimeoutRef = useRef(null);
  const bestFixRef = useRef({ coords: null, accuracy: Infinity });
  const mapRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      getCurrentLocation();
    }
  }, [isOpen]);

  // Helper: HTML Overlay Marker oluştur
  const createMarker = useCallback((map, pos) => {
    if (!map || !pos || !window.google?.maps) return null;

    try {
      // Custom HTML Overlay Class
      class HTMLMarker extends window.google.maps.OverlayView {
        constructor(position, map) {
          super();
          this.position = position;
          this.div = null;
          this.setMap(map);
        }

        onAdd() {
          const div = document.createElement('div');
          div.style.position = 'absolute';
          div.style.cursor = 'move';
          div.style.zIndex = '999999';
          div.innerHTML = `
            <div style="
              position: relative;
              width: 40px;
              height: 40px;
              transform: translate(-50%, -100%);
            ">
              <div style="
                font-size: 40px;
                line-height: 1;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                animation: bounce 2s infinite;
              ">📍</div>
            </div>
          `;
          
          this.div = div;
          
          // Sürükleme işlevselliği
          let isDragging = false;
          let startX, startY;
          
          div.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            div.style.cursor = 'grabbing';
            e.preventDefault();
          });
          
          document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            const projection = this.getProjection();
            if (projection) {
              const point = projection.fromLatLngToDivPixel(this.position);
              const newPoint = new window.google.maps.Point(point.x + dx, point.y + dy);
              const newPos = projection.fromDivPixelToLatLng(newPoint);
              this.position = newPos;
              this.draw();
              startX = e.clientX;
              startY = e.clientY;
            }
          });
          
          document.addEventListener('mouseup', () => {
            if (isDragging) {
              isDragging = false;
              div.style.cursor = 'move';
              const lat = this.position.lat();
              const lng = this.position.lng();
              setPosition([lat, lng]);
              fetchAddress(lat, lng);
            }
          });

          const panes = this.getPanes();
          panes.overlayMouseTarget.appendChild(div);
        }

        draw() {
          if (!this.div) return;
          
          const projection = this.getProjection();
          if (!projection) return;
          
          const point = projection.fromLatLngToDivPixel(this.position);
          if (point) {
            this.div.style.left = point.x + 'px';
            this.div.style.top = point.y + 'px';
          }
        }

        onRemove() {
          if (this.div && this.div.parentNode) {
            this.div.parentNode.removeChild(this.div);
            this.div = null;
          }
        }

        getPosition() {
          return this.position;
        }

        setPosition(pos) {
          this.position = pos;
          this.draw();
        }
      }

      const marker = new HTMLMarker(
        new window.google.maps.LatLng(pos[0], pos[1]),
        map
      );

      // Haritayı marker'a odakla
      safeSetTimeout(() => {
        if (map && pos) {
          map.panTo({ lat: pos[0], lng: pos[1] });
          map.setZoom(17);
        }
      }, 500);

      return marker;
    } catch (err) {
      console.error('Marker oluşturma hatası:', err);
      return null;
    }
  }, []);

  // Marker oluştur/güncelle
  useEffect(() => {
    if (!mapRef.current || !position || !window.google?.maps || !mapLoaded) return;

    // Eski marker'ı temizle
    if (markerRef.current) {
      try {
        if (typeof markerRef.current.setMap === 'function') {
          markerRef.current.setMap(null);
        }
        if (typeof markerRef.current.onRemove === 'function') {
          markerRef.current.onRemove();
        }
      } catch (e) {}
      markerRef.current = null;
    }

    // Harita tamamen yüklendikten sonra marker oluştur
    safeSetTimeout(() => {
      if (mapRef.current && position) {
        const marker = createMarker(mapRef.current, position);
        if (marker) {
          markerRef.current = marker;
        }
      }
    }, 100);

    // Cleanup
    return () => {
      if (markerRef.current) {
        try {
          if (typeof markerRef.current.setMap === 'function') {
            markerRef.current.setMap(null);
          }
          if (typeof markerRef.current.onRemove === 'function') {
            markerRef.current.onRemove();
          }
        } catch (e) {}
        markerRef.current = null;
      }
    };
  }, [position, mapLoaded, createMarker]);

  const stopWatching = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (watchTimeoutRef.current) {
      safeClearTimeout(watchTimeoutRef.current);
      watchTimeoutRef.current = null;
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Tarayıcınız konum özelliğini desteklemiyor.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    // High-accuracy kısa süreli watchPosition ile daha doğru sabitleme
    bestFixRef.current = { coords: null, accuracy: Infinity };

    const onSuccess = (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      const current = [latitude, longitude];
      setPosition(current);
      if (accuracy < bestFixRef.current.accuracy) {
        bestFixRef.current = { coords: { latitude, longitude }, accuracy };
      }
      // Hedef doğruluk seviyesine ulaşınca erken bitir
      if (accuracy <= 30) {
        stopWatching();
        fetchAddress(latitude, longitude).finally(() => setLoading(false));
      }
    };

    const onError = (err) => {
      stopWatching();
      setLoading(false);
      console.error('Konum hatası:', err);
      switch (err.code) {
        case err.PERMISSION_DENIED:
          setError('Konum izni reddedildi. Lütfen tarayıcı ayarlarınızdan konum iznini açın.');
          break;
        case err.POSITION_UNAVAILABLE:
          setError('Konum bilgisi alınamıyor.');
          break;
        case err.TIMEOUT:
          setError('Konum isteği zaman aşımına uğradı.');
          break;
        default:
          setError('Konum alınırken bir hata oluştu.');
      }
    };

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });

      // 6 sn sonra en iyi sabiti kullan
      watchTimeoutRef.current = safeSetTimeout(() => {
        const best = bestFixRef.current.coords;
        stopWatching();
        if (best) {
          const { latitude, longitude } = best;
          setPosition([latitude, longitude]);
          fetchAddress(latitude, longitude).finally(() => setLoading(false));
        } else {
          setLoading(false);
          setError('Konum bilgisi alınamadı.');
        }
      }, 6000);
    } catch (e) {
      onError(e);
    }
  };

  const fetchAddress = async (lat, lon) => {
    try {
      const response = await fetch(
        `/api/geocode/reverse?lat=${lat}&lon=${lon}&language=tr`
      );
      if (!response.ok) {
        throw new Error('Geocode isteği başarısız');
      }
      const json = await response.json();
      const data = json?.data || {};

      if (data) {
        const addressComponents = data.address_components;
        const parsedAddress = parseGoogleMapsAddress(addressComponents);
        
        if (parsedAddress) {
          setAddressDetails({
            street: parsedAddress.street || '',
            buildingNo: parsedAddress.buildingNo || '',
            apartmentNo: '',
            neighbourhood: parsedAddress.neighbourhood || '',
            district: parsedAddress.district || '',
            city: parsedAddress.city || '',
            postcode: parsedAddress.postcode || '',
            notes: ''
          });

          setAddress(data.formatted_address || 'Adres bilgisi alınamadı');
        }
      }
    } catch (err) {
      console.error('Adres alınamadı:', err);
    }
  };

  const searchAddress = async (query) => {
    try {
      if (!window.google?.maps?.places || !isLoaded) {
        return;
      }
      setSearching(true);
      if (!autocompleteServiceRef.current) {
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      }
      const request = {
        input: query,
        componentRestrictions: { country: ['tr'] },
        types: ['geocode']
      };
      autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && Array.isArray(predictions)) {
          setSuggestions(predictions.map(p => ({ place_id: p.place_id, description: p.description })));
        } else {
          setSuggestions([]);
        }
        setSearching(false);
      });
    } catch (e) {
      console.error('Arama hatası:', e);
      setSuggestions([]);
      setSearching(false);
    }
  };

  const handleSelectPlace = (placeId) => {
    try {
      if (!window.google?.maps?.places) return;

      // Yeni Place API (tercih edilen)
      if (window.google.maps.places.Place) {
        const place = new window.google.maps.places.Place({ id: placeId });
        place.fetchFields({ fields: ['formattedAddress', 'addressComponents', 'location'] })
          .then((p) => {
            if (!p) return;
            // Konum
            const loc = p.location;
            if (loc) {
              const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
              const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
              setPosition([lat, lng]);
            }
            // AddressComponents (yeni API -> eski format adaptasyonu)
            const components = p.addressComponents;
            const legacyComponents = Array.isArray(components)
              ? components.map(c => ({
                  types: c.types,
                  long_name: c.longText,
                  short_name: c.shortText
                }))
              : undefined;
            if (legacyComponents) {
              const parsed = parseGoogleMapsAddress(legacyComponents);
              if (parsed) {
                setAddressDetails({
                  street: parsed.street || '',
                  buildingNo: parsed.buildingNo || '',
                  apartmentNo: '',
                  neighbourhood: parsed.neighbourhood || '',
                  district: parsed.district || '',
                  city: parsed.city || '',
                  postcode: parsed.postcode || '',
                  notes: ''
                });
              }
            }
            setAddress(p.formattedAddress || '');
            setSuggestions([]);
            setSearchTerm('');
          })
          .catch((e) => console.error('Place.fetchFields hatası:', e));
        return;
      }

      // Eski PlacesService API (geri dönüş)
      if (!placesServiceRef.current) {
        const container = mapRef.current || document.createElement('div');
        placesServiceRef.current = new window.google.maps.places.PlacesService(container);
      }
      const request = {
        placeId,
        fields: ['formatted_address', 'address_components', 'geometry']
      };
      placesServiceRef.current.getDetails(request, (place, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place) {
          return;
        }
        const geometry = place.geometry;
        if (geometry?.location) {
          const lat = typeof geometry.location.lat === 'function' ? geometry.location.lat() : geometry.location.lat;
          const lng = typeof geometry.location.lng === 'function' ? geometry.location.lng() : geometry.location.lng;
          setPosition([lat, lng]);
        }
        if (place.address_components) {
          const parsed = parseGoogleMapsAddress(place.address_components);
          if (parsed) {
            setAddressDetails({
              street: parsed.street || '',
              buildingNo: parsed.buildingNo || '',
              apartmentNo: '',
              neighbourhood: parsed.neighbourhood || '',
              district: parsed.district || '',
              city: parsed.city || '',
              postcode: parsed.postcode || '',
              notes: ''
            });
          }
        }
        setAddress(place.formatted_address || '');
        setSuggestions([]);
        setSearchTerm('');
      });
    } catch (e) {
      console.error('Place details hatası:', e);
    }
  };

  // Debounce search input
  // Debounced search için
  const debouncedSearch = useCallback(
    debounce((term) => {
      if (term && term.trim().length >= 3) {
        searchAddress(term.trim());
      } else {
        setSuggestions([]);
      }
    }, 350),
    []
  );

  useEffect(() => {
    if (!isOpen) return;
    if (!searchTerm || searchTerm.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debouncedSearch(searchTerm);
  }, [searchTerm, isOpen, debouncedSearch]);

  // Temizlik: modal kapanırken watcher, timer ve marker'ı temizle
  useEffect(() => {
    if (!isOpen) {
      stopWatching();
      
      // Marker'ı temizle
      if (markerRef.current) {
        try {
          if (typeof markerRef.current.setMap === 'function') {
            markerRef.current.setMap(null);
          }
          if (typeof markerRef.current.onRemove === 'function') {
            markerRef.current.onRemove();
          }
        } catch (e) {}
        markerRef.current = null;
      }
      
      // State'leri sıfırla
      setPosition(null);
      setAddress('');
      setSearchTerm('');
      setSuggestions([]);
      setAddressDetails({
        street: '',
        buildingNo: '',
        apartmentNo: '',
        neighbourhood: '',
        district: '',
        city: '',
        postcode: '',
        notes: ''
      });
      setMapLoaded(false);
    }
    return () => {
      stopWatching();
      if (markerRef.current) {
        try {
          if (typeof markerRef.current.setMap === 'function') {
            markerRef.current.setMap(null);
          }
          if (typeof markerRef.current.onRemove === 'function') {
            markerRef.current.onRemove();
          }
        } catch (e) {}
        markerRef.current = null;
      }
    };
  }, [isOpen]);

  const handleConfirm = () => {
    // Detaylı adresi birleştir
    const parts = [];
    
    if (addressDetails.street) {
      let streetPart = addressDetails.street;
      if (addressDetails.buildingNo) {
        streetPart += ` No: ${addressDetails.buildingNo}`;
      }
      if (addressDetails.apartmentNo) {
        streetPart += ` Daire: ${addressDetails.apartmentNo}`;
      }
      parts.push(streetPart);
    }
    
    if (addressDetails.neighbourhood) {
      parts.push(addressDetails.neighbourhood.includes('Mah') ? addressDetails.neighbourhood : `${addressDetails.neighbourhood} Mah.`);
    }
    
    if (addressDetails.district) {
      parts.push(addressDetails.district);
    }
    
    if (addressDetails.city) {
      parts.push(addressDetails.city);
    }
    
    if (addressDetails.postcode) {
      parts.push(addressDetails.postcode);
    }
    
    if (addressDetails.notes) {
      parts.push(`(${addressDetails.notes})`);
    }
    
    const fullAddress = parts.filter(p => p).join(', ');
    
    if (fullAddress) {
      onConfirm(fullAddress);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">Konumunuzu Seçin</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-3" />
                <p className="text-gray-600">Konumunuz alınıyor...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center max-w-md px-4">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={getCurrentLocation}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Tekrar Dene
                </button>
              </div>
            </div>
          ) : position ? (
            <>
              {/* Google Map */}
              <div className="h-64 sm:h-80 relative z-0">
                {loadError ? (
                  <div className="flex items-center justify-center h-full bg-gray-100">
                    <p className="text-red-600">Harita yüklenirken hata oluştu</p>
                  </div>
                ) : !isLoaded ? (
                  <div className="flex items-center justify-center h-full bg-gray-100">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                ) : (
                  <GoogleMap
                    mapContainerStyle={{ 
                      width: '100%', 
                      height: '100%',
                      position: 'relative',
                      zIndex: 0
                    }}
                    mapContainerClassName="relative z-0"
                    center={{ lat: position[0], lng: position[1] }}
                    zoom={15}
                    options={{
                      gestureHandling: 'greedy',
                      zoomControl: true,
                      mapTypeControl: false,
                      streetViewControl: false,
                      fullscreenControl: false,
                      clickableIcons: true,
                    }}
                    onClick={(e) => {
                      const lat = e.latLng.lat();
                      const lng = e.latLng.lng();
                      setPosition([lat, lng]);
                      fetchAddress(lat, lng);
                      
                      // HTML Overlay Marker'ı yeni konuma taşı
                      if (markerRef.current && typeof markerRef.current.setPosition === 'function') {
                        markerRef.current.setPosition(new window.google.maps.LatLng(lat, lng));
                      }
                    }}
                    onLoad={(map) => {
                      mapRef.current = map;
                      setMapLoaded(true);
                    }}
                  >
                  </GoogleMap>
                )}
              </div>

              {/* Address Info */}
              <div className="p-4 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">📍 Adres Detayları</h4>
                
                {/* Adres Arama */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="🔍 Adres ara (en az 3 karakter)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  {searching && (
                    <p className="text-xs text-gray-500 mt-1">Aranıyor...</p>
                  )}
                  {suggestions.length > 0 && (
                    <div className="mt-2 bg-white border border-gray-200 rounded-lg max-h-48 overflow-auto shadow-sm">
                      {suggestions.map((sug, idx) => (
                        <button
                          key={`${sug.place_id || idx}`}
                          type="button"
                          onClick={() => handleSelectPlace(sug.place_id)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
                        >
                          {sug.description}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Detaylı Adres Girişi */}
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Sokak/Cadde *"
                      value={addressDetails.street}
                      onChange={(e) => setAddressDetails({...addressDetails, street: e.target.value})}
                      className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <input
                      type="text"
                      placeholder="Bina No"
                      value={addressDetails.buildingNo}
                      onChange={(e) => setAddressDetails({...addressDetails, buildingNo: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Daire No"
                      value={addressDetails.apartmentNo}
                      onChange={(e) => setAddressDetails({...addressDetails, apartmentNo: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <input
                      type="text"
                      placeholder="Mahalle *"
                      value={addressDetails.neighbourhood}
                      onChange={(e) => setAddressDetails({...addressDetails, neighbourhood: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="İlçe"
                      value={addressDetails.district}
                      onChange={(e) => setAddressDetails({...addressDetails, district: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <input
                      type="text"
                      placeholder="İl *"
                      value={addressDetails.city}
                      onChange={(e) => setAddressDetails({...addressDetails, city: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Tarif (ör: Yeşil binanın yanı)"
                    value={addressDetails.notes}
                    onChange={(e) => setAddressDetails({...addressDetails, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <p className="text-xs text-gray-500 mt-3">
                  <strong>*</strong> Haritadan yaklaşık konumu seçin, adres detaylarını girin.
                </p>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        {!loading && !error && (
          <div className="flex gap-3 p-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              İptal
            </button>
            <button
              onClick={handleConfirm}
              disabled={!addressDetails.street || !addressDetails.city}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>Adresi Kullan</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LocationPickerModal;

