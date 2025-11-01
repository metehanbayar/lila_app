import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, User, Phone, AlertCircle, Loader2, ArrowLeft, ArrowRight, Shield, Sparkles } from 'lucide-react';
import useCustomerStore from '../../store/customerStore';
import { customerRegister } from '../../services/customerApi';
import { sendOTP, verifyOTP } from '../../services/otpApi';
import AppLayout from '../../components/AppLayout';
import ScrollToTop from '../../components/ScrollToTop';
import OTPInput from '../../components/OTPInput';
import { safeSetTimeout, safeClearTimeout } from '../../utils/performance';

function Register() {
  const navigate = useNavigate();
  const { login } = useCustomerStore();
  const [step, setStep] = useState('info'); // 'info' veya 'otp'
  const [formData, setFormData] = useState({
    phone: '',
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    referralCode: '',
  });
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState('');

  // Geri sayım timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = safeSetTimeout(() => setCountdown(countdown - 1), 1000);
      return () => safeClearTimeout(timer);
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

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('Ad ve Soyad zorunludur');
      return;
    }

    setLoading(true);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`;
      const response = await sendOTP(cleanPhone, 'register', fullName);
      
      if (response.success) {
        setStep('otp');
        setCountdown(60);
        
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
        const fullName = `${formData.firstName} ${formData.lastName}`;
        const registerData = {
          phone: cleanPhone,
          fullName: fullName,
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
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl shadow-primary/10 p-4 sm:p-5 border-2 border-white/40 relative overflow-hidden animate-scaleIn">
            {/* Glow Effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            
            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-3 sm:mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary via-purple-600 to-pink-500 mb-2 shadow-lg shadow-primary/20">
                  <Sparkles className="text-white" size={20} />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5">Kayıt Ol</h1>
                <p className="text-xs text-gray-600">
                  {step === 'info' ? 'Bilgilerinizi girin' : 'Doğrulama kodunu girin'}
                </p>
              </div>

              {/* Progress Indicator */}
              <div className="mb-4 flex items-center justify-center gap-2">
                <div className={`h-1.5 w-10 sm:w-12 rounded-full transition-all ${step === 'info' ? 'bg-primary' : 'bg-gray-300'}`} />
                <div className={`h-1.5 w-10 sm:w-12 rounded-full transition-all ${step === 'otp' ? 'bg-primary' : 'bg-gray-300'}`} />
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-3 bg-red-50/80 border border-red-200 text-red-700 px-3 py-2 rounded-lg flex items-center gap-2 animate-slideDown">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span className="text-xs">{error}</span>
                </div>
              )}

              {/* Dev Mode OTP Display */}
              {devOtp && (
                <div className="mb-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 text-yellow-800 px-3 py-2 rounded-lg animate-slideDown">
                  <p className="text-xs font-semibold">🔧 Geliştirme Modu</p>
                  <p className="text-xs mt-0.5">OTP: <span className="font-bold bg-white px-1.5 py-0.5 rounded">{devOtp}</span></p>
                </div>
              )}

            {step === 'info' ? (
              <form onSubmit={handleSendOTP} className="space-y-3">
                {/* Name Grid - Ad ve Soyad yan yana */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="group">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Ad *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none group-focus-within:text-primary">
                        <User className="text-gray-400 group-focus-within:text-primary" size={14} />
                      </div>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="block w-full pl-8 pr-2 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        placeholder="Ad"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Soyad *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none group-focus-within:text-primary">
                        <User className="text-gray-400 group-focus-within:text-primary" size={14} />
                      </div>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="block w-full pl-8 pr-2 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        placeholder="Soyad"
                      />
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Telefon *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none group-focus-within:text-primary">
                      <Phone className="text-gray-400 group-focus-within:text-primary" size={14} />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="block w-full pl-8 pr-2 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="05XX XXX XX XX"
                      maxLength={11}
                    />
                  </div>
                </div>

                {/* Optional Fields Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Email */}
                  <div className="group">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      E-posta
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none group-focus-within:text-primary">
                        <Mail className="text-gray-400 group-focus-within:text-primary" size={14} />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="block w-full pl-8 pr-2 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        placeholder="email@ex.com"
                      />
                    </div>
                  </div>

                  {/* Referral Code */}
                  <div className="group">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Davet Kodu
                    </label>
                    <input
                      type="text"
                      name="referralCode"
                      value={formData.referralCode}
                      onChange={handleChange}
                      placeholder="REF000001"
                      className="block w-full px-2 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Date and Gender Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Date of Birth */}
                  <div className="group">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Doğum Tarihi
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="block w-full px-2 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>

                  {/* Gender */}
                  <div className="group">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Cinsiyet
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="block w-full px-2 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none"
                    >
                      <option value="">Seçiniz</option>
                      <option value="Male">Erkek</option>
                      <option value="Female">Kadın</option>
                      <option value="Other">Diğer</option>
                    </select>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary via-purple-600 to-pink-500 hover:from-primary-dark hover:via-purple-700 hover:to-pink-600 active:scale-[0.98] text-white font-bold py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs mt-4 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gönderiliyor...</span>
                    </>
                  ) : (
                    <>
                      <span>Kod Gönder</span>
                      <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                {/* OTP Header */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                    <Shield className="text-primary" size={20} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">Doğrulama Kodu</h3>
                  <p className="text-xs text-gray-600 mb-2">
                    {formData.phone} numarasına gönderilen 6 haneli kodu girin
                  </p>
                </div>

                {/* OTP Input */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <OTPInput 
                    length={6} 
                    onComplete={handleVerifyAndRegister}
                    disabled={loading}
                  />
                </div>

                {/* Loading State */}
                {loading && (
                  <div className="flex flex-col items-center justify-center gap-2 text-primary">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs font-medium">Kayıt oluşturuluyor...</span>
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
                  onClick={() => setStep('info')}
                  className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 font-medium py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-200 text-xs"
                >
                  <ArrowLeft size={14} />
                  Bilgileri düzenle
                </button>
              </div>
            )}

              {/* Login Link */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-gray-600">
                    Zaten hesabınız var mı?
                  </div>
                  <Link 
                    to="/login" 
                    className="text-primary hover:text-primary-dark font-bold flex items-center gap-1 group"
                  >
                    Giriş Yap
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

export default Register;
