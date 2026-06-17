// components/Admin/LogsPanel.tsx
'use client';

import { useEffect, useState } from 'react';
import { LogEntry } from '@/lib/logger';
import { toast } from 'sonner';

export default function LogsPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Carrega os logs ao abrir a tela
  useEffect(() => {
    const carregarLogs = () => {
      const storedLogs = JSON.parse(localStorage.getItem('sistema_logs') || '[]');
      // Ordena do mais recente para o mais antigo
      const sorted = storedLogs.sort((a: any, b: any) => 
        new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
      );
      setLogs(sorted);
    };

    carregarLogs();
  }, []);

  const limparLogs = () => {
    if (confirm("⚠️ ATENÇÃO: Tem certeza que deseja apagar TODOS os logs de auditoria? Esta ação não pode ser desfeita.")) {
      localStorage.removeItem('sistema_logs');
      setLogs([]);
      toast.success("Histórico de logs apagado com sucesso!");
    }
  };

  return (
    <div className="p-6 md:p-10 animate-fade-in-up">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-800 flex items-center gap-3">
            <span className="text-4xl bg-blue-100 text-blue-600 p-3 rounded-2xl shadow-sm">🕵️‍♂️</span> 
            Auditoria de Sistema
          </h2>
          <p className="text-gray-500 mt-2 text-sm md:text-base">
            Acompanhe em tempo real quem alterou dados no sistema.
          </p>
        </div>
        <button 
          onClick={limparLogs} 
          className="bg-red-50 text-red-600 border border-red-100 font-bold px-6 py-3 rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
        >
          <span>🗑️</span> Limpar Logs
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-widest font-black">
                <th className="p-5 whitespace-nowrap">Data / Hora</th>
                <th className="p-5">Usuário (Operador)</th>
                <th className="p-5">Ação Realizada</th>
                <th className="p-5 w-1/2">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-gray-400 font-medium">
                    <div className="text-4xl mb-2">🍃</div>
                    Nenhum log registrado ainda no seu navegador.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="p-5 text-sm text-gray-500 font-bold whitespace-nowrap">
                      {new Date(log.dataHora).toLocaleString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </td>
                    <td className="p-5 text-sm font-black text-blue-700">
                      {log.usuario}
                    </td>
                    <td className="p-5 text-sm font-bold text-gray-800">
                      <span className="bg-gray-100 px-3 py-1 rounded-lg border border-gray-200 group-hover:bg-white transition-colors">
                        {log.acao}
                      </span>
                    </td>
                    <td className="p-5 text-sm text-gray-600 font-medium">
                      {log.detalhes}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}