'use client';

import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  subtitle?: string;
}

export function KpiCard({ title, value, icon: Icon, color, bgColor, subtitle }: KpiCardProps) {
  return (
    <div className="bg-card/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 hover:bg-white/5 transition-all group relative overflow-hidden">
      {/* Glow Effect */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 blur-3xl ${bgColor}`} />
      
      <div className="flex items-center gap-4 relative z-10">
        <div className={`flex-shrink-0 w-14 h-14 rounded-2xl ${bgColor} border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className={`w-7 h-7 ${color} drop-shadow-md`} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/80 mb-0.5">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-display font-black tabular-nums tracking-tighter ${color}`}>
              {value}
            </span>
          </div>
          {subtitle && (
            <p className="text-[10px] font-medium text-muted-foreground/60 truncate italic">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
