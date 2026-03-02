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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex justify-center mb-6">
              <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center text-4xl">🛡️</div>
          </div>
          <h1 className="text-2xl font-bold text-center text-blue-900 mb-2">CSIPRC Segurança</h1>
          <p className="text-center text-gray-500 mb-8 text-sm">Faça login para acessar</p>
          <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">E-mail</label>
                  <input type="email" required className="w-full p-3 border rounded-lg outline-none text-gray-900" placeholder="usuario@csiprc.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Senha</label>
                  <input type="password" required className="w-full p-3 border rounded-lg outline-none text-gray-900" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <button disabled={loading} className="w-full bg-blue-900 text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition">
                  {loading ? 'Entrando...' : 'Entrar'}
              </button>
          </form>
      </div>
    </div>
  );
}