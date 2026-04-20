import { cn } from '@/lib/utils';

export function Input({ className = '', ...props }) {
  return (
    <input
      className={cn(
        'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg',
        'bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white',
        'transition placeholder:text-gray-400 disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={cn(
        'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg',
        'bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white',
        'transition cursor-pointer disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={cn(
        'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg',
        'bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white',
        'transition placeholder:text-gray-400 resize-vertical',
        className
      )}
      {...props}
    />
  );
}

export function Label({ children, className = '' }) {
  return (
    <label className={cn('block text-xs font-medium text-gray-500 mb-1.5', className)}>
      {children}
    </label>
  );
}

export function FormField({ label, children, error }) {
  return (
    <div className="mb-4">
      {label && <Label>{label}</Label>}
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
