import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Phone, AlertCircle, Loader2, ArrowLeft, ArrowRight, Shield } from 'lucide-react';
import useCustomerStore from '../../store/customerStore';
import { customerLogin } from '../../services/customerApi';
import { sendOTP, verifyOTP } from '../../services/otpApi';
import AppLayout from '../../components/AppLayout';
import ScrollToTop from '../../components/ScrollToTop';
import OTPInput from '../../components/OTPInput';
import { safeSetTimeout, safeClearTimeout } from '../../utils/performance';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useCustomerStore();
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' veya 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState(''); // Geliştirme ortamı için

  const from = location.state?.from || location.state?.from?.pathname || '/profile';

  // Geri sayım timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = safeSetTimeout(() => setCountdown(countdown - 1), 1000);
      return () => safeClearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError(null);

    // Telefon numarası validasyonu
    const cleanPhone = phone.replace(/\s/g, '');
    const phoneRegex = /^(05|5)[0-9]{9}$/;
    
    if (!phoneRegex.test(cleanPhone)) {
      setError('Geçerli bir telefon numarası girin (05xxxxxxxxx)');
      return;
    }

    setLoading(true);

    try {
      const response = await sendOTP(cleanPhone, 'login', ''); // Login için isim boş
      
      if (response.success) {
        setStep('otp');
        setCountdown(60); // 60 saniye bekle
        
        // Geliştirme ortamında OTP'yi göster
        if (response.otp) {
          setDevOtp(response.otp);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'SMS gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otpCode) => {
    setError(null);
    setLoading(true);

    try {
      const cleanPhone = phone.replace(/\s/g, '');
      
      // Önce OTP'yi doğrula
      const verifyResponse = await verifyOTP(cleanPhone, otpCode, 'login');
      
      if (verifyResponse.success) {
        // Sonra giriş yap
        const loginResponse = await customerLogin(cleanPhone, otpCode);
        
        if (loginResponse.success) {
          login(loginResponse.data.customer, loginResponse.data.token);
          navigate(from, { replace: true });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Giriş yapılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    setStep('phone');
    setError(null);
    setDevOtp('');
  };

  return (
    <AppLayout showBottomNav={true}>
      <ScrollToTop />
      <div className="flex items-center justify-center px-4 h-full relative">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-50/30 to-pink-50/30 -z-10 animate-gradient" />
        
        {/* Floating Shapes */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-200/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-primary/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-pink-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        
        <div className="max-w-md w-full relative">
          {/* Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl shadow-primary/10 p-4 sm:p-6 border-2 border-white/40 relative overflow-hidden animate-scaleIn">
            {/* Glow Effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            
            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-4 sm:mb-5">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary to-purple-600 mb-2 sm:mb-3 shadow-lg shadow-primary/20">
                  <Phone className="text-white" size={22} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Hoş Geldiniz</h1>
                <p className="text-sm text-gray-600">
                  {step === 'phone' ? 'Telefon numaranızı girin' : 'Doğrulama kodunu girin'}
                </p>
              </div>

              {/* Progress Indicator */}
              <div className="mb-4 flex items-center justify-center gap-2">
                <div className={`h-1.5 w-10 sm:w-12 rounded-full transition-all ${step === 'phone' ? 'bg-primary' : 'bg-gray-300'}`} />
                <div className={`h-1.5 w-10 sm:w-12 rounded-full transition-all ${step === 'otp' ? 'bg-primary' : 'bg-gray-300'}`} />
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-3 bg-red-50/80 border border-red-200 text-red-700 px-3 py-2 rounded-lg flex items-center gap-2 animate-slideDown">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span className="text-xs">{error}</span>
                </div>
              )}

              {/* Dev Mode OTP Display */}
              {devOtp && (
                <div className="mb-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 text-yellow-800 px-3 py-2 rounded-lg animate-slideDown">
                  <p className="text-xs font-semibold">🔧 Geliştirme Modu</p>
                  <p className="text-xs mt-0.5">OTP: <span className="font-bold text-base bg-white px-1.5 py-0.5 rounded">{devOtp}</span></p>
                </div>
              )}

            {step === 'phone' ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                {/* Phone */}
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Telefon Numarası
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-primary transition-colors">
                      <Phone className="text-gray-400 group-focus-within:text-primary" size={18} />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                      placeholder="05XX XXX XX XX"
                      maxLength={11}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    SMS ile doğrulama kodu gönderilecektir
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary-dark hover:to-purple-700 active:scale-[0.98] text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gönderiliyor...</span>
                    </>
                  ) : (
                    <>
                      <span>Kod Gönder</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                {/* OTP Header */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                    <Shield className="text-primary" size={20} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">Doğrulama Kodu</h3>
                  <p className="text-xs text-gray-600 mb-3">
                    {phone} numarasına gönderilen 6 haneli kodu girin
                  </p>
                </div>

                {/* OTP Input */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <OTPInput 
                    length={6} 
                    onComplete={handleVerifyOTP}
                    disabled={loading}
                  />
                </div>

                {/* Loading State */}
                {loading && (
                  <div className="flex flex-col items-center justify-center gap-2 text-primary">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs font-medium">Doğrulanıyor...</span>
                  </div>
                )}

                {/* Resend Button */}
                <div className="text-center pt-1">
                  {countdown > 0 ? (
                    <p className="text-xs text-gray-600">
                      ⏱️ Yeni kod <span className="font-semibold text-primary">{countdown}</span> saniye sonra
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOTP}
                      className="text-xs text-primary hover:text-primary-dark font-semibold transition-colors"
                    >
                      🔄 Yeni kod gönder
                    </button>
                  )}
                </div>

                {/* Back Button */}
                <button
                  onClick={() => setStep('phone')}
                  className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 font-medium py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-200 text-xs"
                >
                  <ArrowLeft size={14} />
                  Telefon numarasını değiştir
                </button>
              </div>
            )}

              {/* Register Link */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-gray-600">
                    Hesabınız yok mu?
                  </div>
                  <Link 
                    to="/register" 
                    className="text-primary hover:text-primary-dark font-bold flex items-center gap-1 group"
                  >
                    Kayıt Ol
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Back Home */}
              <div className="mt-2 text-center">
                <Link 
                  to="/" 
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft size={12} />
                  Ana Sayfaya Dön
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default Login;
