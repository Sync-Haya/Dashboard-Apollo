'use client';

import { Clock, User } from 'lucide-react';

interface Attendant {
  nome: string;
  tempoMedio: number;
}

interface AttendantAveragesProps {
  data: Attendant[];
}

export function AttendantAverages({ data }: AttendantAveragesProps) {
  // Pegar os top 5 atendentes por tempo médio (ou apenas os primeiros da lista)
  const sortedData = [...data].sort((a, b) => a.tempoMedio - b.tempoMedio).filter(a => a.tempoMedio > 0);

  return (
    <div className="bg-card/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 h-full">
      <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
        <Clock className="w-5 h-5 text-blue-400" />
        <h3 className="text-base font-display font-bold text-white uppercase tracking-wider">Tempo Médio por Atendente</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {sortedData.length === 0 ? (
          <p className="text-xs text-muted-foreground italic col-span-full text-center py-4">Sem dados de finalização hoje</p>
        ) : (
          sortedData.map((a) => (
            <div key={a.nome} className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                <User className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground truncate w-full mb-1">
                {a.nome.split(' ')[0]}
              </p>
              <p className="text-xl font-black font-mono text-white leading-none">
                {a.tempoMedio}<span className="text-[10px] text-blue-400 ml-0.5">M</span>
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
