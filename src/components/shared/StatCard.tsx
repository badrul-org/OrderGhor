import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export default function StatCard({ title, value, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <div className="surface-card rounded-xl p-5 card-hover">
      <div className={`w-7 h-7 rounded-lg ${bgColor} flex items-center justify-center mb-1.5 ring-1 ring-black/5`}>
        <Icon size={15} className={color} />
      </div>
      <p className="text-[10px] text-slate-500 font-medium leading-tight">{title}</p>
      <p className="text-base font-bold text-slate-900 tabular-nums mt-0.5 leading-tight tracking-tight">{value}</p>
    </div>
  );
}
