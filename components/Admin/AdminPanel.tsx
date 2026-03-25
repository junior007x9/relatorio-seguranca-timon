// components/Admin/AdminPanel.tsx
'use client';

import { useState } from 'react';

interface AdminPanelProps {
  onRegister: (email: string, pass: string) => Promise<void>;
  loading: boolean;
}

export default function AdminPanel({ onRegister, loading }: AdminPanelProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(password.length < 6) return alert("A senha deve ter pelo menos 6 caracteres.");
    onRegister(email, password);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="p-6 md:p-10 animate-fade-in-up max-w-2xl mx-auto">
        <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 text-purple-600 rounded-full text-4xl mb-4 shadow-inner">
                ⚙️
            </div>
            <h2 className="text-3xl font-black text-gray-800 tracking-tight">Painel Administrativo</h2>
            <p className="text-gray-500 mt-2">Crie novos acessos para os educadores e supervisores.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <div className="bg-blue-50 text-blue-800 p-4 rounded-2xl text-sm font-medium flex gap-3 items-center border border-blue-100">
                <span className="text-2xl">ℹ️</span>
                <p>Os usuários criados aqui poderão fazer login no sistema e criar novos relatórios.</p>
            </div>

            <div className="space-y-5">
                <div className="group">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-purple-600 transition-colors">E-mail do Novo Usuário</label>
                    <input 
                        type="email" 
                        required 
                        className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-gray-800 font-medium" 
                        placeholder="nome@csiprc.com" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                    />
                </div>
                <div className="group">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-purple-600 transition-colors">Senha Provisória</label>
                    <input 
                        type="password" 
                        required 
                        minLength={6}
                        className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-gray-800 font-medium" 
                        placeholder="Mínimo 6 caracteres" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                    />
                </div>
            </div>

            <button 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 mt-4 flex justify-center items-center gap-2"
            >
                {loading ? <><span className="animate-spin">⏳</span> A processar...</> : <><span>👤</span> Criar Usuário</>}
            </button>
        </form>
    </div>
  );
}