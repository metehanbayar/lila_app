import { Clock3, Facebook, Instagram, Mail, Phone, Twitter } from 'lucide-react';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-12 overflow-hidden border-t border-white/30 bg-dark text-white lg:mt-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(140,71,124,0.24),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(209,107,83,0.18),transparent_28%)]" />
      <div className="relative mx-auto w-full max-w-[1440px] px-4 py-6 lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-white/10 shadow-lg shadow-black/20">
              <img src="/logo.png" alt="Globalmenu" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/60">Globalmenu</p>
              <p className="truncate text-sm font-semibold text-white/85">Online Siparis</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SocialButton href="tel:+905551234567" icon={Phone} label="Telefon" compact />
            <SocialButton href="mailto:info@globalmenu.com" icon={Mail} label="E-posta" compact />
          </div>
        </div>

        <p className="mt-4 text-xs text-white/55">{currentYear} Globalmenu. Tum haklari saklidir.</p>
      </div>

      <div className="relative mx-auto hidden w-full max-w-[1440px] px-6 py-12 lg:block lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.3fr,1fr,1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[22px] border border-white/10 bg-white/10 shadow-lg shadow-black/20">
                <img src="/logo.png" alt="Globalmenu" className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/60">Globalmenu</p>
                <h3 className="font-display text-3xl leading-none">Online Siparis</h3>
              </div>
            </div>

            <p className="max-w-xl text-sm leading-7 text-white/72 sm:text-base">Magaza ve urun siparislerini tek yerden yonetin.</p>

            <div className="flex flex-wrap gap-2">
              <InfoChip icon={Clock3} text="Her gun 10:00 - 23:00" />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-white/55">Iletisim</h4>
            <div className="space-y-3 text-sm text-white/75">
              <ContactLink icon={Phone} href="tel:+905551234567" label="+90 555 123 45 67" />
              <ContactLink icon={Mail} href="mailto:info@globalmenu.com" label="info@globalmenu.com" />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-white/55">Takip Et</h4>
            <div className="flex gap-3">
              <SocialButton href="https://instagram.com" icon={Instagram} label="Instagram" />
              <SocialButton href="https://facebook.com" icon={Facebook} label="Facebook" />
              <SocialButton href="https://twitter.com" icon={Twitter} label="X" />
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-5 text-sm text-white/55">
          <p>{currentYear} Globalmenu. Tum haklari saklidir.</p>
        </div>
      </div>
    </footer>
  );
}

function InfoChip({ icon: Icon, text }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80">
      <Icon className="h-3.5 w-3.5 text-accent-light" />
      <span>{text}</span>
    </div>
  );
}

function ContactLink({ icon: Icon, href, label }) {
  return (
    <a href={href} className="group flex items-center gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 transition-all duration-200 hover:bg-white/8">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/8 text-accent-light">
        <Icon className="h-4 w-4" />
      </span>
      <span className="transition-colors duration-200 group-hover:text-white">{label}</span>
    </a>
  );
}

function SocialButton({ href, icon: Icon, label, compact = false }) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noreferrer' : undefined}
      aria-label={label}
      className={`flex items-center justify-center border border-white/10 bg-white/5 text-white/70 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white ${
        compact ? 'h-10 w-10 rounded-xl' : 'h-12 w-12 rounded-2xl'
      }`}
    >
      <Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
    </a>
  );
}

export default Footer;
