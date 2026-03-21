# Globalmenu

Globalmenu, restoran menusu, siparis, admin paneli ve musteri akislari iceren bir monorepo yapisidir.

## Klasor Yapisi

- `client/`: Vite + React istemcisi
- `server/`: Express API, MSSQL baglantisi, odeme ve bildirim akislari
- `LilaPrinterClient/`: Aktif yazici istemcisi

Eski `server/agent` yapisi kaldirildi.

## Gereksinimler

- Node.js 18+
- MSSQL Server
- SMTP erisimi
- Odeme entegrasyonu kullanilacaksa VakifBank bilgileri

## Kurulum

1. Bagimliliklari yukleyin:

```bash
npm run install-all
```

2. Ornek env dosyalarini kopyalayin:

```bash
copy client\.env.example client\.env
copy server\.env.example server\.env
```

3. `server/.env` icinde su alanlari gercek degerlerle doldurun:

- `AUTH_TOKEN_SECRET`
- `CORS_ORIGIN`
- `DB_*`
- `EMAIL_*`
- `GOOGLE_MAPS_API_KEY` gerekiyorsa
- `PAYMENT_*` ve `VAKIF_*` odeme kullaniliyorsa

4. `client/.env` icinde gerekirse su alanlari duzenleyin:

- `VITE_API_URL`
- `VITE_PROXY_TARGET`
- `VITE_GOOGLE_MAPS_API_KEY`

## Calistirma

Tum uygulamayi gelistirme modunda baslatmak icin:

```bash
npm run dev
```

Tekil komutlar:

```bash
npm run client
npm run server
npm run lint
npm run check
```

`client` varsayilan olarak `5173`, `server` varsayilan olarak `3000` portunda calisir.

## Uretim Notlari

- Bearer token'lar artik geri cozulur base64 credential degil, sunucu tarafinda imzali token'dir.
- Production ortaminda `CORS_ORIGIN` zorunludur.
- `/api/test-email/*` endpoint'leri production'da admin yetkisi ister.
- Odeme ortami varsayilan olarak `test` gelir. Production icin `PAYMENT_ENVIRONMENT=production` ve tum gerekli `VAKIF_*` ile callback URL'leri zorunludur.

## Yazici Akisi

Aktif cozum `LilaPrinterClient` klasorundeki Windows istemcisidir. Kaldirilan legacy agent yapisi repoda tutulmaz.
