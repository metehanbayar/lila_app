import { useEffect, useState, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import {
  Check,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import useDialogBehavior from '../hooks/useDialogBehavior';
import { debounce, safeClearTimeout, safeSetTimeout } from '../utils/performance';
import {
  Field,
  PrimaryButton,
  SecondaryButton,
  TextAreaField,
  TextInput,
} from './ui/primitives';

const libraries = ['places'];

function getAddressComponent(addressComponents, type) {
  const component = addressComponents?.find((item) => item.types.includes(type));
  return component?.long_name || '';
}

function parseGoogleMapsAddress(addressComponents) {
  if (!addressComponents) return null;

  const neighbourhood =
    getAddressComponent(addressComponents, 'sublocality_level_1') ||
    getAddressComponent(addressComponents, 'sublocality_level_2') ||
    getAddressComponent(addressComponents, 'sublocality_level_3') ||
    getAddressComponent(addressComponents, 'sublocality') ||
    getAddressComponent(addressComponents, 'neighborhood') ||
    getAddressComponent(addressComponents, 'political');

  return {
    street: getAddressComponent(addressComponents, 'route'),
    buildingNo: getAddressComponent(addressComponents, 'street_number'),
    neighbourhood,
    district:
      getAddressComponent(addressComponents, 'administrative_area_level_2') ||
      getAddressComponent(addressComponents, 'locality'),
    city: getAddressComponent(addressComponents, 'administrative_area_level_1'),
    postcode: getAddressComponent(addressComponents, 'postal_code'),
  };
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'your_api_key_here';

function LocationPickerModal({ isOpen, onClose, onConfirm }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
    language: 'tr',
    preventGoogleFontsLoading: true,
  });

  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [addressDetails, setAddressDetails] = useState({
    street: '',
    buildingNo: '',
    apartmentNo: '',
    neighbourhood: '',
    district: '',
    city: '',
    postcode: '',
    notes: '',
  });

  const watchIdRef = useRef(null);
  const watchTimeoutRef = useRef(null);
  const bestFixRef = useRef({ coords: null, accuracy: Infinity });
  const mapRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const markerRef = useRef(null);
  const closeButtonRef = useRef(null);
  const { dialogRef, titleId } = useDialogBehavior({
    isOpen,
    onClose,
    initialFocusRef: closeButtonRef,
  });

  useEffect(() => {
    if (isOpen) {
      getCurrentLocation();
    }
  }, [isOpen]);

  const createMarker = useCallback((map, pos) => {
    if (!map || !pos || !window.google?.maps) return null;

    try {
      class HTMLMarker extends window.google.maps.OverlayView {
        constructor(markerPosition, markerMap) {
          super();
          this.position = markerPosition;
          this.div = null;
          this.setMap(markerMap);
        }

        onAdd() {
          const div = document.createElement('div');
          div.style.position = 'absolute';
          div.style.cursor = 'move';
          div.style.zIndex = '999999';
          div.innerHTML = `
            <div style="position: relative; width: 44px; height: 44px; transform: translate(-50%, -100%);">
              <div style="display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:16px;background:linear-gradient(135deg,#6d365f,#d16b53);box-shadow:0 18px 45px rgba(0,0,0,0.24);font-size:22px;">
                <span style="transform:translateY(1px)">+</span>
              </div>
            </div>
          `;

          this.div = div;

          let isDragging = false;
          let startX;
          let startY;

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
            this.div.style.left = `${point.x}px`;
            this.div.style.top = `${point.y}px`;
          }
        }

        onRemove() {
          if (this.div && this.div.parentNode) {
            this.div.parentNode.removeChild(this.div);
            this.div = null;
          }
        }

        setPosition(pos) {
          this.position = pos;
          this.draw();
        }
      }

      const marker = new HTMLMarker(new window.google.maps.LatLng(pos[0], pos[1]), map);

      safeSetTimeout(() => {
        if (map && pos) {
          map.panTo({ lat: pos[0], lng: pos[1] });
          map.setZoom(17);
        }
      }, 400);

      return marker;
    } catch (err) {
      console.error('Marker olusturma hatasi:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current || !position || !window.google?.maps || !mapLoaded) return undefined;

    if (markerRef.current) {
      try {
        if (typeof markerRef.current.setMap === 'function') {
          markerRef.current.setMap(null);
        }
        if (typeof markerRef.current.onRemove === 'function') {
          markerRef.current.onRemove();
        }
      } catch {
        // noop
      }
      markerRef.current = null;
    }

    const timer = safeSetTimeout(() => {
      if (mapRef.current && position) {
        markerRef.current = createMarker(mapRef.current, position);
      }
    }, 100);

    return () => {
      safeClearTimeout(timer);
      if (markerRef.current) {
        try {
          if (typeof markerRef.current.setMap === 'function') {
            markerRef.current.setMap(null);
          }
          if (typeof markerRef.current.onRemove === 'function') {
            markerRef.current.onRemove();
          }
        } catch {
          // noop
        }
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
      setError('Tarayiciniz konum ozelligini desteklemiyor.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    bestFixRef.current = { coords: null, accuracy: Infinity };

    const onSuccess = (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      const current = [latitude, longitude];
      setPosition(current);

      if (accuracy < bestFixRef.current.accuracy) {
        bestFixRef.current = { coords: { latitude, longitude }, accuracy };
      }

      if (accuracy <= 30) {
        stopWatching();
        fetchAddress(latitude, longitude).finally(() => setLoading(false));
      }
    };

    const onError = (err) => {
      stopWatching();
      setLoading(false);
      console.error('Konum hatasi:', err);

      switch (err.code) {
        case err.PERMISSION_DENIED:
          setError('Konum izni reddedildi. Tarayici ayarlarindan izin vermeniz gerekiyor.');
          break;
        case err.POSITION_UNAVAILABLE:
          setError('Konum bilgisi su an alinamiyor.');
          break;
        case err.TIMEOUT:
          setError('Konum istegi zaman asimina ugradi.');
          break;
        default:
          setError('Konum alinirken bir hata olustu.');
      }
    };

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });

      watchTimeoutRef.current = safeSetTimeout(() => {
        const best = bestFixRef.current.coords;
        stopWatching();

        if (best) {
          const { latitude, longitude } = best;
          setPosition([latitude, longitude]);
          fetchAddress(latitude, longitude).finally(() => setLoading(false));
        } else {
          setLoading(false);
          setError('Konum bilgisi alinamadi.');
        }
      }, 6000);
    } catch (err) {
      onError(err);
    }
  };

  const fetchAddress = async (lat, lon) => {
    try {
      const response = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}&language=tr`);
      if (!response.ok) {
        throw new Error('Geocode istegi basarisiz');
      }

      const json = await response.json();
      const data = json?.data || {};

      if (data) {
        const parsedAddress = parseGoogleMapsAddress(data.address_components);
        if (parsedAddress) {
          setAddressDetails({
            street: parsedAddress.street || '',
            buildingNo: parsedAddress.buildingNo || '',
            apartmentNo: '',
            neighbourhood: parsedAddress.neighbourhood || '',
            district: parsedAddress.district || '',
            city: parsedAddress.city || '',
            postcode: parsedAddress.postcode || '',
            notes: '',
          });
          setAddress(data.formatted_address || 'Adres bilgisi alinamadi');
        }
      }
    } catch (err) {
      console.error('Adres alinamadi:', err);
    }
  };

  const searchAddress = async (query) => {
    try {
      if (!window.google?.maps?.places || !isLoaded) return;

      setSearching(true);
      if (!autocompleteServiceRef.current) {
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      }

      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: ['tr'] },
          types: ['geocode'],
        },
        (predictions, status) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            Array.isArray(predictions)
          ) {
            setSuggestions(
              predictions.map((item) => ({
                place_id: item.place_id,
                description: item.description,
              })),
            );
          } else {
            setSuggestions([]);
          }
          setSearching(false);
        },
      );
    } catch (err) {
      console.error('Arama hatasi:', err);
      setSuggestions([]);
      setSearching(false);
    }
  };

  const handleSelectPlace = (placeId) => {
    try {
      if (!window.google?.maps?.places) return;

      if (window.google.maps.places.Place) {
        const place = new window.google.maps.places.Place({ id: placeId });
        place
          .fetchFields({ fields: ['formattedAddress', 'addressComponents', 'location'] })
          .then((selectedPlace) => {
            if (!selectedPlace) return;

            const loc = selectedPlace.location;
            if (loc) {
              const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
              const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
              setPosition([lat, lng]);
            }

            const components = Array.isArray(selectedPlace.addressComponents)
              ? selectedPlace.addressComponents.map((item) => ({
                  types: item.types,
                  long_name: item.longText,
                  short_name: item.shortText,
                }))
              : undefined;

            if (components) {
              const parsed = parseGoogleMapsAddress(components);
              if (parsed) {
                setAddressDetails({
                  street: parsed.street || '',
                  buildingNo: parsed.buildingNo || '',
                  apartmentNo: '',
                  neighbourhood: parsed.neighbourhood || '',
                  district: parsed.district || '',
                  city: parsed.city || '',
                  postcode: parsed.postcode || '',
                  notes: '',
                });
              }
            }

            setAddress(selectedPlace.formattedAddress || '');
            setSuggestions([]);
            setSearchTerm('');
          })
          .catch((err) => console.error('Place.fetchFields hatasi:', err));
        return;
      }

      if (!placesServiceRef.current) {
        const container = mapRef.current || document.createElement('div');
        placesServiceRef.current = new window.google.maps.places.PlacesService(container);
      }

      placesServiceRef.current.getDetails(
        {
          placeId,
          fields: ['formatted_address', 'address_components', 'geometry'],
        },
        (place, status) => {
          if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place) {
            return;
          }

          if (place.geometry?.location) {
            const lat =
              typeof place.geometry.location.lat === 'function'
                ? place.geometry.location.lat()
                : place.geometry.location.lat;
            const lng =
              typeof place.geometry.location.lng === 'function'
                ? place.geometry.location.lng()
                : place.geometry.location.lng;
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
                notes: '',
              });
            }
          }

          setAddress(place.formatted_address || '');
          setSuggestions([]);
          setSearchTerm('');
        },
      );
    } catch (err) {
      console.error('Place details hatasi:', err);
    }
  };

  const debouncedSearch = useCallback(
    debounce((term) => {
      if (term && term.trim().length >= 3) {
        searchAddress(term.trim());
      } else {
        setSuggestions([]);
      }
    }, 350),
    [],
  );

  useEffect(() => {
    if (!isOpen) return;
    if (!searchTerm || searchTerm.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debouncedSearch(searchTerm);
  }, [searchTerm, isOpen, debouncedSearch]);

  useEffect(() => {
    if (!isOpen) {
      stopWatching();

      if (markerRef.current) {
        try {
          if (typeof markerRef.current.setMap === 'function') {
            markerRef.current.setMap(null);
          }
          if (typeof markerRef.current.onRemove === 'function') {
            markerRef.current.onRemove();
          }
        } catch {
          // noop
        }
        markerRef.current = null;
      }

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
        notes: '',
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
        } catch {
          // noop
        }
        markerRef.current = null;
      }
    };
  }, [isOpen]);

  const handleConfirm = () => {
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
      parts.push(
        addressDetails.neighbourhood.includes('Mah')
          ? addressDetails.neighbourhood
          : `${addressDetails.neighbourhood} Mah.`,
      );
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

    const fullAddress = parts.filter(Boolean).join(', ');
    if (fullAddress) {
      onConfirm(fullAddress);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[190] bg-dark/70 backdrop-blur-md">
      <button tabIndex={-1} className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Konum modali kapat" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-none bg-[#f8f2ee] shadow-premium sm:mt-6 sm:h-[calc(100vh-3rem)] sm:rounded-[28px]"
      >
        <div className="border-b border-surface-border bg-white/90 px-4 py-4 backdrop-blur-xl sm:px-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Teslimat noktasi</p>
              <h3 id={titleId} className="mt-1 text-2xl font-black tracking-tight text-dark sm:text-3xl">Konumu secin ve adresi tamamlayin.</h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={getCurrentLocation}
                className="hidden rounded-2xl bg-surface-muted p-3 text-dark transition-all hover:bg-white hover:shadow-card sm:inline-flex"
                aria-label="Konumu yenile"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="rounded-2xl bg-surface-muted p-3 text-dark transition-all hover:bg-white hover:shadow-card"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center px-6">
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-white shadow-card">
                <Loader2 className="h-9 w-9 animate-spin text-primary" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-dark">Konum aliniyor</h4>
                <p className="mt-2 text-sm leading-6 text-dark-lighter">En iyi konum bulundugunda adres alani doldurulacak.</p>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center px-6">
            <div className="gm-panel-muted max-w-xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-white shadow-card">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h4 className="mt-5 text-xl font-bold text-dark">Konum alinamadi</h4>
              <p className="mt-3 text-sm leading-6 text-dark-lighter">{error}</p>
              <PrimaryButton className="mt-6" onClick={getCurrentLocation}>
                <RefreshCw className="h-4 w-4" />
                Tekrar dene
              </PrimaryButton>
            </div>
          </div>
        ) : position ? (
          <>
            <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1.1fr),380px]">
              <div className="relative min-h-[320px] border-b border-surface-border lg:border-b-0 lg:border-r">
                <div className="absolute left-4 right-4 top-4 z-10">
                  <div className="rounded-[24px] border border-white/40 bg-white/92 p-3 shadow-card backdrop-blur-xl">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-lighter" />
                      <TextInput
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Adres ara (en az 3 karakter)"
                        className="pl-11 pr-4"
                        autoComplete="off"
                        enterKeyHint="search"
                      />
                    </div>

                    {searching && <p className="mt-2 text-xs font-medium text-dark-lighter">Araniyor...</p>}

                    {suggestions.length > 0 && (
                      <div className="mt-3 max-h-60 overflow-auto rounded-[22px] border border-surface-border bg-white">
                        {suggestions.map((item, index) => (
                          <button
                            key={`${item.place_id || index}`}
                            type="button"
                            onClick={() => handleSelectPlace(item.place_id)}
                            className="flex w-full items-start gap-3 border-b border-surface-border px-4 py-3 text-left text-sm transition-colors hover:bg-surface-muted last:border-b-0"
                          >
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span className="leading-6 text-dark">{item.description}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {loadError ? (
                  <div className="flex h-full items-center justify-center bg-surface-muted px-6 text-center text-sm text-red-700">
                    Harita yuklenirken bir hata olustu.
                  </div>
                ) : !isLoaded ? (
                  <div className="flex h-full items-center justify-center bg-surface-muted">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
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

                      if (markerRef.current && typeof markerRef.current.setPosition === 'function') {
                        markerRef.current.setPosition(new window.google.maps.LatLng(lat, lng));
                      }
                    }}
                    onLoad={(map) => {
                      mapRef.current = map;
                      setMapLoaded(true);
                    }}
                  />
                )}
              </div>

              <div className="flex min-h-0 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
                  <div className="space-y-4">
                    <div className="gm-panel-muted">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-primary text-white shadow-lg shadow-primary/20">
                          <Navigation className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Secili konum</p>
                          <p className="mt-2 text-sm leading-6 text-dark">{address || 'Harita uzerinden yeni bir nokta secin.'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="gm-panel space-y-4">
                      <Field label="Sokak / cadde">
                        <TextInput
                          value={addressDetails.street}
                          onChange={(e) => setAddressDetails({ ...addressDetails, street: e.target.value })}
                          placeholder="Sokak veya cadde"
                          autoComplete="address-line1"
                          enterKeyHint="next"
                        />
                      </Field>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Bina no">
                          <TextInput
                            value={addressDetails.buildingNo}
                            onChange={(e) => setAddressDetails({ ...addressDetails, buildingNo: e.target.value })}
                            placeholder="No"
                            inputMode="numeric"
                            enterKeyHint="next"
                          />
                        </Field>

                        <Field label="Daire">
                          <TextInput
                            value={addressDetails.apartmentNo}
                            onChange={(e) => setAddressDetails({ ...addressDetails, apartmentNo: e.target.value })}
                            placeholder="Daire"
                            inputMode="numeric"
                            enterKeyHint="next"
                          />
                        </Field>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Mahalle">
                          <TextInput
                            value={addressDetails.neighbourhood}
                            onChange={(e) => setAddressDetails({ ...addressDetails, neighbourhood: e.target.value })}
                            placeholder="Mahalle"
                            autoComplete="address-level3"
                            enterKeyHint="next"
                          />
                        </Field>

                        <Field label="Ilce">
                          <TextInput
                            value={addressDetails.district}
                            onChange={(e) => setAddressDetails({ ...addressDetails, district: e.target.value })}
                            placeholder="Ilce"
                            autoComplete="address-level2"
                            enterKeyHint="next"
                          />
                        </Field>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Il">
                          <TextInput
                            value={addressDetails.city}
                            onChange={(e) => setAddressDetails({ ...addressDetails, city: e.target.value })}
                            placeholder="Il"
                            autoComplete="address-level1"
                            enterKeyHint="next"
                          />
                        </Field>

                        <Field label="Posta kodu">
                          <TextInput
                            value={addressDetails.postcode}
                            onChange={(e) => setAddressDetails({ ...addressDetails, postcode: e.target.value })}
                            placeholder="Posta kodu"
                            inputMode="numeric"
                            autoComplete="postal-code"
                            enterKeyHint="next"
                          />
                        </Field>
                      </div>

                      <Field label="Tarif">
                        <TextAreaField
                          rows={3}
                          value={addressDetails.notes}
                          onChange={(e) => setAddressDetails({ ...addressDetails, notes: e.target.value })}
                          placeholder="Orn: Yesil binanin yani, guvenlikten sola"
                          autoComplete="street-address"
                          enterKeyHint="done"
                        />
                      </Field>
                    </div>
                  </div>
                </div>

                <div className="border-t border-surface-border bg-white/88 px-5 py-4 backdrop-blur-xl sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <SecondaryButton className="w-full justify-center sm:w-auto" onClick={onClose}>
                      Vazgec
                    </SecondaryButton>
                    <PrimaryButton
                      className="w-full justify-center sm:flex-1"
                      onClick={handleConfirm}
                      disabled={!addressDetails.street || !addressDetails.city}
                    >
                      <Check className="h-4 w-4" />
                      Adresi kullan
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={getCurrentLocation}
              className="absolute bottom-28 right-5 z-10 inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-bold text-dark shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover sm:hidden"
            >
              <RefreshCw className="h-4 w-4 text-primary" />
              Konumum
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default LocationPickerModal;
