// components/Auth/LoginForm.tsx
'use client';

import { useState } from 'react';

interface LoginFormProps {
  onLogin: (email: string, pass: string) => Promise<void>;
  loading: boolean;
}

export default function LoginForm({ onLogin, loading }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900 via-blue-950 to-gray-900 px-4">
      
      {/* Círculos decorativos ao fundo */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>

      <div className="glass-panel p-10 rounded-3xl w-full max-w-md animate-fade-in-up relative z-10">
          <div className="flex justify-center mb-8">
              <div className="h-24 w-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center text-5xl shadow-inner shadow-blue-300">
                🛡️
              </div>
          </div>
          <h1 className="text-3xl font-black text-center text-gray-800 mb-2 tracking-tight">CSIPRC Segurança</h1>
          <p className="text-center text-gray-500 mb-8 font-medium">Faça login para acessar o sistema</p>
          
          <form onSubmit={handleSubmit} className="space-y-5">
              <div className="group">
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2 tracking-wider transition-colors group-focus-within:text-blue-600">E-mail</label>
                  <input 
                    type="email" 
                    required 
                    className="w-full p-4 bg-white/50 border border-gray-200 rounded-xl outline-none text-gray-900 transition-all duration-300 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" 
                    placeholder="usuario@csiprc.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                  />
              </div>
              <div className="group">
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2 tracking-wider transition-colors group-focus-within:text-blue-600">Senha</label>
                  <input 
                    type="password" 
                    required 
                    className="w-full p-4 bg-white/50 border border-gray-200 rounded-xl outline-none text-gray-900 transition-all duration-300 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                  />
              </div>
              
              <button 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-blue-700 to-blue-900 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-blue-900/40 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 flex justify-center items-center gap-2 mt-4"
              >
                  {loading ? (
                    <><span className="animate-spin text-xl">⏳</span> Autenticando...</>
                  ) : (
                    <>Entrar no Sistema <span>➔</span></>
                  )}
              </button>
          </form>
      </div>
    </div>
  );
}