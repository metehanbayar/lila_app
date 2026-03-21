function DataTable({ columns, data, onEdit, onDelete, actions, emptyMessage = 'Veri bulunamadi', emptyIcon: EmptyIcon }) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-[28px] border border-surface-border bg-white p-8 text-center shadow-card">
        {EmptyIcon && (
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[24px] bg-surface-muted">
            <EmptyIcon className="h-8 w-8 text-primary" />
          </div>
        )}
        <p className="text-sm text-dark-lighter sm:text-base">{emptyMessage}</p>
      </div>
    );
  }

  const hasActions = actions && actions.length > 0;
  const hasOldActions = onEdit || onDelete;

  return (
    <>
      <div className="grid gap-3 lg:hidden">
        {data.map((row, rowIndex) => (
          <div key={rowIndex} className="rounded-[24px] border border-white/70 bg-white p-4 shadow-card">
            <div className="space-y-3">
              {columns.map((column, colIndex) => (
                <div key={colIndex} className="flex justify-between gap-4 border-b border-surface-border pb-3 last:border-b-0 last:pb-0">
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-dark-lighter">{column.header || column.label}</span>
                  <span className="min-w-0 flex-1 text-right text-sm font-medium text-dark">
                    {column.render ? column.render(row) : row[column.field || column.key]}
                  </span>
                </div>
              ))}
            </div>

            {hasActions && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-surface-border pt-4">
                {actions.map((action, actionIndex) => {
                  if (action.type === 'switch') {
                    const isActive = action.getValue ? action.getValue(row) : row[action.field];
                    return (
                      <button
                        key={actionIndex}
                        onClick={() => action.onClick(row)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          isActive ? 'bg-secondary' : 'bg-surface-border'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    );
                  }

                  const label = typeof action.label === 'function' ? action.label(row) : action.label;
                  const Icon = typeof action.icon === 'function' ? action.icon(row) : action.icon;
                  const variant = typeof action.variant === 'function' ? action.variant(row) : action.variant;
                  const variantClasses = {
                    primary: 'bg-primary text-white',
                    danger: 'bg-red-600 text-white',
                    info: 'bg-blue-600 text-white',
                    success: 'bg-secondary text-white',
                  };

                  return (
                    <button
                      key={actionIndex}
                      onClick={() => action.onClick(row)}
                      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold ${variantClasses[variant] || variantClasses.primary}`}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {!hasActions && hasOldActions && (
              <div className="mt-4 flex gap-2 border-t border-surface-border pt-4">
                {onEdit && (
                  <button onClick={() => onEdit(row)} className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white">
                    Duzenle
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(row)} className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white">
                    Sil
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-card lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-surface-border bg-surface-muted">
              <tr>
                {columns.map((column, index) => (
                  <th key={index} className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-dark-lighter">
                    {column.header || column.label}
                  </th>
                ))}
                {(hasActions || hasOldActions) && <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-[0.18em] text-dark-lighter">Islemler</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border bg-white">
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} className="transition-colors hover:bg-surface-muted/60">
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 text-sm text-dark" style={{ whiteSpace: column.wrap ? 'normal' : 'nowrap' }}>
                      {column.render ? column.render(row) : row[column.field || column.key]}
                    </td>
                  ))}

                  {hasActions && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {actions.map((action, actionIndex) => {
                          if (action.type === 'switch') {
                            const isActive = action.getValue ? action.getValue(row) : row[action.field];
                            return (
                              <button
                                key={actionIndex}
                                onClick={() => action.onClick(row)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  isActive ? 'bg-secondary' : 'bg-surface-border'
                                }`}
                              >
                                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                              </button>
                            );
                          }

                          const label = typeof action.label === 'function' ? action.label(row) : action.label;
                          const Icon = typeof action.icon === 'function' ? action.icon(row) : action.icon;
                          const variant = typeof action.variant === 'function' ? action.variant(row) : action.variant;
                          const variantClasses = {
                            primary: 'text-primary hover:text-primary-dark',
                            danger: 'text-red-600 hover:text-red-700',
                            info: 'text-blue-600 hover:text-blue-700',
                            success: 'text-secondary hover:text-secondary-dark',
                          };

                          return (
                            <button key={actionIndex} onClick={() => action.onClick(row)} className={`inline-flex items-center gap-2 text-sm font-bold ${variantClasses[variant] || variantClasses.primary}`}>
                              {Icon && <Icon className="h-4 w-4" />}
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  )}

                  {!hasActions && hasOldActions && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {onEdit && (
                          <button onClick={() => onEdit(row)} className="text-sm font-bold text-primary hover:text-primary-dark">
                            Duzenle
                          </button>
                        )}
                        {onDelete && (
                          <button onClick={() => onDelete(row)} className="text-sm font-bold text-red-600 hover:text-red-700">
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
