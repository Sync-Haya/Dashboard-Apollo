'use client';

import { Trophy, Medal, Award, User } from 'lucide-react';

interface Atendente {
  nome: string;
  andamento: number;
  finalizado: number;
  total: number;
  tempoMedio: number;
}

interface AtendentesTableProps {
  data: Atendente[];
}

export function AtendentesTable({ data }: AtendentesTableProps) {
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-4 h-4 text-yellow-400" />;
      case 1: return <Medal className="w-4 h-4 text-slate-300" />;
      case 2: return <Award className="w-4 h-4 text-orange-400" />;
      default: return <User className="w-4 h-4 text-muted-foreground/50" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-white/5">
        <h3 className="text-base xl:text-lg font-display font-bold tracking-tight text-white">Produtividade por Atendente</h3>
      </div>
      
      <div className="flex-1 overflow-auto">
        {(!data || data.length === 0) ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">Nenhum dado de atendente</p>
          </div>
        ) : (
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead className="sticky top-0 bg-card/80 backdrop-blur-sm z-10">
              <tr>
                <th className="text-left p-4 text-[10px] text-muted-foreground font-bold uppercase tracking-wider border-b border-border/50">#</th>
                <th className="text-left p-4 text-[10px] text-muted-foreground font-bold uppercase tracking-wider border-b border-border/50">Técnico</th>
                <th className="text-center p-4 text-[10px] text-muted-foreground font-bold uppercase tracking-wider border-b border-border/50">Ativos</th>
                <th className="text-center p-4 text-[10px] text-muted-foreground font-bold uppercase tracking-wider border-b border-border/50">OK</th>
                <th className="text-center p-4 text-[10px] text-muted-foreground font-bold uppercase tracking-wider border-b border-border/50">T. Médio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {data.map((a, i) => (
                <tr key={a.nome} className="hover:bg-primary/5 transition-colors group">
                  <td className="p-4">{getRankIcon(i)}</td>
                  <td className="p-4 font-bold text-foreground">
                    {a.nome?.split(' ').slice(0, 2).join(' ')}
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-mono text-xs font-bold text-orange-400">{a.andamento}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-mono text-xs font-bold text-emerald-400">{a.finalizado}</span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="inline-flex items-center justify-center bg-primary/10 text-primary rounded-lg px-2 py-1 text-xs font-bold font-mono">
                      {a.tempoMedio}m
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
