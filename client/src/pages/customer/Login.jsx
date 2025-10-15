import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Phone, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import useCustomerStore from '../../store/customerStore';
import { customerLogin } from '../../services/customerApi';
import { sendOTP, verifyOTP } from '../../services/otpApi';
import AppLayout from '../../components/AppLayout';
import OTPInput from '../../components/OTPInput';

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
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
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
      const response = await sendOTP(cleanPhone, 'login');
      
      if (response.success) {
        setStep('otp');
        setCountdown(60); // 60 saniye bekle
        
        // Geliştirme ortamında OTP'yi göster
        if (response.otp) {
          setDevOtp(response.otp);
          console.log('DEV OTP:', response.otp);
        }
      }
    } catch (err) {
      console.error('OTP gönderme hatası:', err);
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
      console.error('Giriş hatası:', err);
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
    <AppLayout showBottomNav={false}>
      <div className="flex items-center justify-center px-4 py-8 sm:py-12 min-h-[calc(100vh-64px)]">
        <div className="max-w-md w-full">
          {/* Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-card p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Giriş Yap</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                {step === 'phone' ? 'Telefon numaranızı girin' : 'Doğrulama kodunu girin'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Dev Mode OTP Display */}
            {devOtp && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                <p className="text-sm font-semibold">🔧 Geliştirme Modu</p>
                <p className="text-sm mt-1">OTP Kodunuz: <span className="font-bold text-lg">{devOtp}</span></p>
              </div>
            )}

            {step === 'phone' ? (
              <form onSubmit={handleSendOTP} className="space-y-5">
                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Telefon Numarası
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="text-gray-400" size={18} />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="block w-full pl-10 pr-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="05XX XXX XX XX"
                      maxLength={11}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Telefon numaranıza SMS ile doğrulama kodu gönderilecektir
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark active:bg-primary-dark text-white font-semibold py-3 sm:py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Gönderiliyor...</span>
                    </>
                  ) : (
                    'Doğrulama Kodu Gönder'
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                {/* OTP Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                    {phone} numarasına gönderilen 6 haneli kodu girin
                  </label>
                  <OTPInput 
                    length={6} 
                    onComplete={handleVerifyOTP}
                    disabled={loading}
                  />
                </div>

                {/* Loading State */}
                {loading && (
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Doğrulanıyor...</span>
                  </div>
                )}

                {/* Resend Button */}
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-gray-500">
                      Yeni kod {countdown} saniye sonra gönderilebilir
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOTP}
                      className="text-sm text-primary hover:text-primary-dark font-medium"
                    >
                      Yeni kod gönder
                    </button>
                  )}
                </div>

                {/* Back Button */}
                <button
                  onClick={() => setStep('phone')}
                  className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 text-sm"
                >
                  <ArrowLeft size={16} />
                  Telefon numarasını değiştir
                </button>
              </div>
            )}

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Hesabınız yok mu?{' '}
                <Link to="/register" className="text-primary hover:text-primary-dark font-medium">
                  Kayıt Ol
                </Link>
              </p>
            </div>

            {/* Back Home */}
            <div className="mt-4 text-center">
              <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
                ← Ana Sayfaya Dön
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default Login;
