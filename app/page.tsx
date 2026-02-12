'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
  WidthType, AlignmentType, BorderStyle, Header, ImageRun
} from 'docx';
import { saveAs } from 'file-saver';

// @ts-ignore
import pdfMake from "pdfmake/build/pdfmake";
// @ts-ignore
import pdfFonts from "pdfmake/build/vfs_fonts";

if (typeof window !== 'undefined' && pdfMake.vfs === undefined) {
  // @ts-ignore
  pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;
}

// --- CONFIGURAÇÃO SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- CONFIGURAÇÕES GERAIS ---
const ADMIN_EMAIL = 'admin@csiprc.com'; 
const SENHA_EXCLUSAO = '1234';
const TEMPO_INATIVIDADE = 5 * 60 * 1000; 
const TEMPO_AVISO = 4.5 * 60 * 1000;

// --- TIPAGEM DE DADOS ---
type AlojamentoDados = { qtd: string; nomes: string; };
type HistoricoEdicao = { usuario: string; dataHora: string; acao: string; }; 

type RelatorioData = {
  id?: number; created_at?: string; data: string; supervisor: string; educadores: string; apoio: string; plantao: string;
  tonfas: string; algemas: string; chavesAcesso: string; chavesAlgemas: string; escudos: string; lanternas: string;
  celular: string; radioCelular: string; radioHT: string; cadeados: string; pendrives: string;
  alojamentos: { [key: string]: AlojamentoDados };
  resumoPlantao: string; assinaturaDiurno: string; assinaturaNoturno: string;
  // NOVOS CAMPOS
  assinaturaDiurnoImg: string; 
  assinaturaNoturnoImg: string;
  fotos: string[]; // Array de Base64
  
  temSaida: boolean; saidaAdolescente: string; saidaEducador: string; saidaHorario: string;
  temFolga: boolean; educadoresFolga: string;
  temFerias: boolean; educadoresFerias: string;
  coordenador: string;
  portaria: string;
  cozinha: string;
  servicosGerais: string;
  temApoioSemiliberdade: boolean;
  educadoresApoioSemiliberdade: string;
  historicoEdicoes: HistoricoEdicao[];
};

const INITIAL_FORM_DATA: RelatorioData = {
    data: new Date().toLocaleDateString('pt-BR'),
    coordenador: 'Erasmo Leite', 
    supervisor: '', educadores: '', 
    apoio: '', cozinha: '', servicosGerais: '', portaria: '',
    plantao: '',
    tonfas: '0', algemas: '0', chavesAcesso: '0', chavesAlgemas: '0', escudos: '0', lanternas: '0',
    celular: '0', radioCelular: '0', radioHT: '0', cadeados: '0', pendrives: '0',
    alojamentos: {
      '01': { qtd: '0', nomes: '' }, '02': { qtd: '0', nomes: '' }, '03': { qtd: '0', nomes: '' }, '04': { qtd: '0', nomes: '' },
      '05': { qtd: '0', nomes: '' }, '06': { qtd: '0', nomes: '' }, '07': { qtd: '0', nomes: '' }, '08': { qtd: '0', nomes: '' }
    },
    resumoPlantao: '', assinaturaDiurno: '', assinaturaNoturno: '',
    // INICIALIZAÇÃO NOVOS CAMPOS
    assinaturaDiurnoImg: '', assinaturaNoturnoImg: '', fotos: [],
    
    temSaida: false, saidaAdolescente: '', saidaEducador: '', saidaHorario: '',
    temFolga: false, educadoresFolga: '',
    temFerias: false, educadoresFerias: '',
    temApoioSemiliberdade: false, educadoresApoioSemiliberdade: '',
    historicoEdicoes: []
};

