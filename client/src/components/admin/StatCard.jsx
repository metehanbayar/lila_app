function StatCard({ icon: Icon, title, value, subtitle, color = 'primary' }) {
  const colorClasses = {
    primary: 'bg-primary text-white shadow-primary/20',
    secondary: 'bg-secondary text-white shadow-secondary/20',
    dark: 'bg-dark text-white shadow-black/15',
    yellow: 'bg-amber-500 text-white shadow-amber-500/20',
    green: 'bg-green-600 text-white shadow-green-600/20',
    blue: 'bg-blue-600 text-white shadow-blue-600/20',
  };

  return (
    <div className="rounded-[28px] border border-white/70 bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-dark-lighter">{title}</p>
          <p className="mt-3 break-words text-3xl font-black text-dark sm:text-4xl">{value}</p>
          {subtitle && <p className="mt-2 text-sm text-dark-lighter">{subtitle}</p>}
        </div>
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] shadow-lg ${colorClasses[color] || colorClasses.primary}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

export default StatCard;
