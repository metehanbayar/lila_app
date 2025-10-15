import { useState, useRef, useEffect } from 'react';

/**
 * OTP Input Component
 * @param {Object} props
 * @param {number} props.length - OTP kod uzunluğu (varsayılan: 6)
 * @param {Function} props.onComplete - Kod tamamlandığında çağrılacak fonksiyon
 * @param {boolean} props.disabled - Input'ları devre dışı bırak
 */
function OTPInput({ length = 6, onComplete, disabled = false }) {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const inputRefs = useRef([]);

  useEffect(() => {
    // İlk input'a focus yap
    if (inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  const handleChange = (index, value) => {
    // Sadece rakam kabul et
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Otomatik ilerleme
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Tamamlandığında callback çağır
    if (newOtp.every(digit => digit !== '')) {
      onComplete(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Boşsa önceki input'a git
        inputRefs.current[index - 1]?.focus();
      } else {
        // Mevcut değeri sil
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, i) => {
      if (i < length) newOtp[i] = char;
    });
    setOtp(newOtp);

    // Son dolu input'a focus yap veya tamamsa callback çağır
    const lastFilledIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[lastFilledIndex]?.focus();

    if (newOtp.every(digit => digit !== '')) {
      onComplete(newOtp.join(''));
    }
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-center">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={el => inputRefs.current[index] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(index, e.target.value)}
          onKeyDown={e => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          autoComplete="off"
        />
      ))}
    </div>
  );
}

export default OTPInput;

