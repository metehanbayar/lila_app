import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, Mail, Phone, Shield, Sparkles, User } from 'lucide-react';
import OTPInput from '../../components/OTPInput';
import ScrollToTop from '../../components/ScrollToTop';
import { customerRegister } from '../../services/customerApi';
import { sendOTP, verifyOTP } from '../../services/otpApi';
import useCustomerStore from '../../store/customerStore';
import { safeClearTimeout, safeSetTimeout } from '../../utils/performance';
import { Badge, Button, Field, PageShell, SelectField, SurfaceCard, TextInput } from '../../components/ui/primitives';

function Register() {
  const navigate = useNavigate();
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

  useEffect(() => {
    if (countdown > 0) {
      const timer = safeSetTimeout(() => setCountdown(countdown - 1), 1000);
      return () => safeClearTimeout(timer);
    }
    return undefined;
  }, [countdown]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = formData.phone.replace(/\s/g, '');
    const phoneRegex = /^(05|5)[0-9]{9}$/;

    if (!phoneRegex.test(cleanPhone)) {
      setError('Gecerli bir telefon numarasi girin (05xxxxxxxxx)');
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
      const cleanPhone = formData.phone.replace(/\s/g, '');
      const verifyResponse = await verifyOTP(cleanPhone, code, 'register');

      if (verifyResponse.success) {
        const fullName = `${formData.firstName} ${formData.lastName}`;
        const registerData = {
          phone: cleanPhone,
          fullName,
          email: formData.email || undefined,
          dateOfBirth: formData.dateOfBirth || undefined,
          gender: formData.gender || undefined,
          referralCode: formData.referralCode || undefined,
          otp: code,
        };

        const registerResponse = await customerRegister(registerData);

        if (registerResponse.success) {
          login(registerResponse.data.customer, registerResponse.data.token);
          navigate('/profile');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Kayit olurken bir hata olustu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-6 sm:py-8 lg:py-10">
      <ScrollToTop />
      <PageShell width="full">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr),560px] lg:items-stretch">
          <SurfaceCard tone="hero" className="overflow-hidden p-6 sm:p-8 lg:p-10">
            <div className="space-y-6">
              <span className="gm-eyebrow border-white/20 bg-white/10 text-white">Yeni hesap</span>
              <div className="space-y-4">
                <h1 className="font-display text-5xl leading-none sm:text-6xl">Favori, siparis ve profil tek merkezde.</h1>
                <p className="max-w-xl text-sm leading-7 text-white/82 sm:text-base">
                  Kayit akisi mobile first tekrar kuruldu. Telefon, profil ve istege bagli bilgiler daha net bloklara ayrildi.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[26px] border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Giris</p>
                  <p className="mt-2 text-3xl font-black">OTP</p>
                </div>
                <div className="rounded-[26px] border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Hesap</p>
                  <p className="mt-2 text-3xl font-black">Profil</p>
                </div>
                <div className="rounded-[26px] border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Tekrar</p>
                  <p className="mt-2 text-3xl font-black">Siparis</p>
                </div>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5 sm:p-6 lg:p-8">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Kayit</p>
                  <h2 className="gm-display mt-2 text-4xl">{step === 'info' ? 'Bilgilerini gir' : 'Dogrulama kodu'}</h2>
                  <p className="mt-2 text-sm leading-7 text-dark-lighter">
                    {step === 'info' ? 'Zorunlu alanlari doldur, kodu al ve hesabini ac.' : `${formData.phone} numarasina giden kodu kullanarak kaydi tamamla.`}
                  </p>
                </div>
                <Link to="/" className="rounded-full bg-surface-muted px-4 py-2 text-sm font-semibold text-dark-lighter transition-all hover:bg-white">
                  Ana sayfa
                </Link>
              </div>

              <div className="flex gap-2">
                <div className={`h-2 flex-1 rounded-full ${step === 'info' ? 'bg-primary' : 'bg-surface-muted'}`} />
                <div className={`h-2 flex-1 rounded-full ${step === 'otp' ? 'bg-primary' : 'bg-surface-muted'}`} />
              </div>

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
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="05XX XXX XX XX"
                        className="pl-12"
                        maxLength={11}
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
                    <OTPInput length={6} onComplete={handleVerifyAndRegister} disabled={loading} />
                  </div>

                  {loading && <p className="text-center text-sm font-semibold text-primary">Kayit olusturuluyor...</p>}

                  <div className="flex flex-col gap-3">
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

              <div className="flex items-center justify-between gap-3 border-t border-surface-border pt-5 text-sm">
                <span className="text-dark-lighter">Zaten hesabin var mi?</span>
                <Link to="/login" className="font-bold text-primary">
                  Giris yap
                </Link>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </PageShell>
    </div>
  );
}

export default Register;
