'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
  WidthType, AlignmentType, BorderStyle, Header, ImageRun   
} from 'docx';
import { saveAs } from 'file-saver';

// --- CORREÇÃO DO ERRO VERCEL ---
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

// --- CONFIGURAÇÕES ---
const ADMIN_EMAIL = 'admin@csiprc.com'; 
const SENHA_EXCLUSAO = '1234';
const TEMPO_INATIVIDADE = 5 * 60 * 1000; 
const TEMPO_AVISO = 4.5 * 60 * 1000;

// --- TIPAGEM ---
type AlojamentoDados = { qtd: string; nomes: string; };
type RelatorioData = {
  id?: number; created_at?: string; data: string; supervisor: string; educadores: string; apoio: string; plantao: string;
  tonfas: string; algemas: string; chavesAcesso: string; chavesAlgemas: string; escudos: string; lanternas: string;
  celular: string; radioCelular: string; radioHT: string; cadeados: string; pendrives: string;
  alojamentos: { [key: string]: AlojamentoDados };
  resumoPlantao: string; assinaturaDiurno: string; assinaturaNoturno: string;
  temSaida: boolean; saidaAdolescente: string; saidaEducador: string; saidaHorario: string;
  temFolga: boolean; educadoresFolga: string;
  temFerias: boolean; educadoresFerias: string;
};

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'form' | 'history' | 'admin'>('form');
  const [historico, setHistorico] = useState<RelatorioData[]>([]);
  const [selectedReport, setSelectedReport] = useState<RelatorioData | null>(null);
  
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  const [formData, setFormData] = useState<RelatorioData>({
    data: new Date().toLocaleDateString('pt-BR'),
    supervisor: '', educadores: '', apoio: '', plantao: '',
    tonfas: '0', algemas: '0', chavesAcesso: '0', chavesAlgemas: '0', escudos: '0', lanternas: '0',
    celular: '0', radioCelular: '0', radioHT: '0', cadeados: '0', pendrives: '0',
    alojamentos: {
      '01': { qtd: '0', nomes: '' }, '02': { qtd: '0', nomes: '' }, '03': { qtd: '0', nomes: '' }, '04': { qtd: '0', nomes: '' },
      '05': { qtd: '0', nomes: '' }, '06': { qtd: '0', nomes: '' }, '07': { qtd: '0', nomes: '' }, '08': { qtd: '0', nomes: '' }
    },
    resumoPlantao: '', assinaturaDiurno: '', assinaturaNoturno: '',
    temSaida: false, saidaAdolescente: '', saidaEducador: '', saidaHorario: '',
    temFolga: false, educadoresFolga: '',
    temFerias: false, educadoresFerias: ''
  });

  const handleLogout = useCallback(async () => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    await supabase.auth.signOut();
    setView('form');
    setShowInactivityWarning(false);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (!session) return;
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    setShowInactivityWarning(false);
    warningTimerRef.current = setTimeout(() => { setShowInactivityWarning(true); }, TEMPO_AVISO);
    logoutTimerRef.current = setTimeout(() => { handleLogout(); alert("Sessão expirada."); }, TEMPO_INATIVIDADE);
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
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setAuthLoading(false);
    };
    checkSession();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); });
    return () => { authListener.subscription.unsubscribe(); };
  }, []);

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

  const carregarImagemBuffer = async (url: string) => { try { const r = await fetch(url); if (!r.ok) return null; const b = await r.blob(); return await b.arrayBuffer(); } catch { return null; } };
  const getBase64ImageFromURL = (url: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image(); img.setAttribute("crossOrigin", "anonymous");
      img.onload = () => { const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const ctx = c.getContext("2d"); ctx?.drawImage(img, 0, 0); resolve(c.toDataURL("image/png")); };
      img.onerror = () => resolve(null); img.src = url;
    });
  };

  const gerarTextoWhatsApp = (dados: RelatorioData) => {
    let texto = `*RELATÓRIO EQUIPE DE SEGURANÇA - CSIPRC*\n📅 Data: ${dados.data}\n\n*EQUIPE*\n👮 Supervisor: ${dados.supervisor}\n👥 Educadores: ${dados.educadores}`;
    if (dados.temFolga) texto += `\n🏖️ Folga: ${dados.educadoresFolga}`;
    if (dados.temFerias) texto += `\n✈️ Férias: ${dados.educadoresFerias}`;
    texto += `\n🤝 Apoio: ${dados.apoio}\n🕒 Plantão: ${dados.plantao}`;
    if (dados.temSaida) { texto += `\n\n*🚨 SAÍDA EXTERNA*\n👤 Adolescente: ${dados.saidaAdolescente}\n👮 Educador: ${dados.saidaEducador}\n⏰ Horário: ${dados.saidaHorario}`; }
    texto += `\n\n*🛡️ MATERIAIS*`;
    texto += `\nTonfas: ${dados.tonfas} | Algemas: ${dados.algemas}`;
    texto += `\nCelular: ${dados.celular} | Rádio HT: ${dados.radioHT}`;
    texto += `\nChaves Acesso: ${dados.chavesAcesso} | Chaves Algemas: ${dados.chavesAlgemas}`;
    texto += `\nCadeados: ${dados.cadeados} | Pendrives: ${dados.pendrives}`;
    texto += `\nEscudos: ${dados.escudos} | Lanternas: ${dados.lanternas}`;
    texto += `\nRádio Celular: ${dados.radioCelular}`;
    texto += `\n\n*🔢 ADOLESCENTES*`;
    ['01', '02', '03', '04', '05', '06', '07', '08'].forEach(num => { const al = dados.alojamentos[num]; if (al) texto += `\nAL-${num}: ${al.qtd} ${al.nomes ? `(${al.nomes})` : ''}`; });
    texto += `\n\n*RESUMO DO PLANTÃO*\n📝 ${dados.resumoPlantao}`;
    texto += `\n\n*ASSINATURAS*\n☀️ Diurno: ${dados.assinaturaDiurno}\n🌙 Noturno: ${dados.assinaturaNoturno}`;
    return texto;
  };

  const gerarPDF = async (dataToPrint?: RelatorioData) => {
    const dados = dataToPrint || formData;
    try {
      const logoBase64 = await getBase64ImageFromURL('/logo.png');
      const contentArray: any[] = [
          logoBase64 ? { image: logoBase64, width: 150, alignment: 'center', margin: [0, 0, 0, 10] } : {},
          { text: 'RELATÓRIO EQUIPE DE SEGURANÇA – CSIPRC', style: 'header', alignment: 'center' },
          { text: `Data: ${dados.data}`, style: 'subheader', alignment: 'center', margin: [0, 0, 0, 20] },
          { columns: [{ width: '*', text: [{ text: 'SUPERVISOR: ', bold: true }, dados.supervisor] }], margin: [0, 5] },
          { columns: [{ width: '*', text: [{ text: 'EDUCADORES: ', bold: true }, dados.educadores] }], margin: [0, 5] },
      ];
      if (dados.temFolga) { contentArray.push({ columns: [{ width: '*', text: [{ text: 'FOLGA: ', bold: true }, dados.educadoresFolga] }], margin: [0, 5] }); }
      if (dados.temFerias) { contentArray.push({ columns: [{ width: '*', text: [{ text: 'FÉRIAS: ', bold: true }, dados.educadoresFerias] }], margin: [0, 5] }); }
      contentArray.push({ columns: [{ width: '*', text: [{ text: 'APOIO: ', bold: true }, dados.apoio] }], margin: [0, 5] }, { columns: [{ width: '*', text: [{ text: 'PLANTÃO: ', bold: true }, dados.plantao] }], margin: [0, 0, 0, 20] },);
      if (dados.temSaida) { contentArray.push({ text: 'SAÍDA EXTERNA', style: 'sectionHeader', alignment: 'center', color: 'red' }, { columns: [{ width: '*', text: [{ text: 'Adolescente: ', bold: true }, dados.saidaAdolescente] }, { width: '*', text: [{ text: 'Horário: ', bold: true }, dados.saidaHorario] }], margin: [0, 5] }, { text: [{ text: 'Educador Responsável: ', bold: true }, dados.saidaEducador], margin: [0, 0, 0, 10] }); }
      
      // --- CORREÇÃO DO ERRO DE "UNDEFINED CELL" ---
      // Usamos "|| ''" para garantir que nenhum valor seja null
      contentArray.push(
          { text: 'MATERIAIS DE SEGURANÇA', style: 'sectionHeader', alignment: 'center' }, 
          { 
              style: 'tableExample', 
              table: { 
                  widths: ['*', 'auto', '*', 'auto'], 
                  body: [
                      [{ text: 'ITEM', bold: true, fillColor: '#eeeeee' }, { text: 'QTD', bold: true, fillColor: '#eeeeee' }, { text: 'ITEM', bold: true, fillColor: '#eeeeee' }, { text: 'QTD', bold: true, fillColor: '#eeeeee' }], 
                      ['Tonfas', dados.tonfas || '0', 'Celular + Carregador', dados.celular || '0'], 
                      ['Algemas', dados.algemas || '0', 'Rádio Celular', dados.radioCelular || '0'], 
                      ['Chaves Acesso', dados.chavesAcesso || '0', 'Rádio HT', dados.radioHT || '0'], 
                      ['Chaves Algemas', dados.chavesAlgemas || '0', 'Cadeados', dados.cadeados || '0'], 
                      ['Escudos', dados.escudos || '0', 'Pendrives', dados.pendrives || '0'], 
                      ['Lanternas', dados.lanternas || '0', '', ''],
                  ] 
              }, 
              layout: 'lightHorizontalLines', 
              margin: [0, 5, 0, 20] 
          }, 
          { text: 'ADOLESCENTES POR ALOJAMENTO', style: 'sectionHeader', alignment: 'center' }
      );

      ['01', '02', '03', '04', '05', '06', '07', '08'].forEach(num => { contentArray.push({ text: [{ text: `Alojamento ${num}: `, bold: true }, { text: `${dados.alojamentos[num].qtd} adolescentes - ` }, { text: dados.alojamentos[num].nomes, italics: true }], margin: [0, 2] }); });
      contentArray.push({ text: 'RESUMO DO PLANTÃO', style: 'sectionHeader', alignment: 'center', margin: [0, 20, 0, 5] }, { text: dados.resumoPlantao, fontSize: 11, alignment: 'justify' }, { text: '_______________________________________________', alignment: 'center', margin: [0, 40, 0, 2] }, { text: dados.assinaturaDiurno || '(Sem nome)', bold: true, alignment: 'center' }, { text: 'Supervisor Diurno', alignment: 'center', fontSize: 10, margin: [0, 0, 0, 30] }, { text: '_______________________________________________', alignment: 'center', margin: [0, 10, 0, 2] }, { text: dados.assinaturaNoturno || '(Sem nome)', bold: true, alignment: 'center' }, { text: 'Supervisor Noturno', alignment: 'center', fontSize: 10 },);
      const docDefinition: any = { pageSize: 'A4', pageMargins: [40, 40, 40, 40], content: contentArray, styles: { header: { fontSize: 18, bold: true, margin: [0, 0, 0, 5] }, subheader: { fontSize: 14, bold: true }, sectionHeader: { fontSize: 12, bold: true, decoration: 'underline', margin: [0, 10, 0, 5] }, tableExample: { margin: [0, 5, 0, 15] } } };
      pdfMake.createPdf(docDefinition).download(`Relatorio_PDF_${dados.data.replace(/\//g, '-')}.pdf`);
    } catch { alert("Erro ao gerar PDF."); }
  };

  const gerarWord = async (dataToPrint?: RelatorioData) => {
    const dados = dataToPrint || formData;
    try {
        const logoBuffer = await carregarImagemBuffer('/logo.png');
        const cellStyle = { borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } }, margins: { top: 100, bottom: 100, left: 100, right: 100 } };
        const childrenParagraphs = [new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: "RELATÓRIO EQUIPE DE SEGURANÇA – CSIPRC", bold: true, size: 28 }) ] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: `Data: ${dados.data}`, bold: true, size: 24 }) ] }), new Paragraph({ text: "" }), new Paragraph({ children: [new TextRun({ text: "SUPERVISOR: ", bold: true }), new TextRun(dados.supervisor)] }), new Paragraph({ children: [new TextRun({ text: "EDUCADORES: ", bold: true }), new TextRun(dados.educadores)] })];
        if (dados.temFolga) { childrenParagraphs.push(new Paragraph({ children: [new TextRun({ text: "FOLGA: ", bold: true }), new TextRun(dados.educadoresFolga)] })); }
        if (dados.temFerias) { childrenParagraphs.push(new Paragraph({ children: [new TextRun({ text: "FÉRIAS: ", bold: true }), new TextRun(dados.educadoresFerias)] })); }
        childrenParagraphs.push(new Paragraph({ children: [new TextRun({ text: "APOIO: ", bold: true }), new TextRun(dados.apoio)] }), new Paragraph({ children: [new TextRun({ text: "PLANTÃO: ", bold: true }), new TextRun(dados.plantao)] }), new Paragraph({ text: "" }));
        if (dados.temSaida) { childrenParagraphs.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SAÍDA EXTERNA", bold: true, underline: {}, color: "FF0000" })] }), new Paragraph({ text: "" }), new Paragraph({ children: [new TextRun({ text: "Adolescente: ", bold: true }), new TextRun(dados.saidaAdolescente)] }), new Paragraph({ children: [new TextRun({ text: "Educador: ", bold: true }), new TextRun(dados.saidaEducador)] }), new Paragraph({ children: [new TextRun({ text: "Horário: ", bold: true }), new TextRun(dados.saidaHorario)] }), new Paragraph({ text: "" })); }
        childrenParagraphs.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "MATERIAIS DE SEGURANÇA", bold: true, underline: {} })] }), new Paragraph({ text: "" }), new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [ new TableCell({ children: [new Paragraph({ text: "ITEM", bold: true })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: "QTD", bold: true })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: "ITEM", bold: true })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: "QTD", bold: true })], ...cellStyle }) ] }), new TableRow({ children: [ new TableCell({ children: [new Paragraph("Tonfas")], ...cellStyle }), new TableCell({ children: [new Paragraph(dados.tonfas || "0")], ...cellStyle }), new TableCell({ children: [new Paragraph("Celular + Carregador")], ...cellStyle }), new TableCell({ children: [new Paragraph(dados.celular || "0")], ...cellStyle }) ] }), new TableRow({ children: [ new TableCell({ children: [new Paragraph("Algemas")], ...cellStyle }), new TableCell({ children: [new Paragraph(dados.algemas || "0")], ...cellStyle }), new TableCell({ children: [new Paragraph("Rádio Celular")], ...cellStyle }), new TableCell({ children: [new Paragraph(dados.radioCelular || "0")], ...cellStyle }) ] }), new TableRow({ children: [ new TableCell({ children: [new Paragraph("Chaves de Acesso")], ...cellStyle }), new TableCell({ children: [new Paragraph(dados.chavesAcesso || "0")], ...cellStyle }), new TableCell({ children: [new Paragraph("Rádio HT")], ...cellStyle }), new TableCell({ children: [new Paragraph(dados.radioHT || "0")], ...cellStyle }) ] }), new TableRow({ children: [ new TableCell({ children: [new Paragraph("Chaves de Algemas")], ...cellStyle }), new TableCell({ children: [new Paragraph(dados.chavesAlgemas || "0")], ...cellStyle }), new TableCell({ children: [new Paragraph("Cadeados")], ...cellStyle }), new TableCell({ children: [new Paragraph(dados.cadeados || "0")], ...cellStyle }) ] }), new TableRow({ children: [ new TableCell({ children: [new Paragraph("Escudos")], ...cellStyle }), new TableCell({ children: [new Paragraph(dados.escudos || "0")], ...cellStyle }), new TableCell({ children: [new Paragraph("Pendrives")], ...cellStyle }), new TableCell({ children: [new Paragraph(dados.pendrives || "0")], ...cellStyle }) ] }), new TableRow({ children: [ new TableCell({ children: [new Paragraph("Lanternas")], ...cellStyle }), new TableCell({ children: [new Paragraph(dados.lanternas || "0")], ...cellStyle }), new TableCell({ children: [new Paragraph("")], ...cellStyle }), new TableCell({ children: [new Paragraph("")], ...cellStyle }) ] })] }), new Paragraph({ text: "" }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ADOLESCENTES POR ALOJAMENTO", bold: true, underline: {} })] }), new Paragraph({ text: "" }));
        ['01', '02', '03', '04', '05', '06', '07', '08'].forEach(num => { childrenParagraphs.push(new Paragraph({ children: [ new TextRun({ text: `Alojamento ${num}: `, bold: true }), new TextRun({ text: `${dados.alojamentos[num].qtd} adolescentes - ` }), new TextRun({ text: dados.alojamentos[num].nomes, italics: true }) ], spacing: { after: 120 } })); });
        childrenParagraphs.push(new Paragraph({ text: "" }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "RESUMO DO PLANTÃO", bold: true, underline: {} })] }), new Paragraph({ text: "" }), new Paragraph({ children: [new TextRun(dados.resumoPlantao)] }), new Paragraph({ text: "\n\n" }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "_______________________________________________" })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: dados.assinaturaDiurno || "(Sem nome)", bold: true }) ] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Supervisor Diurno", size: 20 })], spacing: { after: 400 } }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "_______________________________________________" })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: dados.assinaturaNoturno || "(Sem nome)", bold: true }) ] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Supervisor Noturno", size: 20 })] }));
        const doc = new Document({ sections: [{ properties: {}, headers: { default: new Header({ children: [ new Paragraph({ alignment: AlignmentType.CENTER, children: [ logoBuffer ? new ImageRun({ data: new Uint8Array(logoBuffer), transformation: { width: 475, height: 120 } }) : new TextRun("") ] }), new Paragraph({ text: "" }) ] }) }, children: childrenParagraphs }] });
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
        ...item, data: item.data_plantao, apoio: item.servicos_gerais || item.agente_portaria || '', supervisor: item.supervisor,
        resumoPlantao: item.resumo_plantao, assinaturaDiurno: item.plantao_diurno, assinaturaNoturno: item.plantao_noturno, alojamentos: item.alojamentos || {},
        temSaida: item.tem_saida || false, saidaAdolescente: item.saida_adolescente || '', saidaEducador: item.saida_educador || '', saidaHorario: item.saida_horario || '',
        temFolga: item.tem_folga || false, educadoresFolga: item.educadores_folga || '',
        temFerias: item.tem_ferias || false, educadoresFerias: item.educadores_ferias || ''
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
    return await supabase.from('relatorios').insert([{
      data_plantao: formData.data, educadores: formData.educadores, supervisor: formData.supervisor, servicos_gerais: formData.apoio, plantao: formData.plantao,
      tonfas: formData.tonfas, algemas: formData.algemas, chaves_acesso: formData.chavesAcesso, chaves_algemas: formData.chavesAlgemas, escudos: formData.escudos, lanternas: formData.lanternas, celular: formData.celular, radio_celular: formData.radioCelular, radio_ht: formData.radioHT, cadeados: formData.cadeados, pendrives: formData.pendrives,
      alojamentos: formData.alojamentos, resumo_plantao: formData.resumoPlantao, plantao_diurno: formData.assinaturaDiurno, plantao_noturno: formData.assinaturaNoturno,
      tem_saida: formData.temSaida, saida_adolescente: formData.saidaAdolescente, saida_educador: formData.saidaEducador, saida_horario: formData.saidaHorario,
      tem_folga: formData.temFolga, educadores_folga: formData.educadoresFolga,
      tem_ferias: formData.temFerias, educadores_ferias: formData.educadoresFerias
    }]);
  };

  const handleSalvarApenas = async () => {
    setLoading(true);
    const { error } = await salvarNoSupabase();
    setLoading(false);
    if (error) alert("Erro ao salvar: " + error.message); else alert("✅ Salvo com sucesso!");
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

      {/* HEADER OTIMIZADO PARA MOBILE */}
      <div className="bg-blue-900 text-white p-3 sticky top-0 z-50 shadow-md flex justify-between items-center">
        {/* Lado Esquerdo: Título (com truncate para não quebrar) */}
        <div className="flex items-center gap-2 overflow-hidden mr-2">
            <span className="text-xl">🛡️</span>
            <h1 className="font-bold text-sm sm:text-lg truncate">CSIPRC Segurança</h1>
        </div>

        {/* Lado Direito: Botões (Flex Row, sem quebra) */}
        <div className="flex items-center gap-2 flex-shrink-0">
            {view === 'form' && (
              <>
                <button onClick={() => gerarWord(formData)} className="bg-white text-blue-900 p-2 rounded shadow-sm" title="Baixar Word">
                    📄<span className="hidden sm:inline ml-1 font-bold">Word</span>
                </button>
                <button onClick={() => gerarPDF(formData)} className="bg-red-600 text-white p-2 rounded shadow-sm" title="Baixar PDF">
                    📄<span className="hidden sm:inline ml-1 font-bold">PDF</span>
                </button>
                <button onClick={() => { fetchHistory(); setView('history'); setSelectedReport(null); }} className="bg-blue-700 p-2 rounded hover:bg-blue-600" title="Histórico">
                    📜<span className="hidden sm:inline ml-1">Histórico</span>
                </button>
              </>
            )}
            
            {(view === 'history' || view === 'admin') && (
                <button onClick={() => setView('form')} className="bg-yellow-500 text-blue-900 p-2 rounded font-bold" title="Voltar">
                    ⬅ <span className="hidden sm:inline">Voltar</span>
                </button>
            )}
            
            {isUserAdmin && view !== 'admin' && (
                <button onClick={() => setView('admin')} className="bg-purple-600 text-white p-2 rounded font-bold hover:bg-purple-700" title="Admin">
                    ⚙️ <span className="hidden sm:inline">Admin</span>
                </button>
            )}
            
            {/* BOTÃO SAIR */}
            <button onClick={handleLogout} className="bg-red-600 text-white p-2 rounded font-bold border border-red-500 ml-1" title="Sair">
                🚪<span className="hidden sm:inline ml-1">Sair</span>
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
                                <p><span className="font-bold">SUPERVISOR:</span> {selectedReport.supervisor}</p>
                                <p><span className="font-bold">EDUCADORES:</span> {selectedReport.educadores}</p>
                                {selectedReport.temFolga && <p><span className="font-bold text-gray-700">FOLGA:</span> {selectedReport.educadoresFolga}</p>}
                                {selectedReport.temFerias && <p><span className="font-bold text-gray-700">FÉRIAS:</span> {selectedReport.educadoresFerias}</p>}
                                <p><span className="font-bold">APOIO:</span> {selectedReport.apoio}</p>
                                <p><span className="font-bold">PLANTÃO:</span> {selectedReport.plantao}</p>
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
                             <h3 className="text-blue-900 font-bold border-b border-gray-300 mb-3 uppercase">🛡️ Materiais</h3>
                             <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                <div className="bg-gray-50 p-2 rounded border">Tonfas: <b>{selectedReport.tonfas}</b></div>
                                <div className="bg-gray-50 p-2 rounded border">Algemas: <b>{selectedReport.algemas}</b></div>
                                <div className="bg-gray-50 p-2 rounded border">Celular: <b>{selectedReport.celular}</b></div>
                                <div className="bg-gray-50 p-2 rounded border">Rádio HT: <b>{selectedReport.radioHT}</b></div>
                                <div className="bg-gray-50 p-2 rounded border">Lanternas: <b>{selectedReport.lanternas}</b></div>
                                <div className="bg-gray-50 p-2 rounded border">Escudos: <b>{selectedReport.escudos}</b></div>
                                <div className="bg-gray-50 p-2 rounded border">Rádio Cel: <b>{selectedReport.radioCelular}</b></div>
                                <div className="bg-gray-50 p-2 rounded border">Chaves Acesso: <b>{selectedReport.chavesAcesso}</b></div>
                                <div className="bg-gray-50 p-2 rounded border">Chaves Algema: <b>{selectedReport.chavesAlgemas}</b></div>
                                <div className="bg-gray-50 p-2 rounded border">Cadeados: <b>{selectedReport.cadeados}</b></div>
                                <div className="bg-gray-50 p-2 rounded border">Pendrives: <b>{selectedReport.pendrives}</b></div>
                             </div>
                         </div>
                         <div className="mb-6">
                             <h3 className="text-blue-900 font-bold border-b border-gray-300 mb-3 uppercase">🔢 Adolescentes</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {Object.entries(selectedReport.alojamentos).map(([key, val]: any) => (
                                    <div key={key} className="border-b border-gray-100 py-1">
                                        <span className="font-bold text-blue-800">AL-{key}:</span> {val.qtd} adolescentes <span className="italic text-gray-500">({val.nomes})</span>
                                    </div>
                                ))}
                             </div>
                         </div>
                         <div className="mb-6">
                             <h3 className="text-blue-900 font-bold border-b border-gray-300 mb-3 uppercase">📝 Resumo do Plantão</h3>
                             <div className="bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-wrap min-h-[100px] text-gray-900">
                                {selectedReport.resumoPlantao}
                             </div>
                         </div>
                         <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
                             <div>
                                 <div className="border-b border-black mb-2 mx-10"></div>
                                 <p className="font-bold">{selectedReport.assinaturaDiurno || "(Sem Assinatura)"}</p>
                                 <p className="text-xs text-gray-500 uppercase">Supervisor Diurno</p>
                             </div>
                             <div>
                                 <div className="border-b border-black mb-2 mx-10"></div>
                                 <p className="font-bold">{selectedReport.assinaturaNoturno || "(Sem Assinatura)"}</p>
                                 <p className="text-xs text-gray-500 uppercase">Supervisor Noturno</p>
                             </div>
                         </div>
                      </div>
                      
                      {/* BOTÕES DE AÇÃO NO HISTÓRICO - CORRIGIDO PARA MOBILE */}
                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 pb-8">
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
                                    <p className="text-xs text-gray-500 line-clamp-2 mt-2"><em>{item.resumoPlantao || "Sem resumo..."}</em></p>
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
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex justify-between items-center">
                <div><label className="block text-xs font-bold text-blue-800 uppercase mb-1">Data</label><input type="text" name="data" value={formData.data} onChange={handleChange} className="w-40 p-2 border rounded bg-white font-mono text-gray-900" /></div>
                <div className="text-xs text-blue-600 font-semibold hidden md:block">Logado como: {session.user.email}</div>
            </div>
            
            <section><h3 className="flex items-center text-blue-900 font-bold border-b-2 border-blue-200 mb-4 pb-2 text-xl"><span className="mr-2">👥</span> Equipe</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"><div><label className="text-xs font-bold text-gray-500 block mb-1">SUPERVISOR</label><input placeholder="Nome" name="supervisor" value={formData.supervisor} onChange={handleChange} className="w-full border p-3 rounded bg-gray-50 font-semibold text-gray-900" /></div><div><label className="text-xs font-bold text-gray-500 block mb-1">EDUCADORES</label><input placeholder="Nomes" name="educadores" value={formData.educadores} onChange={handleChange} className="w-full border p-3 rounded bg-gray-50 text-gray-900" /></div><div className="col-span-full border-t border-gray-100 pt-3 mt-1 grid grid-cols-1 md:grid-cols-2 gap-4"><div className="bg-gray-50 p-2 rounded border border-gray-200"><div className="flex items-center gap-2 mb-2"><input type="checkbox" id="temFolga" name="temFolga" checked={formData.temFolga} onChange={handleChange} className="w-4 h-4 text-blue-600" /><label htmlFor="temFolga" className="text-xs font-bold text-gray-600 cursor-pointer uppercase">Educador de Folga?</label></div>{formData.temFolga && (<input placeholder="Nome de quem está de folga" name="educadoresFolga" value={formData.educadoresFolga} onChange={handleChange} className="w-full border p-2 rounded text-sm text-gray-900" />)}</div><div className="bg-gray-50 p-2 rounded border border-gray-200"><div className="flex items-center gap-2 mb-2"><input type="checkbox" id="temFerias" name="temFerias" checked={formData.temFerias} onChange={handleChange} className="w-4 h-4 text-blue-600" /><label htmlFor="temFerias" className="text-xs font-bold text-gray-600 cursor-pointer uppercase">Educador de Férias?</label></div>{formData.temFerias && (<input placeholder="Nome de quem está de férias" name="educadoresFerias" value={formData.educadoresFerias} onChange={handleChange} className="w-full border p-2 rounded text-sm text-gray-900" />)}</div></div><div><label className="text-xs font-bold text-gray-500 block mb-1">APOIO</label><input placeholder="Portaria/Cozinha" name="apoio" value={formData.apoio} onChange={handleChange} className="w-full border p-3 rounded bg-gray-50 text-gray-900" /></div><div><label className="text-xs font-bold text-gray-500 block mb-1">PLANTÃO</label><input placeholder="Ex: Alfa" name="plantao" value={formData.plantao} onChange={handleChange} className="w-full border p-3 rounded bg-gray-50 text-gray-900" /></div></div></section>
            <section><h3 className="flex items-center text-blue-900 font-bold border-b-2 border-blue-200 mb-4 pb-2 mt-8 text-xl"><span className="mr-2">🛡️</span> Materiais (Qtd)</h3><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{['tonfas', 'algemas', 'chavesAcesso', 'chavesAlgemas', 'escudos', 'lanternas', 'celular', 'radioCelular', 'radioHT', 'cadeados', 'pendrives'].map((item) => (<div key={item} className="flex flex-col"><label className="text-gray-600 text-xs capitalize mb-1">{item.replace(/([A-Z])/g, ' $1')}</label><input type="number" name={item} onChange={handleChange} value={formData[item as keyof RelatorioData] as string} className="w-full border p-2 rounded bg-white text-gray-900" placeholder="0"/></div>))}</div></section>
            <section><h3 className="flex items-center text-blue-900 font-bold border-b-2 border-blue-200 mb-4 pb-2 mt-8 text-xl"><span className="mr-2">🔢</span> Adolescentes</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{['01', '02', '03', '04', '05', '06', '07', '08'].map((num) => (<div key={num} className="bg-gray-50 p-3 rounded border border-gray-200 flex gap-2 items-center"><span className="font-bold text-blue-800 text-sm w-12">AL-{num}</span><input type="number" placeholder="Qtd" value={formData.alojamentos[num].qtd} onChange={(e) => handleAlojamentoChange(num, 'qtd', e.target.value)} className="w-16 border p-2 text-center rounded font-bold text-gray-900" /><input type="text" placeholder="Nomes..." value={formData.alojamentos[num].nomes} onChange={(e) => handleAlojamentoChange(num, 'nomes', e.target.value)} className="flex-1 border p-2 rounded text-sm text-gray-900" /></div>))}</div></section>
            <section className="mt-8 bg-red-50 p-4 rounded-lg border border-red-200"><div className="flex items-center gap-3 mb-4"><input type="checkbox" id="temSaida" name="temSaida" checked={formData.temSaida} onChange={handleChange} className="w-6 h-6 text-red-600 rounded focus:ring-red-500 border-gray-300" /><label htmlFor="temSaida" className="text-lg font-bold text-red-900 cursor-pointer">Houve Saída Externa?</label></div>{formData.temSaida && (<div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-down"><div><label className="text-xs font-bold text-red-800 block mb-1">Nome do Adolescente</label><input placeholder="Ex: João Silva" name="saidaAdolescente" value={formData.saidaAdolescente} onChange={handleChange} className="w-full border border-red-300 p-2 rounded bg-white text-gray-900" /></div><div><label className="text-xs font-bold text-red-800 block mb-1">Educador Responsável</label><input placeholder="Ex: Maria" name="saidaEducador" value={formData.saidaEducador} onChange={handleChange} className="w-full border border-red-300 p-2 rounded bg-white text-gray-900" /></div><div><label className="text-xs font-bold text-red-800 block mb-1">Horário</label><input placeholder="Ex: 14:00" name="saidaHorario" value={formData.saidaHorario} onChange={handleChange} className="w-full border border-red-300 p-2 rounded bg-white text-gray-900" /></div></div>)}</section>
            <section><h3 className="flex items-center text-blue-900 font-bold border-b-2 border-blue-200 mb-4 pb-2 mt-8 text-xl"><span className="mr-2">📝</span> Resumo</h3><textarea name="resumoPlantao" value={formData.resumoPlantao} placeholder="Fale aqui..." onChange={handleChange} className="w-full border p-3 rounded h-40 mb-6 outline-none text-lg text-gray-900"></textarea><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Supervisor Diurno</label><input placeholder="Assinatura..." name="assinaturaDiurno" value={formData.assinaturaDiurno} onChange={handleChange} className="w-full border p-3 rounded bg-gray-50 text-gray-900" /></div><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Supervisor Noturno</label><input placeholder="Assinatura..." name="assinaturaNoturno" value={formData.assinaturaNoturno} onChange={handleChange} className="w-full border p-3 rounded bg-gray-50 text-gray-900" /></div></div></section>
            <div className="pt-6 pb-8 grid grid-cols-1 md:grid-cols-2 gap-4"><div className="flex gap-2"><button onClick={() => gerarWord(formData)} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl shadow hover:bg-blue-700 transition">📄 Word</button><button onClick={() => gerarPDF(formData)} className="flex-1 bg-red-600 text-white font-bold py-4 rounded-xl shadow hover:bg-red-700 transition">📄 PDF</button></div><div className="flex gap-2"><button onClick={handleSalvarApenas} className="flex-1 bg-gray-700 text-white font-bold py-4 rounded-xl shadow hover:bg-gray-800 transition flex items-center justify-center gap-2">💾 Salvar</button><button onClick={handleSaveAndSend} className="flex-1 bg-green-600 text-white font-bold py-4 rounded-xl shadow hover:bg-green-700 transition flex items-center justify-center gap-2">📱 Zap + Salvar</button></div></div>
            </form>
        )}
      </div>
    </div>
  );
}
