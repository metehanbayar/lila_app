import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, User, Phone, MapPin, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import useCustomerStore from '../../store/customerStore';
import { customerRegister } from '../../services/customerApi';
import { sendOTP, verifyOTP } from '../../services/otpApi';
import AppLayout from '../../components/AppLayout';
import OTPInput from '../../components/OTPInput';

function Register() {
  const navigate = useNavigate();
  const { login } = useCustomerStore();
  const [step, setStep] = useState('info'); // 'info' veya 'otp'
  const [formData, setFormData] = useState({
    phone: '',
    fullName: '',
    email: '',
    address: '',
  });
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState('');

  // Geri sayım timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
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

    // Telefon numarası validasyonu
    const cleanPhone = formData.phone.replace(/\s/g, '');
    const phoneRegex = /^(05|5)[0-9]{9}$/;
    
    if (!phoneRegex.test(cleanPhone)) {
      setError('Geçerli bir telefon numarası girin (05xxxxxxxxx)');
      return;
    }

    if (!formData.fullName.trim()) {
      setError('Ad Soyad zorunludur');
      return;
    }

    setLoading(true);

    try {
      const response = await sendOTP(cleanPhone, 'register');
      
      if (response.success) {
        setStep('otp');
        setCountdown(60);
        
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

  const handleVerifyAndRegister = async (code) => {
    setOtpCode(code);
    setError(null);
    setLoading(true);

    try {
      const cleanPhone = formData.phone.replace(/\s/g, '');
      
      // Önce OTP'yi doğrula
      const verifyResponse = await verifyOTP(cleanPhone, code, 'register');
      
      if (verifyResponse.success) {
        // Sonra kayıt yap
        const registerData = {
          phone: cleanPhone,
          fullName: formData.fullName,
          email: formData.email || undefined,
          address: formData.address || undefined,
          otp: code,
        };
        
        const registerResponse = await customerRegister(registerData);
        
        if (registerResponse.success) {
          login(registerResponse.data.customer, registerResponse.data.token);
          navigate('/profile');
        }
      }
    } catch (err) {
      console.error('Kayıt hatası:', err);
      setError(err.response?.data?.message || 'Kayıt olurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    setStep('info');
    setError(null);
    setDevOtp('');
    setOtpCode('');
  };

  return (
    <AppLayout showBottomNav={false}>
      <div className="flex items-center justify-center px-4 py-8 min-h-[calc(100vh-64px)]">
        <div className="max-w-md w-full">
          {/* Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-card p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Kayıt Ol</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                {step === 'info' ? 'Bilgilerinizi girin' : 'Doğrulama kodunu girin'}
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

            {step === 'info' ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Ad Soyad *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="text-gray-400" size={18} />
                    </div>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="block w-full pl-10 pr-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Adınız Soyadınız"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Telefon Numarası *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="text-gray-400" size={18} />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="block w-full pl-10 pr-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="05XX XXX XX XX"
                      maxLength={11}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    E-posta (İsteğe Bağlı)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="text-gray-400" size={18} />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="ornek@email.com"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Adres (İsteğe Bağlı)
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <MapPin className="text-gray-400" size={18} />
                    </div>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={2}
                      className="block w-full pl-10 pr-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                      placeholder="Adresiniz"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark active:bg-primary-dark text-white font-semibold py-3 sm:py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-sm mt-6 flex items-center justify-center gap-2"
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
                    {formData.phone} numarasına gönderilen 6 haneli kodu girin
                  </label>
                  <OTPInput 
                    length={6} 
                    onComplete={handleVerifyAndRegister}
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
                  onClick={() => setStep('info')}
                  className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 text-sm"
                >
                  <ArrowLeft size={16} />
                  Bilgileri düzenle
                </button>
              </div>
            )}

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Zaten hesabınız var mı?{' '}
                <Link to="/login" className="text-primary hover:text-primary-dark font-medium">
                  Giriş Yap
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

export default Register;
