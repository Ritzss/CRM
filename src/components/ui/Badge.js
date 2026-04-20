export function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    lead:     'bg-blue-50 text-blue-700',
    customer: 'bg-emerald-50 text-emerald-700',
    cold:     'bg-gray-100 text-gray-500',
  };
  const labels = { lead: 'Lead', customer: 'Customer', cold: 'Cold' };
  return <Badge className={map[status] || map.cold}>{labels[status] || status}</Badge>;
}

export function RoleBadge({ role }) {
  return role === 'admin'
    ? <Badge className="bg-violet-50 text-violet-700">Admin</Badge>
    : <Badge className="bg-sky-50 text-sky-700">Employee</Badge>;
}

export function StageBadge({ stage }) {
  const map = {
    prospect:    'bg-gray-100 text-gray-600',
    proposal:    'bg-blue-50 text-blue-700',
    negotiation: 'bg-amber-50 text-amber-700',
    closed_won:  'bg-emerald-50 text-emerald-700',
    closed_lost: 'bg-red-50 text-red-600',
  };
  const labels = {
    prospect: 'Prospect', proposal: 'Proposal', negotiation: 'Negotiation',
    closed_won: 'Won', closed_lost: 'Lost',
  };
  return <Badge className={map[stage] || map.prospect}>{labels[stage] || stage}</Badge>;
}
