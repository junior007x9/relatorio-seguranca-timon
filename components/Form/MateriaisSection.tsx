// components/Form/MateriaisSection.tsx
'use client';

import { RelatorioData } from '@/types';

interface Props {
  formData: RelatorioData;
  onChange: (e: any) => void;
}

export default function MateriaisSection({ formData, onChange }: Props) {
  const materiais = [
    { label: 'Tonfas', name: 'tonfas', icon: '🏏' },
    { label: 'Algemas', name: 'algemas', icon: '🔗' },
    { label: 'Chaves de Acesso', name: 'chavesAcesso', icon: '🔑' },
    { label: 'Rádio Celular', name: 'radioCelular', icon: '📱' }, // <-- Entrou no lugar das Chaves Algemas
    { label: 'Escudos', name: 'escudos', icon: '🛡️' },
    { label: 'Lanternas', name: 'lanternas', icon: '🔦' },
    { label: 'Celular', name: 'celular', icon: '📱' },
    { label: 'Rádio HT', name: 'radioHT', icon: '📻' },
    { label: 'Chaves Algemas', name: 'chavesAlgemas', icon: '🗝️' }, // <-- Movido para cá (vice-versa)
    { label: 'Cadeados', name: 'cadeados', icon: '🔒' },
    { label: 'Pendrives', name: 'pendrives', icon: '💾' }
  ];

  return (
    <section className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm relative mt-10">
      <div className="absolute -top-4 left-6 bg-slate-700 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md tracking-wide flex items-center gap-2">
        <span>🎒</span> CONFERÊNCIA DE MATERIAIS
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
        {materiais.map((item, idx) => (
          <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col items-center justify-center text-center group hover:bg-white hover:border-slate-400 hover:shadow-md transition-all">
            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{item.icon}</span>
            <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 leading-tight h-8 flex items-center justify-center group-focus-within:text-blue-600">
              {item.label}
            </label>
            <input
              type="text"
              name={item.name}
              value={(formData as any)[item.name]}
              onChange={onChange}
              className="w-16 bg-white border border-slate-300 p-2 rounded-lg text-center font-black text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
            />
          </div>
        ))}
      </div>
    </section>
  );
}