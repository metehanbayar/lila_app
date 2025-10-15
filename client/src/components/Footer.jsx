import { Phone, Mail, Instagram, Facebook, Twitter } from 'lucide-react';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-white mt-auto pb-16 lg:pb-0">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* İletişim ve Sosyal Medya */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-4 sm:mb-6">
          {/* Hakkımızda */}
          <div>
            <div className="flex justify-center mb-2 sm:mb-3">
              <img 
                src="/logo.png" 
                alt="Lila Group" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed text-center">
              Premium restoran deneyimi ve lezzetli yemekler için bizi tercih edin.
            </p>
          </div>

          {/* İletişim */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-primary">İletişim</h3>
            <div className="space-y-2">
              <a
                href="tel:+905551234567"
                className="flex items-center space-x-2 text-gray-300 hover:text-primary active:text-primary transition-colors text-xs sm:text-sm"
              >
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+90 555 123 45 67</span>
              </a>
              <a
                href="https://wa.me/905551234567"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-300 hover:text-secondary active:text-secondary transition-colors text-xs sm:text-sm"
              >
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>WhatsApp ile İletişim</span>
              </a>
              <a
                href="mailto:info@lilagroup.com"
                className="flex items-center space-x-2 text-gray-300 hover:text-primary active:text-primary transition-colors text-xs sm:text-sm"
              >
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>info@lilagroup.com</span>
              </a>
            </div>
          </div>

          {/* Sosyal Medya */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-primary">Bizi Takip Edin</h3>
            <div className="flex space-x-3 sm:space-x-4">
              <a
                href="https://instagram.com/lilagroup"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 sm:w-11 sm:h-11 bg-gray-700 hover:bg-primary active:bg-primary-dark rounded-full flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com/lilagroup"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 sm:w-11 sm:h-11 bg-gray-700 hover:bg-primary active:bg-primary-dark rounded-full flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/lilagroup"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 sm:w-11 sm:h-11 bg-gray-700 hover:bg-primary active:bg-primary-dark rounded-full flex items-center justify-center transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Alt Bilgi */}
        <div className="border-t border-gray-700 pt-4 sm:pt-6 text-center">
          <p className="text-gray-400 text-xs sm:text-sm">
            © {currentYear} Lila Group. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

