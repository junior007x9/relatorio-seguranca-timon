// app/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- Imports Refatorados ---
import { RelatorioData } from '@/types';
import { calcularTotalAdolescentes } from '@/lib/utils';
import { gerarPDF } from '@/lib/pdfGenerator';
import { gerarWord } from '@/lib/wordGenerator';
import { gerarTextoWhatsApp } from '@/lib/whatsappHelper';

// --- Componentes ---
import LoginForm from '@/components/Auth/LoginForm';
import AdminPanel from '@/components/Admin/AdminPanel';
import HistoryView from '@/components/History/HistoryView';
import SignaturePad from '@/components/UI/SignaturePad';
import EquipeSection from '@/components/Form/EquipeSection';
import MateriaisSection from '@/components/Form/MateriaisSection';
import AlojamentosSection from '@/components/Form/AlojamentosSection';
import OcorrenciasSection from '@/components/Form/OcorrenciasSection';

// --- CONFIGURAÇÃO SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- CONFIGURAÇÕES GERAIS ---
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@csiprc.com'; 
const TEMPO_INATIVIDADE = 5 * 60 * 1000; 
const TEMPO_AVISO = 4.5 * 60 * 1000;

// --- TEMPLATES PREDEFINIDOS ---
const getBaseData = (): RelatorioData => ({
    data: new Date().toLocaleDateString('pt-BR'),
    coordenador: 'Erasmo Leite', supervisor: '', educadores: '', apoio: '', cozinha: '', servicosGerais: '', portaria: '', plantao: '',
    // MATERIAIS PADRÃO PARA ALFA E BETA
    tonfas: '08', algemas: '03', chavesAcesso: '30', chavesAlgemas: '02', escudos: '02', lanternas: '02', celular: '01', radioCelular: '0', radioHT: '04', cadeados: '30', pendrives: '02',
    // ALOJAMENTOS PADRÃO PARA ALFA E BETA
    alojamentos: {
        '01': { qtd: '02', nomes: 'Mateus, Felipe' },
        '02': { qtd: '02', nomes: 'Carlos, Evanderson' },
        '03': { qtd: '01', nomes: 'Pedro H.' },
        '04': { qtd: '02', nomes: 'Alex, Mickelson' },
        '05': { qtd: '02', nomes: 'Wanderson, Islei' },
        '06': { qtd: '02', nomes: 'Kauã, kauê' },
        '07': { qtd: '03', nomes: 'HenriqueG., João G., João H.' },
        '08': { qtd: '01', nomes: 'Tarcio' }
    },
    resumoPlantao: '', assinaturaDiurno: '', assinaturaNoturno: '', assinaturaDiurnoImg: '', assinaturaNoturnoImg: '', fotos: [],
    temSaida: false, saidaAdolescente: '', saidaEducador: '', saidaHorario: '',
    temAdmissao: false, admissoes: [], temDesligamento: false, desligamentos: [],
    temFolga: false, educadoresFolga: '', temFerias: false, educadoresFerias: '', temApoioSemiliberdade: false, educadoresApoioSemiliberdade: '',
    historicoEdicoes: []
});

const getTemplateAlfa = (): RelatorioData => ({
    ...getBaseData(),
    supervisor: 'Rosem',
    plantao: 'Alfa Diurno',
    educadores: 'Júnior, Wellington, Gleidson, Anderson, Francilio, Elizandria, Diego',
    portaria: 'Paulo',
    cozinha: 'Liliane',
    servicosGerais: 'Ana'
});

const getTemplateBeta = (): RelatorioData => ({
    ...getBaseData(),
    supervisor: 'Jailson',
    plantao: 'Beta Diurno',
    educadores: 'Wilson/Maria José/Marcos Paulo/marciana/wrobison/Orlando',
    portaria: 'Paulo',
    cozinha: 'IVA',
    servicosGerais: 'Francisca'
});

