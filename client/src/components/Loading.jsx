function Loading({ size = 'md', text = 'Yükleniyor...', variant = 'primary' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const variantClasses = {
    primary: 'border-primary',
    white: 'border-white',
    gray: 'border-gray-600',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      {/* Spinner */}
      <div className={`${sizeClasses[size]} relative mb-4`}>
        <div className={`w-full h-full border-4 ${variantClasses[variant]} border-t-transparent rounded-full animate-spin`}></div>
        <div className={`absolute inset-0 border-4 ${variantClasses[variant]} border-r-transparent rounded-full animate-spin-reverse opacity-50`}></div>
      </div>
      
      {/* Text */}
      <p className={`text-gray-600 font-medium ${textSizeClasses[size]} animate-pulse`}>
        {text}
      </p>
      
      {/* Loading dots */}
      <div className="flex gap-1.5 mt-3">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
      </div>
    </div>
  );
}

export default Loading;
