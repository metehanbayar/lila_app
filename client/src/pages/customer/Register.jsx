import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, Mail, Phone, Shield, User } from 'lucide-react';
import OTPInput from '../../components/OTPInput';
import ScrollToTop from '../../components/ScrollToTop';
import { customerRegister } from '../../services/customerApi';
import { sendOTP, verifyOTP } from '../../services/otpApi';
import useCustomerStore from '../../store/customerStore';
import { TURKISH_PHONE_PLACEHOLDER, formatTurkishPhoneInput, isValidTurkishMobilePhone, normalizeTurkishPhone } from '../../utils/phone';
import { safeClearTimeout, safeSetTimeout } from '../../utils/performance';
import { Badge, Button, Field, PageShell, SelectField, SurfaceCard, TextInput } from '../../components/ui/primitives';

function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useCustomerStore();
  const [step, setStep] = useState('info');
  const [formData, setFormData] = useState({
    phone: '',
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    referralCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState('');
  const searchParams = new URLSearchParams(location.search);
  const redirectUrl = location.state?.from || searchParams.get('redirect') || '/profile';
  const redirectMessage = location.state?.message || searchParams.get('message');
  const hasRedirectContext = Boolean(location.state?.from || searchParams.get('redirect') || redirectMessage);
  const loginSearch = new URLSearchParams();

  if (hasRedirectContext) {
    loginSearch.set('redirect', redirectUrl);
    if (redirectMessage) {
      loginSearch.set('message', redirectMessage);
    }
  }

  const loginHref = loginSearch.toString() ? `/login?${loginSearch.toString()}` : '/login';

  useEffect(() => {
    if (countdown > 0) {
      const timer = safeSetTimeout(() => setCountdown(countdown - 1), 1000);
      return () => safeClearTimeout(timer);
    }
    return undefined;
  }, [countdown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'phone' ? formatTurkishPhoneInput(value) : value,
    }));
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = normalizeTurkishPhone(formData.phone);

    if (!isValidTurkishMobilePhone(cleanPhone)) {
      setError('Gecerli bir telefon numarasi girin');
      return;
    }

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('Ad ve soyad zorunludur');
      return;
    }

    setLoading(true);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`;
      const response = await sendOTP(cleanPhone, 'register', fullName);

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

  const handleVerifyAndRegister = async (code) => {
    setError(null);
    setLoading(true);

    try {
      const cleanPhone = normalizeTurkishPhone(formData.phone);
      const verifyResponse = await verifyOTP(cleanPhone, code, 'register');

      if (verifyResponse.success) {
        const fullName = `${formData.firstName} ${formData.lastName}`.trim();
        const registerResponse = await customerRegister({
          phone: cleanPhone,
          fullName,
          email: formData.email || undefined,
          dateOfBirth: formData.dateOfBirth || undefined,
          gender: formData.gender || undefined,
          referralCode: formData.referralCode || undefined,
          otp: code,
        });

        if (registerResponse.success) {
          login(registerResponse.data.customer, registerResponse.data.token);
          navigate(redirectUrl, { replace: true });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Kayit olurken bir hata olustu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-4 sm:py-6 lg:py-8">
      <ScrollToTop />
      <PageShell width="content">
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Yeni hesap</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-dark sm:text-3xl">
                  {step === 'info' ? 'Bilgilerinizi girin.' : 'Kaydi kodla tamamlayin.'}
                </h1>
                <p className="mt-2 text-sm leading-6 text-dark-lighter">
                  {step === 'info' ? 'Zorunlu alanlari doldurun, SMS kodunu alin ve hesabinizi acin.' : `${formData.phone} numarasina gonderilen kodu kullanin.`}
                </p>
              </div>
              <Link to="/" className="rounded-full bg-surface-muted px-4 py-2 text-sm font-semibold text-dark transition-all hover:bg-white">
                Ana sayfa
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className={`h-2 rounded-full ${step === 'info' ? 'bg-primary' : 'bg-surface-muted'}`} />
              <div className={`h-2 rounded-full ${step === 'otp' ? 'bg-primary' : 'bg-surface-muted'}`} />
            </div>
          </div>

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
            {step === 'info' ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Ad">
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-lighter" />
                      <TextInput name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Ad" className="pl-12" required />
                    </div>
                  </Field>

                  <Field label="Soyad">
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-lighter" />
                      <TextInput name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Soyad" className="pl-12" required />
                    </div>
                  </Field>
                </div>

                <Field label="Telefon">
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-lighter" />
                    <TextInput
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      pattern="[0-9 ]*"
                      enterKeyHint="next"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder={TURKISH_PHONE_PLACEHOLDER}
                      className="pl-12"
                      maxLength={14}
                      required
                    />
                  </div>
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="E-posta">
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-lighter" />
                      <TextInput type="email" name="email" value={formData.email} onChange={handleChange} placeholder="mail@ornek.com" className="pl-12" />
                    </div>
                  </Field>

                  <Field label="Davet kodu">
                    <TextInput name="referralCode" value={formData.referralCode} onChange={handleChange} placeholder="REF000001" />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Dogum tarihi">
                    <TextInput type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
                  </Field>

                  <Field label="Cinsiyet">
                    <SelectField name="gender" value={formData.gender} onChange={handleChange}>
                      <option value="">Seciniz</option>
                      <option value="Male">Erkek</option>
                      <option value="Female">Kadin</option>
                      <option value="Other">Diger</option>
                    </SelectField>
                  </Field>
                </div>

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
                  <OTPInput length={6} onComplete={handleVerifyAndRegister} disabled={loading} />
                </div>

                {loading && <p className="text-center text-sm font-semibold text-primary">Kayit olusturuluyor...</p>}

                <div className="grid gap-3">
                  {countdown > 0 ? (
                    <p className="text-center text-sm text-dark-lighter">Yeni kod {countdown} saniye sonra gonderilebilir.</p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setStep('info');
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
                    onClick={() => setStep('info')}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-surface-muted px-4 py-3 text-sm font-semibold text-dark"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Bilgileri duzenle
                  </button>
                </div>
              </div>
            )}
          </SurfaceCard>

          <SurfaceCard className="p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-dark-lighter">Zaten hesabin var mi?</span>
              <Link to={loginHref} state={hasRedirectContext ? { from: redirectUrl, message: redirectMessage } : null} className="font-bold text-primary">
                Giris yap
              </Link>
            </div>
          </SurfaceCard>
        </div>
      </PageShell>
    </div>
  );
}

export default Register;
