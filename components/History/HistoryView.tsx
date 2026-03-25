// components/History/HistoryView.tsx
'use client';

import { useState } from 'react';
import { RelatorioData } from '@/types';
import { gerarWord } from '@/lib/wordGenerator';
import { gerarPDF } from '@/lib/pdfGenerator';

interface HistoryProps {
    historico: RelatorioData[];
    loading: boolean;
    selectedReport: RelatorioData | null;
    onSelectReport: (report: RelatorioData | null) => void;
    onEditReport: (report: RelatorioData) => void;
    onDeleteReport: (id: number) => void;
    onResendWhatsApp: (report: RelatorioData) => void;
    isUserAdmin: boolean;
}

export default function HistoryView({ historico, loading, selectedReport, onSelectReport, onEditReport, onDeleteReport, onResendWhatsApp, isUserAdmin }: HistoryProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredHistory = historico.filter(r => 
        r.data.includes(searchTerm) || 
        r.plantao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.supervisor?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-10 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight">📜 Histórico de Plantões</h2>
                    <p className="text-gray-500 mt-1 text-sm md:text-base">Consulte, edite ou exporte relatórios anteriores.</p>
                </div>
                
                <div className="relative w-full md:w-72">
                    <span className="absolute left-3 top-3 text-gray-400">🔍</span>
                    <input 
                        type="text" 
                        placeholder="Buscar por data, plantão..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-gray-200 pl-10 pr-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20 text-blue-600 font-bold text-xl animate-pulse">
                    ⏳ Carregando histórico...
                </div>
            ) : filteredHistory.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-200 border-dashed">
                    <span className="text-5xl mb-4 block">📭</span>
                    <p className="text-gray-500 text-lg font-medium">Nenhum relatório encontrado.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {filteredHistory.map((report, idx) => (
                        <div key={idx} className="bg-white p-5 md:p-6 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 hover:border-blue-200 transition-all duration-300 group flex flex-col justify-between cursor-pointer" onClick={() => onSelectReport(report)}>
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="bg-blue-50 text-blue-700 font-black px-3 py-1 rounded-lg text-sm tracking-wide border border-blue-100">
                                        {report.data}
                                    </span>
                                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
                                        {report.plantao || 'Sem Plantão'}
                                    </span>
                                </div>
                                <h3 className="font-bold text-gray-800 text-lg mb-1">{report.supervisor || 'Sem Supervisor'}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2">{report.resumoPlantao || 'Nenhum resumo adicionado...'}</p>
                            </div>
                            
                            <div className="mt-6 flex items-center justify-center w-full bg-gray-50 text-blue-600 font-bold py-2.5 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors text-sm">
                                Ver Detalhes ➔
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL DE DETALHES COM TODOS OS BOTÕES */}
            {selectedReport && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in-up">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto border border-gray-100 flex flex-col">
                        <div className="sticky top-0 bg-white/95 backdrop-blur-md p-5 md:p-6 border-b border-gray-100 flex justify-between items-center z-10">
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-gray-800">Detalhes do Plantão</h3>
                                <p className="text-sm text-gray-500">{selectedReport.data} - {selectedReport.plantao}</p>
                            </div>
                            <button onClick={() => onSelectReport(null)} className="bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors shadow-sm">✕</button>
                        </div>
                        
                        <div className="p-5 md:p-6 space-y-6 flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                                <div><span className="block text-xs font-black text-blue-400 uppercase tracking-wider mb-1">Supervisor</span><span className="font-bold text-blue-900 text-lg">{selectedReport.supervisor}</span></div>
                                <div><span className="block text-xs font-black text-blue-400 uppercase tracking-wider mb-1">Coordenador</span><span className="font-bold text-blue-900 text-lg">{selectedReport.coordenador}</span></div>
                                <div className="sm:col-span-2"><span className="block text-xs font-black text-blue-400 uppercase tracking-wider mb-1">Equipa de Educadores</span><span className="text-blue-800 font-medium">{selectedReport.educadores}</span></div>
                            </div>
                            
                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                <h4 className="font-black text-gray-800 border-b border-gray-200 pb-2 mb-3 flex items-center gap-2">📝 Resumo do Plantão</h4>
                                <p className="text-gray-700 whitespace-pre-wrap text-sm md:text-base leading-relaxed">{selectedReport.resumoPlantao || 'Sem resumo registrado.'}</p>
                            </div>
                        </div>
                        
                        {/* BARRA DE AÇÕES (Totalmente Responsiva) */}
                        <div className="sticky bottom-0 bg-white p-4 md:p-6 border-t border-gray-100 rounded-b-3xl shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2 md:gap-3">
                                <button onClick={() => gerarWord(selectedReport)} className="bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold py-3 px-2 md:px-4 rounded-xl transition-all border border-blue-100 hover:border-blue-600 flex items-center justify-center gap-1 md:gap-2 text-sm">
                                    <span className="text-lg">📄</span> <span className="hidden xs:inline">Word</span>
                                </button>
                                <button onClick={() => gerarPDF(selectedReport)} className="bg-red-50 hover:bg-red-600 hover:text-white text-red-600 font-bold py-3 px-2 md:px-4 rounded-xl transition-all border border-red-100 hover:border-red-600 flex items-center justify-center gap-1 md:gap-2 text-sm">
                                    <span className="text-lg">📄</span> <span className="hidden xs:inline">PDF</span>
                                </button>
                                <button onClick={() => onResendWhatsApp(selectedReport)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-2 md:px-4 rounded-xl transition-all shadow-md shadow-green-500/20 flex items-center justify-center gap-1 md:gap-2 text-sm col-span-2 sm:col-span-1">
                                    <span className="text-lg">📱</span> Zap
                                </button>
                                <button onClick={() => onEditReport(selectedReport)} className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-2 md:px-4 rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1 md:gap-2 text-sm flex-1">
                                    <span className="text-lg">✏️</span> Editar
                                </button>
                                {isUserAdmin && selectedReport.id && (
                                    <button onClick={() => onDeleteReport(selectedReport.id as number)} className="bg-white hover:bg-red-600 text-red-600 hover:text-white font-bold py-3 px-2 md:px-4 rounded-xl border border-red-200 hover:border-transparent transition-all flex items-center justify-center gap-1 md:gap-2 text-sm">
                                        <span className="text-lg">🗑️</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}