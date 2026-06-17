// components/UI/SmartServerSelect.tsx
'use client';

import React, { useMemo } from 'react';
import { registrarLog } from '@/lib/logger';

interface Servidor {
  nome: string;
  cargo: string;
}

interface Props {
  label: string;
  formData: any;
  selecionados: Servidor[];
  onChange: (novaLista: Servidor[]) => void;
}

export default function SmartServerSelect({ label, formData, selecionados = [], onChange }: Props) {
  const servidoresDisponiveis = useMemo(() => {
    const lista: Servidor[] = [];
    
    const adicionarServidores = (nomesString: string, cargo: string) => {
      if (!nomesString) return;
      nomesString.split(/[,/;\n]| e /i).forEach(n => {
        const nomeLimpo = n.trim();
        if (nomeLimpo && nomeLimpo.toLowerCase() !== 'não houve' && nomeLimpo !== '-') {
          lista.push({ nome: nomeLimpo, cargo });
        }
      });
    };

    adicionarServidores(formData.coordenador, 'Coordenador');
    adicionarServidores(formData.supervisor, 'Supervisor');
    adicionarServidores(formData.educadores, 'Educador');
    adicionarServidores(formData.portaria, 'Portaria');
    adicionarServidores(formData.apoio, 'Apoio');
    
    return lista;
  }, [formData.coordenador, formData.supervisor, formData.educadores, formData.portaria, formData.apoio]);

  const toggleServidor = (servidor: Servidor) => {
    const jaSelecionado = selecionados.some((s) => s.nome === servidor.nome);
    let novaLista;
    
    if (jaSelecionado) {
      novaLista = selecionados.filter((s) => s.nome !== servidor.nome);
    } else {
      novaLista = [...selecionados, servidor];
    }
    
    onChange(novaLista); // <-- Agora ele repassa a alteração de forma inteligente para o formulário mestre

    const userName = typeof window !== "undefined" ? localStorage.getItem("usuarioAtual") || "Usuário" : "Usuário";
    registrarLog(userName, 'Seleção de Equipe', `${jaSelecionado ? 'Removeu' : 'Adicionou'} ${servidor.nome} (${servidor.cargo}) no campo: ${label}`);
  };

  return (
    <div className="w-full bg-white/50 backdrop-blur rounded-2xl border border-gray-200 shadow-sm p-4">
      <label className="block text-sm font-black text-gray-800 mb-3">{label}</label>
      <div className="flex flex-wrap gap-2">
        {servidoresDisponiveis.length === 0 ? (
          <span className="text-xs text-gray-400 font-bold bg-gray-100 px-3 py-1 rounded-lg">A equipe do plantão ainda não foi preenchida.</span>
        ) : (
          servidoresDisponiveis.map((srv, idx) => {
            const isSelected = selecionados.some((s) => s.nome === srv.nome);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => toggleServidor(srv)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  isSelected 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 border border-transparent scale-105' 
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100 hover:border-blue-300'
                }`}
              >
                {isSelected && <span className="text-white text-xs">✓</span>}
                <span>{srv.nome}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider ${isSelected ? 'bg-white/20 text-blue-50' : 'bg-gray-100 text-gray-500'}`}>
                  {srv.cargo}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}