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
import { toast } from 'sonner'; 
import { registrarLog } from '@/lib/logger'; 

// --- Componentes ---
import LoginForm from '@/components/Auth/LoginForm';
import AdminPanel from '@/components/Admin/AdminPanel';
import HistoryView from '@/components/History/HistoryView';
import SignaturePad from '@/components/UI/SignaturePad';
import EquipeSection from '@/components/Form/EquipeSection';
import MateriaisSection from '@/components/Form/MateriaisSection';
import AlojamentosSection from '@/components/Form/AlojamentosSection';
import OcorrenciasSection from '@/components/Form/OcorrenciasSection';
import LogsPanel from '@/components/Admin/LogsPanel';

// --- CONFIGURAÇÃO SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- CONFIGURAÇÕES GERAIS ---
const ADMIN_EMAIL = 'santos.junior12@hotmail.com'; 
const TEMPO_INATIVIDADE = 5 * 60 * 1000; 
const TEMPO_AVISO = 4.5 * 60 * 1000;

// --- DADOS PADRÃO ---
const getBaseData = (): any => ({
    data: new Date().toLocaleDateString('pt-BR'),
    coordenador: '', 
    supervisor: '', educadores: '', apoio: '', cozinha: '', servicosGerais: '', portaria: '', plantao: '',
    tonfas: '08', algemas: '03', chavesAcesso: '30', chavesAlgemas: '02', escudos: '02', lanternas: '02', celular: '01', radioCelular: '0', radioHT: '04', cadeados: '30', pendrives: '02',
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
    
    // --- CAMPOS NOVOS (INTELIGÊNCIA DE SERVIDORES) ---
    temVisita: false, responsaveisVisitas: [], responsaveisVistoria: [],
    // ---------------------------------------------------

    temSaida: false, saidas: [], saidaAdolescente: '', saidaEducador: '', saidaHorario: '',
    temAdmissao: false, admissoes: [], temDesligamento: false, desligamentos: [],
    temFolga: false, educadoresFolga: '', temFerias: false, educadoresFerias: '', temApoioSemiliberdade: false, educadoresApoioSemiliberdade: '',
    historicoEdicoes: []
});

const getTemplateVazio = (): any => ({
    ...getBaseData(),
    tonfas: '0', algemas: '0', chavesAcesso: '0', chavesAlgemas: '0', escudos: '0', lanternas: '0', celular: '0', radioCelular: '0', radioHT: '0', cadeados: '0', pendrives: '0',
    alojamentos: { '01': { qtd: '0', nomes: '' }, '02': { qtd: '0', nomes: '' }, '03': { qtd: '0', nomes: '' }, '04': { qtd: '0', nomes: '' }, '05': { qtd: '0', nomes: '' }, '06': { qtd: '0', nomes: '' }, '07': { qtd: '0', nomes: '' }, '08': { qtd: '0', nomes: '' } },
    cozinha: '', servicosGerais: '', portaria: '', educadores: '', supervisor: '', plantao: ''
});

