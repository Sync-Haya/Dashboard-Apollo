'use client';

import { useState, useEffect, useCallback } from 'react';
import { KpiCard } from './kpi-card';
import { TimelineChart } from './timeline-chart';
import { RecentTickets } from './recent-tickets';
import { mockDashboardData } from '@/lib/mock-data';
import {
  AlertCircle,
  Loader2,
  CheckCircle2,
  BarChart3,
  RefreshCw,
  Calendar,
  Maximize2,
  Minimize2,
  PhoneCall,
  Clock,
  Activity,
  Key,
  Database,
  Lock,
} from 'lucide-react';

interface DashboardData {
  apollo: {
    andamento: number;
    finalizado: number;
    totalDia: number;
    tempoMedioGeral: number;
    atendentes: Array<{ nome: string; andamento: number; finalizado: number; total: number; tempoMedio: number }>;
    timeline: Array<{ hora: string; abertos: number; finalizados: number }>;
    recentes: any[];
    error?: string | null;
  };
  dataConsulta: string;
  atualizadoEm: string;
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [lastUpdate, setLastUpdate] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [mounted, setMounted] = useState(false);

  // Carregar token do localStorage no início
  useEffect(() => {
    setMounted(true);
    setSelectedDate(getTodayStr());
    const savedToken = localStorage.getItem('apollo_dashboard_token');
    if (savedToken) setToken(savedToken);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [mounted]);

  const fetchData = useCallback(async () => {
    if (!mounted) return;
    // Se não tiver token, usa dados mock
    if (!token) {
      setData(mockDashboardData);
      setIsLoading(false);
      setLastUpdate(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (selectedDate) params.set('date', selectedDate);
      params.set('_t', Date.now().toString());
      
      const res = await fetch(`/api/dashboard?${params.toString()}`, {
        cache: 'no-store',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache', 
          'Pragma': 'no-cache' 
        },
      });
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Token inválido ou expirado');
        }
        throw new Error('Erro ao carregar dados');
      }
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Erro desconhecido');
      // Se der erro de token, limpa e volta pro mock
      if (err.message.includes('Token')) {
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, token]);

  const handleLogin = () => {
    if (!tempToken.trim()) return;
    localStorage.setItem('apollo_dashboard_token', tempToken.trim());
    setToken(tempToken.trim());
    setShowTokenInput(false);
    setTempToken('');
  };

  const handleLogout = () => {
    localStorage.removeItem('apollo_dashboard_token');
    setToken(null);
    setData(mockDashboardData);
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => { fetchData(); }, 5 * 60 * 1000); // 5 minutos
    return () => clearInterval(interval);
  }, [fetchData]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const ap = data?.apollo || { 
    andamento: 0, 
    finalizado: 0, 
    totalDia: 0, 
    tempoMedioGeral: 0,
    atendentes: [], 
    timeline: [], 
    recentes: [],
    error: null
  };

