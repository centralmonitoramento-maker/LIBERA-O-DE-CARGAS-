
import React, { useState } from 'react';
import { Truck } from 'lucide-react';
import { User } from '../types';

interface LoginViewProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
  onRegisterRequest: (user: Omit<User, 'id' | 'status' | 'createdAt'>) => void;
}

const ROLE_NAMES = {
  expedition: 'Expedição',
  central: 'Central de Monitoramento',
  audit: 'Auditoria de Gate',
  analysis: 'Análise de Dados',
};

export const LoginView: React.FC<LoginViewProps> = ({ users, onLoginSuccess, onRegisterRequest }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [registerRole, setRegisterRole] = useState<'expedition' | 'central' | 'audit' | 'analysis'>('expedition');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [storeLocation, setStoreLocation] = useState('');
  const [jobFunction, setJobFunction] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const normalize = (str: string) => {
    return str.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'login') {
      if (!username || !password) {
        setError('Por favor, preencha todos os campos.');
        return;
      }

      const normalizedInputUsername = normalize(username);
      
      const user = users.find(u => normalize(u.username) === normalizedInputUsername);
      
      if (user) {
        if (user.password !== password) {
          setError('Senha incorreta.');
          return;
        }

        if (user.status === 'active') {
          onLoginSuccess(user);
        } else if (user.status === 'pending') {
          setError('Seu cadastro ainda está aguardando aprovação da Auditoria.');
        } else {
          setError('Seu cadastro foi rejeitado pela Auditoria.');
        }
      } else {
        setError(`Usuário "${username}" não encontrado.`);
      }
    } else {
      // Register request
      if (!username || !password || !fullName || !storeLocation || !jobFunction) {
        setError('Por favor, preencha todos os campos para solicitação.');
        return;
      }

      const normalizedInputUsername = normalize(username);
      const exists = users.find(u => normalize(u.username) === normalizedInputUsername);
      
      if (exists) {
        setError('Este nome de usuário já está em uso.');
        return;
      }

      onRegisterRequest({
        username,
        password,
        fullName,
        storeLocation,
        jobFunction,
        role: registerRole,
      });
      setSuccess('Solicitação enviada! Aguarde a aprovação da Auditoria.');
      setMode('login');
      setPassword('');
      setFullName('');
      setStoreLocation('');
      setJobFunction('');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-500 relative">
      {/* Subtle background watermark */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] flex items-center justify-center z-0">
        <img src="/logo.png" alt="" className="w-full transform scale-125 rotate-12" />
      </div>

      <div className="bg-primary-navy p-10 text-center relative z-10">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-gold via-transparent to-transparent"></div>
        </div>
        <div className="relative w-28 h-28 bg-white keep-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl border-4 border-primary-gold overflow-hidden group hover:scale-105 transition-transform duration-500">
          <img 
            src="/logo.png" 
            alt="Prev de Perdas" 
            className="w-full h-full object-cover" 
            style={{ width: '201px' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
            }}
          />
          <Truck className="fallback-icon hidden w-16 h-16 text-primary-navy" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight relative z-10">
          {mode === 'login' ? 'Sistema CargaRadar' : 'Solicitar Cadastro'}
        </h2>
        <p className="text-primary-gold text-[10px] font-black uppercase tracking-[0.3em] mt-2 relative z-10">
          {mode === 'login' ? 'Acesso Unificado' : 'Pré-cadastro de Acesso'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        )}
        
        {mode === 'register' && (
          <>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Área de Atuação</label>
              <select
                value={registerRole}
                onChange={(e) => setRegisterRole(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary-gold outline-none transition-all"
              >
                {Object.entries(ROLE_NAMES).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Nome Completo</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary-gold outline-none transition-all placeholder:font-normal placeholder:opacity-50"
                placeholder="Digite seu nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Loja Locado</label>
              <input
                type="text"
                value={storeLocation}
                onChange={(e) => setStoreLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary-gold outline-none transition-all placeholder:font-normal placeholder:opacity-50"
                placeholder="Ex: Loja 07 SIA"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Função</label>
              <input
                type="text"
                value={jobFunction}
                onChange={(e) => setJobFunction(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary-gold outline-none transition-all placeholder:font-normal placeholder:opacity-50"
                placeholder="Ex: Conferente de Expedição"
                required
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Usuário</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary-gold outline-none transition-all placeholder:font-normal placeholder:opacity-50"
            placeholder="Escolha um nome de usuário"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary-gold outline-none transition-all placeholder:font-normal placeholder:opacity-50"
            placeholder="••••••"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary-navy hover:bg-primary-navy/90 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 border-b-4 border-primary-gold"
        >
          {mode === 'login' ? 'ENTRAR NO SISTEMA' : 'ENVIAR SOLICITAÇÃO'}
        </button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
              setSuccess('');
            }}
            className="text-[10px] font-black text-primary-navy hover:text-primary-gold uppercase tracking-widest transition-colors"
          >
            {mode === 'login' ? 'Não tem conta? Solicite cadastro' : 'Já tem conta? Faça login'}
          </button>
        </div>
      </form>
      
      <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">CargaRadar Security Protocol v2.5</p>
      </div>
    </div>
  );
};
