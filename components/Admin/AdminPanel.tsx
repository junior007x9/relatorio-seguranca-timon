// components/Admin/AdminPanel.tsx
'use client';

import { useState } from 'react';

interface AdminPanelProps {
  onRegister: (email: string, pass: string) => Promise<void>;
  loading: boolean;
}

export default function AdminPanel({ onRegister, loading }: AdminPanelProps) {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister(newUserEmail, newUserPassword);
    setNewUserEmail('');
    setNewUserPassword('');
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-purple-900 mb-6 text-center">Painel Admin</h2>
        <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
            <h3 className="font-bold text-purple-800 mb-4">Cadastrar Novo Usuário</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase">E-mail</label>
                    <input type="email" required className="w-full p-2 border rounded text-gray-900" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase">Senha</label>
                    <input type="password" required className="w-full p-2 border rounded text-gray-900" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} />
                </div>
                <button disabled={loading} className="w-full bg-purple-600 text-white py-2 rounded font-bold hover:bg-purple-700">
                    {loading ? 'A processar...' : 'Cadastrar'}
                </button>
            </form>
        </div>
    </div>
  );
}