  if (error && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center glass-card p-8 border border-border/50">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground">Erro ao carregar dashboard</p>
          <p className="text-muted-foreground mt-1">{error}</p>
          <button onClick={() => fetchData()} className="mt-4 bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Banner de Dados Fictícios */}
      {!token && (
        <div className="bg-rose-600 py-1.5 px-4 text-center">
          <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] text-white animate-pulse">
            ⚠️ Modo de Apresentação: Exibindo Dados Fictícios para Demonstração ⚠️
          </p>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-white/5 px-4 xl:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 p-2.5 rounded-2xl border border-primary/20 shadow-lg shadow-primary/10">
              <Activity className="w-8 h-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl xl:text-2xl font-display font-bold tracking-tight text-white">Dashboard Apollo</h1>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                    <PhoneCall className="w-3 h-3" />
                    WhatsApp
                  </span>
                  {token ? (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                      <Database className="w-3 h-3" />
                      Produção
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Apresentação
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Suporte Técnico — Chamados de Hoje</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Token Input Section */}
            <div className="relative">
              {!token ? (
                <div className="flex items-center gap-2">
                  {showTokenInput ? (
                    <div className="flex items-center gap-2 bg-secondary/80 p-1 rounded-xl border border-primary/30">
                      <input 
                        type="password" 
                        placeholder="Cole o JWT aqui..."
                        value={tempToken}
                        onChange={(e) => setTempToken(e.target.value)}
                        className="bg-transparent text-xs px-3 py-1.5 outline-none w-48 text-white"
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      />
                      <button 
                        onClick={handleLogin}
                        className="bg-primary text-white p-1.5 rounded-lg hover:opacity-90"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowTokenInput(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-500/20 transition-all"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Acessar Produção
                    </button>
                  )}
                </div>
              ) : (
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-all"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  Token Ativo (Sair)
                </button>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2 border border-white/5">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Total Dia</span>
                <span className="text-sm font-bold text-primary font-mono">{ap.totalDia}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/5 group hover:border-primary/30 transition-all">
              <Calendar className="w-4 h-4 text-primary" />
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                className="bg-transparent text-sm font-bold outline-none cursor-pointer font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => fetchData()} 
                disabled={isLoading} 
                className="flex items-center justify-center w-11 h-11 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-xl shadow-primary/20 border border-primary/50"
                title="Atualizar"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              <button 
                onClick={toggleFullscreen} 
                className="flex items-center justify-center w-11 h-11 bg-white/5 text-white rounded-xl hover:bg-white/10 border border-white/10 transition-all" 
                title={isFullscreen ? 'Sair tela cheia' : 'Tela cheia'}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
            </div>

            <div className="bg-primary/5 px-5 py-2.5 rounded-2xl border border-primary/20 shadow-inner">
              <div className="font-mono text-3xl font-black text-primary tabular-nums tracking-tighter drop-shadow-sm">{currentTime}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 xl:p-6 flex flex-col flex-1 min-h-0 gap-4 xl:gap-6">
        {/* Erros */}
        {ap.error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-destructive text-sm font-medium flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            Apollo: {ap.error}
          </div>
        )}

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
          <KpiCard 
            title="Em Andamento" 
            value={ap.andamento} 
            icon={Loader2} 
            color="text-orange-400" 
            bgColor="bg-orange-500/10" 
            subtitle="Chamados ativos no momento" 
          />
          <KpiCard 
            title="Finalizados" 
            value={ap.finalizado} 
            icon={CheckCircle2} 
            color="text-emerald-400" 
            bgColor="bg-emerald-500/10" 
            subtitle="Resolvidos hoje" 
          />
          <KpiCard 
            title="Tempo Médio" 
            value={`${ap.tempoMedioGeral}m`} 
            icon={Clock} 
            color="text-blue-400" 
            bgColor="bg-blue-500/10" 
            subtitle="Duração média por chamado" 
          />
          <KpiCard 
            title="Total Geral" 
            value={ap.totalDia} 
            icon={BarChart3} 
            color="text-primary" 
            bgColor="bg-primary/10" 
            subtitle="Volume total de interações" 
          />
        </div>

        {/* Layout TV: Últimos Chamados em cima, Gráfico em baixo */}
        <div className="flex flex-col flex-1 min-h-0 gap-4 xl:gap-6">
          {/* Últimos Chamados - Flex 1 (preenche o espaço) */}
          <div className="flex-1 min-h-0">
            <RecentTickets data={ap.recentes || []} title="Últimos Chamados Identificados" />
          </div>

          {/* Gráfico de Linhas - Fixed Height (diminuído um pouco) */}
          <div className="h-[250px] xl:h-[300px] shrink-0">
            <TimelineChart data={ap.timeline || []} title="Fluxo de Chamados (Abertos agora vs Finalizados)" isApollo />
          </div>
        </div>
      </main>
      
      <footer className="p-6 text-center text-xs text-muted-foreground font-medium border-t border-border/50 bg-card/30">
        Última atualização dos dados: {lastUpdate || 'N/A'} • Versão 2.0 (Apollo Only)
      </footer>
    </div>
  );
}
