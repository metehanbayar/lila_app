import { createContext, forwardRef, useContext, useId, useMemo } from 'react';

export function cn(...parts) {
  return parts.filter(Boolean).join(' ');
}

const widthMap = {
  narrow: 'max-w-3xl',
  content: 'max-w-5xl',
  wide: 'max-w-7xl',
  full: 'max-w-[1440px]',
};

const surfaceToneMap = {
  default: 'gm-panel',
  muted: 'gm-panel-muted',
  hero: 'gm-panel-hero',
};

const buttonVariantMap = {
  primary: 'gm-button gm-button-primary',
  secondary: 'gm-button gm-button-secondary',
  ghost: 'gm-button gm-button-ghost',
  danger: 'gm-button gm-button-danger',
};

const FieldContext = createContext(null);

function useFieldProps(props = {}) {
  const context = useContext(FieldContext);
  const describedBy = [props['aria-describedby'], context?.describedBy].filter(Boolean).join(' ') || undefined;

  return {
    id: props.id || context?.inputId,
    'aria-describedby': describedBy,
    'aria-invalid': props['aria-invalid'] ?? (context?.invalid || undefined),
  };
}

export function PageShell({ children, width = 'wide', className = '' }) {
  return <div className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', widthMap[width] || widthMap.wide, className)}>{children}</div>;
}

export function SurfaceCard({
  as: Component = 'section',
  children,
  tone = 'default',
  className = '',
  ...props
}) {
  return (
    <Component className={cn(surfaceToneMap[tone] || surfaceToneMap.default, className)} {...props}>
      {children}
    </Component>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  align = 'left',
  className = '',
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'items-center text-center sm:flex-col sm:items-center',
        className,
      )}
    >
      <div className={cn('space-y-3', align === 'center' && 'max-w-2xl')}>
        {eyebrow && <span className="gm-eyebrow">{eyebrow}</span>}
        {title && <h2 className="gm-display text-[clamp(1.8rem,5vw,3.5rem)] leading-none">{title}</h2>}
        {description && <p className="max-w-2xl text-sm leading-6 text-dark-lighter sm:text-base">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button className={cn(buttonVariantMap[variant] || buttonVariantMap.primary, className)} {...props}>
      {children}
    </button>
  );
}

export function PrimaryButton(props) {
  return <Button variant="primary" {...props} />;
}

export function SecondaryButton(props) {
  return <Button variant="secondary" {...props} />;
}

export function GhostButton(props) {
  return <Button variant="ghost" {...props} />;
}

export function DangerButton(props) {
  return <Button variant="danger" {...props} />;
}

export function Field({ label, hint, error, className = '', children, id, inputId }) {
  const generatedId = useId().replace(/:/g, '');
  const fieldId = id || `gm-field-${generatedId}`;
  const resolvedInputId = inputId || `${fieldId}-control`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = error ? errorId : hint ? hintId : undefined;
  const contextValue = useMemo(
    () => ({
      describedBy,
      inputId: resolvedInputId,
      invalid: Boolean(error),
    }),
    [describedBy, error, resolvedInputId],
  );

  return (
    <FieldContext.Provider value={contextValue}>
      <div className={cn('gm-field', className)}>
        {label && (
          <label htmlFor={resolvedInputId} className="gm-field-label">
            {label}
          </label>
        )}
        {children}
        {error ? (
          <p id={errorId} role="alert" className="gm-field-error">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="gm-field-hint">
            {hint}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}

export const TextInput = forwardRef(function TextInput({ className = '', ...props }, ref) {
  const { id, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid, ...restProps } = props;
  const fieldProps = useFieldProps({
    id,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
  });

  return <input ref={ref} className={cn('gm-input', className)} {...restProps} {...fieldProps} />;
});

export const SelectField = forwardRef(function SelectField({ className = '', children, ...props }, ref) {
  const { id, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid, ...restProps } = props;
  const fieldProps = useFieldProps({
    id,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
  });

  return (
    <select ref={ref} className={cn('gm-select', className)} {...restProps} {...fieldProps}>
      {children}
    </select>
  );
});

export const TextAreaField = forwardRef(function TextAreaField({ className = '', ...props }, ref) {
  const { id, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid, ...restProps } = props;
  const fieldProps = useFieldProps({
    id,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
  });

  return <textarea ref={ref} className={cn('gm-textarea', className)} {...restProps} {...fieldProps} />;
});

export function Chip({ active = false, className = '', children, ...props }) {
  return (
    <button
      className={cn(
        'gm-chip transition-all duration-200',
        active && 'animate-chip-settle border-primary/30 bg-primary text-white shadow-lg shadow-primary/20',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({ tone = 'primary', className = '', children }) {
  const toneClass =
    tone === 'success'
      ? 'gm-badge-success'
      : tone === 'warning'
        ? 'gm-badge-warning'
        : tone === 'danger'
          ? 'gm-badge-danger'
          : 'gm-badge-primary';

  return <span className={cn('gm-badge', toneClass, className)}>{children}</span>;
}

export function StickyActionBar({ className = '', children }) {
  return (
    <div className={cn('gm-sticky-bar rounded-[24px] p-3 sm:p-4', className)}>
      {children}
    </div>
  );
}
