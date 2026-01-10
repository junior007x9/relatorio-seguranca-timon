'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
  WidthType, AlignmentType, BorderStyle, Header, ImageRun   
} from 'docx';
import { saveAs } from 'file-saver';

// --- CORREÇÃO DO ERRO VERCEL AQUI ---
// @ts-ignore
import pdfMake from "pdfmake/build/pdfmake";
// @ts-ignore
import pdfFonts from "pdfmake/build/vfs_fonts";

// Configuração pdfMake
if (typeof window !== 'undefined' && pdfMake.vfs === undefined) {
  // @ts-ignore
  pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;
}

// --- CONFIGURAÇÃO SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- DEFINA O E-MAIL DO ADMINISTRADOR AQUI ---
const ADMIN_EMAIL = 'admin@csiprc.com'; 
const SENHA_EXCLUSAO = '1234'; // Senha extra para confirmar exclusão

// --- TIPAGEM ---
type AlojamentoDados = { qtd: string; nomes: string; };
type RelatorioData = {
  id?: number; created_at?: string; data: string; supervisor: string; educadores: string; apoio: string; plantao: string;
  tonfas: string; algemas: string; chavesAcesso: string; chavesAlgemas: string; escudos: string; lanternas: string;
  celular: string; radioCelular: string; radioHT: string; cadeados: string; pendrives: string;
  alojamentos: { [key: string]: AlojamentoDados };
  resumoPlantao: string; assinaturaDiurno: string; assinaturaNoturno: string; 
};

