function DataTable({ columns, data, onEdit, onDelete, actions, emptyMessage = 'Veri bulunamadı', emptyIcon: EmptyIcon }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg sm:rounded-xl shadow-card p-6 sm:p-8 text-center">
        {EmptyIcon && (
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <EmptyIcon className="w-8 h-8 text-gray-400" />
          </div>
        )}
        <p className="text-gray-500 text-sm sm:text-base">{emptyMessage}</p>
      </div>
    );
  }

  // actions prop varsa onu kullan, yoksa eski onEdit/onDelete'i kullan
  const hasActions = actions && actions.length > 0;
  const hasOldActions = onEdit || onDelete;

  return (
    <>
      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {data.map((row, rowIndex) => (
          <div key={rowIndex} className="bg-white rounded-lg shadow-card p-4">
            <div className="space-y-2">
              {columns.map((column, colIndex) => (
                <div key={colIndex} className="flex justify-between items-start gap-3">
                  <span className="text-xs font-medium text-gray-500 uppercase min-w-[80px]">
                    {column.header || column.label}
                  </span>
                  <span className="text-sm text-gray-900 text-right flex-1">
                    {column.render ? column.render(row) : row[column.field || column.key]}
                  </span>
                </div>
              ))}
            </div>
            {/* Yeni actions formatı */}
            {hasActions && (
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
                {actions.map((action, actionIndex) => {
                  // Switch/toggle butonu kontrolü
                  if (action.type === 'switch') {
                    const isActive = action.getValue ? action.getValue(row) : row[action.field];
                    return (
                      <div key={actionIndex} className="flex items-center justify-center">
                        <button
                          onClick={() => action.onClick(row)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            isActive 
                              ? 'bg-green-600 focus:ring-green-500' 
                              : 'bg-gray-200 focus:ring-gray-500'
                          }`}
                          title={isActive ? 'Pasif Et' : 'Aktif Et'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  }
                  
                  // Normal butonlar
                  const label = typeof action.label === 'function' ? action.label(row) : action.label;
                  const Icon = typeof action.icon === 'function' ? action.icon(row) : action.icon;
                  const variant = typeof action.variant === 'function' ? action.variant(row) : action.variant;
                  
                  const variantClasses = {
                    primary: 'bg-primary text-white hover:bg-primary-dark',
                    danger: 'bg-red-600 text-white hover:bg-red-700',
                    info: 'bg-blue-600 text-white hover:bg-blue-700',
                    success: 'bg-green-600 text-white hover:bg-green-700',
                  };
                  return (
                    <button
                      key={actionIndex}
                      onClick={() => action.onClick(row)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${variantClasses[variant] || variantClasses.primary}`}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
            {/* Eski format (backward compatibility) */}
            {!hasActions && hasOldActions && (
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
                {onEdit && (
                  <button
                    onClick={() => onEdit(row)}
                    className="flex-1 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium active:bg-primary-dark transition-colors"
                  >
                    Düzenle
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(row)}
                    className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium active:bg-red-700 transition-colors"
                  >
                    Sil
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.header || column.label}
                  </th>
                ))}
                {(hasActions || hasOldActions) && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 text-sm text-gray-900" style={{ whiteSpace: column.wrap ? 'normal' : 'nowrap' }}>
                      {column.render ? column.render(row) : row[column.field || column.key]}
                    </td>
                  ))}
                  {/* Yeni actions formatı */}
                  {hasActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {actions.map((action, actionIndex) => {
                          // Switch/toggle butonu kontrolü
                          if (action.type === 'switch') {
                            const isActive = action.getValue ? action.getValue(row) : row[action.field];
                            return (
                              <button
                                key={actionIndex}
                                onClick={() => action.onClick(row)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                  isActive 
                                    ? 'bg-green-600 focus:ring-green-500' 
                                    : 'bg-gray-200 focus:ring-gray-500'
                                }`}
                                title={isActive ? 'Pasif Et' : 'Aktif Et'}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    isActive ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            );
                          }
                          
                          // Normal butonlar
                          const label = typeof action.label === 'function' ? action.label(row) : action.label;
                          const Icon = typeof action.icon === 'function' ? action.icon(row) : action.icon;
                          const variant = typeof action.variant === 'function' ? action.variant(row) : action.variant;
                          
                          const variantClasses = {
                            primary: 'text-primary hover:text-primary-dark',
                            danger: 'text-red-600 hover:text-red-800',
                            info: 'text-blue-600 hover:text-blue-800',
                            success: 'text-green-600 hover:text-green-800',
                          };
                          return (
                            <button
                              key={actionIndex}
                              onClick={() => action.onClick(row)}
                              className={`inline-flex items-center gap-1 font-medium transition-colors ${variantClasses[variant] || variantClasses.primary}`}
                              title={label}
                            >
                              {Icon && <Icon className="w-4 h-4" />}
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                  {/* Eski format (backward compatibility) */}
                  {!hasActions && hasOldActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="text-primary hover:text-primary-dark"
                          >
                            Düzenle
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Sil
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default DataTable;

