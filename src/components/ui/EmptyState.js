export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-[14px] font-semibold text-gray-600 mb-1">{title}</div>
      {description && <div className="text-[12px] text-gray-400 mb-4 max-w-xs">{description}</div>}
      {action}
    </div>
  );
}
