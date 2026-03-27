// components/History/HistoryView.tsx
'use client';

import { useEffect, useRef } from 'react';
import { RelatorioData } from '@/types';
import { gerarPDF } from '@/lib/pdfGenerator';
import { gerarWord } from '@/lib/wordGenerator';

interface Props {
  historico: RelatorioData[];
  loading: boolean;
  selectedReport: RelatorioData | null;
  onSelectReport: (r: RelatorioData | null) => void;
  onEditReport: (r: RelatorioData) => void;
  onDeleteReport: (id: number) => void;
  onResendWhatsApp: (r: RelatorioData) => void;
  isUserAdmin: boolean;
}

export default function HistoryView({
  historico, loading, selectedReport, onSelectReport, onEditReport, onDeleteReport, onResendWhatsApp, isUserAdmin
}: Props) {
  const detalhesRef = useRef<HTMLDivElement>(null);

  // Efeito para rolar a tela para o topo do relatório selecionado no Desktop,
  // e jogar pro topo absoluto no Celular para garantir foco imediato.
  useEffect(() => {
    if (selectedReport) {
      if (window.innerWidth >= 768) {
        detalhesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [selectedReport]);

  if (loading) return <div className="p-10 text-center font-bold text-gray-500 animate-pulse">Carregando histórico...</div>;
  if (historico.length === 0) return <div className="p-10 text-center font-bold text-gray-500">Nenhum relatório encontrado.</div>;

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 md:p-8 relative">

      {/* COLUNA ESQUERDA: LISTA DE RELATÓRIOS */}
      <div className={`w-full md:w-1/3 flex-col gap-4 ${selectedReport ? 'hidden md:flex' : 'flex'}`}>
        <h2 className="font-black text-2xl text-gray-800 mb-2">📜 Histórico</h2>
        <div className="overflow-y-auto max-h-[75vh] pr-2 space-y-4">
            {historico.map((relatorio) => (
              <div
                key={relatorio.id}
                onClick={() => onSelectReport(relatorio)}
                className={`p-5 rounded-2xl cursor-pointer transition-all border ${
                  selectedReport?.id === relatorio.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 border-blue-600 md:-translate-y-1'
                    : 'bg-gray-50 hover:bg-white hover:shadow-md border-gray-200 text-gray-700'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black text-lg">{relatorio.data}</span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${selectedReport?.id === relatorio.id ? 'bg-white/20' : 'bg-gray-200 text-gray-600'}`}>
                    {relatorio.plantao}
                  </span>
                </div>
                <div className="text-sm font-medium opacity-90 truncate">Coord: {relatorio.coordenador}</div>
                <div className="text-sm opacity-80 truncate">Sup: {relatorio.supervisor}</div>
              </div>
            ))}
        </div>
      </div>

      {/* COLUNA DIREITA: DETALHES DO RELATÓRIO */}
      {selectedReport && (
        <div ref={detalhesRef} className="w-full md:w-2/3 bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm animate-fade-in-up">
          
          {/* BOTÃO VOLTAR - Exclusivo para Mobile */}
          <button
            onClick={() => onSelectReport(null)}
            className="md:hidden w-full mb-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-gray-200 shadow-sm"
          >
            <span className="text-xl">⬅</span> Voltar para a lista de relatórios
          </button>

          <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
            <div>
              <h3 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight">{selectedReport.plantao}</h3>
              <p className="text-gray-500 font-medium text-lg mt-1">🗓️ {selectedReport.data}</p>
            </div>
            
            {/* GRUPO DE BOTÕES DE AÇÃO */}
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => onEditReport(selectedReport)} className="flex-1 sm:flex-none bg-amber-100 text-amber-700 px-4 py-3 md:py-2 rounded-xl hover:bg-amber-200 font-bold text-sm flex justify-center items-center gap-2 transition-colors">
                ✏️ Editar
              </button>
              
              <button onClick={() => gerarWord(selectedReport)} className="flex-1 sm:flex-none bg-blue-100 text-blue-700 px-4 py-3 md:py-2 rounded-xl hover:bg-blue-200 font-bold text-sm flex justify-center items-center gap-2 transition-colors">
                📄 Word
              </button>
              
              <button onClick={() => gerarPDF(selectedReport)} className="flex-1 sm:flex-none bg-rose-100 text-rose-700 px-4 py-3 md:py-2 rounded-xl hover:bg-rose-200 font-bold text-sm flex justify-center items-center gap-2 transition-colors">
                📄 PDF
              </button>

              <button onClick={() => onResendWhatsApp(selectedReport)} className="flex-1 sm:flex-none bg-green-100 text-green-700 px-4 py-3 md:py-2 rounded-xl hover:bg-green-200 font-bold text-sm flex justify-center items-center gap-2 transition-colors">
                📱 Zap
              </button>
              
              {isUserAdmin && selectedReport.id && (
                <button onClick={() => onDeleteReport(selectedReport.id!)} className="flex-1 sm:flex-none bg-gray-800 text-white px-4 py-3 md:py-2 rounded-xl hover:bg-gray-900 font-bold text-sm flex justify-center items-center gap-2 transition-colors">
                  🗑️ Excluir
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <div><span className="text-xs font-black text-gray-400 uppercase">Supervisor</span><p className="font-bold text-gray-800 text-lg">{selectedReport.supervisor}</p></div>
              <div><span className="text-xs font-black text-gray-400 uppercase">Coordenador</span><p className="font-bold text-gray-800 text-lg">{selectedReport.coordenador}</p></div>
              <div className="sm:col-span-2"><span className="text-xs font-black text-gray-400 uppercase">Educadores</span><p className="font-bold text-gray-800 text-lg">{selectedReport.educadores}</p></div>
            </div>

            {selectedReport.resumoPlantao && (
              <div>
                <h4 className="font-black text-xl text-gray-800 mb-3 flex items-center gap-2">📝 Resumo do Plantão</h4>
                <div className="bg-blue-50/50 p-5 md:p-6 rounded-2xl border border-blue-100 text-gray-800 whitespace-pre-wrap text-lg leading-relaxed shadow-inner">
                  {selectedReport.resumoPlantao}
                </div>
              </div>
            )}
            
            {selectedReport.fotos && selectedReport.fotos.length > 0 && (
               <div className="mt-8">
                   <h4 className="font-black text-xl text-gray-800 mb-3 flex items-center gap-2">📷 Fotos Anexadas</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {selectedReport.fotos.map((f, i) => (
                           <img key={i} src={f} className="rounded-2xl w-full h-auto object-cover border border-gray-200 shadow-sm" alt="Foto relatorio" />
                       ))}
                   </div>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}