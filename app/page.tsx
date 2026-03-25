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
  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] font-bold text-gray-900">Carregando...</div>;
  if (!session) return <LoginForm onLogin={handleLogin} loading={loading} />;

  const isUserAdmin = session.user.email === ADMIN_EMAIL;
  const totalAtual = calcularTotalAdolescentes(formData);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-12 selection:bg-blue-200">
      
      {showInactivityWarning && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center px-4 animate-fade-in-up">
            <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border-t-4 border-red-500">
                <div className="text-6xl mb-4 animate-bounce">⏳</div>
                <h3 className="text-2xl font-black text-gray-800 mb-2">Sessão Expirando!</h3>
                <p className="text-gray-500 mb-8">Você será desconectado em 30 segundos por inatividade de segurança.</p>
                <button onClick={() => setShowInactivityWarning(false)} className="bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold py-3 px-6 rounded-xl w-full hover:shadow-lg hover:-translate-y-1 transition-all active:translate-y-0">
                  Continuar Logado
                </button>
            </div>
        </div>
      )}

      {/* HEADER BAR (Glassmorphism) */}
      <div className="glass-panel sticky top-0 z-40 px-6 py-4 flex flex-wrap justify-between items-center gap-4 transition-all">
        <div className="flex items-center gap-3 overflow-hidden group cursor-pointer" onClick={() => setView('select-plantao')}>
            <span className="text-2xl group-hover:scale-110 transition-transform bg-blue-100 p-2 rounded-xl">🛡️</span>
            <h1 className="font-black text-gray-800 text-lg sm:text-xl tracking-tight">CSIPRC Segurança</h1>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap justify-end flex-1">
            {view === 'form' && (
              <div className="flex gap-2 bg-gray-100/50 p-1.5 rounded-xl border border-gray-200">
                <button onClick={() => gerarWord(formData)} className="bg-white text-blue-700 px-4 py-2 rounded-lg shadow-sm hover:shadow-md hover:scale-105 transition-all flex items-center gap-2 font-bold text-sm">
                  <span className="text-lg">📄</span> <span className="hidden sm:inline">Word</span>
                </button>
                <button onClick={() => gerarPDF(formData)} className="bg-white text-red-600 px-4 py-2 rounded-lg shadow-sm hover:shadow-md hover:scale-105 transition-all flex items-center gap-2 font-bold text-sm">
                  <span className="text-lg">📄</span> <span className="hidden sm:inline">PDF</span>
                </button>
              </div>
            )}
            
            {(view === 'form' || view === 'select-plantao') && (
                <button onClick={() => { fetchHistory(); setView('history'); setSelectedReport(null); }} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all flex items-center gap-2 font-bold text-sm">
                  📜 <span className="hidden sm:inline">Histórico</span>
                </button>
            )}

            {(view === 'history' || view === 'admin') && (
                <button onClick={() => setView('select-plantao')} className="bg-gray-800 text-white px-4 py-2 rounded-xl hover:bg-gray-700 hover:shadow-md transition-all flex items-center gap-2 font-bold text-sm">
                  ⬅ Voltar
                </button>
            )}
            
            {isUserAdmin && view !== 'admin' && (
                <button onClick={() => setView('admin')} className="bg-purple-100 text-purple-700 px-4 py-2 rounded-xl hover:bg-purple-200 hover:scale-105 transition-all flex items-center gap-2 font-bold text-sm">
                  ⚙️ <span className="hidden sm:inline">Admin</span>
                </button>
            )}
            
            <button onClick={handleLogout} className="bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all duration-300 flex items-center gap-2 text-sm ml-2">
              🚪 <span className="hidden sm:inline">Sair</span>
            </button>
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <div className="max-w-5xl mx-auto mt-8 px-4 sm:px-0">
        <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden border border-gray-100 min-h-[80vh]">
          
          {view === 'admin' && <AdminPanel onRegister={handleRegisterUser} loading={loading} />}

          {view === 'history' && (
              <HistoryView 
                  historico={historico} loading={loading} selectedReport={selectedReport}
                  onSelectReport={setSelectedReport} onEditReport={(r) => { setFormData(r); setSelectedReport(null); setView('form'); window.scrollTo(0,0); }}
                  onDeleteReport={handleDeleteReport} onResendWhatsApp={(r) => { const txt = gerarTextoWhatsApp(r); window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(txt)}`, '_blank'); }}
                  isUserAdmin={isUserAdmin}
              />
          )}

          {/* --- NOVA TELA DE SELEÇÃO DE PLANTÃO (MODERNA) --- */}
          {view === 'select-plantao' && (
              <div className="flex flex-col items-center justify-center min-h-[75vh] px-6 py-12 animate-fade-in-up">
                  <div className="inline-block bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide mb-6">
                    MÓDULO DE REGISTRO
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-gray-800 mb-4 text-center tracking-tight">Qual o Plantão de Hoje?</h2>
                  <p className="text-gray-500 mb-12 text-center text-lg max-w-xl">
                    Selecione o plantão abaixo para carregar as informações predefinidas e economizar tempo na digitação.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
                      <button 
                          onClick={() => { setFormData(getTemplateAlfa()); setView('form'); window.scrollTo(0,0); }} 
                          className="relative bg-gradient-to-br from-blue-500 to-blue-700 text-white p-10 rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-2 transition-all duration-300 group overflow-hidden"
                      >
                          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                          <div className="flex flex-col items-center gap-3 relative z-10">
                            <span className="text-6xl group-hover:scale-110 transition-transform duration-300 drop-shadow-md">☀️</span>
                            <span className="text-4xl font-black tracking-wide mt-2">ALFA</span>
                            <span className="bg-white/20 px-4 py-1 rounded-full text-sm font-bold tracking-widest uppercase backdrop-blur-sm">Diurno</span>
                          </div>
                      </button>
                      
                      <button 
                          onClick={() => { setFormData(getTemplateBeta()); setView('form'); window.scrollTo(0,0); }} 
                          className="relative bg-gradient-to-br from-emerald-500 to-teal-700 text-white p-10 rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-2 transition-all duration-300 group overflow-hidden"
                      >
                          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                          <div className="flex flex-col items-center gap-3 relative z-10">
                            <span className="text-6xl group-hover:scale-110 transition-transform duration-300 drop-shadow-md">🌿</span>
                            <span className="text-4xl font-black tracking-wide mt-2">BETA</span>
                            <span className="bg-white/20 px-4 py-1 rounded-full text-sm font-bold tracking-widest uppercase backdrop-blur-sm">Diurno</span>
                          </div>
                      </button>
                  </div>
                  
                  <button onClick={() => { setFormData(getTemplateVazio()); setView('form'); window.scrollTo(0,0); }} className="mt-12 flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-colors font-semibold py-2 px-4 rounded-xl hover:bg-gray-100">
                      <span>✍️</span> Iniciar relatório em branco
                  </button>
              </div>
          )}

          {/* --- FORMULÁRIO PRINCIPAL --- */}
          {view === 'form' && (
              <form className="p-6 md:p-10 space-y-10 animate-fade-in-up" onSubmit={(e) => e.preventDefault()}>
              
              {formData.id && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl animate-pulse">⚠️</span>
                        <div>
                          <p className="font-black text-yellow-900">MODO DE EDIÇÃO ATIVO</p>
                          <p className="text-sm opacity-90">As alterações substituirão os dados do relatório existente.</p>
                        </div>
                      </div>
                      <button onClick={() => { if(confirm("Cancelar edição? Todas as alterações não salvas serão perdidas.")) setView('select-plantao'); }} className="bg-white text-yellow-700 px-5 py-2.5 rounded-xl font-bold shadow-sm hover:bg-yellow-100 transition-colors w-full sm:w-auto">Cancelar Edição</button>
                  </div>
              )}

              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">📅</div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Data do Plantão</label>
                      <input type="text" name="data" value={formData.data} onChange={handleChange} className="w-36 bg-transparent font-black text-gray-800 text-lg outline-none border-b-2 border-transparent focus:border-blue-500 transition-colors" />
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 hidden md:flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    {session.user.email}
                  </div>
              </div>
              
              <div className="space-y-8 divide-y divide-gray-100">
                <EquipeSection formData={formData} onChange={handleChange} />
                <MateriaisSection formData={formData} onChange={handleChange} />
                <AlojamentosSection formData={formData} handleAlojamentoChange={handleAlojamentoChange} totalAtual={totalAtual} />
              </div>
              
              <section className="relative mt-12 bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <h3 className="flex items-center text-blue-900 font-black text-2xl tracking-tight">
                        <span className="mr-3 bg-blue-600 text-white p-2 rounded-xl text-lg shadow-md shadow-blue-500/30">📝</span> 
                        Resumo do Plantão
                      </h3>
                      <button type="button" onClick={toggleRecording} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-red-500/40' : 'bg-white text-blue-700 hover:bg-blue-100 border border-blue-200'}`}>
                          {isRecording ? <><span>⏹️</span> Gravando...</> : <><span>🎙️</span> Ditar por Voz</>}
                      </button>
                  </div>
                  <textarea name="resumoPlantao" value={formData.resumoPlantao} placeholder="Fale ou digite aqui os detalhes principais e observações gerais do plantão..." onChange={handleChange} className="w-full bg-white border border-gray-200 p-5 rounded-2xl h-48 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all text-gray-800 text-lg shadow-inner resize-none"></textarea>
              </section>

              <OcorrenciasSection formData={formData} onChange={handleChange} gerenciarArray={gerenciarArray} />

              <section className="bg-gray-50 p-6 rounded-3xl border border-gray-200 mt-12">
                  <h3 className="flex items-center text-gray-800 font-black text-xl mb-6">
                    <span className="mr-2">📷</span> Galeria de Fotos
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {formData.fotos.map((foto, idx) => (
                          <div key={idx} className="relative group overflow-hidden rounded-2xl shadow-sm border border-gray-200 aspect-video">
                              <img src={foto} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              <button type="button" onClick={() => setFormData(p => ({ ...p, fotos: p.fotos.filter((_, i) => i !== idx)}))} className="absolute top-2 right-2 bg-red-500/90 backdrop-blur text-white w-8 h-8 flex items-center justify-center rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg">X</button>
                          </div>
                      ))}
                      <label className="border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center aspect-video cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-all group">
                          <span className="text-3xl text-gray-400 group-hover:scale-125 transition-transform group-hover:text-blue-500 mb-1">+</span>
                          <span className="text-sm text-gray-500 font-semibold group-hover:text-blue-600">Adicionar Foto</span>
                          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                  </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 p-6 md:p-8 rounded-3xl border border-gray-200 mt-8">
                  <div className="space-y-4">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Supervisor Diurno</label>
                      <input name="assinaturaDiurno" value={formData.assinaturaDiurno} onChange={handleChange} placeholder="Nome do Supervisor" className="w-full bg-white border border-gray-200 p-4 rounded-xl text-gray-800 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" />
                      <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                        <SignaturePad label="Assinatura Digital (Diurno)" onSave={(d) => setFormData(p => ({...p, assinaturaDiurnoImg: d}))} initialImage={formData.assinaturaDiurnoImg} />
                      </div>
                  </div>
                  <div className="space-y-4">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Supervisor Noturno</label>
                      <input name="assinaturaNoturno" value={formData.assinaturaNoturno} onChange={handleChange} placeholder="Nome do Supervisor" className="w-full bg-white border border-gray-200 p-4 rounded-xl text-gray-800 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" />
                      <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                        <SignaturePad label="Assinatura Digital (Noturno)" onSave={(d) => setFormData(p => ({...p, assinaturaNoturnoImg: d}))} initialImage={formData.assinaturaNoturnoImg} />
                      </div>
                  </div>
              </div>
              
              {/* Barra de Ações Final (Sticky Bottom effect) */}
              <div className="mt-12 p-6 bg-white rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex gap-4">
                      <button type="button" onClick={() => gerarWord(formData)} className="flex-1 bg-blue-50 text-blue-700 font-bold py-4 rounded-2xl hover:bg-blue-100 hover:-translate-y-1 transition-all border border-blue-100 flex items-center justify-center gap-2">
                        <span className="text-xl">📄</span> Gerar Word
                      </button>
                      <button type="button" onClick={() => gerarPDF(formData)} className="flex-1 bg-red-50 text-red-600 font-bold py-4 rounded-2xl hover:bg-red-100 hover:-translate-y-1 transition-all border border-red-100 flex items-center justify-center gap-2">
                        <span className="text-xl">📄</span> Gerar PDF
                      </button>
                  </div>
                  <div className="flex gap-4">
                      <button type="button" onClick={handleSalvarApenas} className={`flex-1 flex items-center justify-center gap-2 ${formData.id ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' : 'bg-gray-800 hover:bg-gray-900 shadow-gray-900/30'} text-white font-bold py-4 rounded-2xl shadow-xl hover:-translate-y-1 transition-all`}>
                          <span className="text-xl">💾</span> {formData.id ? 'Salvar Edição' : 'Apenas Salvar'}
                      </button>
                      <button type="button" onClick={handleSaveAndSend} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-green-500/30 hover:shadow-green-500/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                          <span className="text-xl">📱</span> Zap + Salvar
                      </button>
                  </div>
              </div>
              </form>
          )}
        </div>
      </div>
    </div>
  );
}