const defaultEquipes = {
    ALFA: { supervisor: 'Rosem', educadores: 'Júnior, Wellington, Gleidson, Anderson, Francilio, Elizandria, Diego', portaria: 'Paulo', cozinha: 'Liliane', servicosGerais: 'Ana' },
    BETA: { supervisor: 'Jailson', educadores: 'Wilson/Maria José/Marcos Paulo/marciana/wrobison/Orlando', portaria: 'Paulo', cozinha: 'IVA', servicosGerais: 'Francisca' },
    BETA_NOTURNO: { supervisor: 'ADIVAN RIBEIRO SILVEIRA', educadores: 'RAILSON DA SILVA MONTEIRO, FRANCIELIO DA SILVA VICENTE, LANNYO KENNED ARAUJO BARBOSA, FRANCISCO HELIO RODRIGUES', portaria: 'Paulo', cozinha: 'IVA', servicosGerais: 'Francisca' }
};

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false); 
  
  const [view, setView] = useState<'select-plantao' | 'form' | 'history' | 'admin' | 'manage-team' | 'set-name' | 'logs'>('select-plantao');
  
  const [userName, setUserName] = useState<string>(''); 
  const [nameInput, setNameInput] = useState<string>(''); 
  
  const [historico, setHistorico] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [formData, setFormData] = useState<any>(getTemplateVazio());
  
  const [equipes, setEquipes] = useState<any>(defaultEquipes);
  const [editandoEquipe, setEditandoEquipe] = useState<'ALFA' | 'BETA' | 'BETA_NOTURNO'>('ALFA');

  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  
  const baseTextRef = useRef<string>(''); 

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('relatorios').select('*').order('created_at', { ascending: false });
    setLoading(false);
    if (data) {
      setHistorico(data.map((item: any) => ({
        ...item, data: item.data_plantao, apoio: item.apoio_geral || item.servicos_gerais || '', 
        coordenador: item.coordenador || '', 
        cozinha: item.equipe_cozinha || '',
        servicosGerais: item.equipe_servicos_gerais || '', portaria: item.equipe_portaria || '',
        resumoPlantao: item.resumo_plantao, assinaturaDiurno: item.plantao_diurno, assinaturaNoturno: item.plantao_noturno, 
        assinaturaDiurnoImg: item.assinatura_diurno_img || '', assinaturaNoturnoImg: item.assinatura_noturno_img || '',
        fotos: item.fotos || [], alojamentos: item.alojamentos || {},
        
        // --- CAMPOS NOVOS DA CARGA ---
        temVisita: item.tem_visita || false, 
        responsaveisVistoria: item.responsaveis_vistoria || [], 
        responsaveisVisitas: item.responsaveis_visitas || [],
        // -----------------------------

        temSaida: item.tem_saida || false, saidas: item.saidas || [], saidaAdolescente: item.saida_adolescente || '', saidaEducador: item.saida_educador || '', saidaHorario: item.saida_horario || '',
        temAdmissao: item.tem_admissao || false, admissoes: item.admissoes || [],
        temDesligamento: item.tem_desligamento || false, desligamentos: item.desligamentos || [],
        temFolga: item.tem_folga || false, educadoresFolga: item.educadores_folga || '',
        temFerias: item.tem_ferias || false, educadoresFerias: item.educadores_ferias || '',
        temApoioSemiliberdade: item.tem_apoio_semiliberdade || false, educadoresApoioSemiliberdade: item.educadores_apoio_semiliberdade || '',
        tonfas: item.tonfas, algemas: item.algemas, chavesAcesso: item.chaves_acesso, chavesAlgemas: item.chaves_algemas, escudos: item.escudos, lanternas: item.lanternas, celular: item.celular, radioCelular: item.radio_celular, radioHT: item.radio_ht, cadeados: item.cadeados, pendrives: item.pendrives,
        historicoEdicoes: item.historico_edicoes || []
      })));
    }
  }, []);

  useEffect(() => {
    if (session && userName) fetchHistory();
  }, [session, userName, fetchHistory]);

  useEffect(() => {
    const carregarEquipes = async () => {
      try {
        const { data, error } = await supabase
          .from('configuracoes')
          .select('valor')
          .eq('chave', 'equipes_padrao')
          .single();

        if (!error && data && data.valor) {
          const mergedEquipes = { ...defaultEquipes, ...data.valor };
          setEquipes(mergedEquipes);
          localStorage.setItem('equipes_cadastradas', JSON.stringify(mergedEquipes));
        } else {
          const equipesSalvas = localStorage.getItem('equipes_cadastradas');
          if (equipesSalvas) {
            setEquipes({ ...defaultEquipes, ...JSON.parse(equipesSalvas) });
          }
        }
      } catch (error) {
        console.error("Erro ao carregar as equipes da nuvem:", error);
      }
    };
    
    carregarEquipes();
  }, []); 

  const handleSalvarEquipes = async () => {
      setLoading(true);
      try {
          const { error } = await supabase
            .from('configuracoes')
            .upsert({ chave: 'equipes_padrao', valor: equipes }, { onConflict: 'chave' });

          if (error) throw error;

          localStorage.setItem('equipes_cadastradas', JSON.stringify(equipes));
          
          toast.success('Equipas atualizadas e sincronizadas na nuvem com sucesso!');
          registrarLog(userName, 'Atualização de Equipas', `Alterou a equipe padrão: ${editandoEquipe}`);
          
          setView('select-plantao');
          window.scrollTo(0,0);
      } catch (error: any) {
          toast.error('Ocorreu um erro ao guardar as equipas na nuvem: ' + error.message);
      } finally {
          setLoading(false);
      }
  };

  const handleSelectPlantao = (tipo: 'ALFA' | 'BETA' | 'BETA_NOTURNO') => {
      const base = getBaseData();
      const equipe = equipes[tipo] || defaultEquipes[tipo]; 
      const ultimo = historico.length > 0 ? historico[0] : null;
      
      let nomePlantao = '';
      if (tipo === 'ALFA') nomePlantao = 'Alfa Diurno';
      else if (tipo === 'BETA') nomePlantao = 'Beta Diurno';
      else if (tipo === 'BETA_NOTURNO') nomePlantao = 'Beta Noturno';

      setFormData({
          ...base,
          plantao: nomePlantao,
          coordenador: ultimo?.coordenador || base.coordenador, 
          supervisor: equipe.supervisor || '',
          educadores: equipe.educadores || '',
          portaria: equipe.portaria || '',
          cozinha: equipe.cozinha || '',
          servicosGerais: equipe.servicosGerais || '',
          tonfas: ultimo?.tonfas || base.tonfas,
          algemas: ultimo?.algemas || base.algemas,
          chavesAcesso: ultimo?.chavesAcesso || base.chavesAcesso,
          chavesAlgemas: ultimo?.chavesAlgemas || base.chavesAlgemas,
          escudos: ultimo?.escudos || base.escudos,
          lanternas: ultimo?.lanternas || base.lanternas,
          celular: ultimo?.celular || base.celular,
          radioCelular: ultimo?.radioCelular || base.radioCelular,
          radioHT: ultimo?.radioHT || base.radioHT,
          cadeados: ultimo?.cadeados || base.cadeados,
          pendrives: ultimo?.pendrives || base.pendrives,
          alojamentos: ultimo?.alojamentos || base.alojamentos,
      });
      setView('form');
      window.scrollTo(0,0);
  };

  const handleLogout = useCallback(async () => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    
    registrarLog(userName || 'Usuário', 'Logout', 'Sessão encerrada pelo usuário');
    toast.info('Sessão encerrada com segurança.');
    
    await supabase.auth.signOut();
    setSession(null); setUserName(''); setView('select-plantao'); setShowInactivityWarning(false);
  }, [userName]);

  const resetInactivityTimer = useCallback(() => {
    if (!session) return;
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    setShowInactivityWarning(false);
    warningTimerRef.current = setTimeout(() => { setShowInactivityWarning(true); }, TEMPO_AVISO);
    logoutTimerRef.current = setTimeout(() => { handleLogout(); toast.warning("Sessão expirada por segurança."); }, TEMPO_INATIVIDADE);
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
        if (!error && data.session) {
            setSession(data.session);
            const nomeSalvo = data.session.user.user_metadata?.display_name;
            if (nomeSalvo) {
                setUserName(nomeSalvo);
            } else {
                setView('set-name'); 
            }
        }
        setAuthLoading(false);
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') { 
            setSession(null); setUserName(''); setView('select-plantao'); 
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setSession(session);
            const nomeSalvo = session?.user?.user_metadata?.display_name;
            if (nomeSalvo) {
                setUserName(nomeSalvo);
                if (view === 'set-name') setView('select-plantao');
            } else {
                setView('set-name');
            }
        }
    });
    return () => { authListener.subscription.unsubscribe(); };
  }, [handleLogout]);

  const handleLogin = async (email: string, pass: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    setLoading(false);
    
    if (error) {
        toast.error("Erro no login: " + error.message);
    } else {
        toast.success("Login efetuado com sucesso!");
        registrarLog(email, 'Login', 'Acesso ao sistema');
    }
  };

  const handleRegisterUser = async (email: string, pass: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password: pass });
    setLoading(false);
    if (error) toast.error("Erro ao registrar: " + error.message); 
    else toast.success("Usuário criado com sucesso!");
  };

  const handleSaveName = async () => {
    if (!nameInput.trim()) return toast.warning("Por favor, digite um nome válido.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
        data: { display_name: nameInput.trim() }
    });
    setLoading(false);
    
    if (error) {
        toast.error("Erro ao salvar o nome: " + error.message);
    } else {
        toast.success(`Bem-vindo(a), ${nameInput.trim()}!`);
        registrarLog(nameInput.trim(), 'Perfil', 'Definiu ou alterou o nome de usuário');
        setUserName(nameInput.trim());
        setView('select-plantao');
    }
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAlojamentoChange = (id: string, field: 'qtd' | 'nomes', value: string) => {
    setFormData(prev => ({ ...prev, alojamentos: { ...prev.alojamentos, [id]: { ...prev.alojamentos[id], [field]: value } } }));
  };

  const gerenciarArray = (campo: string, index: number, field?: string, value?: string, remover?: boolean, adicionar?: boolean, novoItem?: any) => {
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
                  toast.success("Foto adicionada!");
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
    if (!SpeechRecognition) return toast.error("O seu navegador não suporta reconhecimento de voz. Tente usar o Google Chrome.");
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    recognition.interimResults = !isMobile; 

    baseTextRef.current = formData.resumoPlantao || '';

    recognition.onresult = (event: any) => {
      let textoDaSessaoAtual = '';
      for (let i = 0; i < event.results.length; i++) {
        textoDaSessaoAtual += ' ' + event.results[i][0].transcript.trim();
      }
      const textoCompleto = (baseTextRef.current + textoDaSessaoAtual).replace(/\s+/g, ' ').trim();

      setFormData(prev => ({ 
        ...prev, 
        resumoPlantao: textoCompleto
      }));
    };

    recognition.onerror = (event: any) => {
      console.error("Erro no áudio:", event.error);
      if (event.error !== 'no-speech') {
        setIsRecording(false);
      }
    };
    
    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
    toast.info("Microfone ativado. Pode falar...");
  };

  const handleDeleteReport = async (id: number) => {
    if (session?.user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        return toast.error("Acesso Negado: Apenas o administrador pode excluir relatórios.");
    }

    const confirmacao = confirm("⚠️ ATENÇÃO: Tem certeza absoluta que deseja EXCLUIR DEFINITIVAMENTE este relatório? Esta ação não pode ser desfeita.");
    if (!confirmacao) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('relatorios')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error("Erro ao excluir: " + error.message);
      } else {
        toast.success("Relatório excluído permanentemente!");
        registrarLog(userName, 'Exclusão de Relatório', `Excluiu o relatório ID: ${id}`);
        setSelectedReport(null); 
        fetchHistory(); 
      }
    } catch (err) { 
      toast.error("Erro inesperado. Verifique a sua conexão."); 
    } finally { 
      setLoading(false); 
    }
  };

  const salvarNoSupabase = async () => {
    const novoHistorico = [...(formData.historicoEdicoes || [])];
    if (formData.id) novoHistorico.push({ usuario: userName || session.user.email, dataHora: new Date().toLocaleString('pt-BR'), acao: 'Edição' });

    const payload = {
      data_plantao: formData.data, educadores: formData.educadores, supervisor: formData.supervisor, coordenador: formData.coordenador, apoio_geral: formData.apoio,
      equipe_cozinha: formData.cozinha, equipe_servicos_gerais: formData.servicosGerais, equipe_portaria: formData.portaria, plantao: formData.plantao,
      tonfas: formData.tonfas, algemas: formData.algemas, chaves_acesso: formData.chavesAcesso, chaves_algemas: formData.chavesAlgemas, escudos: formData.escudos, lanternas: formData.lanternas, celular: formData.celular, radio_celular: formData.radioCelular, radio_ht: formData.radioHT, cadeados: formData.cadeados, pendrives: formData.pendrives,
      alojamentos: formData.alojamentos, resumo_plantao: formData.resumoPlantao, plantao_diurno: formData.assinaturaDiurno, plantao_noturno: formData.assinaturaNoturno,
      assinatura_diurno_img: formData.assinaturaDiurnoImg, assinatura_noturno_img: formData.assinaturaNoturnoImg, fotos: formData.fotos,
      
      // --- SALVANDO DADOS NOVOS NO SUPABASE ---
      tem_visita: formData.temVisita,
      responsaveis_vistoria: formData.responsaveisVistoria,
      responsaveis_visitas: formData.responsaveisVisitas,
      // ----------------------------------------

      tem_saida: formData.temSaida, saidas: formData.saidas,
      tem_admissao: formData.temAdmissao, admissoes: formData.admissoes,
      tem_desligamento: formData.temDesligamento, desligamentos: formData.desligamentos,
      tem_folga: formData.temFolga, educadores_folga: formData.educadoresFolga, tem_ferias: formData.temFerias, educadores_ferias: formData.educadoresFerias,
      tem_apoio_semiliberdade: formData.temApoioSemiliberdade, educadores_apoio_semiliberdade: formData.educadoresApoioSemiliberdade,
      historico_edicoes: novoHistorico
    };

    if (formData.id) return await supabase.from('relatorios').update(payload).eq('id', formData.id).select();
    return await supabase.from('relatorios').insert([payload]).select();
  };

  useEffect(() => {
    if (view !== 'form') return;
    if (!formData.plantao) return;
    if (!formData.resumoPlantao || formData.resumoPlantao.trim().length < 5) return;

    const timer = setTimeout(async () => {
        setIsAutoSaving(true);
        const { data, error } = await salvarNoSupabase();
        
        if (!error && data && data.length > 0) {
            if (!formData.id) {
                setFormData(prev => ({ ...prev, id: data[0].id }));
            }
        }
        setIsAutoSaving(false);
    }, 2000); 

    return () => clearTimeout(timer);
  }, [formData, view]);

  const validarRelatorio = () => {
    if (!formData.resumoPlantao || formData.resumoPlantao.trim().length < 5) {
        toast.warning("O Resumo do Plantão é OBRIGATÓRIO! Preencha-o antes de guardar.");
        document.getElementById('resumo-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
    }
    return true;
  };

  const handleSalvarApenas = async () => {
    if (!validarRelatorio()) return;
    setLoading(true);
    const { error } = await salvarNoSupabase();
    setLoading(false);
    
    if (error) {
        toast.error("Erro ao salvar: " + error.message);
    } else { 
        toast.success(formData.id ? "Relatório ATUALIZADO com sucesso!" : "Relatório SALVO com sucesso!");
        registrarLog(userName, 'Salvou Relatório', formData.id ? `Atualizou o relatório do ${formData.plantao}` : `Criou um novo relatório para o ${formData.plantao}`);
        fetchHistory(); 
    }
  };

  const handleSaveAndSend = async () => {
    if (!validarRelatorio()) return;
    setLoading(true);
    const { error } = await salvarNoSupabase();
    setLoading(false);
    if (error) return toast.error("Erro ao salvar: " + error.message);
    
    toast.success("Relatório salvo! Abrindo o WhatsApp...");
    registrarLog(userName, 'Envio WhatsApp', `Salvou e enviou o relatório do ${formData.plantao}`);
    
    fetchHistory();
    const texto = gerarTextoWhatsApp(formData);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
  };

  if (authLoading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0]">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
              <p className="text-gray-600 font-bold tracking-widest uppercase text-sm animate-pulse">A preparar sistema...</p>
          </div>
      );
  }
  if (!session) return <LoginForm onLogin={handleLogin} loading={loading} />;

  const isUserAdmin = session?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const totalAtual = calcularTotalAdolescentes(formData);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-12 selection:bg-blue-200">
      
      {/* HEADER BAR */}
      <div className="sticky top-0 z-40 px-6 py-4 flex flex-wrap justify-between items-center gap-4 transition-all border-b border-white/40 bg-white/80 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-3 overflow-hidden group cursor-pointer" onClick={() => { if(userName) setView('select-plantao'); }}>
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-2.5 sm:p-3 rounded-2xl shadow-lg group-hover:scale-105 transition-all duration-300 group-hover:shadow-blue-500/30">
                <span className="text-2xl sm:text-3xl drop-shadow-md">🛡️</span>
            </div>
            
            <div className="flex flex-col justify-center">
                <h1 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 text-xl sm:text-2xl tracking-tight leading-none mb-1.5">
                    CSIPRC Segurança
                </h1>
                
                <div className="inline-flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/80 rounded-full px-2.5 py-0.5 w-fit shadow-sm">
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 tracking-wider uppercase">Desenvolvido pelo Socioeducador</span>
                    <span className="text-[10px] sm:text-[11px] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 ml-1.5 uppercase tracking-wide">
                        Júnior Santos
                    </span>
                </div>
            </div>
        </div>
        
        {userName && (
          <div className="flex items-center gap-3 flex-wrap justify-end flex-1 mt-2 sm:mt-0">

              {view === 'form' && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-gray-100 shadow-sm transition-all">
                      {isAutoSaving ? (
                          <span className="text-blue-500 flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                              A guardar...
                          </span>
                      ) : (
                          <span className="text-emerald-600 flex items-center gap-2">
                              <span className="text-lg leading-none">✓</span> {formData.id ? 'Salvo na Nuvem' : 'Aguardando...'}
                          </span>
                      )}
                  </div>
              )}

              {view === 'form' && (
                <div className="flex gap-2 bg-gray-100/80 backdrop-blur p-1.5 rounded-xl border border-gray-200">
                  <button onClick={() => { gerarWord(formData); toast.success('Gerando arquivo Word...'); }} className="bg-white text-blue-700 px-4 py-2 rounded-lg shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center gap-2 font-bold text-sm">
                    <span className="text-lg">📄</span> <span className="hidden sm:inline">Word</span>
                  </button>
                  <button onClick={() => { gerarPDF(formData); toast.success('Gerando arquivo PDF...'); }} className="bg-white text-red-600 px-4 py-2 rounded-lg shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center gap-2 font-bold text-sm">
                    <span className="text-lg">📄</span> <span className="hidden sm:inline">PDF</span>
                  </button>
                </div>
              )}
              
              {['form', 'select-plantao', 'manage-team'].includes(view) && (
                  <button onClick={() => { fetchHistory(); setView('history'); setSelectedReport(null); }} className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl hover:bg-gray-50 hover:shadow-md active:scale-95 transition-all flex items-center gap-2 font-bold text-sm">
                    📜 <span className="hidden sm:inline">Histórico</span>
                  </button>
              )}

              {['history', 'admin', 'manage-team', 'logs'].includes(view) && (
                  <button onClick={() => setView('select-plantao')} className="bg-gray-800 text-white px-5 py-2.5 rounded-xl hover:bg-gray-700 hover:shadow-lg active:scale-95 transition-all flex items-center gap-2 font-bold text-sm">
                    ⬅ Voltar
                  </button>
              )}
              
              {isUserAdmin && view !== 'logs' && view !== 'admin' && (
                <>
                  <button onClick={() => setView('logs')} className="bg-blue-100 text-blue-700 px-5 py-2.5 rounded-xl hover:bg-blue-200 active:scale-95 transition-all flex items-center gap-2 font-bold text-sm shadow-sm">
                    🕵️‍♂️ <span className="hidden sm:inline">Logs</span>
                  </button>
                  <button onClick={() => setView('admin')} className="bg-purple-100 text-purple-700 px-5 py-2.5 rounded-xl hover:bg-purple-200 active:scale-95 transition-all flex items-center gap-2 font-bold text-sm shadow-sm">
                    ⚙️ <span className="hidden sm:inline">Admin</span>
                  </button>
                </>
              )}
              
              <button onClick={handleLogout} className="bg-red-50 text-red-600 border border-red-100 px-4 py-2.5 rounded-xl font-bold hover:bg-red-600 hover:text-white hover:shadow-md hover:shadow-red-500/20 active:scale-95 transition-all duration-300 flex items-center gap-2 text-sm ml-2">
                🚪 <span className="hidden sm:inline">Sair</span>
              </button>
          </div>
        )}
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <div className="max-w-5xl mx-auto mt-8 px-4 sm:px-0">
        <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden border border-gray-100 min-h-[80vh]">
          
          {/* TELA DE IDENTIFICAÇÃO DO NOME */}
          {view === 'set-name' && (
            <div className="flex flex-col items-center justify-center min-h-[75vh] px-6 py-12 animate-fade-in-up">
              <div className="text-6xl mb-6">👋</div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-800 mb-2 text-center">Identificação no Sistema</h2>
              <p className="text-gray-500 mb-8 text-center text-lg max-w-md">
                Para manter o controle das alterações e segurança, por favor, insira o seu nome de identificação.
              </p>
              
              <div className="w-full max-w-md space-y-4">
                <input 
                  type="text" 
                  value={nameInput} 
                  onChange={(e) => setNameInput(e.target.value)} 
                  placeholder="Seu nome completo ou de guerra..." 
                  className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-lg font-bold text-gray-800 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-center shadow-inner"
                  onKeyDown={(e) => { if(e.key === 'Enter') handleSaveName(); }}
                />
                <button 
                  onClick={handleSaveName}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'A guardar...' : 'Guardar Identificação 🚀'}
                </button>
              </div>
            </div>
          )}

          {/* PAINEL DE LOGS EXCLUSIVO PARA ADMIN */}
          {view === 'logs' && userName && isUserAdmin && <LogsPanel />}

          {/* PAINEL DE ADMIN GERAL */}
          {view === 'admin' && userName && isUserAdmin && <AdminPanel onRegister={handleRegisterUser} loading={loading} />}

          {/* HISTÓRICO DE RELATÓRIOS */}
          {view === 'history' && userName && (
              <HistoryView 
                  historico={historico} loading={loading} selectedReport={selectedReport}
                  onSelectReport={setSelectedReport} onEditReport={(r) => { setFormData(r); setSelectedReport(null); setView('form'); window.scrollTo(0,0); }}
                  onDeleteReport={handleDeleteReport} onResendWhatsApp={(r) => { const txt = gerarTextoWhatsApp(r); window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(txt)}`, '_blank'); }}
                  isUserAdmin={isUserAdmin}
              />
          )}

          {/* GERENCIAMENTO DE EQUIPE */}
          {view === 'manage-team' && userName && isUserAdmin && (
            <div className="p-8 md:p-12 animate-fade-in-up">
                <div className="mb-8">
                    <h2 className="text-3xl font-black text-gray-800 flex items-center gap-3">
                        <span className="text-4xl bg-purple-100 text-purple-600 p-3 rounded-2xl shadow-sm">👥</span> 
                        Gerir Equipas Padrão
                    </h2>
                    <p className="text-gray-500 mt-2 text-sm md:text-base">
                       Atualize aqui quem está na equipa de cada plantão. <br/>
                       <span className="inline-block mt-1 text-blue-700 font-bold bg-blue-50 px-3 py-1 rounded-full border border-blue-100 text-xs shadow-sm">☁️ Sincronização Ativa</span>
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <button onClick={() => setEditandoEquipe('ALFA')} className={`flex-1 py-4 px-4 rounded-2xl font-black text-lg transition-all flex justify-center items-center gap-2 ${editandoEquipe === 'ALFA' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/30 -translate-y-1' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'}`}>
                        ☀️ ALFA
                    </button>
                    <button onClick={() => setEditandoEquipe('BETA')} className={`flex-1 py-4 px-4 rounded-2xl font-black text-lg transition-all flex justify-center items-center gap-2 ${editandoEquipe === 'BETA' ? 'bg-gradient-to-r from-emerald-400 to-green-600 text-white shadow-lg shadow-green-500/30 -translate-y-1' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'}`}>
                        🌿 BETA
                    </button>
                    <button onClick={() => setEditandoEquipe('BETA_NOTURNO')} className={`flex-1 py-4 px-4 rounded-2xl font-black text-lg transition-all flex justify-center items-center gap-2 ${editandoEquipe === 'BETA_NOTURNO' ? 'bg-gradient-to-r from-indigo-500 to-purple-700 text-white shadow-lg shadow-indigo-500/30 -translate-y-1' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'}`}>
                        🌙 BETA Noturno
                    </button>
                </div>

                <div className="bg-gray-50/50 p-6 md:p-8 rounded-3xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-inner">
                    {[
                        { label: 'Supervisor(a)', name: 'supervisor' },
                        { label: 'Educadores', name: 'educadores' },
                        { label: 'Portaria', name: 'portaria' },
                        { label: 'Equipa Cozinha', name: 'cozinha' },
                        { label: 'Serviços Gerais', name: 'servicosGerais' }
                    ].map(campo => (
                        <div key={campo.name} className={campo.name === 'educadores' ? 'md:col-span-2' : ''}>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{campo.label}</label>
                            <input 
                                type="text" 
                                value={equipes[editandoEquipe]?.[campo.name] || ''} 
                                onChange={(e) => setEquipes((prev: any) => ({...prev, [editandoEquipe]: {...prev[editandoEquipe], [campo.name]: e.target.value}}))}
                                className="w-full bg-white border border-gray-200 p-4 rounded-xl outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 text-gray-800 font-medium shadow-sm transition-all"
                                placeholder={`Nome(s) para ${campo.label.toLowerCase()}`}
                            />
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex gap-4 flex-col sm:flex-row">
                    <button onClick={() => setView('select-plantao')} className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-2xl hover:bg-gray-50 active:scale-95 transition-all shadow-sm">Cancelar</button>
                    <button onClick={handleSalvarEquipes} disabled={loading} className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 active:scale-95 transition-all text-lg disabled:opacity-50">
                        {loading ? 'A guardar...' : '💾 Guardar Atualizações'}
                    </button>
                </div>
            </div>
          )}

          {/* TELA INICIAL (SELEÇÃO DE PLANTÃO) */}
          {view === 'select-plantao' && userName && (
              <div className="flex flex-col items-center justify-center min-h-[75vh] px-6 py-12 animate-fade-in-up">
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-100 px-5 py-2 rounded-full text-xs sm:text-sm font-black tracking-widest mb-8 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> MÓDULO DE REGISTO
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-gray-800 mb-4 text-center tracking-tight leading-tight">Qual o Plantão<br/>de Hoje?</h2>
                  <p className="text-gray-500 mb-10 text-center text-lg max-w-xl">
                    Selecione o seu plantão para carregar as equipas automaticamente.
                  </p>
                  
                  {isUserAdmin && (
                    <div className="mb-10">
                        <button onClick={() => setView('manage-team')} className="flex items-center gap-2 bg-white text-purple-700 hover:bg-purple-50 active:scale-95 transition-all font-bold py-2.5 px-6 rounded-xl shadow-sm border border-purple-200 text-sm">
                            <span className="text-lg">👥</span> Editar Equipas Padrão
                        </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                      <button onClick={() => handleSelectPlantao('ALFA')} className="relative bg-gradient-to-br from-amber-400 to-orange-500 text-white p-8 rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-orange-500/40 hover:-translate-y-2 active:scale-95 transition-all duration-300 group overflow-hidden border border-orange-300">
                          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                          <div className="flex flex-col items-center gap-3 relative z-10">
                            <span className="text-6xl group-hover:scale-125 transition-transform duration-300 drop-shadow-lg">☀️</span>
                            <span className="text-4xl font-black tracking-wide mt-2">ALFA</span>
                            <span className="bg-white/30 px-5 py-1.5 rounded-full text-xs font-black tracking-widest uppercase backdrop-blur-md border border-white/40 shadow-sm">Diurno</span>
                          </div>
                      </button>
                      
                      <button onClick={() => handleSelectPlantao('BETA')} className="relative bg-gradient-to-br from-emerald-400 to-green-600 text-white p-8 rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-green-500/40 hover:-translate-y-2 active:scale-95 transition-all duration-300 group overflow-hidden border border-green-400">
                          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white opacity-20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                          <div className="flex flex-col items-center gap-3 relative z-10">
                            <span className="text-6xl group-hover:scale-125 transition-transform duration-300 drop-shadow-lg">🌿</span>
                            <span className="text-4xl font-black tracking-wide mt-2">BETA</span>
                            <span className="bg-white/30 px-5 py-1.5 rounded-full text-xs font-black tracking-widest uppercase backdrop-blur-md border border-white/40 shadow-sm">Diurno</span>
                          </div>
                      </button>

                      <button onClick={() => handleSelectPlantao('BETA_NOTURNO')} className="relative bg-gradient-to-br from-indigo-500 to-purple-700 text-white p-8 rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-2 active:scale-95 transition-all duration-300 group overflow-hidden border border-indigo-400">
                          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                          <div className="absolute top-4 left-4 text-white/20 text-4xl">✨</div>
                          <div className="flex flex-col items-center gap-3 relative z-10">
                            <span className="text-6xl group-hover:scale-125 transition-transform duration-300 drop-shadow-lg">🌙</span>
                            <span className="text-4xl font-black tracking-wide mt-2">BETA</span>
                            <span className="bg-black/20 px-5 py-1.5 rounded-full text-xs font-black tracking-widest uppercase backdrop-blur-md border border-white/20 shadow-sm text-indigo-50">Noturno</span>
                          </div>
                      </button>
                  </div>
                  
                  <button onClick={() => { setFormData(getTemplateVazio()); setView('form'); window.scrollTo(0,0); }} className="mt-12 flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-all font-bold py-3 px-6 rounded-2xl hover:bg-gray-100 active:scale-95 hover:shadow-sm border border-transparent hover:border-gray-200">
                      <span className="text-xl">✍️</span> Iniciar formulário em branco
                  </button>
              </div>
          )}

          {/* FORMULÁRIO DE REGISTRO */}
          {view === 'form' && userName && (
              <form className="p-6 md:p-10 space-y-10 animate-fade-in-up" onSubmit={(e) => e.preventDefault()}>
              
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex flex-wrap items-center gap-4">
                    <button type="button" onClick={() => setView('select-plantao')} className="bg-white border border-gray-200 text-gray-500 hover:text-gray-800 px-4 py-2 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all hover:bg-gray-100">
                        ⬅️ Trocar Plantão
                    </button>
                    <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600 shadow-sm">📅</div>
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Data do Registo</label>
                          <input type="text" name="data" value={formData.data} onChange={handleChange} className="w-36 bg-transparent font-black text-gray-800 text-lg outline-none border-b-2 border-transparent focus:border-blue-500 transition-colors" />
                        </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 hidden md:flex items-center gap-2 font-bold">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Logado(a) como: {userName}
                  </div>
              </div>

              {formData.id && (
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-l-yellow-400 border border-y-yellow-100 border-r-yellow-100 text-yellow-800 p-6 rounded-r-2xl shadow-md flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-24 z-30">
                      <div className="flex items-center gap-4">
                        <div className="bg-yellow-100 p-3 rounded-full shadow-inner text-2xl animate-pulse">✏️</div>
                        <div>
                          <p className="font-black text-yellow-900 text-lg uppercase tracking-tight">Modo de Edição Ativo</p>
                          <p className="text-sm opacity-90 font-medium">Você está alterando um relatório já salvo na base de dados.</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => { if(confirm("Deseja realmente cancelar? Todas as alterações não guardadas serão perdidas.")) setView('select-plantao'); }} className="bg-white border border-yellow-200 text-yellow-700 px-6 py-2.5 rounded-xl font-bold shadow-sm active:scale-95 hover:bg-yellow-100 transition-all w-full sm:w-auto">Cancelar Edição</button>
                  </div>
              )}
              
              <div className="space-y-8 divide-y divide-gray-100">
                <EquipeSection formData={formData} onChange={handleChange} />
                <MateriaisSection formData={formData} onChange={handleChange} />
                <AlojamentosSection 
                   formData={formData} 
                   handleAlojamentoChange={handleAlojamentoChange} 
                   totalAtual={totalAtual} 
                   setFormData={setFormData} // <-- INJEÇÃO DO NOVO SISTEMA
                />
              </div>
              
              <section id="resumo-section" className={`relative mt-12 p-8 rounded-3xl border transition-all duration-300 ${isRecording ? 'bg-blue-50/80 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'bg-gray-50 border-gray-200 shadow-inner'}`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                      <div className="flex flex-col">
                        <h3 className="flex items-center text-gray-900 font-black text-2xl tracking-tight">
                          <span className="mr-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white p-2.5 rounded-xl text-xl shadow-md shadow-blue-500/30">📝</span> 
                          Resumo do Plantão
                          <span className="text-red-500 ml-2 text-2xl leading-none" title="Campo Obrigatório">*</span>
                        </h3>
                        {isRecording ? (
                          <span className="text-blue-600 font-bold text-sm mt-2 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span> O microfone está a ouvir... 
                            <span className="hidden sm:inline">fale e aguarde a transcrição.</span>
                          </span>
                        ) : (
                          <span className="text-gray-500 font-medium text-xs mt-1 ml-14">
                            Relate as principais ocorrências. Mínimo de 5 caracteres.
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        {formData.resumoPlantao && !isRecording && (
                           <button type="button" onClick={() => { if(confirm("Tem a certeza que deseja limpar todo o resumo?")) setFormData(p => ({...p, resumoPlantao: ''})) }} className="px-4 py-2.5 text-red-500 bg-white active:scale-95 hover:bg-red-50 font-bold rounded-xl transition-all text-sm border border-red-100 shadow-sm hover:border-red-200">
                             Limpar Texto
                           </button>
                        )}
                        <button type="button" onClick={toggleRecording} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black transition-all shadow-md active:scale-95 text-base ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-red-500/40 hover:bg-red-600' : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200 hover:shadow-lg'}`}>
                            {isRecording ? <><span>⏹️</span> Parar Gravação</> : <><span>🎙️</span> Ditar por Voz</>}
                        </button>
                      </div>
                  </div>
                  
                  <textarea 
                    name="resumoPlantao" 
                    value={formData.resumoPlantao} 
                    placeholder="Fale no microfone ou clique aqui para digitar os detalhes principais da rotina, observações e alterações do plantão..." 
                    onChange={handleChange} 
                    disabled={isRecording}
                    className={`w-full bg-white border p-6 rounded-2xl h-64 outline-none transition-all text-gray-800 text-lg shadow-sm resize-y font-medium leading-relaxed ${isRecording ? 'border-blue-400 ring-4 ring-blue-100 cursor-not-allowed opacity-90' : 'border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-400'}`}
                  ></textarea>
                  
                  <div className="flex justify-end mt-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${formData.resumoPlantao.length < 5 ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                          {formData.resumoPlantao.length} / 5 caracteres mínimos
                      </span>
                  </div>
              </section>

              <OcorrenciasSection 
                  formData={formData} 
                  onChange={handleChange} 
                  gerenciarArray={gerenciarArray} 
                  setFormData={setFormData} // <-- INJEÇÃO DO NOVO SISTEMA
              />

              <section className="bg-gray-50 p-8 rounded-3xl border border-gray-200 mt-12 shadow-inner">
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="flex items-center text-gray-800 font-black text-xl">
                        <span className="mr-3 text-2xl">📷</span> Galeria de Fotos
                      </h3>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {formData.fotos.map((foto: any, idx: number) => (
                          <div key={idx} className="relative group overflow-hidden rounded-2xl shadow-sm border border-gray-200 aspect-video bg-white">
                              <img src={foto} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              <button type="button" onClick={() => { setFormData((p: any) => ({ ...p, fotos: p.fotos.filter((_: any, i: number) => i !== idx)})); toast.success("Foto removida!"); }} className="absolute top-2 right-2 bg-red-500/90 backdrop-blur text-white w-8 h-8 flex items-center justify-center rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg active:scale-90">✕</button>
                          </div>
                      ))}
                      <label className="border-2 border-dashed border-gray-300 bg-white rounded-2xl flex flex-col items-center justify-center aspect-video cursor-pointer active:scale-95 hover:bg-blue-50 hover:border-blue-400 transition-all group shadow-sm">
                          <span className="text-3xl text-gray-300 group-hover:scale-110 transition-transform group-hover:text-blue-500 mb-2">📸</span>
                          <span className="text-sm text-gray-500 font-bold group-hover:text-blue-600">Adicionar Foto</span>
                          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                  </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 p-6 md:p-8 rounded-3xl border border-gray-200 mt-8 shadow-inner">
                  <div className="space-y-4">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest block ml-1">Supervisor Diurno</label>
                      <input name="assinaturaDiurno" value={formData.assinaturaDiurno} onChange={handleChange} placeholder="Nome do Supervisor" className="w-full bg-white border border-gray-200 p-4 rounded-xl text-gray-800 font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all shadow-sm" />
                      <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                        <SignaturePad label="Assinatura Digital (Diurno)" onSave={(d) => setFormData((p: any) => ({...p, assinaturaDiurnoImg: d}))} initialImage={formData.assinaturaDiurnoImg} />
                      </div>
                  </div>
                  <div className="space-y-4">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest block ml-1">Supervisor Noturno</label>
                      <input name="assinaturaNoturno" value={formData.assinaturaNoturno} onChange={handleChange} placeholder="Nome do Supervisor" className="w-full bg-white border border-gray-200 p-4 rounded-xl text-gray-800 font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all shadow-sm" />
                      <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                        <SignaturePad label="Assinatura Digital (Noturno)" onSave={(d) => setFormData((p: any) => ({...p, assinaturaNoturnoImg: d}))} initialImage={formData.assinaturaNoturnoImg} />
                      </div>
                  </div>
              </div>
              
              <div className="mt-12 p-6 bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_-15px_40px_rgba(0,0,0,0.08)] border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 sticky bottom-4 z-40">
                  <div className="flex gap-4">
                      <button type="button" onClick={() => { gerarWord(formData); toast.success('A exportar Word...'); }} className="flex-1 bg-white text-blue-700 font-bold py-4 rounded-2xl hover:bg-blue-50 active:scale-95 transition-all border border-blue-100 shadow-sm hover:shadow-md flex items-center justify-center gap-2">
                        <span className="text-xl">📄</span> Exportar Word
                      </button>
                      <button type="button" onClick={() => { gerarPDF(formData); toast.success('A exportar PDF...'); }} className="flex-1 bg-white text-red-600 font-bold py-4 rounded-2xl hover:bg-red-50 active:scale-95 transition-all border border-red-100 shadow-sm hover:shadow-md flex items-center justify-center gap-2">
                        <span className="text-xl">📄</span> Exportar PDF
                      </button>
                  </div>
                  <div className="flex gap-4">
                      <button type="button" onClick={handleSalvarApenas} className={`flex-1 flex items-center justify-center gap-2 ${formData.id ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-orange-500/30 hover:shadow-orange-500/50' : 'bg-gray-800 hover:bg-gray-900 shadow-gray-900/30 hover:shadow-gray-900/50'} text-white font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition-all`}>
                          <span className="text-xl">💾</span> {formData.id ? 'Guardar Edição' : 'Só Guardar'}
                      </button>
                      <button type="button" onClick={handleSaveAndSend} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-green-500/30 hover:shadow-green-500/50 active:scale-95 transition-all flex items-center justify-center gap-2">
                          <span className="text-xl">📱</span> Zap + Guardar
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