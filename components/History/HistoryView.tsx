// components/History/HistoryView.tsx
'use client';

import { RelatorioData } from '@/types';
import { calcularTotalAdolescentes, converterParaLista, limparTexto } from '@/lib/utils';
import { gerarPDF } from '@/lib/pdfGenerator';
import { gerarWord } from '@/lib/wordGenerator';

interface HistoryViewProps {
  historico: RelatorioData[];
  loading: boolean;
  selectedReport: RelatorioData | null;
  onSelectReport: (report: RelatorioData | null) => void;
  onEditReport: (report: RelatorioData) => void;
  onDeleteReport: (id: number) => void;
  onResendWhatsApp: (report: RelatorioData) => void;
  isUserAdmin: boolean;
}

export default function HistoryView({
  historico, loading, selectedReport, onSelectReport, onEditReport, onDeleteReport, onResendWhatsApp, isUserAdmin
}: HistoryViewProps) {
    
  if (selectedReport) {
    return (
      <div className="p-6 animate-fade-in-up">
          <div className="flex justify-between items-center border-b pb-4 mb-4">
             <h2 className="text-xl md:text-2xl font-bold text-blue-900">📄 Visualizar Relatório</h2>
             <button onClick={() => onSelectReport(null)} className="text-sm bg-gray-200 px-3 py-1 rounded text-gray-700 hover:bg-gray-300 font-bold">FECHAR X</button>
          </div>
          
          <div className="bg-white p-6 md:p-10 rounded shadow-lg border border-gray-200 max-w-4xl mx-auto text-gray-800 text-sm md:text-base">
             <div className="text-center border-b-2 border-blue-900 pb-4 mb-6">
                 <h1 className="text-xl md:text-2xl font-bold text-blue-900 uppercase">Relatório Equipe de Segurança – CSIPRC</h1>
                 <p className="text-lg font-bold mt-2 text-gray-600">Data: {selectedReport.data}</p>
             </div>
             <div className="mb-6">
                 <h3 className="text-blue-900 font-bold border-b border-gray-300 mb-3 uppercase">👥 Equipe</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
                    <p><span className="font-bold">COORDENADOR DE SEGURANÇA:</span> {selectedReport.coordenador || 'Erasmo Leite'}</p>
                    <p><span className="font-bold">SUPERVISOR:</span> {selectedReport.supervisor}</p>
                    <p className="col-span-full"><span className="font-bold">EDUCADORES:</span> {selectedReport.educadores}</p>
                    {selectedReport.temFolga && <p className="col-span-full"><span className="font-bold text-gray-700">FOLGA:</span> {selectedReport.educadoresFolga}</p>}
                    {selectedReport.temFerias && <p className="col-span-full"><span className="font-bold text-gray-700">FÉRIAS:</span> {selectedReport.educadoresFerias}</p>}
                    {selectedReport.temApoioSemiliberdade && <p className="col-span-full"><span className="font-bold text-gray-700">APOIO SEMILIBERDADE:</span> {selectedReport.educadoresApoioSemiliberdade}</p>}
                    
                    <div className="col-span-full mt-2 border-t pt-2">
                        <p className="font-bold mb-1">EQUIPE DE APOIO:</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <p>Portaria: {selectedReport.portaria || '-'}</p>
                            <p>Cozinha: {selectedReport.cozinha || '-'}</p>
                            <p>Serv. Gerais: {selectedReport.servicosGerais || '-'}</p>
                            <p>Outros: {selectedReport.apoio || '-'}</p>
                        </div>
                    </div>
                    <p className="col-span-full mt-2"><span className="font-bold">PLANTÃO:</span> {selectedReport.plantao}</p>
                 </div>
             </div>
             
             {selectedReport.temSaida && (
                 <div className="mb-6 bg-red-50 p-4 rounded border border-red-200">
                     <h3 className="text-red-900 font-bold border-b border-red-300 mb-3 uppercase">🚨 Saída Externa</h3>
                     <p className="text-gray-900"><span className="font-bold">Adolescente:</span> {selectedReport.saidaAdolescente}</p>
                     <p className="text-gray-900"><span className="font-bold">Educador:</span> {selectedReport.saidaEducador}</p>
                     <p className="text-gray-900"><span className="font-bold">Horário:</span> {selectedReport.saidaHorario}</p>
                 </div>
             )}

             {selectedReport.temAdmissao && (
                 <div className="mb-6 bg-green-50 p-4 rounded border border-green-200">
                     <h3 className="text-green-900 font-bold border-b border-green-300 mb-3 uppercase">🆕 Admissão de Adolescente</h3>
                     {(selectedReport.admissoes || []).length > 0 ? (
                         <div className="space-y-2">
                             {(selectedReport.admissoes || []).map((adm, idx) => (
                                 <div key={idx} className="bg-white p-2 rounded shadow-sm border border-green-100 text-sm">
                                     <p className="font-bold text-gray-900">{adm.nome}</p>
                                     <div className="grid grid-cols-2 gap-2 mt-1 text-gray-600 text-xs">
                                         <p>Recebido: {adm.quemRecebeu} | Vistoria: {adm.quemVistoria}</p>
                                         <p>Origem: {adm.origem} | Horário: {adm.horario}</p>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     ) : <p className="text-gray-500 italic">Sim (sem detalhes).</p>}
                 </div>
             )}

             {selectedReport.temDesligamento && (
                 <div className="mb-6 bg-red-50 p-4 rounded border border-red-200">
                     <h3 className="text-red-900 font-bold border-b border-red-300 mb-3 uppercase">📤 Desligamento</h3>
                     {(selectedReport.desligamentos || []).length > 0 ? (
                         <div className="space-y-2">
                             {(selectedReport.desligamentos || []).map((des, idx) => (
                                 <div key={idx} className="bg-white p-2 rounded shadow-sm border border-red-100 text-sm">
                                     <p className="font-bold text-gray-900">{des.nome}</p>
                                     <div className="grid grid-cols-2 gap-2 mt-1 text-gray-600 text-xs">
                                         <p>Levou: {des.quemLevou} | Motorista: {des.motorista}</p>
                                         <p>Vistoria: {des.quemVistoria} | Horário: {des.horario}</p>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     ) : <p className="text-gray-500 italic">Sim (sem detalhes).</p>}
                 </div>
             )}

             <div className="mb-6">
                 <h3 className="text-blue-900 font-bold border-b border-gray-300 mb-3 uppercase">🔢 Adolescentes</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(selectedReport.alojamentos).map(([key, val]: any) => (
                        <div key={key} className="border-b border-gray-100 py-1">
                            <span className="font-bold text-blue-800">AL-{key}:</span> {val.qtd || '0'} adolescentes <span className="italic text-gray-500">({val.nomes || ''})</span>
                        </div>
                    ))}
                 </div>
                 <div className="mt-4 pt-2 border-t border-gray-300 text-right">
                    <span className="text-xl font-bold text-blue-900">Total: {calcularTotalAdolescentes(selectedReport)}</span>
                 </div>
             </div>

             <div className="mb-6">
                 <h3 className="text-blue-900 font-bold border-b border-gray-300 mb-3 uppercase">📝 Resumo do Plantão</h3>
                 <div className="bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-wrap min-h-[100px] text-gray-900 break-words overflow-hidden">
                    {converterParaLista(selectedReport.resumoPlantao || "Sem observações.").map((l, i) => (
                        <div key={i} className="mb-1">• {l}</div>
                    ))}
                 </div>
             </div>

             <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
                 <div>
                     <div className="border-b border-black mb-2 mx-10"></div>
                     <p className="font-bold">{selectedReport.assinaturaDiurno || "(Sem Assinatura)"}</p>
                     <p className="text-xs text-gray-500 uppercase">Supervisor Diurno</p>
                     {selectedReport.assinaturaDiurnoImg && (
                         <img src={selectedReport.assinaturaDiurnoImg} className="mt-2 h-16 mx-auto border border-gray-200" alt="Assinatura" />
                     )}
                 </div>
                 <div>
                     <div className="border-b border-black mb-2 mx-10"></div>
                     <p className="font-bold">{selectedReport.assinaturaNoturno || "(Sem Assinatura)"}</p>
                     <p className="text-xs text-gray-500 uppercase">Supervisor Noturno</p>
                     {selectedReport.assinaturaNoturnoImg && (
                         <img src={selectedReport.assinaturaNoturnoImg} className="mt-2 h-16 mx-auto border border-gray-200" alt="Assinatura" />
                     )}
                 </div>
             </div>

             {selectedReport.fotos && selectedReport.fotos.length > 0 && (
                 <div className="mt-8 border-t pt-4">
                     <h3 className="text-blue-900 font-bold mb-3 uppercase">📷 Registros Fotográficos</h3>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                         {selectedReport.fotos.map((foto, index) => (
                             <img key={index} src={foto} alt={`Foto ${index}`} className="w-full h-32 object-cover rounded border border-gray-300" />
                         ))}
                     </div>
                 </div>
             )}
          </div>
          
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 pb-8">
                <button onClick={() => onEditReport(selectedReport)} className="col-span-1 sm:col-span-2 w-full bg-yellow-500 text-white px-4 py-3 rounded-lg font-bold shadow hover:bg-yellow-600 flex items-center justify-center gap-2 border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 transition-all">
                    ✏️ EDITAR ESTE RELATÓRIO
                </button>
                <button onClick={() => onResendWhatsApp(selectedReport)} className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-bold shadow hover:bg-green-700 flex items-center justify-center gap-2">📱 Enviar WhatsApp</button>
                <button onClick={() => gerarPDF(selectedReport)} className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-bold shadow hover:bg-red-700 flex items-center justify-center gap-2">📄 Baixar PDF</button>
                <button onClick={() => gerarWord(selectedReport)} className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-bold shadow hover:bg-blue-700 flex items-center justify-center gap-2">📄 Baixar Word</button>
                {isUserAdmin && (<button onClick={() => onDeleteReport(selectedReport.id!)} className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg font-bold shadow hover:bg-black flex items-center justify-center gap-2 border border-red-500">🗑️ Excluir Relatório</button>)}
          </div>
      </div>
    );
  }

  return (
      <div className="p-6">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Histórico de Relatórios</h2>
          {loading && <p className="text-gray-900">A carregar...</p>}
          {!loading && historico.length === 0 && <p className="text-gray-500">Nenhum relatório encontrado.</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {historico.map((item) => (
                  <div key={item.id} onClick={() => onSelectReport(item)} className="cursor-pointer border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md bg-white hover:bg-blue-50 transition group">
                      <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg text-blue-800 group-hover:text-blue-600">{item.data}</h3>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">{item.plantao}</span>
                      </div>
                      <p className="text-sm text-gray-700"><strong>Supervisor:</strong> {item.supervisor}</p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-2"><em>{limparTexto(item.resumoPlantao).substring(0, 50) + "..." || "Sem resumo..."}</em></p>
                      <p className="text-xs text-blue-600 mt-2 font-bold text-right group-hover:underline">Ver completo &gt;</p>
                  </div>
              ))}
          </div>
      </div>
  );
}