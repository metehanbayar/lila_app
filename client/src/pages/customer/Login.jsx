import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, Phone, Shield } from 'lucide-react';
import OTPInput from '../../components/OTPInput';
import ScrollToTop from '../../components/ScrollToTop';
import { customerLogin } from '../../services/customerApi';
import { sendOTP, verifyOTP } from '../../services/otpApi';
import useCustomerStore from '../../store/customerStore';
import { safeClearTimeout, safeSetTimeout } from '../../utils/performance';
import { Badge, Button, Field, PageShell, SurfaceCard, TextInput } from '../../components/ui/primitives';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useCustomerStore();
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState('');

  const searchParams = new URLSearchParams(location.search);
  const redirectUrl = searchParams.get('redirect') || '/profile';
  const redirectMessage = searchParams.get('message');

  useEffect(() => {
    if (countdown > 0) {
      const timer = safeSetTimeout(() => setCountdown(countdown - 1), 1000);
      return () => safeClearTimeout(timer);
    }
    return undefined;
  }, [countdown]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\s/g, '');
    const phoneRegex = /^(05|5)[0-9]{9}$/;

    if (!phoneRegex.test(cleanPhone)) {
      setError('Gecerli bir telefon numarasi girin (05xxxxxxxxx)');
      return;
    }

    setLoading(true);

    try {
      const response = await sendOTP(cleanPhone, 'login', '');
      if (response.success) {
        setStep('otp');
        setCountdown(60);
        if (response.otp) setDevOtp(response.otp);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'SMS gonderilemedi. Lutfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otpCode) => {
    setError(null);
    setLoading(true);

    try {
      const cleanPhone = phone.replace(/\s/g, '');
      const verifyResponse = await verifyOTP(cleanPhone, otpCode, 'login');

      if (verifyResponse.success) {
        const loginResponse = await customerLogin(cleanPhone, otpCode);
        if (loginResponse.success) {
          login(loginResponse.data.customer, loginResponse.data.token);
          navigate(redirectUrl, { replace: true });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Giris yapilirken bir hata olustu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-6 sm:py-8 lg:py-10">
      <ScrollToTop />
      <PageShell width="full">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr),520px] lg:items-stretch">
          <SurfaceCard tone="hero" className="overflow-hidden p-6 sm:p-8 lg:p-10">
            <div className="space-y-6">
              <span className="gm-eyebrow border-white/20 bg-white/10 text-white">Hesabina gir</span>
              <div className="space-y-4">
                <h1 className="font-display text-5xl leading-none sm:text-6xl">Siparislerini tek yerden yonet.</h1>
                <p className="max-w-xl text-sm leading-7 text-white/82 sm:text-base">
                  Telefon numarasi ile hizli giris. Mobilde tek el akisi, desktopta daha rahat form hiyerarsisi.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[26px] border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Tek adim</p>
                  <p className="mt-2 text-3xl font-black">OTP</p>
                  <p className="mt-1 text-sm text-white/72">Sifre yok</p>
                </div>
                <div className="rounded-[26px] border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Hizli erisim</p>
                  <p className="mt-2 text-3xl font-black">Profil</p>
                  <p className="mt-1 text-sm text-white/72">Siparis ve favoriler</p>
                </div>
              </div>

              <div className="rounded-[26px] border border-white/15 bg-white/10 p-5 backdrop-blur-md">
                <p className="text-sm font-semibold text-white">Giristen sonra</p>
                <ul className="mt-3 space-y-2 text-sm text-white/75">
                  <li>Adreslerini yonetebilirsin.</li>
                  <li>Eski siparislerini tekrar verebilirsin.</li>
                  <li>Favorilerini tek yerden gorebilirsin.</li>
                </ul>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5 sm:p-6 lg:p-8">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Musteri girisi</p>
                  <h2 className="gm-display mt-2 text-4xl">{step === 'phone' ? 'Telefon numarasi' : 'Dogrulama kodu'}</h2>
                  <p className="mt-2 text-sm leading-7 text-dark-lighter">
                    {step === 'phone' ? 'Numarani gir, kodu al ve giris yap.' : `${phone} numarasina gonderilen 6 haneli kodu yaz.`}
                  </p>
                </div>
                <Link to="/" className="rounded-full bg-surface-muted px-4 py-2 text-sm font-semibold text-dark-lighter transition-all hover:bg-white">
                  Ana sayfa
                </Link>
              </div>

              <div className="flex gap-2">
                <div className={`h-2 flex-1 rounded-full ${step === 'phone' ? 'bg-primary' : 'bg-surface-muted'}`} />
                <div className={`h-2 flex-1 rounded-full ${step === 'otp' ? 'bg-primary' : 'bg-surface-muted'}`} />
              </div>

              {redirectMessage && (
                <div className="rounded-[22px] border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">{redirectMessage}</div>
              )}

              {error && (
                <div className="flex items-start gap-3 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {devOtp && (
                <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <div className="flex items-center gap-2">
                    <Badge tone="warning">Gelistirme</Badge>
                    <span>Kod: {devOtp}</span>
                  </div>
                </div>
              )}

              {step === 'phone' ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <Field label="Telefon numarasi" hint="SMS ile dogrulama kodu gonderilecektir.">
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-lighter" />
                      <TextInput
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="05XX XXX XX XX"
                        className="pl-12"
                        maxLength={11}
                        required
                      />
                    </div>
                  </Field>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Kod gonderiliyor...' : 'Kod gonder'}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </form>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-[28px] border border-surface-border bg-surface-muted p-5 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[22px] bg-primary text-white shadow-lg shadow-primary/20">
                      <Shield className="h-6 w-6" />
                    </div>
                    <OTPInput length={6} onComplete={handleVerifyOTP} disabled={loading} />
                  </div>

                  {loading && <p className="text-center text-sm font-semibold text-primary">Dogrulaniyor...</p>}

                  <div className="flex flex-col gap-3">
                    {countdown > 0 ? (
                      <p className="text-center text-sm text-dark-lighter">Yeni kod {countdown} saniye sonra gonderilebilir.</p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setStep('phone');
                          setError(null);
                          setDevOtp('');
                        }}
                        className="text-center text-sm font-bold text-primary"
                      >
                        Yeni kod gonder
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setStep('phone')}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-surface-muted px-4 py-3 text-sm font-semibold text-dark"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Numara degistir
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 border-t border-surface-border pt-5 text-sm">
                <span className="text-dark-lighter">Hesabin yok mu?</span>
                <Link to="/register" className="font-bold text-primary">
                  Kayit ol
                </Link>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </PageShell>
    </div>
  );
}

export default Login;