export default function Home() {
  // --- ESTADOS DE AUTENTICAÇÃO ---
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // --- ESTADOS DO SISTEMA ---
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'form' | 'history' | 'admin'>('form');
  const [historico, setHistorico] = useState<RelatorioData[]>([]);
  const [selectedReport, setSelectedReport] = useState<RelatorioData | null>(null);
  
  // Admin cadastro
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  // Formulário Atual
  const [formData, setFormData] = useState<RelatorioData>({
    data: new Date().toLocaleDateString('pt-BR'),
    supervisor: '', educadores: '', apoio: '', plantao: '',
    tonfas: '0', algemas: '0', chavesAcesso: '0', chavesAlgemas: '0', escudos: '0', lanternas: '0',
    celular: '0', radioCelular: '0', radioHT: '0', cadeados: '0', pendrives: '0',
    alojamentos: {
      '01': { qtd: '0', nomes: '' }, '02': { qtd: '0', nomes: '' }, '03': { qtd: '0', nomes: '' }, '04': { qtd: '0', nomes: '' },
      '05': { qtd: '0', nomes: '' }, '06': { qtd: '0', nomes: '' }, '07': { qtd: '0', nomes: '' }, '08': { qtd: '0', nomes: '' }
    },
    resumoPlantao: '', assinaturaDiurno: '', assinaturaNoturno: ''
  });

  // --- EFEITO: VERIFICAR SESSÃO ---
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

  // --- FUNÇÕES DE LOGIN/LOGOUT ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    setLoading(false);
    if (error) alert("Erro ao entrar: " + error.message);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setView('form'); };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signUp({ email: newUserEmail, password: newUserPassword });
    setLoading(false);
    if (error) alert("Erro: " + error.message); else { alert("Usuário criado!"); setNewUserEmail(''); setNewUserPassword(''); }
  };

  // --- HANDLERS DO FORMULÁRIO ---
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleAlojamentoChange = (id: string, field: 'qtd' | 'nomes', value: string) => {
    setFormData(prev => ({ ...prev, alojamentos: { ...prev.alojamentos, [id]: { ...prev.alojamentos[id], [field]: value } } }));
  };

  // --- AUXILIARES IMAGEM ---
  const carregarImagemBuffer = async (url: string) => { try { const r = await fetch(url); if (!r.ok) return null; const b = await r.blob(); return await b.arrayBuffer(); } catch { return null; } };
  const getBase64ImageFromURL = (url: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image(); img.setAttribute("crossOrigin", "anonymous");
      img.onload = () => { const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const ctx = c.getContext("2d"); ctx?.drawImage(img, 0, 0); resolve(c.toDataURL("image/png")); };
      img.onerror = () => resolve(null); img.src = url;
    });
  };

  // --- GERAR ARQUIVOS (PDF/WORD) ---
  const gerarPDF = async (dataToPrint?: RelatorioData) => {
    const dados = dataToPrint || formData;
    try {
      const logoBase64 = await getBase64ImageFromURL('/logo.png');
      const docDefinition: any = {
        pageSize: 'A4', pageMargins: [40, 40, 40, 40],
        content: [
          logoBase64 ? { image: logoBase64, width: 150, alignment: 'center', margin: [0, 0, 0, 10] } : {},
          { text: 'RELATÓRIO EQUIPE DE SEGURANÇA – CSIPRC', style: 'header', alignment: 'center' },
          { text: `Data: ${dados.data}`, style: 'subheader', alignment: 'center', margin: [0, 0, 0, 20] },
          { columns: [{ width: '*', text: [{ text: 'SUPERVISOR: ', bold: true }, dados.supervisor] }], margin: [0, 5] },
          { columns: [{ width: '*', text: [{ text: 'EDUCADORES: ', bold: true }, dados.educadores] }], margin: [0, 5] },
          { columns: [{ width: '*', text: [{ text: 'APOIO: ', bold: true }, dados.apoio] }], margin: [0, 5] },
          { columns: [{ width: '*', text: [{ text: 'PLANTÃO: ', bold: true }, dados.plantao] }], margin: [0, 0, 0, 20] },
          { text: 'MATERIAIS DE SEGURANÇA', style: 'sectionHeader', alignment: 'center' },
          {
            style: 'tableExample',
            table: {
              widths: ['*', 'auto', '*', 'auto'],
              body: [
                [{ text: 'ITEM', bold: true, fillColor: '#eeeeee' }, { text: 'QTD', bold: true, fillColor: '#eeeeee' }, { text: 'ITEM', bold: true, fillColor: '#eeeeee' }, { text: 'QTD', bold: true, fillColor: '#eeeeee' }],
                ['Tonfas', dados.tonfas, 'Celular + Carregador', dados.celular],
                ['Algemas', dados.algemas, 'Rádio Celular', dados.radioCelular],
                ['Chaves Acesso', dados.chavesAcesso, 'Rádio HT', dados.radioHT],
                ['Chaves Algemas', dados.chavesAlgemas, 'Cadeados', dados.cadeados],
                ['Escudos', dados.escudos, 'Pendrives', dados.pendrives],
                ['Lanternas', dados.lanternas, '', ''],
              ]
            }, layout: 'lightHorizontalLines', margin: [0, 5, 0, 20]
          },
          { text: 'ADOLESCENTES POR ALOJAMENTO', style: 'sectionHeader', alignment: 'center' },
          ...['01', '02', '03', '04', '05', '06', '07', '08'].map(num => ({
            text: [{ text: `Alojamento ${num}: `, bold: true }, { text: `${dados.alojamentos[num].qtd} adolescentes - ` }, { text: dados.alojamentos[num].nomes, italics: true }],
            margin: [0, 2]
          })),
          { text: 'RESUMO DO PLANTÃO', style: 'sectionHeader', alignment: 'center', margin: [0, 20, 0, 5] },
          { text: dados.resumoPlantao, fontSize: 11, alignment: 'justify' },
          { text: '_______________________________________________', alignment: 'center', margin: [0, 40, 0, 2] },
          { text: dados.assinaturaDiurno || '(Sem nome)', bold: true, alignment: 'center' },
          { text: 'Supervisor Diurno', alignment: 'center', fontSize: 10, margin: [0, 0, 0, 30] },
          { text: '_______________________________________________', alignment: 'center', margin: [0, 10, 0, 2] },
          { text: dados.assinaturaNoturno || '(Sem nome)', bold: true, alignment: 'center' },
          { text: 'Supervisor Noturno', alignment: 'center', fontSize: 10 },
        ],
        styles: { header: { fontSize: 18, bold: true, margin: [0, 0, 0, 5] }, subheader: { fontSize: 14, bold: true }, sectionHeader: { fontSize: 12, bold: true, decoration: 'underline', margin: [0, 10, 0, 5] }, tableExample: { margin: [0, 5, 0, 15] } }
      };
      pdfMake.createPdf(docDefinition).download(`Relatorio_PDF_${dados.data.replace(/\//g, '-')}.pdf`);
    } catch { alert("Erro ao gerar PDF."); }
  };

  const gerarWord = async (dataToPrint?: RelatorioData) => {
    const dados = dataToPrint || formData;
    try {
        const logoBuffer = await carregarImagemBuffer('/logo.png');
        const cellStyle = { borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } }, margins: { top: 100, bottom: 100, left: 100, right: 100 } };
        const doc = new Document({
          sections: [{
            properties: {},
            headers: { default: new Header({ children: [ new Paragraph({ alignment: AlignmentType.CENTER, children: [ logoBuffer ? new ImageRun({ data: new Uint8Array(logoBuffer), transformation: { width: 475, height: 120 } }) : new TextRun("") ] }), new Paragraph({ text: "" }) ] }) },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: "RELATÓRIO EQUIPE DE SEGURANÇA – CSIPRC", bold: true, size: 28 }) ] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: `Data: ${dados.data}`, bold: true, size: 24 }) ] }),
              new Paragraph({ text: "" }),
              new Paragraph({ children: [new TextRun({ text: "SUPERVISOR: ", bold: true }), new TextRun(dados.supervisor)] }),
              new Paragraph({ children: [new TextRun({ text: "EDUCADORES: ", bold: true }), new TextRun(dados.educadores)] }),
              new Paragraph({ children: [new TextRun({ text: "APOIO: ", bold: true }), new TextRun(dados.apoio)] }),
              new Paragraph({ children: [new TextRun({ text: "PLANTÃO: ", bold: true }), new TextRun(dados.plantao)] }),
              new Paragraph({ text: "" }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "MATERIAIS DE SEGURANÇA", bold: true, underline: {} })] }),
              new Paragraph({ text: "" }),
              new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
                  new TableRow({ children: [ new TableCell({ children: [new Paragraph({ text: "ITEM", bold: true })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: "QTD", bold: true })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: "ITEM", bold: true })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: "QTD", bold: true })], ...cellStyle }) ] }),
                  new TableRow({ children: [ new TableCell({ children: [new Paragraph("Tonfas")], ...cellStyle }), new TableCell({ children: [new Paragraph(dados.tonfas)], ...cellStyle }), new TableCell({ children: [new Paragraph("Celular + Carregador")], ...cellStyle }), new TableCell({ children: [new Paragraph(dados.celular)], ...cellStyle }) ] }),
                  new TableRow({ children: [ new TableCell({ children: [new Paragraph("Algemas")], ...cellStyle }), new TableCell({ children: [new Paragraph(dados.algemas)], ...cellStyle }), new TableCell({ children: [new Paragraph("Rádio Celular")], ...cellStyle }), new TableCell({ children: [new Paragraph(dados.radioCelular)], ...cellStyle }) ] }),
                  new TableRow({ children: [ new TableCell({ children: [new Paragraph("Chaves de Acesso")], ...cellStyle }), new TableCell({ children: [new Paragraph(dados.chavesAcesso)], ...cellStyle }), new TableCell({ children: [new Paragraph("Rádio HT")], ...cellStyle }), new TableCell({ children: [new Paragraph(dados.radioHT)], ...cellStyle }) ] }),
                  new TableRow({ children: [ new TableCell({ children: [new Paragraph("Chaves de Algemas")], ...cellStyle }), new TableCell({ children: [new Paragraph(dados.chavesAlgemas)], ...cellStyle }), new TableCell({ children: [new Paragraph("Cadeados")], ...cellStyle }), new TableCell({ children: [new Paragraph(dados.cadeados)], ...cellStyle }) ] }),
                  new TableRow({ children: [ new TableCell({ children: [new Paragraph("Escudos")], ...cellStyle }), new TableCell({ children: [new Paragraph(dados.escudos)], ...cellStyle }), new TableCell({ children: [new Paragraph("Pendrives")], ...cellStyle }), new TableCell({ children: [new Paragraph(dados.pendrives)], ...cellStyle }) ] }),
                  new TableRow({ children: [ new TableCell({ children: [new Paragraph("Lanternas")], ...cellStyle }), new TableCell({ children: [new Paragraph(dados.lanternas)], ...cellStyle }), new TableCell({ children: [new Paragraph("")], ...cellStyle }), new TableCell({ children: [new Paragraph("")], ...cellStyle }) ] })
              ] }),
              new Paragraph({ text: "" }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ADOLESCENTES POR ALOJAMENTO", bold: true, underline: {} })] }),
              new Paragraph({ text: "" }),
              ...['01', '02', '03', '04', '05', '06', '07', '08'].map(num => new Paragraph({ children: [ new TextRun({ text: `Alojamento ${num}: `, bold: true }), new TextRun({ text: `${dados.alojamentos[num].qtd} adolescentes - ` }), new TextRun({ text: dados.alojamentos[num].nomes, italics: true }) ], spacing: { after: 120 } })),
              new Paragraph({ text: "" }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "RESUMO DO PLANTÃO", bold: true, underline: {} })] }),
              new Paragraph({ text: "" }),
              new Paragraph({ children: [new TextRun(dados.resumoPlantao)] }),
              new Paragraph({ text: "\n\n" }), 
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "_______________________________________________" })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: dados.assinaturaDiurno || "(Sem nome)", bold: true }) ] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Supervisor Diurno", size: 20 })], spacing: { after: 400 } }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "_______________________________________________" })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: dados.assinaturaNoturno || "(Sem nome)", bold: true }) ] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Supervisor Noturno", size: 20 })] })
            ]
          }]
        });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `Relatorio_${dados.data.replace(/\//g, '-')}.docx`);
    } catch { alert("Erro ao criar o arquivo do Word."); }
  };

  // --- HISTORICO E EXCLUSÃO ---
  const fetchHistory = async () => {
    setLoading(true);
    const { data } = await supabase.from('relatorios').select('*').order('created_at', { ascending: false });
    setLoading(false);
    if (data) {
      setHistorico(data.map((item: any) => ({
        ...item, data: item.data_plantao, apoio: item.servicos_gerais || item.agente_portaria || '', supervisor: item.supervisor,
        resumoPlantao: item.resumo_plantao, assinaturaDiurno: item.plantao_diurno, assinaturaNoturno: item.plantao_noturno, alojamentos: item.alojamentos || {}
      })));
    }
  };

  const handleDeleteReport = async (id: number) => {
    // 1. Verificar se é Admin
    if (session?.user?.email !== ADMIN_EMAIL) {
        alert("Apenas o administrador pode excluir relatórios.");
        return;
    }

    // 2. Pedir senha de segurança
    const senhaDigitada = prompt("⚠️ ATENÇÃO: Essa ação não pode ser desfeita.\n\nPara excluir, digite a senha de administrador:");
    
    if (senhaDigitada !== SENHA_EXCLUSAO) {
        alert("Senha incorreta. Exclusão cancelada.");
        return;
    }

    // 3. Excluir no Supabase
    setLoading(true);
    const { error } = await supabase.from('relatorios').delete().eq('id', id);
    setLoading(false);

    if (error) {
        alert("Erro ao excluir: " + error.message);
    } else {
        alert("Relatório excluído com sucesso.");
        setSelectedReport(null); // Fecha o modal
        fetchHistory(); // Atualiza a lista
    }
  };

  const handleSalvarApenas = async () => {
    setLoading(true);
    const { error } = await supabase.from('relatorios').insert([{
      data_plantao: formData.data, educadores: formData.educadores, supervisor: formData.supervisor, servicos_gerais: formData.apoio, plantao: formData.plantao,
      tonfas: formData.tonfas, algemas: formData.algemas, chaves_acesso: formData.chavesAcesso, chaves_algemas: formData.chavesAlgemas, escudos: formData.escudos, lanternas: formData.lanternas, celular: formData.celular, radio_celular: formData.radioCelular, radio_ht: formData.radioHT, cadeados: formData.cadeados, pendrives: formData.pendrives,
      alojamentos: formData.alojamentos, resumo_plantao: formData.resumoPlantao, plantao_diurno: formData.assinaturaDiurno, plantao_noturno: formData.assinaturaNoturno
    }]);
    setLoading(false);
    if (error) alert("Erro ao salvar: " + error.message); else alert("✅ Salvo com sucesso!");
  };

  const handleSaveAndSend = async () => {
    setLoading(true);
    const { error } = await supabase.from('relatorios').insert([{
      data_plantao: formData.data, educadores: formData.educadores, supervisor: formData.supervisor, servicos_gerais: formData.apoio, plantao: formData.plantao,
      tonfas: formData.tonfas, algemas: formData.algemas, chaves_acesso: formData.chavesAcesso, chaves_algemas: formData.chavesAlgemas, escudos: formData.escudos, lanternas: formData.lanternas, celular: formData.celular, radio_celular: formData.radioCelular, radio_ht: formData.radioHT, cadeados: formData.cadeados, pendrives: formData.pendrives,
      alojamentos: formData.alojamentos, resumo_plantao: formData.resumoPlantao, plantao_diurno: formData.assinaturaDiurno, plantao_noturno: formData.assinaturaNoturno
    }]);
    setLoading(false);
    if (error) { alert("Erro ao salvar: " + error.message); return; }
    const texto = `*RELATÓRIO EQUIPE DE SEGURANÇA - CSIPRC*\n📅 Data: ${formData.data}\n\n*EQUIPE*\n👮 Supervisor: ${formData.supervisor}\n👥 Educadores: ${formData.educadores}\n🤝 Apoio: ${formData.apoio}\n🕒 Plantão: ${formData.plantao}\n\n*RESUMO DO PLANTÃO*\n📝 ${formData.resumoPlantao}\n\n*ASSINATURAS*\n☀️ Diurno: ${formData.assinaturaDiurno}\n🌙 Noturno: ${formData.assinaturaNoturno}\n\n_(Ver detalhes completos no arquivo Word/PDF)_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
  };

  // ------------------------- RENDERIZAÇÃO -------------------------

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 font-bold">Carregando...</div>;

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-center mb-6"><div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center text-4xl">🛡️</div></div>
            <h1 className="text-2xl font-bold text-center text-blue-900 mb-2">CSIPRC Segurança</h1>
            <p className="text-center text-gray-500 mb-8 text-sm">Faça login para acessar</p>
            <form onSubmit={handleLogin} className="space-y-4">
                <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">E-mail</label><input type="email" required className="w-full p-3 border rounded-lg outline-none" placeholder="usuario@csiprc.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} /></div>
                <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Senha</label><input type="password" required className="w-full p-3 border rounded-lg outline-none" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} /></div>
                <button disabled={loading} className="w-full bg-blue-900 text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition">{loading ? 'Entrando...' : 'Entrar'}</button>
            </form>
        </div>
      </div>
    );
  }

  const isUserAdmin = session.user.email === ADMIN_EMAIL;

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-10">
      {/* HEADER */}
      <div className="bg-blue-900 text-white p-4 sticky top-0 z-50 shadow-md flex justify-between items-center flex-wrap gap-2">
        <h1 className="font-bold text-sm md:text-lg flex items-center gap-2"><span>🛡️</span> CSIPRC Segurança</h1>
        <div className="flex gap-2 flex-wrap justify-end items-center">
            {view === 'form' && (
              <>
                <button onClick={() => gerarWord(formData)} className="text-xs bg-white text-blue-900 px-3 py-2 rounded font-bold shadow-sm hidden md:block">📄 Word</button>
                <button onClick={() => gerarPDF(formData)} className="text-xs bg-red-600 text-white px-3 py-2 rounded font-bold shadow-sm hidden md:block">📄 PDF</button>
                <button onClick={() => { fetchHistory(); setView('history'); setSelectedReport(null); }} className="text-xs bg-blue-700 px-3 py-2 rounded hover:bg-blue-600 transition">📜 Histórico</button>
              </>
            )}
            {(view === 'history' || view === 'admin') && <button onClick={() => setView('form')} className="text-xs bg-yellow-500 text-blue-900 font-bold px-3 py-2 rounded">⬅ Voltar</button>}
            {isUserAdmin && view !== 'admin' && <button onClick={() => setView('admin')} className="text-xs bg-purple-600 text-white px-3 py-2 rounded font-bold hover:bg-purple-700">⚙️ Admin</button>}
            <button onClick={handleLogout} className="text-xs bg-gray-800 text-gray-300 px-3 py-2 rounded hover:bg-gray-700 border border-gray-600 ml-2">Sair</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto bg-white shadow-lg min-h-screen mt-4 rounded-xl overflow-hidden">
        
        {/* VIEW: ADMIN */}
        {view === 'admin' && (
            <div className="p-8 max-w-lg mx-auto">
                <h2 className="text-2xl font-bold text-purple-900 mb-6 text-center">Painel Admin</h2>
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                    <h3 className="font-bold text-purple-800 mb-4">Cadastrar Novo Usuário</h3>
                    <form onSubmit={handleRegisterUser} className="space-y-4">
                        <div><label className="block text-xs font-bold text-gray-600 uppercase">E-mail</label><input type="email" required className="w-full p-2 border rounded" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} /></div>
                        <div><label className="block text-xs font-bold text-gray-600 uppercase">Senha</label><input type="password" required className="w-full p-2 border rounded" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} /></div>
                        <button disabled={loading} className="w-full bg-purple-600 text-white py-2 rounded font-bold hover:bg-purple-700">{loading ? '...' : 'Cadastrar'}</button>
                    </form>
                </div>
            </div>
        )}

        {/* VIEW: HISTÓRICO */}
        {view === 'history' && (
            <div className="p-6">
                
                {/* --- MODO LEITURA (DETALHES DO RELATÓRIO) --- */}
                {selectedReport ? (
                   <div className="animate-fade-in-up">
                      <div className="flex justify-between items-center border-b pb-4 mb-4">
                         <h2 className="text-xl md:text-2xl font-bold text-blue-900">📄 Visualizar Relatório</h2>
                         <button onClick={() => setSelectedReport(null)} className="text-sm bg-gray-200 px-3 py-1 rounded text-gray-700 hover:bg-gray-300 font-bold">FECHAR X</button>
                      </div>
                      
                      {/* CARTÃO ESTILO PAPEL A4 */}
                      <div className="bg-white p-6 md:p-10 rounded shadow-lg border border-gray-200 max-w-4xl mx-auto text-gray-800 text-sm md:text-base">
                         
                         {/* Cabeçalho do Relatório */}
                         <div className="text-center border-b-2 border-blue-900 pb-4 mb-6">
                             <h1 className="text-xl md:text-2xl font-bold text-blue-900 uppercase">Relatório Equipe de Segurança – CSIPRC</h1>
                             <p className="text-lg font-bold mt-2 text-gray-600">Data: {selectedReport.data}</p>
                         </div>

                         {/* Equipe */}
                         <div className="mb-6">
                             <h3 className="text-blue-900 font-bold border-b border-gray-300 mb-3 uppercase">👥 Equipe</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
                                <p><span className="font-bold">SUPERVISOR:</span> {selectedReport.supervisor}</p>
                                <p><span className="font-bold">EDUCADORES:</span> {selectedReport.educadores}</p>
                                <p><span className="font-bold">APOIO:</span> {selectedReport.apoio}</p>
                                <p><span className="font-bold">PLANTÃO:</span> {selectedReport.plantao}</p>
                             </div>
                         </div>

                         {/* Materiais */}
                         <div className="mb-6">
                             <h3 className="text-blue-900 font-bold border-b border-gray-300 mb-3 uppercase">🛡️ Materiais</h3>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs md:text-sm">
                                <div className="bg-gray-50 p-2 rounded">Tonfas: <strong>{selectedReport.tonfas}</strong></div>
                                <div className="bg-gray-50 p-2 rounded">Algemas: <strong>{selectedReport.algemas}</strong></div>
                                <div className="bg-gray-50 p-2 rounded">Celular: <strong>{selectedReport.celular}</strong></div>
                                <div className="bg-gray-50 p-2 rounded">Rádio HT: <strong>{selectedReport.radioHT}</strong></div>
                                <div className="bg-gray-50 p-2 rounded">Lanternas: <strong>{selectedReport.lanternas}</strong></div>
                                <div className="bg-gray-50 p-2 rounded">Escudos: <strong>{selectedReport.escudos}</strong></div>
                                {/* Exibindo apenas alguns principais para não poluir, ou mapeie todos */}
                                <div className="bg-gray-50 p-2 rounded col-span-2 text-gray-400 italic text-center">(Ver PDF para lista completa)</div>
                             </div>
                         </div>

                         {/* Alojamentos */}
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

                         {/* Resumo */}
                         <div className="mb-6">
                             <h3 className="text-blue-900 font-bold border-b border-gray-300 mb-3 uppercase">📝 Resumo do Plantão</h3>
                             <div className="bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-wrap min-h-[100px]">
                                {selectedReport.resumoPlantao}
                             </div>
                         </div>

                         {/* Assinaturas */}
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

                      {/* BOTÕES DE AÇÃO NO RODAPÉ DO DETALHE */}
                      <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <button onClick={() => gerarPDF(selectedReport)} className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-red-700 flex items-center gap-2">
                                📄 Baixar PDF
                            </button>
                            <button onClick={() => gerarWord(selectedReport)} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-blue-700 flex items-center gap-2">
                                📄 Baixar Word
                            </button>
                            
                            {/* BOTÃO EXCLUIR (SÓ PARA ADMIN) */}
                            {isUserAdmin && (
                                <button 
                                    onClick={() => handleDeleteReport(selectedReport.id!)} 
                                    className="bg-gray-800 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-black flex items-center gap-2 border border-red-500"
                                >
                                    🗑️ Excluir Relatório
                                </button>
                            )}
                      </div>
                   </div>

                ) : (
                    /* LISTA DE CARDS (QUANDO NADA SELECIONADO) */
                    <>
                        <h2 className="text-2xl font-bold text-blue-900 mb-4">Histórico de Relatórios</h2>
                        {loading && <p>Carregando...</p>}
                        {!loading && historico.length === 0 && <p className="text-gray-500">Nenhum relatório encontrado.</p>}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {historico.map((item) => (
                                <div 
                                    key={item.id} 
                                    onClick={() => setSelectedReport(item)} 
                                    className="cursor-pointer border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md bg-white hover:bg-blue-50 transition group"
                                >
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

        {/* VIEW: FORMULÁRIO (PADRÃO) */}
        {view === 'form' && (
            <form className="p-6 space-y-8" onSubmit={(e) => e.preventDefault()}>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex justify-between items-center">
                <div><label className="block text-xs font-bold text-blue-800 uppercase mb-1">Data</label><input type="text" name="data" value={formData.data} onChange={handleChange} className="w-40 p-2 border rounded bg-white font-mono" /></div>
                <div className="text-xs text-blue-600 font-semibold hidden md:block">Logado como: {session.user.email}</div>
            </div>
            <section><h3 className="flex items-center text-blue-900 font-bold border-b-2 border-blue-200 mb-4 pb-2 text-xl"><span className="mr-2">👥</span> Equipe</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"><div><label className="text-xs font-bold text-gray-500 block mb-1">SUPERVISOR</label><input placeholder="Nome" name="supervisor" value={formData.supervisor} onChange={handleChange} className="w-full border p-3 rounded bg-gray-50 font-semibold" /></div><div><label className="text-xs font-bold text-gray-500 block mb-1">EDUCADORES</label><input placeholder="Nomes" name="educadores" value={formData.educadores} onChange={handleChange} className="w-full border p-3 rounded bg-gray-50" /></div><div><label className="text-xs font-bold text-gray-500 block mb-1">APOIO</label><input placeholder="Portaria/Cozinha" name="apoio" value={formData.apoio} onChange={handleChange} className="w-full border p-3 rounded bg-gray-50" /></div><div><label className="text-xs font-bold text-gray-500 block mb-1">PLANTÃO</label><input placeholder="Ex: Alfa" name="plantao" value={formData.plantao} onChange={handleChange} className="w-full border p-3 rounded bg-gray-50" /></div></div></section>
            <section><h3 className="flex items-center text-blue-900 font-bold border-b-2 border-blue-200 mb-4 pb-2 mt-8 text-xl"><span className="mr-2">🛡️</span> Materiais (Qtd)</h3><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{['tonfas', 'algemas', 'chavesAcesso', 'chavesAlgemas', 'escudos', 'lanternas', 'celular', 'radioCelular', 'radioHT', 'cadeados', 'pendrives'].map((item) => (<div key={item} className="flex flex-col"><label className="text-gray-600 text-xs capitalize mb-1">{item.replace(/([A-Z])/g, ' $1')}</label><input type="number" name={item} onChange={handleChange} value={formData[item as keyof RelatorioData] as string} className="w-full border p-2 rounded bg-white" placeholder="0"/></div>))}</div></section>
            <section><h3 className="flex items-center text-blue-900 font-bold border-b-2 border-blue-200 mb-4 pb-2 mt-8 text-xl"><span className="mr-2">🔢</span> Adolescentes</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{['01', '02', '03', '04', '05', '06', '07', '08'].map((num) => (<div key={num} className="bg-gray-50 p-3 rounded border border-gray-200 flex gap-2 items-center"><span className="font-bold text-blue-800 text-sm w-12">AL-{num}</span><input type="number" placeholder="Qtd" value={formData.alojamentos[num].qtd} onChange={(e) => handleAlojamentoChange(num, 'qtd', e.target.value)} className="w-16 border p-2 text-center rounded font-bold" /><input type="text" placeholder="Nomes..." value={formData.alojamentos[num].nomes} onChange={(e) => handleAlojamentoChange(num, 'nomes', e.target.value)} className="flex-1 border p-2 rounded text-sm" /></div>))}</div></section>
            <section><h3 className="flex items-center text-blue-900 font-bold border-b-2 border-blue-200 mb-4 pb-2 mt-8 text-xl"><span className="mr-2">📝</span> Resumo</h3><textarea name="resumoPlantao" value={formData.resumoPlantao} placeholder="Fale aqui..." onChange={handleChange} className="w-full border p-3 rounded h-40 mb-6 outline-none text-lg"></textarea><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Supervisor Diurno</label><input placeholder="Assinatura..." name="assinaturaDiurno" value={formData.assinaturaDiurno} onChange={handleChange} className="w-full border p-3 rounded bg-gray-50" /></div><div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Supervisor Noturno</label><input placeholder="Assinatura..." name="assinaturaNoturno" value={formData.assinaturaNoturno} onChange={handleChange} className="w-full border p-3 rounded bg-gray-50" /></div></div></section>
            <div className="pt-6 pb-8 grid grid-cols-1 md:grid-cols-2 gap-4"><div className="flex gap-2"><button onClick={() => gerarWord(formData)} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl shadow hover:bg-blue-700 transition">📄 Word</button><button onClick={() => gerarPDF(formData)} className="flex-1 bg-red-600 text-white font-bold py-4 rounded-xl shadow hover:bg-red-700 transition">📄 PDF</button></div><div className="flex gap-2"><button onClick={handleSalvarApenas} className="flex-1 bg-gray-700 text-white font-bold py-4 rounded-xl shadow hover:bg-gray-800 transition flex items-center justify-center gap-2">💾 Salvar</button><button onClick={handleSaveAndSend} className="flex-1 bg-green-600 text-white font-bold py-4 rounded-xl shadow hover:bg-green-700 transition flex items-center justify-center gap-2">📱 Zap + Salvar</button></div></div>
            </form>
        )}
      </div>
    </div>
  );
}