import { Phone, Mail, Instagram, Facebook, Twitter, Heart, MapPin, Clock } from 'lucide-react';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-b from-gray-900 to-black text-white mt-auto pb-20 lg:pb-0 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-0 right-0 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

      <div className="container mx-auto px-4 py-10 sm:py-14 relative z-10">
        {/* Üst Kısım */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 mb-10">
          {/* Hakkımızda */}
          <div className="text-center md:text-left">
            <div className="flex justify-center md:justify-start mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-8 h-8 object-contain filter brightness-0 invert"
                />
              </div>
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
              Global Menu
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Premium restoran deneyimi ve lezzetli yemekler için bizi tercih edin.
              Kaliteli hizmet anlayışımızla her zaman yanınızdayız.
            </p>
          </div>

          {/* İletişim */}
          <div className="text-center md:text-left">
            <h3 className="text-lg font-bold text-white mb-5 flex items-center justify-center md:justify-start gap-2">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Phone className="w-4 h-4 text-purple-400" />
              </div>
              İletişim
            </h3>
            <div className="space-y-3">
              <a
                href="tel:+905551234567"
                className="flex items-center justify-center md:justify-start gap-3 text-gray-400 hover:text-white transition-colors group"
              >
                <div className="w-10 h-10 bg-gray-800 group-hover:bg-purple-500/20 rounded-xl flex items-center justify-center transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-sm">+90 555 123 45 67</span>
              </a>
              <a
                href="https://wa.me/905551234567"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center md:justify-start gap-3 text-gray-400 hover:text-green-400 transition-colors group"
              >
                <div className="w-10 h-10 bg-gray-800 group-hover:bg-green-500/20 rounded-xl flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <span className="text-sm">WhatsApp</span>
              </a>
              <a
                href="mailto:info@globalmenu.com"
                className="flex items-center justify-center md:justify-start gap-3 text-gray-400 hover:text-white transition-colors group"
              >
                <div className="w-10 h-10 bg-gray-800 group-hover:bg-pink-500/20 rounded-xl flex items-center justify-center transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-sm">info@globalmenu.com</span>
              </a>
            </div>
          </div>

          {/* Sosyal Medya */}
          <div className="text-center md:text-left">
            <h3 className="text-lg font-bold text-white mb-5 flex items-center justify-center md:justify-start gap-2">
              <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 text-pink-400" />
              </div>
              Bizi Takip Edin
            </h3>
            <div className="flex justify-center md:justify-start gap-3">
              <SocialButton
                href="https://instagram.com"
                icon={<Instagram className="w-5 h-5" />}
                gradient="from-purple-500 via-pink-500 to-orange-500"
              />
              <SocialButton
                href="https://facebook.com"
                icon={<Facebook className="w-5 h-5" />}
                gradient="from-blue-600 to-blue-400"
              />
              <SocialButton
                href="https://twitter.com"
                icon={<Twitter className="w-5 h-5" />}
                gradient="from-cyan-500 to-blue-500"
              />
            </div>

            {/* Çalışma Saatleri */}
            <div className="mt-6 p-4 bg-gray-800/50 rounded-2xl border border-gray-700/50">
              <div className="flex items-center gap-2 text-purple-400 mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-semibold">Çalışma Saatleri</span>
              </div>
              <p className="text-gray-400 text-sm">
                Her gün: 10:00 - 23:00
              </p>
            </div>
          </div>
        </div>

        {/* Alt Bilgi */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm text-center sm:text-left">
              © {currentYear} Global Menu. Tüm hakları saklıdır.
            </p>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500 animate-pulse" />
              <span>in Turkey</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Social Button Component
function SocialButton({ href, icon, gradient }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative w-12 h-12 bg-gray-800 hover:bg-transparent rounded-xl flex items-center justify-center transition-all duration-300 overflow-hidden"
    >
      {/* Gradient background on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      {/* Icon */}
      <span className="relative z-10 text-gray-400 group-hover:text-white transition-colors duration-300">
        {icon}
      </span>
    </a>
  );
}

export default Footer;
