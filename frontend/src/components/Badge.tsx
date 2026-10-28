import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'cached' | 'fallback' | 'neutral';
  children: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  size = 'sm',
  className = ''
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  const variantClasses = {
    success: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-950/40',
    warning: 'bg-amber-950/60 text-amber-400 border-amber-500/30 shadow-sm shadow-amber-950/40',
    error: 'bg-rose-950/60 text-rose-400 border-rose-500/30 shadow-sm shadow-rose-950/40',
    info: 'bg-sky-950/60 text-sky-400 border-sky-500/30 shadow-sm shadow-sky-950/40',
    cached: 'bg-portkey-950/60 text-portkey-400 border-portkey-500/30 shadow-sm shadow-portkey-950/40 font-medium',
    fallback: 'bg-purple-950/60 text-purple-400 border-purple-500/30 shadow-sm shadow-purple-950/40 font-medium',
    neutral: 'bg-obsidian-850 text-slate-300 border-obsidian-border'
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono font-medium tracking-tight ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};
