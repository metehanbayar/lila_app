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
    <div className="min-h-screen py-4 sm:py-6 lg:py-8">
      <ScrollToTop />
      <PageShell width="narrow">
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Musteri girisi</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-dark sm:text-3xl">
                  {step === 'phone' ? 'Telefon numaranizi girin.' : 'Dogrulama kodunu yazin.'}
                </h1>
                <p className="mt-2 text-sm leading-6 text-dark-lighter">
                  {step === 'phone' ? 'SMS ile gelen kodla sifresiz giris yaparsiniz.' : `${phone} numarasina gonderilen 6 haneli kodu girin.`}
                </p>
              </div>
              <Link to="/" className="rounded-full bg-surface-muted px-4 py-2 text-sm font-semibold text-dark transition-all hover:bg-white">
                Ana sayfa
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className={`h-2 rounded-full ${step === 'phone' ? 'bg-primary' : 'bg-surface-muted'}`} />
              <div className={`h-2 rounded-full ${step === 'otp' ? 'bg-primary' : 'bg-surface-muted'}`} />
            </div>
          </div>

          {redirectMessage && <SurfaceCard className="border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 shadow-none">{redirectMessage}</SurfaceCard>}

          {error && (
            <SurfaceCard className="border border-red-200 bg-red-50 p-4 shadow-none">
              <div className="flex items-start gap-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            </SurfaceCard>
          )}

          {devOtp && (
            <SurfaceCard className="border border-amber-200 bg-amber-50 p-4 shadow-none">
              <div className="flex items-center gap-2 text-sm text-amber-800">
                <Badge tone="warning">Gelistirme</Badge>
                <span>Kod: {devOtp}</span>
              </div>
            </SurfaceCard>
          )}

          <SurfaceCard className="p-5 sm:p-6">
            {step === 'phone' ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <Field label="Telefon numarasi" hint="Kod bu numaraya gonderilir.">
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

                <Button type="submit" disabled={loading} className="w-full justify-center">
                  {loading ? 'Kod gonderiliyor...' : 'Kod gonder'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="rounded-[24px] border border-surface-border bg-surface-muted p-4 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[18px] bg-primary text-white shadow-lg shadow-primary/20">
                    <Shield className="h-5 w-5" />
                  </div>
                  <OTPInput length={6} onComplete={handleVerifyOTP} disabled={loading} />
                </div>

                {loading && <p className="text-center text-sm font-semibold text-primary">Dogrulaniyor...</p>}

                <div className="grid gap-3">
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
          </SurfaceCard>

          <SurfaceCard className="p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-dark-lighter">Hesabin yok mu?</span>
              <Link to="/register" className="font-bold text-primary">
                Kayit ol
              </Link>
            </div>
          </SurfaceCard>
        </div>
      </PageShell>
    </div>
  );
}

export default Login;
