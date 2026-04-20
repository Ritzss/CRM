import { initials } from '@/lib/utils';

const sizes = { sm: 'w-7 h-7 text-[10px]', md: 'w-9 h-9 text-[12px]', lg: 'w-12 h-12 text-[14px]' };

export function Avatar({ name, size = 'md', className = '' }) {
  return (
    <div className={`rounded-full bg-emerald-50 text-emerald-700 font-semibold flex items-center justify-center shrink-0 ${sizes[size]} ${className}`}>
      {initials(name)}
    </div>
  );
}
