function StatCard({ icon: Icon, title, value, subtitle, color = 'primary' }) {
  const colorClasses = {
    primary: 'bg-primary bg-opacity-10 text-primary',
    secondary: 'bg-secondary bg-opacity-10 text-secondary',
    dark: 'bg-dark bg-opacity-10 text-dark',
    yellow: 'bg-yellow-500 bg-opacity-10 text-yellow-600',
    green: 'bg-green-500 bg-opacity-10 text-green-600',
    blue: 'bg-blue-500 bg-opacity-10 text-blue-600',
  };

  return (
    <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-lg sm:rounded-xl shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">{title}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 break-all">{value}</p>
          {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2 truncate">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[color]}`}>
          <Icon size={20} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
        </div>
      </div>
    </div>
  );
}

export default StatCard;

