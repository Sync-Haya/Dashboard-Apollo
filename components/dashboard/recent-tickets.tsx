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
      <div className="flex-1 overflow-hidden p-4">
        {(!data || data.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Nenhum chamado identificado</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 grid-rows-2 grid-flow-col gap-4 h-full">
            {data.slice(0, 4).map((t, i) => {
              const colorClass = statusColors[t.status] || 'bg-secondary text-muted-foreground';
              const date = new Date(t.criadoEm);
              const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              const duration = getDurationMinutes(t);
              
              return (
                <div key={`${t.id}-${i}`} className="flex flex-col justify-between p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-primary/5 transition-colors group">
                  <div className="flex items-start justify-between mb-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-white/5 text-muted-foreground border border-white/5">
                          #{t.protocolo}
                        </span>
                        <span className={`text-xs font-bold uppercase rounded-md px-2 py-0.5 border ${colorClass} border-current/20`}>
                          {t.status}
                        </span>
                      </div>
                      <span className="text-lg xl:text-xl font-bold line-clamp-2 text-foreground group-hover:text-primary transition-colors leading-tight">
                        {t.cliente || 'Consumidor Final'}
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-end shrink-0">
                       <span className="text-xs font-mono text-muted-foreground font-bold">{time}</span>
                       <span className={`text-sm xl:text-base font-black font-mono mt-1 ${t.status === 'Finalizado' ? 'text-emerald-400/80' : duration > 30 ? 'text-rose-400 animate-pulse' : 'text-blue-400'}`}>
                         {duration} MIN
                       </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${t.status === 'Finalizado' ? 'bg-emerald-500/40' : 'bg-primary/40 animate-pulse'}`} />
                      <span className="text-sm text-muted-foreground font-semibold truncate max-w-[200px]">
                        {t.tecnico && t.tecnico !== 'N/A' ? t.tecnico : 'Aguardando Técnico'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-tighter">Apollo Suporte</span>
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
