import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: string;
    positive?: boolean;
    neutral?: boolean;
  };
  icon?: LucideIcon;
  badge?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  trend,
  icon: Icon,
  badge,
  className = ''
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-obsidian-border bg-obsidian-card p-5 shadow-lg shadow-black/20 transition-all duration-200 hover:border-obsidian-border-hover hover:bg-obsidian-card-hover group ${className}`}
    >
      <div className="flex items-center justify-between text-slate-400">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">{label}</span>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-obsidian-850 text-slate-300 border border-obsidian-border group-hover:text-portkey-400 group-hover:border-portkey-500/30 transition-colors">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-white mono-nums">{value}</span>
        {badge && (
          <span className="rounded bg-obsidian-850 border border-obsidian-border px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
            {badge}
          </span>
        )}
      </div>

      {(subtext || trend) && (
        <div className="mt-2.5 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={`font-medium ${
                trend.neutral
                  ? 'text-slate-400'
                  : trend.positive
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {trend.value}
            </span>
          )}
          {subtext && <span className="text-slate-400">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
