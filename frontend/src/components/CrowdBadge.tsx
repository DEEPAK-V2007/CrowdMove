const colors: Record<string, { bg: string; text: string; label: string }> = {
  green:  { bg: 'bg-green-100', text: 'text-green-800', label: 'Low' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Moderate' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'High' },
  red:    { bg: 'bg-red-100', text: 'text-red-800', label: 'Full' },
};

export default function CrowdBadge({ status }: { status: string }) {
  const c = colors[status] || colors.green;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-2 h-2 rounded-full ${status === 'green' ? 'bg-green-500' : status === 'yellow' ? 'bg-yellow-500' : status === 'orange' ? 'bg-orange-500' : 'bg-red-500'}`} />
      {c.label}
    </span>
  );
}
