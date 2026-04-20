import { cn } from '@/lib/utils';

const variants = {
  primary:   'bg-emerald-600 text-white hover:bg-emerald-700 border-transparent',
  secondary: 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200',
  danger:    'bg-red-500 text-white hover:bg-red-600 border-transparent',
  ghost:     'bg-transparent text-gray-500 hover:bg-gray-100 border-transparent',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
};

export function Button({
  children, variant = 'primary', size = 'md',
  className = '', disabled, onClick, type = 'button', ...props
}) {
  return (
    <button
      type={type} disabled={disabled} onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg border',
        'active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant], sizes[size], className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