// --- COMPONENTE DE ASSINATURA (CANVAS) ---
// Este componente cria a área de desenho
const SignaturePad = ({ label, onSave, initialImage }: { label: string, onSave: (data: string) => void, initialImage: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Carrega assinatura se já existir (modo edição)
    useEffect(() => {
        if (initialImage && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            const img = new Image();
            img.onload = () => ctx?.drawImage(img, 0, 0);
            img.src = initialImage;
        }
    }, [initialImage]);

    const getCoords = (e: any) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        // Suporte para Mouse e Touch (Celular)
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDrawing = (e: any) => {
        setIsDrawing(true);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            const { x, y } = getCoords(e);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#000';
        }
    };

    const draw = (e: any) => {
        if (!isDrawing || !canvasRef.current) return;
        if(e.type === 'touchmove') e.preventDefault(); // Evita scroll da tela ao assinar
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            const { x, y } = getCoords(e);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    };

    const endDrawing = () => {
        if (isDrawing && canvasRef.current) {
            setIsDrawing(false);
            // Salva a imagem em base64
            onSave(canvasRef.current.toDataURL("image/png"));
        }
    };

    const clear = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && canvasRef.current) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            onSave('');
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
            <div className="border-2 border-gray-300 rounded bg-white touch-none">
                <canvas 
                    ref={canvasRef} 
                    width={300} 
                    height={150} 
                    className="w-full cursor-crosshair bg-white"
                    onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={endDrawing} onMouseLeave={endDrawing}
                    onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={endDrawing}
                />
            </div>
            <button type="button" onClick={clear} className="text-xs text-red-600 font-bold underline self-end">Limpar Assinatura</button>
        </div>
    );
};

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
   
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'form' | 'history' | 'admin'>('form');
  const [historico, setHistorico] = useState<RelatorioData[]>([]);
  const [selectedReport, setSelectedReport] = useState<RelatorioData | null>(null);
   
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>(''); 

  const [formData, setFormData] = useState<RelatorioData>(INITIAL_FORM_DATA);

  const calcularTotalAdolescentes = (dados: RelatorioData) => {
    return Object.values(dados.alojamentos).reduce((acc, curr) => {
      const qtd = parseInt(curr.qtd) || 0;
      return acc + qtd;
    }, 0);
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Seu navegador não suporta reconhecimento de voz. Tente usar o Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;

    baseTextRef.current = formData.resumoPlantao;

    recognition.onresult = (event: any) => {
      let currentSessionTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        currentSessionTranscript += event.results[i][0].transcript;
      }
      setFormData(prev => ({
        ...prev,
        resumoPlantao: (baseTextRef.current + ' ' + currentSessionTranscript).trim()
      }));
    };

    recognition.onerror = (event: any) => {
      console.error("Erro no reconhecimento de voz:", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const handleLogout = useCallback(async () => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    await supabase.auth.signOut();
    setSession(null);
    setView('form');
    setShowInactivityWarning(false);
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
        events.forEach(event => window.addEventListener(event, resetInactivityTimer));
        return () => {
            events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
            if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
            if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        };
    }
  }, [session, resetInactivityTimer]);

  useEffect(() => {
    const checkSession = async () => {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            console.error("Erro sessão:", error.message);
            if (error.message.includes("Refresh Token")) handleLogout();
        } else {
            setSession(data.session);
        }
        setAuthLoading(false);
    };
    checkSession();
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') { setSession(null); setView('form'); } 
        else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') { setSession(session); }
    });
    return () => { authListener.subscription.unsubscribe(); };
  }, [handleLogout]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    setLoading(false);
    if (error) alert("Erro: " + error.message);
  };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signUp({ email: newUserEmail, password: newUserPassword });
    setLoading(false);
    if (error) alert("Erro: " + error.message); else { alert("Usuário criado!"); setNewUserEmail(''); setNewUserPassword(''); }
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleAlojamentoChange = (id: string, field: 'qtd' | 'nomes', value: string) => {
    setFormData(prev => ({ ...prev, alojamentos: { ...prev.alojamentos, [id]: { ...prev.alojamentos[id], [field]: value } } }));
  };

  const handleEditReport = (report: RelatorioData) => {
    setFormData({ ...report });
    setSelectedReport(null);
    setView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
      if(confirm("Tem certeza que deseja cancelar a edição? Os dados não salvos serão perdidos.")) {
          setFormData(INITIAL_FORM_DATA);
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

  // --- LÓGICA DE UPLOAD DE FOTOS ---
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (event: any) => {
              const img = new Image();
              img.onload = () => {
                  // Redimensiona imagem para economizar espaço no banco (Max 800px)
                  const canvas = document.createElement('canvas');
                  const MAX_WIDTH = 800;
                  const scaleSize = MAX_WIDTH / img.width;
                  canvas.width = MAX_WIDTH;
                  canvas.height = img.height * scaleSize;
                  const ctx = canvas.getContext("2d");
                  ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                  // Comprime para JPEG 70%
                  const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
                  setFormData(prev => ({ ...prev, fotos: [...prev.fotos, dataUrl] }));
              };
              img.src = event.target.result;
          };
          reader.readAsDataURL(file);
      }
  };

  const removePhoto = (index: number) => {
      setFormData(prev => ({ ...prev, fotos: prev.fotos.filter((_, i) => i !== index) }));
  };

  const carregarImagemBuffer = async (url: string) => { try { const r = await fetch(url); if (!r.ok) return null; const b = await r.blob(); return await b.arrayBuffer(); } catch { return null; } };
  const getBase64ImageFromURL = (url: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image(); img.setAttribute("crossOrigin", "anonymous");
      img.onload = () => { const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const ctx = c.getContext("2d"); ctx?.drawImage(img, 0, 0); resolve(c.toDataURL("image/png")); };
      img.onerror = () => resolve(null); img.src = url;
    });
  };

  // --- LIMPEZA DE TEXTO (Mantida a versão corrigida do último prompt) ---
  const limparTexto = (texto: string) => {
      if (!texto) return "";
      const limpo = texto
        .replace(/[^\w\sÀ-ÿ.,;:\-()\/%@!?:'"\n]/g, "") 
        .replace(/As1|Asl|As\|/g, "Às")   
        .replace(/As\s/g, "Às ") 
        .replace(/[ \t]+/g, " ");
      return limpo.trim();
  };

  const converterParaLista = (texto: string) => {
      if (!texto) return [];
      const limpo = limparTexto(texto);
      const linhas = limpo.split(/\n/);
      return linhas.filter(l => l.trim().length > 0).map(l => l.trim());
  };

  const gerarTextoWhatsApp = (dados: RelatorioData) => {
    const total = calcularTotalAdolescentes(dados);
    let texto = `*RELATÓRIO EQUIPE DE SEGURANÇA - CSIPRC*\n📅 Data: ${dados.data}\n`;
    texto += `\n*👮 COORDENAÇÃO*\nCoordenador de Segurança: ${dados.coordenador}\nSupervisor: ${dados.supervisor}`;
    // ... (restante do código do whatsapp igual)
    texto += `\n\n*👥 EDUCADORES*\n${dados.educadores}`;
    if (dados.temFolga) texto += `\n🏖️ Folga: ${dados.educadoresFolga}`;
    if (dados.temFerias) texto += `\n✈️ Férias: ${dados.educadoresFerias}`;
    if (dados.temApoioSemiliberdade) texto += `\n🔄 Apoio Semiliberdade: ${dados.educadoresApoioSemiliberdade}`;
    texto += `\n\n*🤝 EQUIPE DE APOIO*`;
    texto += `\nPortaria: ${dados.portaria || '-'}`;
    texto += `\nCozinha: ${dados.cozinha || '-'}`;
    texto += `\nServ. Gerais: ${dados.servicosGerais || '-'}`;
    texto += `\nOutros Apoios: ${dados.apoio || '-'}`;
    texto += `\n\n🕒 Plantão: ${dados.plantao}`;
    if (dados.temSaida) { 
        texto += `\n\n*🚨 SAÍDA EXTERNA*\n👤 Adolescente: ${dados.saidaAdolescente}\n👮 Educador: ${dados.saidaEducador}\n⏰ Horário: ${dados.saidaHorario}`; 
    }
    texto += `\n\n*🛡️ MATERIAIS*`;
    texto += `\n🔹 Tonfas: ${dados.tonfas || '0'} | Algemas: ${dados.algemas || '0'}`;
    texto += `\n🔹 Celular: ${dados.celular || '0'} | Rádio HT: ${dados.radioHT || '0'}`;
    texto += `\n🔹 Chaves Acesso: ${dados.chavesAcesso || '0'} | Chaves Algema: ${dados.chavesAlgemas || '0'}`;
    texto += `\n🔹 Cadeados: ${dados.cadeados || '0'} | Pendrives: ${dados.pendrives || '0'}`;
    texto += `\n🔹 Escudos: ${dados.escudos || '0'} | Lanternas: ${dados.lanternas || '0'}`;
    texto += `\n🔹 Rádio Cel: ${dados.radioCelular || '0'}`;
    texto += `\n\n*🔢 ADOLESCENTES*`;
    ['01', '02', '03', '04', '05', '06', '07', '08'].forEach(num => {
        const al = dados.alojamentos[num];
        if (al) { texto += `\n🏠 AL-${num}: ${al.qtd || '0'} ${al.nomes ? `(${al.nomes})` : ''}`; }
    });
    texto += `\n\n*TOTAL: ${total} adolescentes*`;
    
    // Lista Limpa
    const linhasResumo = converterParaLista(dados.resumoPlantao);
    texto += `\n\n*📝 RESUMO DO PLANTÃO*\n` + (linhasResumo.length > 0 ? linhasResumo.map(l => `• ${l}`).join('\n') : 'Sem observações.');
    texto += `\n\n*✍️ ASSINATURAS*\n☀️ Diurno: ${dados.assinaturaDiurno}\n🌙 Noturno: ${dados.assinaturaNoturno}`;
    return texto;
  };

  // --- GERADOR PDF COM FOTOS E ASSINATURAS ---
  const gerarPDF = async (dataToPrint?: RelatorioData) => {
    const dados = dataToPrint || formData;
    const total = calcularTotalAdolescentes(dados);

    try {
      const logoBase64 = await getBase64ImageFromURL('/logo.png');
      const contentArray: any[] = [
          logoBase64 ? { image: logoBase64, width: 320, alignment: 'center', margin: [0, 0, 0, 5] } : {},
          { text: 'RELATÓRIO EQUIPE DE SEGURANÇA – CSIPRC', style: 'header', alignment: 'center' },
          { text: `Data: ${dados.data}`, style: 'subheader', alignment: 'center', margin: [0, 0, 0, 10] }, 
          {
            columns: [
              { width: '*', stack: [
                { text: [{ text: 'COORDENADOR: ', bold: true }, dados.coordenador], fontSize: 10 },
                { text: [{ text: 'SUPERVISOR: ', bold: true }, dados.supervisor], fontSize: 10 },
              ]},
              { width: '*', stack: [
                 { text: [{ text: 'PLANTÃO: ', bold: true }, dados.plantao], fontSize: 10 },
                 { text: [{ text: 'EDUCADORES: ', bold: true }, dados.educadores], fontSize: 10 }
              ]}
            ], margin: [0, 2]
          }
      ];

      const extras = [];
      if (dados.temFolga) extras.push({ text: `FOLGA: ${dados.educadoresFolga}`, fontSize: 9 });
      if (dados.temFerias) extras.push({ text: `FÉRIAS: ${dados.educadoresFerias}`, fontSize: 9 });
      if (dados.temApoioSemiliberdade) extras.push({ text: `APOIO SEMI: ${dados.educadoresApoioSemiliberdade}`, fontSize: 9 });
      if(extras.length > 0) contentArray.push({ columns: extras, margin: [0, 2] });

      contentArray.push(
          { text: 'EQUIPE DE APOIO', style: 'sectionHeader', alignment: 'center' },
          { columns: [
              { width: '*', text: [{ text: 'Portaria: ', bold: true }, dados.portaria || '-'], fontSize: 10 },
              { width: '*', text: [{ text: 'Cozinha: ', bold: true }, dados.cozinha || '-'], fontSize: 10 },
              { width: '*', text: [{ text: 'Serv. Gerais: ', bold: true }, dados.servicosGerais || '-'], fontSize: 10 },
              { width: '*', text: [{ text: 'Outros: ', bold: true }, dados.apoio || '-'], fontSize: 10 }
          ], margin: [0, 2] }
      );

      if (dados.temSaida) {
        contentArray.push(
            { text: 'SAÍDA EXTERNA', style: 'sectionHeader', alignment: 'center', color: 'red' },
            { columns: [{ width: '*', text: [{ text: 'Adolescente: ', bold: true }, dados.saidaAdolescente], fontSize: 10 }, { width: '*', text: [{ text: 'Horário: ', bold: true }, dados.saidaHorario], fontSize: 10 }], margin: [0, 2] },
            { text: [{ text: 'Educador Responsável: ', bold: true }, dados.saidaEducador], margin: [0, 0, 0, 5], fontSize: 10 }
        );
      }

      contentArray.push(
          { text: 'MATERIAIS DE SEGURANÇA', style: 'sectionHeader', alignment: 'center' },
          {
            style: 'tableExample',
            table: {
              widths: ['*', 'auto', '*', 'auto'],
              body: [
                [{ text: 'ITEM', bold: true, fillColor: '#eeeeee', fontSize: 9 }, { text: 'QTD', bold: true, fillColor: '#eeeeee', fontSize: 9 }, { text: 'ITEM', bold: true, fillColor: '#eeeeee', fontSize: 9 }, { text: 'QTD', bold: true, fillColor: '#eeeeee', fontSize: 9 }],
                ['Tonfas', dados.tonfas || '0', 'Celular + Carregador', dados.celular || '0'],
                ['Algemas', dados.algemas || '0', 'Rádio Celular', dados.radioCelular || '0'],
                ['Chaves Acesso', dados.chavesAcesso || '0', 'Rádio HT', dados.radioHT || '0'],
                ['Chaves Algemas', dados.chavesAlgemas || '0', 'Cadeados', dados.cadeados || '0'],
                ['Escudos', dados.escudos || '0', 'Pendrives', dados.pendrives || '0'],
                ['Lanternas', dados.lanternas || '0', '', ''],
              ]
            }, layout: 'lightHorizontalLines', margin: [0, 2, 0, 5]
          },
          { text: 'ADOLESCENTES POR ALOJAMENTO', style: 'sectionHeader', alignment: 'center' }
      );

      const alojamentosLeft = [];
      const alojamentosRight = [];
      ['01', '02', '03', '04'].forEach(num => alojamentosLeft.push({ text: [{ text: `AL-${num}: `, bold: true }, { text: `${dados.alojamentos[num].qtd || '0'} - ` }, { text: dados.alojamentos[num].nomes || '', italics: true }], fontSize: 9, margin: [0, 1] }));
      ['05', '06', '07', '08'].forEach(num => alojamentosRight.push({ text: [{ text: `AL-${num}: `, bold: true }, { text: `${dados.alojamentos[num].qtd || '0'} - ` }, { text: dados.alojamentos[num].nomes || '', italics: true }], fontSize: 9, margin: [0, 1] }));

      contentArray.push({
          columns: [
              { width: '*', stack: alojamentosLeft as any },
              { width: '*', stack: alojamentosRight as any }
          ]
      });

      contentArray.push({ text: `TOTAL DE ADOLESCENTES: ${total}`, bold: true, alignment: 'right', fontSize: 11, margin: [0, 2, 0, 5], color: '#1e3a8a' });

      contentArray.push({ text: 'RESUMO DO PLANTÃO', style: 'sectionHeader', alignment: 'center', margin: [0, 5, 0, 2] });
      
      const linhasResumo = converterParaLista(dados.resumoPlantao);
      if (linhasResumo.length > 0) {
          contentArray.push({ ul: linhasResumo, fontSize: 10, margin: [10, 0, 0, 10], alignment: 'justify' });
      } else {
          contentArray.push({ text: "Sem observações.", fontSize: 10, alignment: 'center', margin: [0, 0, 0, 10] });
      }

      // --- ASSINATURAS (IMAGENS) ---
      contentArray.push({ 
          unbreakable: true, 
          stack: [
            { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1 }], margin: [0, 0, 0, 10] },
            {
                columns: [
                    { width: '*', stack: [
                        dados.assinaturaDiurnoImg ? { image: dados.assinaturaDiurnoImg, width: 100, alignment: 'center' } : {},
                        { text: '_________________________', alignment: 'center' },
                        { text: dados.assinaturaDiurno || '(Sem nome)', bold: true, alignment: 'center', fontSize: 9 },
                        { text: 'Supervisor Diurno', alignment: 'center', fontSize: 8 }
                    ]},
                    { width: '*', stack: [
                        dados.assinaturaNoturnoImg ? { image: dados.assinaturaNoturnoImg, width: 100, alignment: 'center' } : {},
                        { text: '_________________________', alignment: 'center' },
                        { text: dados.assinaturaNoturno || '(Sem nome)', bold: true, alignment: 'center', fontSize: 9 },
                        { text: 'Supervisor Noturno', alignment: 'center', fontSize: 8 }
                    ]}
                ]
            }
          ]
      });

      // --- FOTOS ANEXADAS ---
      if (dados.fotos && dados.fotos.length > 0) {
          contentArray.push({ text: 'REGISTROS FOTOGRÁFICOS', style: 'sectionHeader', alignment: 'center', pageBreak: 'before', margin: [0, 10, 0, 10] });
          const fotosGrid = [];
          // Agrupa fotos em pares
          for (let i = 0; i < dados.fotos.length; i += 2) {
              const row = {
                  columns: [
                      { image: dados.fotos[i], width: 250, margin: [0, 5, 5, 5] },
                      dados.fotos[i+1] ? { image: dados.fotos[i+1], width: 250, margin: [5, 5, 0, 5] } : {}
                  ]
              };
              fotosGrid.push(row);
          }
          contentArray.push(fotosGrid);
      }

      const docDefinition: any = { 
          pageSize: 'A4', 
          pageMargins: [15, 15, 15, 15], 
          content: contentArray, 
          defaultStyle: { fontSize: 10 },
          styles: { 
              header: { fontSize: 16, bold: true, margin: [0, 0, 0, 2] }, 
              subheader: { fontSize: 12, bold: true }, 
              sectionHeader: { fontSize: 11, bold: true, decoration: 'underline', margin: [0, 5, 0, 2] }, 
              tableExample: { margin: [0, 2, 0, 5] } 
          } 
      };
      pdfMake.createPdf(docDefinition).download(`Relatorio_PDF_${dados.data.replace(/\//g, '-')}.pdf`);
    } catch { alert("Erro ao gerar PDF."); }
  };

  // --- GERADOR WORD COM FOTOS E ASSINATURAS ---
  const gerarWord = async (dataToPrint?: RelatorioData) => {
    const dados = dataToPrint || formData;
    const total = calcularTotalAdolescentes(dados);

    try {
        const logoBuffer = await carregarImagemBuffer('/logo.png');
        const cellStyle = { borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } }, margins: { top: 50, bottom: 50, left: 50, right: 50 } };
        const noSpacing = { after: 0, before: 0 }; 
        
        const childrenParagraphs = [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: "RELATÓRIO EQUIPE DE SEGURANÇA – CSIPRC", bold: true, size: 24 }) ], spacing: noSpacing }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: `Data: ${dados.data}`, bold: true, size: 20 }) ], spacing: { after: 100 } }),
              
              new Paragraph({ children: [new TextRun({ text: "COORDENADOR: ", bold: true }), new TextRun(dados.coordenador + " | "), new TextRun({ text: "SUPERVISOR: ", bold: true }), new TextRun(dados.supervisor)], spacing: noSpacing }),
              new Paragraph({ children: [new TextRun({ text: "EDUCADORES: ", bold: true }), new TextRun(dados.educadores)], spacing: noSpacing }),
        ];

        // ... (Dados extras) ...
        if (dados.temFolga) childrenParagraphs.push(new Paragraph({ children: [new TextRun({ text: "FOLGA: ", bold: true }), new TextRun(dados.educadoresFolga)], spacing: noSpacing }));
        if (dados.temFerias) childrenParagraphs.push(new Paragraph({ children: [new TextRun({ text: "FÉRIAS: ", bold: true }), new TextRun(dados.educadoresFerias)], spacing: noSpacing }));
        if (dados.temApoioSemiliberdade) childrenParagraphs.push(new Paragraph({ children: [new TextRun({ text: "APOIO SEMI: ", bold: true }), new TextRun(dados.educadoresApoioSemiliberdade)], spacing: noSpacing }));

        childrenParagraphs.push(
              new Paragraph({ text: "" }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "EQUIPE DE APOIO", bold: true, underline: {} })], spacing: noSpacing }),
              new Paragraph({ children: [new TextRun({ text: "Portaria: ", bold: true }), new TextRun(dados.portaria || "-" + " | "), new TextRun({ text: "Cozinha: ", bold: true }), new TextRun(dados.cozinha || "-")], spacing: noSpacing }),
              new Paragraph({ children: [new TextRun({ text: "Serv. Gerais: ", bold: true }), new TextRun(dados.servicosGerais || "-" + " | "), new TextRun({ text: "Outros: ", bold: true }), new TextRun(dados.apoio || "-")], spacing: noSpacing }),
              new Paragraph({ children: [new TextRun({ text: "PLANTÃO: ", bold: true }), new TextRun(dados.plantao)], spacing: { after: 100 } }),
        );

        if (dados.temSaida) {
            childrenParagraphs.push(
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SAÍDA EXTERNA", bold: true, underline: {}, color: "FF0000" })], spacing: noSpacing }),
                new Paragraph({ children: [new TextRun({ text: "Adolescente: ", bold: true }), new TextRun(dados.saidaAdolescente + " | "), new TextRun({ text: "Horário: ", bold: true }), new TextRun(dados.saidaHorario)], spacing: noSpacing }),
                new Paragraph({ children: [new TextRun({ text: "Educador: ", bold: true }), new TextRun(dados.saidaEducador)], spacing: { after: 100 } }),
            );
        }

        childrenParagraphs.push(
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "MATERIAIS DE SEGURANÇA", bold: true, underline: {} })], spacing: { after: 50 } }),
              new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
                  new TableRow({ children: [ new TableCell({ children: [new Paragraph({ text: "ITEM", bold: true, size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: "QTD", bold: true, size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: "ITEM", bold: true, size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: "QTD", bold: true, size: 18 })], ...cellStyle }) ] }),
                  new TableRow({ children: [ new TableCell({ children: [new Paragraph({ text: "Tonfas", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: dados.tonfas || "0", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: "Celular + Carregador", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: dados.celular || "0", size: 18 })], ...cellStyle }) ] }),
                  new TableRow({ children: [ new TableCell({ children: [new Paragraph({ text: "Algemas", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: dados.algemas || "0", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: "Rádio Celular", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: dados.radioCelular || "0", size: 18 })], ...cellStyle }) ] }),
                  new TableRow({ children: [ new TableCell({ children: [new Paragraph({ text: "Chaves Acesso", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: dados.chavesAcesso || "0", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: "Rádio HT", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: dados.radioHT || "0", size: 18 })], ...cellStyle }) ] }),
                  new TableRow({ children: [ new TableCell({ children: [new Paragraph({ text: "Chaves Algema", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: dados.chavesAlgemas || "0", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: "Cadeados", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: dados.cadeados || "0", size: 18 })], ...cellStyle }) ] }),
                  new TableRow({ children: [ new TableCell({ children: [new Paragraph({ text: "Escudos", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: dados.escudos || "0", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: "Pendrives", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: dados.pendrives || "0", size: 18 })], ...cellStyle }) ] }),
                  new TableRow({ children: [ new TableCell({ children: [new Paragraph({ text: "Lanternas", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: dados.lanternas || "0", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: "", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: "", size: 18 })], ...cellStyle }) ] })
              ] }),
              new Paragraph({ text: "" }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ADOLESCENTES POR ALOJAMENTO", bold: true, underline: {} })], spacing: noSpacing })
        );

        ['01', '02', '03', '04', '05', '06', '07', '08'].forEach(num => {
            if (dados.alojamentos[num].qtd && dados.alojamentos[num].qtd !== '0') {
               childrenParagraphs.push(new Paragraph({ children: [ new TextRun({ text: `AL-${num}: `, bold: true, size: 18 }), new TextRun({ text: `${dados.alojamentos[num].qtd} - `, size: 18 }), new TextRun({ text: dados.alojamentos[num].nomes || '', italics: true, size: 18 }) ], spacing: noSpacing }));
            }
        });

        childrenParagraphs.push(
            new Paragraph({ alignment: AlignmentType.RIGHT, children: [ new TextRun({ text: `TOTAL: ${total}`, bold: true, size: 22 }) ], spacing: { before: 50, after: 50 } })
        );

        childrenParagraphs.push(
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "RESUMO DO PLANTÃO", bold: true, underline: {} })], keepNext: true, spacing: noSpacing })
        );

        // --- CORREÇÃO WORD: LISTA DE TÓPICOS ---
        const linhasResumo = converterParaLista(dados.resumoPlantao);

        if (linhasResumo.length > 0) {
            linhasResumo.forEach(linha => {
                childrenParagraphs.push(
                    new Paragraph({ 
                        children: [new TextRun({ text: linha, size: 18 })], 
                        bullet: { level: 0 }, 
                        spacing: { after: 100 }
                    })
                );
            });
        } else {
            childrenParagraphs.push(new Paragraph({ children: [new TextRun({ text: "Sem observações.", size: 18 })] }));
        }

        childrenParagraphs.push(
              new Paragraph({ text: "\n", keepNext: true, spacing: noSpacing }), 
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "___________________________        ___________________________" })], keepNext: true, spacing: noSpacing }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: `${dados.assinaturaDiurno || "(Sem nome)"}             ${dados.assinaturaNoturno || "(Sem nome)"}`, bold: true, size: 16 }) ], keepNext: true, spacing: noSpacing }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Supervisor Diurno                      Supervisor Noturno", size: 14 })], keepNext: true })
        );

        // --- FOTOS NO WORD ---
        if(dados.fotos && dados.fotos.length > 0) {
            childrenParagraphs.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ANEXOS FOTOGRÁFICOS", bold: true, size: 20 })], pageBreakBefore: true }));
            
            for(const foto of dados.fotos) {
                // Word requer imagem como Buffer/Blob
                const res = await fetch(foto);
                const buff = await res.blob();
                childrenParagraphs.push(new Paragraph({ children: [new ImageRun({ data: await buff.arrayBuffer(), transformation: { width: 400, height: 300 } })], alignment: AlignmentType.CENTER }));
                childrenParagraphs.push(new Paragraph({ text: "\n" }));
            }
        }

        const doc = new Document({ sections: [{ properties: { page: { margin: { top: 500, bottom: 500, left: 500, right: 500 } } } as any, headers: { default: new Header({ children: [ new Paragraph({ alignment: AlignmentType.CENTER, children: [ logoBuffer ? new ImageRun({ data: new Uint8Array(logoBuffer), transformation: { width: 650, height: 160 } }) : new TextRun("") ] }), new Paragraph({ text: "" }) ] }) }, children: childrenParagraphs }] });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `Relatorio_${dados.data.replace(/\//g, '-')}.docx`);
    } catch { alert("Erro ao criar o arquivo do Word."); }
  };

  const fetchHistory = async () => {
    setLoading(true);
    const { data } = await supabase.from('relatorios').select('*').order('created_at', { ascending: false });
    setLoading(false);
    if (data) {
      setHistorico(data.map((item: any) => ({
        ...item, 
        data: item.data_plantao, 
        apoio: item.apoio_geral || item.servicos_gerais || '', 
        supervisor: item.supervisor,
        coordenador: item.coordenador || 'Erasmo Leite',
        cozinha: item.equipe_cozinha || '',
        servicosGerais: item.equipe_servicos_gerais || '',
        portaria: item.equipe_portaria || '',
        resumoPlantao: item.resumo_plantao, 
        assinaturaDiurno: item.plantao_diurno, 
        assinaturaNoturno: item.plantao_noturno, 
        
        // Mapeamento novos campos
        assinaturaDiurnoImg: item.assinatura_diurno_img || '',
        assinaturaNoturnoImg: item.assinatura_noturno_img || '',
        fotos: item.fotos || [],

        alojamentos: item.alojamentos || {},
        temSaida: item.tem_saida || false, 
        saidaAdolescente: item.saida_adolescente || '', 
        saidaEducador: item.saida_educador || '', 
        saidaHorario: item.saida_horario || '',
        temFolga: item.tem_folga || false, 
        educadoresFolga: item.educadores_folga || '',
        temFerias: item.tem_ferias || false, 
        educadoresFerias: item.educadores_ferias || '',
        temApoioSemiliberdade: item.tem_apoio_semiliberdade || false, 
        educadoresApoioSemiliberdade: item.educadores_apoio_semiliberdade || '',
        tonfas: item.tonfas,
        algemas: item.algemas,
        chavesAcesso: item.chaves_acesso,
        chavesAlgemas: item.chaves_algemas,
        escudos: item.escudos,
        lanternas: item.lanternas,
        celular: item.celular,
        radioCelular: item.radio_celular,
        radioHT: item.radio_ht,
        cadeados: item.cadeados,
        pendrives: item.pendrives,
        historicoEdicoes: item.historico_edicoes || []
      })));
    }
  };

  const handleDeleteReport = async (id: number) => {
    if (session?.user?.email !== ADMIN_EMAIL) { alert("Apenas admin."); return; }
    if (prompt("Para excluir, digite a senha:") !== SENHA_EXCLUSAO) { alert("Senha incorreta."); return; }
    setLoading(true);
    const { error } = await supabase.from('relatorios').delete().eq('id', id);
    setLoading(false);
    if (error) alert("Erro: " + error.message); else { alert("Excluído!"); setSelectedReport(null); fetchHistory(); }
  };

  const salvarNoSupabase = async () => {
    const novoHistorico = [...(formData.historicoEdicoes || [])];
    if (formData.id) {
        novoHistorico.push({
            usuario: session.user.email,
            dataHora: new Date().toLocaleString('pt-BR'),
            acao: 'Edição'
        });
    }

    const payload = {
      data_plantao: formData.data, educadores: formData.educadores, supervisor: formData.supervisor, 
      coordenador: formData.coordenador, 
      apoio_geral: formData.apoio,
      equipe_cozinha: formData.cozinha,
      equipe_servicos_gerais: formData.servicosGerais,
      equipe_portaria: formData.portaria,
      plantao: formData.plantao,
      tonfas: formData.tonfas, algemas: formData.algemas, chaves_acesso: formData.chavesAcesso, chaves_algemas: formData.chavesAlgemas, escudos: formData.escudos, lanternas: formData.lanternas, celular: formData.celular, radio_celular: formData.radioCelular, radio_ht: formData.radioHT, cadeados: formData.cadeados, pendrives: formData.pendrives,
      alojamentos: formData.alojamentos, resumo_plantao: formData.resumoPlantao, plantao_diurno: formData.assinaturaDiurno, plantao_noturno: formData.assinaturaNoturno,
      
      // NOVOS CAMPOS SALVOS
      assinatura_diurno_img: formData.assinaturaDiurnoImg,
      assinatura_noturno_img: formData.assinaturaNoturnoImg,
      fotos: formData.fotos,

      tem_saida: formData.temSaida, saida_adolescente: formData.saidaAdolescente, saida_educador: formData.saidaEducador, saida_horario: formData.saidaHorario,
      tem_folga: formData.temFolga, educadores_folga: formData.educadoresFolga,
      tem_ferias: formData.temFerias, educadores_ferias: formData.educadoresFerias,
      tem_apoio_semiliberdade: formData.temApoioSemiliberdade, educadores_apoio_semiliberdade: formData.educadoresApoioSemiliberdade,
      historico_edicoes: novoHistorico
    };

    if (formData.id) {
        return await supabase.from('relatorios').update(payload).eq('id', formData.id);
    } else {
        return await supabase.from('relatorios').insert([payload]);
    }
  };

  const handleSalvarApenas = async () => {
    setLoading(true);
    const { error } = await salvarNoSupabase();
    setLoading(false);
    if (error) {
        alert("Erro ao salvar: " + error.message);
    } else {
        alert(formData.id ? "✅ Relatório ATUALIZADO com sucesso!" : "✅ Relatório SALVO com sucesso!");
    }
  };

  const handleSaveAndSend = async () => {
    setLoading(true);
    const { error } = await salvarNoSupabase();
    setLoading(false);
    if (error) { alert("Erro ao salvar: " + error.message); return; }
    const texto = gerarTextoWhatsApp(formData);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const handleResendWhatsApp = (report: RelatorioData) => {
    const texto = gerarTextoWhatsApp(report);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 font-bold text-gray-900">Carregando...</div>;

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-center mb-6"><div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center text-4xl">🛡️</div></div>
            <h1 className="text-2xl font-bold text-center text-blue-900 mb-2">CSIPRC Segurança</h1>
            <p className="text-center text-gray-500 mb-8 text-sm">Faça login para acessar</p>
            <form onSubmit={handleLogin} className="space-y-4">
                <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">E-mail</label><input type="email" required className="w-full p-3 border rounded-lg outline-none text-gray-900" placeholder="usuario@csiprc.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} /></div>
                <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Senha</label><input type="password" required className="w-full p-3 border rounded-lg outline-none text-gray-900" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} /></div>
                <button disabled={loading} className="w-full bg-blue-900 text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition">{loading ? 'Entrando...' : 'Entrar'}</button>
            </form>
        </div>
      </div>
    );
  }

  const isUserAdmin = session.user.email === ADMIN_EMAIL;
  const totalAtual = calcularTotalAdolescentes(formData);

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-10">
      
      {showInactivityWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center px-4">
            <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center border-2 border-red-500 animate-pulse">
                <div className="text-4xl mb-4">⏳</div>
                <h3 className="text-xl font-bold text-red-600 mb-2">Sessão Expirando!</h3>
                <p className="text-gray-700 mb-6">Você será desconectado em 30 segundos por inatividade.</p>
                <button onClick={() => { setShowInactivityWarning(false); }} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl w-full hover:bg-blue-700">Continuar Logado</button>
            </div>
        </div>
      )}

      <div className="bg-blue-900 text-white p-3 sticky top-0 z-50 shadow-md flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2 overflow-hidden mr-2">
            <span className="text-xl">🛡️</span>
            <h1 className="font-bold text-sm sm:text-lg truncate">CSIPRC Segurança</h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end flex-1">
            {view === 'form' && (
              <>
                <button onClick={() => gerarWord(formData)} className="bg-white text-blue-900 p-2 rounded shadow-sm flex items-center" title="Baixar Word">
                    📄 <span className="ml-1 font-bold text-xs sm:text-sm">Word</span>
                </button>
                <button onClick={() => gerarPDF(formData)} className="bg-red-600 text-white p-2 rounded shadow-sm flex items-center" title="Baixar PDF">
                    📄 <span className="ml-1 font-bold text-xs sm:text-sm">PDF</span>
                </button>
                <button onClick={() => { fetchHistory(); setView('history'); setSelectedReport(null); }} className="bg-blue-700 p-2 rounded hover:bg-blue-600 flex items-center" title="Histórico">
                    📜 <span className="ml-1 text-xs sm:text-sm">Histórico</span>
                </button>
              </>
            )}
            
            {(view === 'history' || view === 'admin') && (
                <button onClick={() => setView('form')} className="bg-yellow-500 text-blue-900 p-2 rounded font-bold flex items-center" title="Voltar">
                    ⬅ <span className="ml-1 text-xs sm:text-sm">Voltar</span>
                </button>
            )}
            
            {isUserAdmin && view !== 'admin' && (
                <button onClick={() => setView('admin')} className="bg-purple-600 text-white p-2 rounded font-bold hover:bg-purple-700 flex items-center" title="Admin">
                    ⚙️ <span className="ml-1 text-xs sm:text-sm">Admin</span>
                </button>
            )}
            
            <button onClick={handleLogout} className="bg-red-600 text-white p-2 rounded font-bold border border-red-500 ml-1 flex items-center" title="Sair">
                🚪 <span className="ml-1 text-xs sm:text-sm">Sair</span>
            </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto bg-white shadow-lg min-h-screen mt-4 rounded-xl overflow-hidden">
        
        {view === 'admin' && (
            <div className="p-8 max-w-lg mx-auto">
                <h2 className="text-2xl font-bold text-purple-900 mb-6 text-center">Painel Admin</h2>
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                    <h3 className="font-bold text-purple-800 mb-4">Cadastrar Novo Usuário</h3>
                    <form onSubmit={handleRegisterUser} className="space-y-4">
                        <div><label className="block text-xs font-bold text-gray-600 uppercase">E-mail</label><input type="email" required className="w-full p-2 border rounded text-gray-900" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} /></div>
                        <div><label className="block text-xs font-bold text-gray-600 uppercase">Senha</label><input type="password" required className="w-full p-2 border rounded text-gray-900" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} /></div>
                        <button disabled={loading} className="w-full bg-purple-600 text-white py-2 rounded font-bold hover:bg-purple-700">{loading ? '...' : 'Cadastrar'}</button>
                    </form>
                </div>
            </div>
        )}

        {view === 'history' && (
            <div className="p-6">
                {selectedReport ? (
                   <div className="animate-fade-in-up">
                      <div className="flex justify-between items-center border-b pb-4 mb-4">
                         <h2 className="text-xl md:text-2xl font-bold text-blue-900">📄 Visualizar Relatório</h2>
                         <button onClick={() => setSelectedReport(null)} className="text-sm bg-gray-200 px-3 py-1 rounded text-gray-700 hover:bg-gray-300 font-bold">FECHAR X</button>
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
                         <div className="mb-6">
                             {/* NOVA VISUALIZAÇÃO DE MATERIAIS PARA EVITAR 'SOPA' NO MOBILE */}
                             <h3 className="text-blue-900 font-bold border-b border-gray-300 mb-3 uppercase">🛡️ Materiais</h3>
                             <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                                <div className="bg-gray-50 p-2 rounded border flex flex-col justify-between h-full">
                                    <span className="text-gray-500 font-bold uppercase text-[10px] sm:text-xs">Tonfas</span>
                                    <span className="font-bold text-lg text-gray-900">{selectedReport.tonfas || '0'}</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded border flex flex-col justify-between h-full">
                                    <span className="text-gray-500 font-bold uppercase text-[10px] sm:text-xs">Algemas (Par)</span>
                                    <span className="font-bold text-lg text-gray-900">{selectedReport.algemas || '0'}</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded border flex flex-col justify-between h-full">
                                    <span className="text-gray-500 font-bold uppercase text-[10px] sm:text-xs">Celular</span>
                                    <span className="font-bold text-lg text-gray-900">{selectedReport.celular || '0'}</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded border flex flex-col justify-between h-full">
                                    <span className="text-gray-500 font-bold uppercase text-[10px] sm:text-xs">Rádio HT</span>
                                    <span className="font-bold text-lg text-gray-900">{selectedReport.radioHT || '0'}</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded border flex flex-col justify-between h-full">
                                    <span className="text-gray-500 font-bold uppercase text-[10px] sm:text-xs">Lanternas</span>
                                    <span className="font-bold text-lg text-gray-900">{selectedReport.lanternas || '0'}</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded border flex flex-col justify-between h-full">
                                    <span className="text-gray-500 font-bold uppercase text-[10px] sm:text-xs">Escudos</span>
                                    <span className="font-bold text-lg text-gray-900">{selectedReport.escudos || '0'}</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded border flex flex-col justify-between h-full">
                                    <span className="text-gray-500 font-bold uppercase text-[10px] sm:text-xs">Rádio Cel</span>
                                    <span className="font-bold text-lg text-gray-900">{selectedReport.radioCelular || '0'}</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded border flex flex-col justify-between h-full">
                                    <span className="text-gray-500 font-bold uppercase text-[10px] sm:text-xs">Chaves Acesso</span>
                                    <span className="font-bold text-lg text-gray-900">{selectedReport.chavesAcesso || '0'}</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded border flex flex-col justify-between h-full">
                                    <span className="text-gray-500 font-bold uppercase text-[10px] sm:text-xs">Chaves (Algema)</span>
                                    <span className="font-bold text-lg text-gray-900">{selectedReport.chavesAlgemas || '0'}</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded border flex flex-col justify-between h-full">
                                    <span className="text-gray-500 font-bold uppercase text-[10px] sm:text-xs">Cadeados</span>
                                    <span className="font-bold text-lg text-gray-900">{selectedReport.cadeados || '0'}</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded border flex flex-col justify-between h-full">
                                    <span className="text-gray-500 font-bold uppercase text-[10px] sm:text-xs">Pendrives</span>
                                    <span className="font-bold text-lg text-gray-900">{selectedReport.pendrives || '0'}</span>
                                </div>
                             </div>
                         </div>
                         <div className="mb-6">
                             <h3 className="text-blue-900 font-bold border-b border-gray-300 mb-3 uppercase">🔢 Adolescentes</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {Object.entries(selectedReport.alojamentos).map(([key, val]: any) => (
                                    <div key={key} className="border-b border-gray-100 py-1">
                                        <span className="font-bold text-blue-800">AL-{key}:</span> {val.qtd || '0'} adolescentes <span className="italic text-gray-500">({val.nomes || ''})</span>
                                    </div>
                                ))}
                             </div>
                             {/* TOTAL NO VISUALIZADOR DE HISTÓRICO */}
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
                                     <img src={selectedReport.assinaturaDiurnoImg} className="mt-2 h-16 mx-auto border border-gray-200" alt="Assinatura Diurno" />
                                 )}
                             </div>
                             <div>
                                 <div className="border-b border-black mb-2 mx-10"></div>
                                 <p className="font-bold">{selectedReport.assinaturaNoturno || "(Sem Assinatura)"}</p>
                                 <p className="text-xs text-gray-500 uppercase">Supervisor Noturno</p>
                                 {selectedReport.assinaturaNoturnoImg && (
                                     <img src={selectedReport.assinaturaNoturnoImg} className="mt-2 h-16 mx-auto border border-gray-200" alt="Assinatura Noturno" />
                                 )}
                             </div>
                         </div>

                         {/* EXIBIÇÃO DE FOTOS NO HISTÓRICO */}
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

                         {selectedReport.historicoEdicoes && selectedReport.historicoEdicoes.length > 0 && (
                            <div className="mt-10 border-t-2 border-gray-200 pt-6">
                                <h3 className="text-gray-500 font-bold uppercase text-sm mb-4 text-center">🕒 Histórico de Alterações</h3>
                                <div className="space-y-4">
                                    {selectedReport.historicoEdicoes.map((edicao, index) => (
                                        <div key={index} className="flex gap-4 items-start">
                                            <div className="flex flex-col items-center">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                                                <div className="w-0.5 h-full bg-gray-200 -mb-2"></div>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg flex-1 border border-gray-100 shadow-sm">
                                                <p className="text-xs text-gray-500 font-bold">{edicao.acao} em {edicao.dataHora}</p>
                                                <p className="text-sm font-bold text-blue-900">Editado por: {edicao.usuario}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                         )}

                      </div>
                      
                      {/* BOTÕES DE AÇÃO NO HISTÓRICO - ADICIONADO BOTÃO EDITAR */}
                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 pb-8">
                            {/* --- BOTÃO DE EDITAR NOVO --- */}
                            <button onClick={() => handleEditReport(selectedReport)} className="col-span-1 sm:col-span-2 w-full bg-yellow-500 text-white px-4 py-3 rounded-lg font-bold shadow hover:bg-yellow-600 flex items-center justify-center gap-2 border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 transition-all">
                                ✏️ EDITAR ESTE RELATÓRIO
                            </button>

                            <button onClick={() => handleResendWhatsApp(selectedReport)} className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-bold shadow hover:bg-green-700 flex items-center justify-center gap-2">📱 Enviar WhatsApp</button>
                            <button onClick={() => gerarPDF(selectedReport)} className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-bold shadow hover:bg-red-700 flex items-center justify-center gap-2">📄 Baixar PDF</button>
                            <button onClick={() => gerarWord(selectedReport)} className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-bold shadow hover:bg-blue-700 flex items-center justify-center gap-2">📄 Baixar Word</button>
                            {isUserAdmin && (<button onClick={() => handleDeleteReport(selectedReport.id!)} className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg font-bold shadow hover:bg-black flex items-center justify-center gap-2 border border-red-500">🗑️ Excluir Relatório</button>)}
                      </div>
                   </div>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-blue-900 mb-4">Histórico de Relatórios</h2>
                        {loading && <p className="text-gray-900">Carregando...</p>}
                        {!loading && historico.length === 0 && <p className="text-gray-500">Nenhum relatório encontrado.</p>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {historico.map((item) => (
                                <div key={item.id} onClick={() => setSelectedReport(item)} className="cursor-pointer border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md bg-white hover:bg-blue-50 transition group">
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
                    </>
                )}
            </div>
        )}

        {view === 'form' && (
            <form className="p-6 space-y-8" onSubmit={(e) => e.preventDefault()}>
            
            {/* AVISO DE MODO EDIÇÃO */}
            {formData.id && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 p-4 mb-4 rounded shadow flex justify-between items-center animate-pulse">
                    <div>
                        <p className="font-bold">⚠️ MODO DE EDIÇÃO</p>
                        <p className="text-sm">Você está alterando um relatório existente.</p>
                    </div>
                    <button onClick={handleCancelEdit} className="bg-white text-yellow-700 px-3 py-1 rounded border border-yellow-300 font-bold hover:bg-yellow-50 text-sm">
                        CANCELAR
                    </button>
                </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex justify-between items-center">
                <div><label className="block text-xs font-bold text-blue-800 uppercase mb-1">Data</label><input type="text" name="data" value={formData.data} onChange={handleChange} className="w-40 p-2 border rounded bg-white font-mono text-gray-900" /></div>
                <div className="text-xs text-blue-600 font-semibold hidden md:block">Logado como: {session.user.email}</div>
            </div>
            
            <section>
                <h3 className="flex items-center text-blue-900 font-bold border-b-2 border-blue-200 mb-4 pb-2 text-xl"><span className="mr-2">👥</span> Equipe</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* CAMPO DO COORDENADOR BLOQUEADO */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">COORDENADOR DE SEGURANÇA</label>
                        <input 
                            value={formData.coordenador} 
                            readOnly 
                            className="w-full border p-3 rounded bg-gray-200 font-bold text-gray-600 cursor-not-allowed" 
                        />
                    </div>

                    <div><label className="text-xs font-bold text-gray-500 block mb-1">SUPERVISOR</label><input placeholder="Nome" name="supervisor" value={formData.supervisor} onChange={handleChange} className="w-full border p-3 rounded bg-gray-50 font-semibold text-gray-900" /></div>
                    <div className="col-span-full"><label className="text-xs font-bold text-gray-500 block mb-1">EDUCADORES</label><input placeholder="Nomes dos educadores..." name="educadores" value={formData.educadores} onChange={handleChange} className="w-full border p-3 rounded bg-gray-50 text-gray-900" /></div>
                    
                    <div className="col-span-full border-t border-gray-100 pt-3 mt-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-2 rounded border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                                <input type="checkbox" id="temFolga" name="temFolga" checked={formData.temFolga} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                                <label htmlFor="temFolga" className="text-xs font-bold text-gray-600 cursor-pointer uppercase">Educador de Folga?</label>
                            </div>
                            {formData.temFolga && (
                                <input placeholder="Nome de quem está de folga" name="educadoresFolga" value={formData.educadoresFolga} onChange={handleChange} className="w-full border p-2 rounded text-sm text-gray-900" />
                            )}
                        </div>
                        <div className="bg-gray-50 p-2 rounded border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                                <input type="checkbox" id="temFerias" name="temFerias" checked={formData.temFerias} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                                <label htmlFor="temFerias" className="text-xs font-bold text-gray-600 cursor-pointer uppercase">Educador de Férias?</label>
                            </div>
                            {formData.temFerias && (
                                <input placeholder="Nome de quem está de férias" name="educadoresFerias" value={formData.educadoresFerias} onChange={handleChange} className="w-full border p-2 rounded text-sm text-gray-900" />
                            )}
                        </div>
                        <div className="bg-gray-50 p-2 rounded border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                                <input type="checkbox" id="temApoioSemiliberdade" name="temApoioSemiliberdade" checked={formData.temApoioSemiliberdade} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                                <label htmlFor="temApoioSemiliberdade" className="text-xs font-bold text-gray-600 cursor-pointer uppercase">Apoio Semiliberdade?</label>
                            </div>
                            {formData.temApoioSemiliberdade && (
                                <input placeholder="Nome do educador" name="educadoresApoioSemiliberdade" value={formData.educadoresApoioSemiliberdade} onChange={handleChange} className="w-full border p-2 rounded text-sm text-gray-900" />
                            )}
                        </div>
                    </div>

                    <div><label className="text-xs font-bold text-gray-500 block mb-1">PORTARIA</label><input placeholder="Nome" name="portaria" value={formData.portaria} onChange={handleChange} className="w-full border p-3 rounded bg-gray-50 text-gray-900" /></div>
                    <div><label className="text-xs font-bold text-gray-500 block mb-1">COZINHA</label><input placeholder="Nome" name="cozinha" value={formData.cozinha} onChange={handleChange} className="w-full border p-3 rounded bg-gray-50 text-gray-900" /></div>
                    <div><label className="text-xs font-bold text-gray-500 block mb-1">SERV. GERAIS</label><input placeholder="Nome" name="servicosGerais" value={formData.servicosGerais} onChange={handleChange} className="w-full border p-3 rounded bg-gray-50 text-gray-900" /></div>
                    <div><label className="text-xs font-bold text-gray-500 block mb-1">OUTRO APOIO</label><input placeholder="Ex: Motorista" name="apoio" value={formData.apoio} onChange={handleChange} className="w-full border p-3 rounded bg-gray-50 text-gray-900" /></div>
                    
                    <div className="col-span-full mt-4"><label className="text-xs font-bold text-gray-500 block mb-1">PLANTÃO</label><input placeholder="Ex: Alfa" name="plantao" value={formData.plantao} onChange={handleChange} className="w-full border p-3 rounded bg-gray-50 text-gray-900" /></div>
                </div>
            </section>
            
            <section><h3 className="flex items-center text-blue-900 font-bold border-b-2 border-blue-200 mb-4 pb-2 mt-8 text-xl"><span className="mr-2">🛡️</span> Materiais (Qtd)</h3><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{['tonfas', 'algemas', 'chavesAcesso', 'chavesAlgemas', 'escudos', 'lanternas', 'celular', 'radioCelular', 'radioHT', 'cadeados', 'pendrives'].map((item) => (<div key={item} className="flex flex-col"><label className="text-gray-600 text-xs capitalize mb-1">{item.replace(/([A-Z])/g, ' $1')}</label><input type="number" name={item} onChange={handleChange} value={formData[item as keyof RelatorioData] as string} className="w-full border p-2 rounded bg-white text-gray-900" placeholder="0"/></div>))}</div></section>
            <section>
                <div className="flex justify-between items-center border-b-2 border-blue-200 mb-4 pb-2 mt-8">
                    <h3 className="flex items-center text-blue-900 font-bold text-xl"><span className="mr-2">🔢</span> Adolescentes</h3>
                    <div className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full font-bold text-sm">
                        Total: {totalAtual}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{['01', '02', '03', '04', '05', '06', '07', '08'].map((num) => (<div key={num} className="bg-gray-50 p-3 rounded border border-gray-200 flex gap-2 items-center"><span className="font-bold text-blue-800 text-sm w-12">AL-{num}</span><input type="number" placeholder="Qtd" value={formData.alojamentos[num].qtd} onChange={(e) => handleAlojamentoChange(num, 'qtd', e.target.value)} className="w-16 border p-2 text-center rounded font-bold text-gray-900" /><input type="text" placeholder="Nomes..." value={formData.alojamentos[num].nomes} onChange={(e) => handleAlojamentoChange(num, 'nomes', e.target.value)} className="flex-1 border p-2 rounded text-sm text-gray-900" /></div>))}</div>
            </section>
            <section className="mt-8 bg-red-50 p-4 rounded-lg border border-red-200"><div className="flex items-center gap-3 mb-4"><input type="checkbox" id="temSaida" name="temSaida" checked={formData.temSaida} onChange={handleChange} className="w-6 h-6 text-red-600 rounded focus:ring-red-500 border-gray-300" /><label htmlFor="temSaida" className="text-lg font-bold text-red-900 cursor-pointer">Houve Saída Externa?</label></div>{formData.temSaida && (<div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-down"><div><label className="text-xs font-bold text-red-800 block mb-1">Nome do Adolescente</label><input placeholder="Ex: João Silva" name="saidaAdolescente" value={formData.saidaAdolescente} onChange={handleChange} className="w-full border border-red-300 p-2 rounded bg-white text-gray-900" /></div><div><label className="text-xs font-bold text-red-800 block mb-1">Educador Responsável</label><input placeholder="Ex: Maria" name="saidaEducador" value={formData.saidaEducador} onChange={handleChange} className="w-full border border-red-300 p-2 rounded bg-white text-gray-900" /></div><div><label className="text-xs font-bold text-red-800 block mb-1">Horário</label><input placeholder="Ex: 14:00" name="saidaHorario" value={formData.saidaHorario} onChange={handleChange} className="w-full border border-red-300 p-2 rounded bg-white text-gray-900" /></div></div>)}</section>
            
            {/* MICROFONE AQUI */}
            <section className="relative">
                <div className="flex justify-between items-center border-b-2 border-blue-200 mb-4 pb-2">
                    <h3 className="flex items-center text-blue-900 font-bold text-xl"><span className="mr-2">📝</span> Resumo</h3>
                    <button 
                        type="button" 
                        onClick={toggleRecording} 
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold shadow transition ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-blue-100 text-blue-900 hover:bg-blue-200'}`}
                    >
                        {isRecording ? (
                            <><span>⏹️</span> Gravando... (Toque para parar)</>
                        ) : (
                            <><span>🎙️</span> Usar Microfone</>
                        )}
                    </button>
                </div>
                <textarea name="resumoPlantao" value={formData.resumoPlantao} placeholder="Fale aqui..." onChange={handleChange} className="w-full border p-3 rounded h-40 mb-6 outline-none text-lg text-gray-900"></textarea>
            </section>

            {/* --- SEÇÃO FOTOS --- */}
            <section className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-blue-900 font-bold text-lg mb-4">📷 Fotos da Ocorrência / Plantão</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {formData.fotos.map((foto, idx) => (
                        <div key={idx} className="relative group">
                            <img src={foto} className="w-full h-24 object-cover rounded border" />
                            <button onClick={() => removePhoto(idx)} className="absolute top-0 right-0 bg-red-600 text-white p-1 rounded-bl text-xs font-bold">X</button>
                        </div>
                    ))}
                    <label className="border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center h-24 cursor-pointer hover:bg-gray-100">
                        <span className="text-2xl text-gray-400">+</span>
                        <span className="text-xs text-gray-500">Adicionar Foto</span>
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                </div>
            </section>

            {/* --- SEÇÃO ASSINATURAS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-500 uppercase block">Nome Supervisor Diurno</label>
                    <input placeholder="Digite o nome..." name="assinaturaDiurno" value={formData.assinaturaDiurno} onChange={handleChange} className="w-full border p-2 rounded text-gray-900" />
                    <SignaturePad label="Assinatura Digital (Diurno)" onSave={(data) => setFormData(prev => ({...prev, assinaturaDiurnoImg: data}))} initialImage={formData.assinaturaDiurnoImg} />
                </div>
                <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-500 uppercase block">Nome Supervisor Noturno</label>
                    <input placeholder="Digite o nome..." name="assinaturaNoturno" value={formData.assinaturaNoturno} onChange={handleChange} className="w-full border p-2 rounded text-gray-900" />
                    <SignaturePad label="Assinatura Digital (Noturno)" onSave={(data) => setFormData(prev => ({...prev, assinaturaNoturnoImg: data}))} initialImage={formData.assinaturaNoturnoImg} />
                </div>
            </div>
            
            <div className="pt-6 pb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-2">
                    <button onClick={() => gerarWord(formData)} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl shadow hover:bg-blue-700 transition">📄 Word</button>
                    <button onClick={() => gerarPDF(formData)} className="flex-1 bg-red-600 text-white font-bold py-4 rounded-xl shadow hover:bg-red-700 transition">📄 PDF</button>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleSalvarApenas} className={`flex-1 ${formData.id ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-700 hover:bg-gray-800'} text-white font-bold py-4 rounded-xl shadow transition flex items-center justify-center gap-2`}>
                        {formData.id ? '💾 Salvar Alteração' : '💾 Salvar Novo'}
                    </button>
                    <button onClick={handleSaveAndSend} className="flex-1 bg-green-600 text-white font-bold py-4 rounded-xl shadow hover:bg-green-700 transition flex items-center justify-center gap-2">
                        📱 Zap + Salvar
                    </button>
                </div>
            </div>
            </form>
        )}
      </div>
    </div>
  );
}
