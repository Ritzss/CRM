export function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-start gap-4">
      {icon && (
        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-xl shrink-0">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</div>
        <div className="text-2xl font-bold tracking-tight truncate" style={{ color: color || '#111' }}>{value}</div>
        {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}
