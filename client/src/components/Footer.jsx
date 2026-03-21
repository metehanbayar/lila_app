import { Clock3, Facebook, Heart, Instagram, Mail, MapPin, Phone, Twitter } from 'lucide-react';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-12 overflow-hidden border-t border-white/30 bg-dark text-white lg:mt-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(140,71,124,0.24),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(209,107,83,0.18),transparent_28%)]" />
      <div className="relative mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.3fr,1fr,1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[22px] border border-white/10 bg-white/10 shadow-lg shadow-black/20">
                <img src="/logo.png" alt="Globalmenu" className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/60">Globalmenu</p>
                <h3 className="font-display text-3xl leading-none">Siparis akisi</h3>
              </div>
            </div>

            <p className="max-w-xl text-sm leading-7 text-white/72 sm:text-base">
              Mobilde hizli, desktopta ferah bir siparis deneyimi. Restoran, musteri ve admin yuzeyleri ayni tasarim ailesi
              altinda toplandi.
            </p>

            <div className="flex flex-wrap gap-2">
              <InfoChip icon={Clock3} text="Her gun 10:00 - 23:00" />
              <InfoChip icon={MapPin} text="Turkiye geneli kurulum" />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-white/55">Iletisim</h4>
            <div className="space-y-3 text-sm text-white/75">
              <ContactLink icon={Phone} href="tel:+905551234567" label="+90 555 123 45 67" />
              <ContactLink icon={Mail} href="mailto:info@globalmenu.com" label="info@globalmenu.com" />
              <ContactLink icon={MapPin} href="/" label="Kurulum ve destek merkezi" />
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

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-5 text-sm text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>{currentYear} Globalmenu. Tum haklari saklidir.</p>
          <div className="flex items-center gap-2">
            <span>Turkey build</span>
            <Heart className="h-4 w-4 fill-current text-accent" />
            <span>mobile first</span>
          </div>
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

function SocialButton({ href, icon: Icon, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
    >
      <Icon className="h-5 w-5" />
    </a>
  );
}

export default Footer;