const getTemplateVazio = (): RelatorioData => ({
    ...getBaseData(),
    tonfas: '0', algemas: '0', chavesAcesso: '0', chavesAlgemas: '0', escudos: '0', lanternas: '0', celular: '0', radioCelular: '0', radioHT: '0', cadeados: '0', pendrives: '0',
    alojamentos: { '01': { qtd: '0', nomes: '' }, '02': { qtd: '0', nomes: '' }, '03': { qtd: '0', nomes: '' }, '04': { qtd: '0', nomes: '' }, '05': { qtd: '0', nomes: '' }, '06': { qtd: '0', nomes: '' }, '07': { qtd: '0', nomes: '' }, '08': { qtd: '0', nomes: '' } },
    cozinha: '', servicosGerais: '', portaria: '', educadores: '', supervisor: '', plantao: ''
});

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // view inicial é agora a seleção do plantão
  const [view, setView] = useState<'select-plantao' | 'form' | 'history' | 'admin'>('select-plantao');
  const [historico, setHistorico] = useState<RelatorioData[]>([]);
  const [selectedReport, setSelectedReport] = useState<RelatorioData | null>(null);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [formData, setFormData] = useState<RelatorioData>(getTemplateVazio());
  
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>(''); 

  // --- Autenticação & Sessão ---
  const handleLogout = useCallback(async () => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    await supabase.auth.signOut();
    setSession(null); setView('select-plantao'); setShowInactivityWarning(false);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (!session) return;
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    setShowInactivityWarning(false);
    warningTimerRef.current = setTimeout(() => { setShowInactivityWarning(true); }, TEMPO_AVISO);
    logoutTimerRef.current = setTimeout(() => { handleLogout(); alert("Sessão expirada por segurança."); }, TEMPO_INATIVIDADE);
  }, [session, handleLogout]);

  useEffect(() => {
    if (session) {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
        resetInactivityTimer();
        events.forEach(ev => window.addEventListener(ev, resetInactivityTimer));
        return () => { events.forEach(ev => window.removeEventListener(ev, resetInactivityTimer)); };
    }
  }, [session, resetInactivityTimer]);

  useEffect(() => {
    const checkSession = async () => {
        const { data, error } = await supabase.auth.getSession();
        if (!error) setSession(data.session);
        setAuthLoading(false);
    };
    checkSession();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') { setSession(null); setView('select-plantao'); } 
        else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') setSession(session);
    });
    return () => { authListener.subscription.unsubscribe(); };
  }, [handleLogout]);

  const handleLogin = async (email: string, pass: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    setLoading(false);
    if (error) alert("Erro: " + error.message);
  };

  const handleRegisterUser = async (email: string, pass: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password: pass });
    setLoading(false);
    if (error) alert("Erro: " + error.message); else alert("Usuário criado!");
  };

  // --- Handlers do Formulário ---
  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAlojamentoChange = (id: string, field: 'qtd' | 'nomes', value: string) => {
    setFormData(prev => ({ ...prev, alojamentos: { ...prev.alojamentos, [id]: { ...prev.alojamentos[id], [field]: value } } }));
  };

  const gerenciarArray = (campo: keyof RelatorioData, index: number, field?: string, value?: string, remover?: boolean, adicionar?: boolean, novoItem?: any) => {
      setFormData(prev => {
          const arr: any[] = [...(prev[campo] as any[]) || []];
          if (remover) arr.splice(index, 1);
          else if (adicionar) arr.push(novoItem);
          else if (field) arr[index] = { ...arr[index], [field]: value };
          return { ...prev, [campo]: arr };
      });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (event: any) => {
              const img = new Image();
              img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const MAX_WIDTH = 800;
                  const scaleSize = MAX_WIDTH / img.width;
                  canvas.width = MAX_WIDTH;
                  canvas.height = img.height * scaleSize;
                  const ctx = canvas.getContext("2d");
                  ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                  const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
                  setFormData(prev => ({ ...prev, fotos: [...(prev.fotos || []), dataUrl] }));
              };
              img.src = event.target.result;
          };
          reader.readAsDataURL(file);
      }
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Seu navegador não suporta reconhecimento de voz.");
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;
    baseTextRef.current = formData.resumoPlantao;

    recognition.onresult = (event: any) => {
      let currentSessionTranscript = '';
      for (let i = 0; i < event.results.length; ++i) currentSessionTranscript += event.results[i][0].transcript;
      setFormData(prev => ({ ...prev, resumoPlantao: (baseTextRef.current + ' ' + currentSessionTranscript).trim() }));
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  // --- Base de Dados (Supabase) ---
  const fetchHistory = async () => {
    setLoading(true);
    const { data } = await supabase.from('relatorios').select('*').order('created_at', { ascending: false });
    setLoading(false);
    if (data) {
      setHistorico(data.map((item: any) => ({
        ...item, data: item.data_plantao, apoio: item.apoio_geral || item.servicos_gerais || '', 
        coordenador: item.coordenador || 'Erasmo Leite', cozinha: item.equipe_cozinha || '',
        servicosGerais: item.equipe_servicos_gerais || '', portaria: item.equipe_portaria || '',
        resumoPlantao: item.resumo_plantao, assinaturaDiurno: item.plantao_diurno, assinaturaNoturno: item.plantao_noturno, 
        assinaturaDiurnoImg: item.assinatura_diurno_img || '', assinaturaNoturnoImg: item.assinatura_noturno_img || '',
        fotos: item.fotos || [], alojamentos: item.alojamentos || {},
        temSaida: item.tem_saida || false, saidaAdolescente: item.saida_adolescente || '', saidaEducador: item.saida_educador || '', saidaHorario: item.saida_horario || '',
        temAdmissao: item.tem_admissao || false, admissoes: item.admissoes || [],
        temDesligamento: item.tem_desligamento || false, desligamentos: item.desligamentos || [],
        temFolga: item.tem_folga || false, educadoresFolga: item.educadores_folga || '',
        temFerias: item.tem_ferias || false, educadoresFerias: item.educadores_ferias || '',
        temApoioSemiliberdade: item.tem_apoio_semiliberdade || false, educadoresApoioSemiliberdade: item.educadores_apoio_semiliberdade || '',
        tonfas: item.tonfas, algemas: item.algemas, chavesAcesso: item.chaves_acesso, chavesAlgemas: item.chaves_algemas, escudos: item.escudos, lanternas: item.lanternas, celular: item.celular, radioCelular: item.radio_celular, radioHT: item.radio_ht, cadeados: item.cadeados, pendrives: item.pendrives,
        historicoEdicoes: item.historico_edicoes || []
      })));
    }
  };

  const handleDeleteReport = async (id: number) => {
    if (session?.user?.email !== ADMIN_EMAIL) return alert("Apenas admin pode excluir.");
    const senhaDigitada = prompt("Para excluir este relatório, digite a senha de administrador:");
    if (!senhaDigitada) return;

    setLoading(true);
    try {
      const resposta = await fetch('/api/relatorios', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, senha: senhaDigitada })
      });
      const dados = await resposta.json();
      if (!resposta.ok) alert("Erro: " + dados.error);
      else { alert("🗑️ " + dados.message); setSelectedReport(null); fetchHistory(); }
    } catch (err) { alert("Erro de conexão ao tentar excluir o relatório."); } 
    finally { setLoading(false); }
  };

  const salvarNoSupabase = async () => {
    const novoHistorico = [...(formData.historicoEdicoes || [])];
    if (formData.id) novoHistorico.push({ usuario: session.user.email, dataHora: new Date().toLocaleString('pt-BR'), acao: 'Edição' });

    const payload = {
      data_plantao: formData.data, educadores: formData.educadores, supervisor: formData.supervisor, coordenador: formData.coordenador, apoio_geral: formData.apoio,
      equipe_cozinha: formData.cozinha, equipe_servicos_gerais: formData.servicosGerais, equipe_portaria: formData.portaria, plantao: formData.plantao,
      tonfas: formData.tonfas, algemas: formData.algemas, chaves_acesso: formData.chavesAcesso, chaves_algemas: formData.chavesAlgemas, escudos: formData.escudos, lanternas: formData.lanternas, celular: formData.celular, radio_celular: formData.radioCelular, radio_ht: formData.radioHT, cadeados: formData.cadeados, pendrives: formData.pendrives,
      alojamentos: formData.alojamentos, resumo_plantao: formData.resumoPlantao, plantao_diurno: formData.assinaturaDiurno, plantao_noturno: formData.assinaturaNoturno,
      assinatura_diurno_img: formData.assinaturaDiurnoImg, assinatura_noturno_img: formData.assinaturaNoturnoImg, fotos: formData.fotos,
      tem_saida: formData.temSaida, saida_adolescente: formData.saidaAdolescente, saida_educador: formData.saidaEducador, saida_horario: formData.saidaHorario,
      tem_admissao: formData.temAdmissao, admissoes: formData.admissoes,
      tem_desligamento: formData.temDesligamento, desligamentos: formData.desligamentos,
      tem_folga: formData.temFolga, educadores_folga: formData.educadoresFolga, tem_ferias: formData.temFerias, educadores_ferias: formData.educadoresFerias,
      tem_apoio_semiliberdade: formData.temApoioSemiliberdade, educadores_apoio_semiliberdade: formData.educadoresApoioSemiliberdade,
      historico_edicoes: novoHistorico
    };

    if (formData.id) return await supabase.from('relatorios').update(payload).eq('id', formData.id);
    return await supabase.from('relatorios').insert([payload]);
  };

  const handleSalvarApenas = async () => {
    setLoading(true);
    const { error } = await salvarNoSupabase();
    setLoading(false);
    if (error) alert("Erro ao salvar: " + error.message);
    else alert(formData.id ? "✅ Relatório ATUALIZADO com sucesso!" : "✅ Relatório SALVO com sucesso!");
  };

  const handleSaveAndSend = async () => {
    setLoading(true);
    const { error } = await salvarNoSupabase();
    setLoading(false);
    if (error) return alert("Erro ao salvar: " + error.message);
    const texto = gerarTextoWhatsApp(formData);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
  };

  // --- Renderização ---
  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 font-bold text-gray-900">A carregar...</div>;
  if (!session) return <LoginForm onLogin={handleLogin} loading={loading} />;

  const isUserAdmin = session.user.email === ADMIN_EMAIL;
  const totalAtual = calcularTotalAdolescentes(formData);

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-10">
      {showInactivityWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center px-4">
            <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center border-2 border-red-500 animate-pulse">
                <div className="text-4xl mb-4">⏳</div>
                <h3 className="text-xl font-bold text-red-600 mb-2">Sessão Expirando!</h3>
                <p className="text-gray-700 mb-6">Será desconectado em 30 segundos por inatividade.</p>
                <button onClick={() => setShowInactivityWarning(false)} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl w-full hover:bg-blue-700">Continuar Logado</button>
            </div>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="bg-blue-900 text-white p-3 sticky top-0 z-50 shadow-md flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2 overflow-hidden mr-2">
            <span className="text-xl">🛡️</span>
            <h1 className="font-bold text-sm sm:text-lg truncate">CSIPRC Segurança</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end flex-1">
            {view === 'form' && (
              <>
                <button onClick={() => setView('select-plantao')} className="bg-yellow-500 text-blue-900 p-2 rounded font-bold shadow-sm flex items-center" title="Novo Relatório">➕ <span className="ml-1 font-bold text-xs sm:text-sm">Novo Plantão</span></button>
                <button onClick={() => gerarWord(formData)} className="bg-white text-blue-900 p-2 rounded shadow-sm flex items-center" title="Baixar Word">📄 <span className="ml-1 font-bold text-xs sm:text-sm">Word</span></button>
                <button onClick={() => gerarPDF(formData)} className="bg-red-600 text-white p-2 rounded shadow-sm flex items-center" title="Baixar PDF">📄 <span className="ml-1 font-bold text-xs sm:text-sm">PDF</span></button>
              </>
            )}
            
            {(view === 'form' || view === 'select-plantao') && (
                <button onClick={() => { fetchHistory(); setView('history'); setSelectedReport(null); }} className="bg-blue-700 p-2 rounded hover:bg-blue-600 flex items-center" title="Histórico">📜 <span className="ml-1 text-xs sm:text-sm">Histórico</span></button>
            )}

            {(view === 'history' || view === 'admin') && (
                <button onClick={() => setView('select-plantao')} className="bg-yellow-500 text-blue-900 p-2 rounded font-bold flex items-center" title="Voltar">⬅ <span className="ml-1 text-xs sm:text-sm">Voltar</span></button>
            )}
            {isUserAdmin && view !== 'admin' && (
                <button onClick={() => setView('admin')} className="bg-purple-600 text-white p-2 rounded font-bold hover:bg-purple-700 flex items-center" title="Admin">⚙️ <span className="ml-1 text-xs sm:text-sm">Admin</span></button>
            )}
            <button onClick={handleLogout} className="bg-red-600 text-white p-2 rounded font-bold border border-red-500 ml-1 flex items-center" title="Sair">🚪 <span className="ml-1 text-xs sm:text-sm">Sair</span></button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto bg-white shadow-lg min-h-screen mt-4 rounded-xl overflow-hidden">
        
        {view === 'admin' && <AdminPanel onRegister={handleRegisterUser} loading={loading} />}

        {view === 'history' && (
            <HistoryView 
                historico={historico} loading={loading} selectedReport={selectedReport}
                onSelectReport={setSelectedReport} onEditReport={(r) => { setFormData(r); setSelectedReport(null); setView('form'); window.scrollTo(0,0); }}
                onDeleteReport={handleDeleteReport} onResendWhatsApp={(r) => { const txt = gerarTextoWhatsApp(r); window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(txt)}`, '_blank'); }}
                isUserAdmin={isUserAdmin}
            />
        )}

        {/* --- NOVA TELA DE SELEÇÃO DE PLANTÃO --- */}
        {view === 'select-plantao' && (
            <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 animate-fade-in-up">
                <h2 className="text-3xl md:text-5xl font-black text-blue-900 mb-4 text-center tracking-tight">Qual o Plantão de Hoje?</h2>
                <p className="text-gray-500 mb-12 text-center text-lg">Selecione abaixo para carregar as informações predefinidas automaticamente.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                    <button 
                        onClick={() => { setFormData(getTemplateAlfa()); setView('form'); window.scrollTo(0,0); }} 
                        className="bg-blue-600 hover:bg-blue-700 text-white p-12 rounded-3xl shadow-2xl border-b-[10px] border-blue-800 transition-all active:border-b-0 active:translate-y-3 flex flex-col items-center gap-4 group"
                    >
                        <span className="text-7xl group-hover:scale-110 transition-transform">☀️</span>
                        <span className="text-4xl font-black tracking-wide">ALFA</span>
                        <span className="text-xl font-medium opacity-90 tracking-widest uppercase">Diurno</span>
                    </button>
                    
                    <button 
                        onClick={() => { setFormData(getTemplateBeta()); setView('form'); window.scrollTo(0,0); }} 
                        className="bg-green-600 hover:bg-green-700 text-white p-12 rounded-3xl shadow-2xl border-b-[10px] border-green-800 transition-all active:border-b-0 active:translate-y-3 flex flex-col items-center gap-4 group"
                    >
                        <span className="text-7xl group-hover:scale-110 transition-transform">🌿</span>
                        <span className="text-4xl font-black tracking-wide">BETA</span>
                        <span className="text-xl font-medium opacity-90 tracking-widest uppercase">Diurno</span>
                    </button>
                </div>
                
                <button onClick={() => { setFormData(getTemplateVazio()); setView('form'); window.scrollTo(0,0); }} className="mt-12 text-gray-500 underline font-bold hover:text-gray-800 transition-colors">
                    Ou começar um relatório totalmente em branco
                </button>
            </div>
        )}

        {/* --- FORMULÁRIO PRINCIPAL --- */}
        {view === 'form' && (
            <form className="p-6 space-y-8" onSubmit={(e) => e.preventDefault()}>
            
            {formData.id && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 p-4 mb-4 rounded shadow flex justify-between items-center animate-pulse">
                    <div><p className="font-bold">⚠️ MODO DE EDIÇÃO</p><p className="text-sm">Está a alterar um relatório existente.</p></div>
                    <button onClick={() => { if(confirm("Cancelar edição?")) setView('select-plantao'); }} className="bg-white text-yellow-700 px-3 py-1 rounded border border-yellow-300 font-bold hover:bg-yellow-50 text-sm">CANCELAR</button>
                </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex justify-between items-center">
                <div><label className="block text-xs font-bold text-blue-800 uppercase mb-1">Data</label><input type="text" name="data" value={formData.data} onChange={handleChange} className="w-40 p-2 border rounded bg-white font-mono text-gray-900" /></div>
                <div className="text-xs text-blue-600 font-semibold hidden md:block">Logado como: {session.user.email}</div>
            </div>
            
            {/* Secções Limpas (agora com Lápis de edição embutido nelas) */}
            <EquipeSection formData={formData} onChange={handleChange} />
            <MateriaisSection formData={formData} onChange={handleChange} />
            <AlojamentosSection formData={formData} handleAlojamentoChange={handleAlojamentoChange} totalAtual={totalAtual} />
            
            <section className="relative mt-8">
                <div className="flex justify-between items-center border-b-2 border-blue-200 mb-4 pb-2">
                    <h3 className="flex items-center text-blue-900 font-bold text-xl"><span className="mr-2">📝</span> Resumo do Plantão</h3>
                    <button type="button" onClick={toggleRecording} className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold shadow transition ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-blue-100 text-blue-900 hover:bg-blue-200'}`}>
                        {isRecording ? <><span>⏹️</span> A gravar...</> : <><span>🎙️</span> Usar Microfone</>}
                    </button>
                </div>
                <textarea name="resumoPlantao" value={formData.resumoPlantao} placeholder="Fale ou digite aqui os detalhes principais do plantão..." onChange={handleChange} className="w-full border p-3 rounded h-40 mb-6 outline-none text-lg text-gray-900"></textarea>
            </section>

            <OcorrenciasSection formData={formData} onChange={handleChange} gerenciarArray={gerenciarArray} />

            <section className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-8">
                <h3 className="text-blue-900 font-bold text-lg mb-4">📷 Fotos</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {formData.fotos.map((foto, idx) => (
                        <div key={idx} className="relative group">
                            <img src={foto} className="w-full h-24 object-cover rounded border" />
                            <button type="button" onClick={() => setFormData(p => ({ ...p, fotos: p.fotos.filter((_, i) => i !== idx)}))} className="absolute top-0 right-0 bg-red-600 text-white p-1 rounded-bl text-xs font-bold">X</button>
                        </div>
                    ))}
                    <label className="border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center h-24 cursor-pointer hover:bg-gray-100">
                        <span className="text-2xl text-gray-400">+</span><span className="text-xs text-gray-500">Adicionar</span>
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200 mt-8">
                <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-500 uppercase block">Nome Supervisor Diurno</label>
                    <input name="assinaturaDiurno" value={formData.assinaturaDiurno} onChange={handleChange} className="w-full border p-2 rounded text-gray-900" />
                    <SignaturePad label="Assinatura Digital (Diurno)" onSave={(d) => setFormData(p => ({...p, assinaturaDiurnoImg: d}))} initialImage={formData.assinaturaDiurnoImg} />
                </div>
                <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-500 uppercase block">Nome Supervisor Noturno</label>
                    <input name="assinaturaNoturno" value={formData.assinaturaNoturno} onChange={handleChange} className="w-full border p-2 rounded text-gray-900" />
                    <SignaturePad label="Assinatura Digital (Noturno)" onSave={(d) => setFormData(p => ({...p, assinaturaNoturnoImg: d}))} initialImage={formData.assinaturaNoturnoImg} />
                </div>
            </div>
            
            <div className="pt-6 pb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-2">
                    <button type="button" onClick={() => gerarWord(formData)} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl shadow hover:bg-blue-700">📄 Word</button>
                    <button type="button" onClick={() => gerarPDF(formData)} className="flex-1 bg-red-600 text-white font-bold py-4 rounded-xl shadow hover:bg-red-700">📄 PDF</button>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={handleSalvarApenas} className={`flex-1 ${formData.id ? 'bg-yellow-600' : 'bg-gray-700'} text-white font-bold py-4 rounded-xl shadow`}>
                        {formData.id ? '💾 Salvar Alteração' : '💾 Salvar Novo'}
                    </button>
                    <button type="button" onClick={handleSaveAndSend} className="flex-1 bg-green-600 text-white font-bold py-4 rounded-xl shadow">📱 Zap + Salvar</button>
                </div>
            </div>
            </form>
        )}
      </div>
    </div>
  );
}