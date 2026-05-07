'use client';

import { useState, useEffect } from 'react';
import { Lock, Plus, Building2, Calendar, Key, Save, X, LogOut, CheckCircle2 } from 'lucide-react';

export default function LicencasAdmin() {
  const [senha, setSenha] = useState('');
  const [isLogged, setIsLogged] = useState(false);
  const [licencas, setLicencas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const fetchLicencas = async (token: string) => {
    try {
      const res = await fetch('/api/admin/license', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLicencas(data.licencas);
        setIsLogged(true);
        setErrorMsg('');
      } else {
        setErrorMsg('Senha incorreta ou acesso negado.');
        setIsLogged(false);
      }
    } catch (err) {
      setErrorMsg('Erro de conexão ao servidor.');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senha) return;
    setLoading(true);
    fetchLicencas(senha).finally(() => setLoading(false));
  };

  const handleLogout = () => {
    setSenha('');
    setIsLogged(false);
    setLicencas([]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...editItem,
        ativo: editItem.ativo === 'true' || editItem.ativo === true
      };

      const res = await fetch('/api/admin/license', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${senha}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowModal(false);
        fetchLicencas(senha);
      } else {
        alert('Erro ao salvar');
      }
    } catch (error) {
      alert('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta licença?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/license?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${senha}` }
      });
      if (res.ok) {
        fetchLicencas(senha);
      } else {
        alert('Erro ao excluir');
      }
    } catch {
      alert('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (licenca: any = null) => {
    if (licenca) {
      setEditItem({
        ...licenca,
        dataDaCompra: new Date(licenca.dataDaCompra).toISOString().split('T')[0],
        dataDeExpiracao: new Date(licenca.dataDeExpiracao).toISOString().split('T')[0],
        apolloLogin: licenca.apolloLogin || '',
        apolloSenha: licenca.apolloSenha || ''
      });
    } else {
      setEditItem({
        nomeEmpresa: '',
        dataDaCompra: new Date().toISOString().split('T')[0],
        dataDeExpiracao: '',
        apolloLogin: '',
        apolloSenha: '',
        ativo: true
      });
    }
    setShowModal(true);
  };

  if (!isLogged) {
    return (
      <div className="min-h-screen bg-[#0f1115] text-white flex flex-col items-center justify-center p-4">
        <div className="bg-[#1a1d24] p-10 rounded-2xl border border-gray-800 w-full max-w-md shadow-2xl flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Painel de Licenças</h1>
          <p className="text-sm text-gray-400 mb-8 text-center">Acesso restrito à administração do sistema.</p>
          
          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div>
              <input 
                type="password" 
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-[#0f1115] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-center"
                placeholder="Digite a Senha Mestra"
              />
            </div>
            {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-colors flex justify-center items-center gap-2"
            >
              {loading ? 'Verificando...' : 'Acessar Painel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1115] text-white p-6 xl:p-10">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10 bg-[#1a1d24] p-6 rounded-2xl border border-gray-800">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Key className="w-6 h-6 text-blue-500" /> Gestão de Licenças e Clientes
            </h1>
            <p className="text-gray-400 text-sm mt-1">Gerencie o acesso das empresas ao Dashboard</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => openModal()} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors">
              <Plus className="w-5 h-5" /> Nova Licença
            </button>
            <button onClick={handleLogout} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors">
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {licencas.map(lic => {
            const expDate = new Date(lic.dataDeExpiracao);
            const today = new Date();
            const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const isExpired = diffDays <= 0;
            const isWarning = diffDays > 0 && diffDays <= 5;

            return (
              <div key={lic.id} className="bg-[#1a1d24] p-6 rounded-2xl border border-gray-800 hover:border-gray-700 transition-colors flex flex-col relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-full h-1 ${!lic.ativo ? 'bg-gray-600' : isExpired ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500/10 rounded-lg">
                      <Building2 className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{lic.nomeEmpresa}</h3>
                      <p className="text-xs text-gray-500 font-mono mt-0.5" title="Chave de Acesso">Chave: {lic.chaveAcesso}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md ${!lic.ativo ? 'bg-gray-500/20 text-gray-400' : isExpired ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {!lic.ativo ? 'Inativo' : isExpired ? 'Vencido' : 'Ativo'}
                  </span>
                </div>

                <div className="space-y-3 mb-6 bg-[#0f1115] p-4 rounded-xl border border-gray-800/50">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Compra:</span>
                    <span className="font-medium text-gray-200">{new Date(lic.dataDaCompra).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Vencimento:</span>
                    <span className={`font-bold ${isExpired ? 'text-red-400' : isWarning ? 'text-orange-400' : 'text-gray-200'}`}>
                      {new Date(lic.dataDeExpiracao).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {lic.ativo && (
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-800">
                      <span className="text-gray-400">Status de Uso:</span>
                      {isExpired ? (
                        <span className="text-red-400 font-bold">Bloqueado (-{Math.abs(diffDays)} dias)</span>
                      ) : (
                        <span className={isWarning ? 'text-orange-400 font-bold' : 'text-emerald-400 font-bold'}>
                          Resta{diffDays === 1 ? '' : 'm'} {diffDays} dia{diffDays === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-auto pt-4">
                  <button 
                    onClick={() => handleDelete(lic.id)}
                    className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm transition-colors"
                    title="Excluir"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => openModal(lic)}
                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors"
                  >
                    Editar / Renovar
                  </button>
                </div>
              </div>
            );
          })}

          {licencas.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-800 rounded-2xl">
              <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Nenhuma empresa/licença cadastrada ainda.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d24] border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#0f1115]">
              <h2 className="text-lg font-bold">{editItem.id ? 'Editar Licença' : 'Nova Licença'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Nome da Empresa</label>
                <input 
                  type="text" required
                  value={editItem.nomeEmpresa}
                  onChange={(e) => setEditItem({...editItem, nomeEmpresa: e.target.value})}
                  className="w-full bg-[#0f1115] border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Ex: Empresa XYZ LTDA"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Data da Compra</label>
                  <input 
                    type="date" required
                    value={editItem.dataDaCompra}
                    onChange={(e) => setEditItem({...editItem, dataDaCompra: e.target.value})}
                    className="w-full bg-[#0f1115] border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Data de Expiração</label>
                  <input 
                    type="date" required
                    value={editItem.dataDeExpiracao}
                    onChange={(e) => setEditItem({...editItem, dataDeExpiracao: e.target.value})}
                    className="w-full bg-[#0f1115] border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Login Apollo</label>
                  <input 
                    type="text" required
                    value={editItem.apolloLogin || ''}
                    onChange={(e) => setEditItem({...editItem, apolloLogin: e.target.value})}
                    className="w-full bg-[#0f1115] border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                    placeholder="Ex: USUARIO"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Senha Apollo</label>
                  <input 
                    type="password" required
                    value={editItem.apolloSenha || ''}
                    onChange={(e) => setEditItem({...editItem, apolloSenha: e.target.value})}
                    className="w-full bg-[#0f1115] border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                    placeholder="***"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 -mt-2">Credenciais usadas para consultar o banco da Apollo automaticamente.</p>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Status</label>
                <select 
                  value={editItem.ativo ? 'true' : 'false'}
                  onChange={(e) => setEditItem({...editItem, ativo: e.target.value})}
                  className="w-full bg-[#0f1115] border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="true">Ativo (Pode acessar)</option>
                  <option value="false">Inativo (Bloqueado Manualmente)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-800 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex justify-center items-center gap-2">
                  <Save className="w-4 h-4" /> {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
