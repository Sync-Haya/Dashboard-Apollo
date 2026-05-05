import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface RecentTicket {
  id: string;
  protocolo: number | string;
  status: string;
  criadoEm: string;
  finalizadoEm?: string | null;
  sistema: string;
  tecnico?: string;
  cliente?: string;
}

interface RecentTicketsProps {
  data: RecentTicket[];
  title: string;
}

const statusColors: Record<string, string> = {
  'Aberto': 'bg-yellow-500/15 text-yellow-400',
  'Atendendo': 'bg-orange-500/15 text-orange-400',
  'Fechado': 'bg-emerald-500/15 text-emerald-400',
  'Andamento': 'bg-orange-500/15 text-orange-400',
  'Finalizado': 'bg-emerald-500/15 text-emerald-400',
};

export function RecentTickets({ data, title }: RecentTicketsProps) {
  const [now, setNow] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const getDurationMinutes = (t: RecentTicket) => {
    if (!now) return 0;
    const start = new Date(t.criadoEm).getTime();
    if (t.status === 'Finalizado' && t.finalizadoEm) {
      const end = new Date(t.finalizadoEm).getTime();
      return Math.max(0, Math.floor((end - start) / 60000));
    }
    return Math.max(0, Math.floor((now.getTime() - start) / 60000));
  };

  // Prevenir erro de hidratação (SSR vs Client)
  if (!mounted) {
    return (
      <div className="flex flex-col h-full bg-card/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden min-h-[300px]">
        <div className="p-4 border-b border-white/5 bg-white/5">
          <h3 className="text-base xl:text-lg font-display font-bold tracking-tight text-white">{title}</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <h3 className="text-base xl:text-lg font-display font-bold tracking-tight text-white">{title}</h3>
        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest italic">Tempo decorrido atualizado a cada 1m</span>
      </div>
      <div className="flex-1 overflow-auto max-h-[600px] scrollbar-hide">
        {(!data || data.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">Nenhum chamado identificado</p>
          </div>
        ) : (
          <div className="divide-y divide-border/10">
            {data.map((t, i) => {
              const colorClass = statusColors[t.status] || 'bg-secondary text-muted-foreground';
              const date = new Date(t.criadoEm);
              const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              const duration = getDurationMinutes(t);
              
              return (
                <div key={`${t.id}-${i}`} className="p-4 hover:bg-primary/5 transition-colors group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-white/5 text-muted-foreground border border-white/5">
                        #{t.protocolo}
                      </span>
                      <span className={`text-[10px] font-bold uppercase rounded-md px-2 py-0.5 border ${colorClass} border-current/20`}>
                        {t.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                         <span className="text-[10px] font-mono text-muted-foreground font-bold">{time}</span>
                         <span className={`text-xs font-black font-mono ${t.status === 'Finalizado' ? 'text-emerald-400/80' : duration > 30 ? 'text-rose-400 animate-pulse' : 'text-blue-400'}`}>
                           {duration} MIN
                         </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-base font-bold truncate text-foreground group-hover:text-primary transition-colors">
                      {t.cliente || 'Consumidor Final'}
                    </span>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${t.status === 'Finalizado' ? 'bg-emerald-500/40' : 'bg-primary/40 animate-pulse'}`} />
                        <span className="text-xs text-muted-foreground font-semibold truncate">
                          {t.tecnico && t.tecnico !== 'N/A' ? t.tecnico : 'Aguardando Técnico'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-tighter">Apollo Suporte</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
