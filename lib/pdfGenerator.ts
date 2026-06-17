// lib/pdfGenerator.ts

// @ts-ignore
import pdfMake from "pdfmake/build/pdfmake";
// @ts-ignore
import pdfFonts from "pdfmake/build/vfs_fonts";
import { RelatorioData } from '@/types';
import { calcularTotalAdolescentes, converterParaLista, getBase64ImageFromURL } from './utils';

if (typeof window !== 'undefined' && pdfMake.vfs === undefined) {
  // @ts-ignore
  pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;
}

// Função auxiliar para formatar a lista Inteligente nos relatórios em PDF
const formatarSmartList = (lista: any[]) => {
  if (!lista || lista.length === 0) return 'Não informado';
  return lista.map(s => `${s.nome} (${s.cargo})`).join(', ');
};

// Função auxiliar para criar cabeçalhos de secção bonitos com fundo colorido
const criarCabecalhoSecao = (titulo: string, corFundo: string = '#1e3a8a') => ({
  table: {
    widths: ['*'],
    body: [[{ text: titulo, bold: true, color: '#ffffff', fillColor: corFundo, margin: [5, 4, 5, 4], alignment: 'center' }]]
  },
  layout: 'noBorders',
  margin: [0, 15, 0, 10]
});

export const gerarPDF = async (dados: RelatorioData | any) => {
  const total = calcularTotalAdolescentes(dados);

  try {
    const logoBase64 = await getBase64ImageFromURL('/logo.png');
    
    const contentArray: any[] = [
      // LOGO
      logoBase64 ? { image: logoBase64, width: 250, alignment: 'center', margin: [0, 0, 0, 10] } : {},
      
      // TÍTULO PRINCIPAL
      { text: 'RELATÓRIO DIÁRIO DE PLANTÃO DE SEGURANÇA', style: 'mainTitle' },
      { text: 'CENTRO SÓCIOEDUCATIVO DE INTERNAÇÃO PROVISÓRIA DA REGIÃO DOS COCAIS - CSIPRC', style: 'subTitle' },
      { text: `DATA DO PLANTÃO: ${dados.data}`, style: 'dateTitle' },
      
      // 1. DADOS DA EQUIPE
      criarCabecalhoSecao('📋 DADOS DA EQUIPE', '#1e3a8a'),
      {
        table: {
          widths: ['*', '*'],
          body: [
            [
              { text: [{ text: 'Coordenador: ', bold: true }, dados.coordenador || '-'] },
              { text: [{ text: 'Supervisor: ', bold: true }, dados.supervisor || '-'] }
            ],
            [
              { text: [{ text: 'Plantão: ', bold: true }, dados.plantao || '-'] },
              { text: [{ text: 'Educadores: ', bold: true }, dados.educadores || '-'] }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 5],
        fontSize: 10
      }
    ];

    // EQUIPE DE APOIO
    contentArray.push({
      table: {
        widths: ['*', '*'],
        body: [
          [
            { text: [{ text: 'Portaria: ', bold: true }, dados.portaria || '-'], fillColor: '#f8fafc' },
            { text: [{ text: 'Cozinha: ', bold: true }, dados.cozinha || '-'], fillColor: '#f8fafc' }
          ],
          [
            { text: [{ text: 'Serv. Gerais: ', bold: true }, dados.servicosGerais || '-'], fillColor: '#f8fafc' },
            { text: [{ text: 'Apoio Geral: ', bold: true }, dados.apoio || '-'], fillColor: '#f8fafc' }
          ]
        ]
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 5],
      fontSize: 10
    });

    // EXTRAS (Folgas, Férias)
    const extras = [];
    if (dados.temFolga) extras.push({ text: `Folgas: ${dados.educadoresFolga}` });
    if (dados.temFerias) extras.push({ text: `Férias/Atestado: ${dados.educadoresFerias}` });
    if (dados.temApoioSemiliberdade) extras.push({ text: `Apoio Semiliberdade: ${dados.educadoresApoioSemiliberdade}` });
    
    if (extras.length > 0) {
      contentArray.push({
        table: { widths: ['*'], body: [[ { stack: extras, color: '#475569', fontSize: 9, italics: true } ]] },
        layout: 'noBorders',
        margin: [0, 2, 0, 5]
      });
    }

    // 2. MATERIAIS DE SEGURANÇA
    contentArray.push(
      criarCabecalhoSecao('🎒 CONFERÊNCIA DE MATERIAIS', '#475569'),
      {
        table: {
          widths: ['*', 'auto', '*', 'auto'],
          body: [
            [
              { text: 'ITEM', bold: true, fillColor: '#e2e8f0', alignment: 'center' }, 
              { text: 'QTD', bold: true, fillColor: '#e2e8f0', alignment: 'center' }, 
              { text: 'ITEM', bold: true, fillColor: '#e2e8f0', alignment: 'center' }, 
              { text: 'QTD', bold: true, fillColor: '#e2e8f0', alignment: 'center' }
            ],
            // AQUI FOI FEITA A TROCA ENTRE CHAVES DE ALGEMAS E RÁDIO CELULAR
            ['Tonfas', { text: dados.tonfas || '0', alignment: 'center' }, 'Celular + Carregador', { text: dados.celular || '0', alignment: 'center' }],
            ['Algemas', { text: dados.algemas || '0', alignment: 'center' }, 'Rádio Celular', { text: dados.radioCelular || '0', alignment: 'center' }], // INVERTIDO AQUI
            ['Chaves Acesso', { text: dados.chavesAcesso || '0', alignment: 'center' }, 'Rádio HT', { text: dados.radioHT || '0', alignment: 'center' }],
            ['Chaves Algemas', { text: dados.chavesAlgemas || '0', alignment: 'center' }, 'Cadeados', { text: dados.cadeados || '0', alignment: 'center' }], // INVERTIDO AQUI
            ['Escudos', { text: dados.escudos || '0', alignment: 'center' }, 'Pendrives', { text: dados.pendrives || '0', alignment: 'center' }],
            ['Lanternas', { text: dados.lanternas || '0', alignment: 'center' }, '', ''],
          ]
        }, 
        layout: {
          hLineWidth: (i: any, node: any) => (i === 0 || i === node.table.body.length) ? 1 : 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#cbd5e1',
          vLineColor: () => '#cbd5e1',
        },
        margin: [0, 0, 0, 10],
        fontSize: 10
      }
    );

    // 3. ALOJAMENTOS
    contentArray.push(criarCabecalhoSecao('🛏️ ADOLESCENTES POR ALOJAMENTO', '#0d9488'));

    const alojamentosLeft = [];
    const alojamentosRight = [];
    
    ['01', '02', '03', '04'].forEach(num => alojamentosLeft.push({ text: [{ text: `AL-${num} [${dados.alojamentos[num].qtd || '0'}]: `, bold: true, color: '#0f766e' }, { text: dados.alojamentos[num].nomes || 'Vazio', italics: true }], margin: [0, 4] }));
    ['05', '06', '07', '08'].forEach(num => alojamentosRight.push({ text: [{ text: `AL-${num} [${dados.alojamentos[num].qtd || '0'}]: `, bold: true, color: '#0f766e' }, { text: dados.alojamentos[num].nomes || 'Vazio', italics: true }], margin: [0, 4] }));

    contentArray.push(
      {
        columns: [
          { width: '50%', stack: alojamentosLeft as any, padding: [0, 0, 10, 0] },
          { width: '50%', stack: alojamentosRight as any, padding: [10, 0, 0, 0] }
        ],
        fontSize: 10
      },
      // Bloco da Inteligência da Vistoria dos Alojamentos
      {
        table: {
          widths: ['*'],
          body: [
            [{
              text: [
                { text: `TOTAL DE ADOLESCENTES NO PLANTÃO: ${total}\n\n`, bold: true, fontSize: 11, color: '#0f766e' },
                { text: `Horário da Vistoria: `, bold: true, color: '#0f766e' }, `${dados.horarioVistoria || 'Não informado'}\n`,
                { text: `Vistoriado por: `, bold: true, color: '#0f766e' }, `${formatarSmartList(dados.responsaveisVistoria)}`
              ]
            }]
          ]
        },
        layout: 'noBorders',
        margin: [0, 15, 0, 10],
        alignment: 'right'
      }
    );

    // 4. RESUMO DO PLANTÃO
    contentArray.push(criarCabecalhoSecao('📝 RESUMO E OBSERVAÇÕES DO PLANTÃO', '#1e3a8a'));
    
    const linhasResumo = converterParaLista(dados.resumoPlantao);
    if (linhasResumo.length > 0) {
      contentArray.push({ ul: linhasResumo, fontSize: 10, margin: [15, 0, 5, 10], alignment: 'justify', lineHeight: 1.3 });
    } else {
      contentArray.push({ text: "Nenhuma observação registada para este plantão.", fontSize: 10, alignment: 'center', italics: true, color: '#64748b' });
    }

    // 5. OCORRÊNCIAS E VISITAS
    const temOcorrencia = dados.temVisita || dados.temSaida || dados.temAdmissao || dados.temDesligamento;
    if (temOcorrencia) {
        contentArray.push(criarCabecalhoSecao('🚨 OCORRÊNCIAS REGISTRADAS', '#b91c1c'));

        if (dados.temVisita) {
          contentArray.push({ text: '▶ VISITAS DE FAMILIARES (SÁBADO)', bold: true, color: '#4f46e5', margin: [0, 5, 0, 2], fontSize: 11 });
          contentArray.push({ 
              text: [
                  { text: `Revista realizada por: `, bold: true },
                  { text: `${formatarSmartList(dados.responsaveisVisitas)}`, fontSize: 10, color: '#334155' }
              ], margin: [10, 0, 0, 8] 
          });
        }

        if (dados.temSaida && dados.saidas && dados.saidas.length > 0) {
          contentArray.push({ text: '▶ SAÍDAS EXTERNAS', bold: true, color: '#b91c1c', margin: [0, 5, 0, 2], fontSize: 11 });
          dados.saidas.forEach((s: any) => {
              contentArray.push(
                  {
                      table: {
                          widths: ['*', '*', '*'],
                          body: [[
                              { text: [{ text: 'Adolescente: ', bold: true }, s.adolescente], fontSize: 10 },
                              { text: [{ text: 'Educador(es): ', bold: true }, formatarSmartList(s.educadores)], fontSize: 10 },
                              { text: [{ text: 'Horário: ', bold: true }, s.horario], fontSize: 10 }
                          ]]
                      },
                      layout: 'lightHorizontalLines',
                      margin: [0, 0, 0, 5]
                  }
              );
          });
        }

        if (dados.temAdmissao && dados.admissoes && dados.admissoes.length > 0) {
            contentArray.push({ text: '▶ ADMISSÕES', bold: true, color: '#15803d', margin: [0, 5, 0, 2], fontSize: 11 });
            dados.admissoes.forEach((a: any) => {
                contentArray.push({ 
                    text: [
                        { text: `• Adolescente: ${a.nome}\n`, bold: true },
                        { text: `  Recebido por: ${a.quemRecebeu} | Vistoriado por: ${formatarSmartList(a.vistoriadores)} | Horário: ${a.horario}`, fontSize: 9, color: '#334155' }
                    ], margin: [10, 0, 0, 8] 
                });
            });
        }

        if (dados.temDesligamento && dados.desligamentos && dados.desligamentos.length > 0) {
            contentArray.push({ text: '▶ DESLIGAMENTOS', bold: true, color: '#b91c1c', margin: [0, 5, 0, 2], fontSize: 11 });
            dados.desligamentos.forEach((d: any) => {
                contentArray.push({ 
                    text: [
                        { text: `• Adolescente: ${d.nome}\n`, bold: true },
                        { text: `  Levado por: ${d.quemLevou} | Motorista: ${d.motorista} | Vistoriado por: ${formatarSmartList(d.vistoriadores)} | Horário: ${d.horario}`, fontSize: 9, color: '#334155' }
                    ], margin: [10, 0, 0, 8] 
                });
            });
        }
    }

    // 6. ASSINATURAS (Protegido de quebra de página)
    contentArray.push({ 
        unbreakable: true, 
        margin: [0, 30, 0, 0],
        stack: [
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#cbd5e1' }], margin: [0, 0, 0, 20] },
          {
              columns: [
                  { width: '*', stack: [
                      dados.assinaturaDiurnoImg ? { image: dados.assinaturaDiurnoImg, width: 120, alignment: 'center' } : { text: '\n\n\n' },
                      { text: '________________________________', alignment: 'center' },
                      { text: dados.assinaturaDiurno || '(Sem nome registrado)', bold: true, alignment: 'center', fontSize: 10, margin: [0, 2, 0, 0] },
                      { text: 'Supervisor Plantão Diurno', alignment: 'center', fontSize: 8, color: '#64748b' }
                  ]},
                  { width: '*', stack: [
                      dados.assinaturaNoturnoImg ? { image: dados.assinaturaNoturnoImg, width: 120, alignment: 'center' } : { text: '\n\n\n' },
                      { text: '________________________________', alignment: 'center' },
                      { text: dados.assinaturaNoturno || '(Sem nome registrado)', bold: true, alignment: 'center', fontSize: 10, margin: [0, 2, 0, 0] },
                      { text: 'Supervisor Plantão Noturno', alignment: 'center', fontSize: 8, color: '#64748b' }
                  ]}
              ]
          }
        ]
    });

    // 7. FOTOS
    if (dados.fotos && dados.fotos.length > 0) {
        contentArray.push(
            { text: '', pageBreak: 'before' }, // Força a quebra de página
            criarCabecalhoSecao('📷 REGISTROS FOTOGRÁFICOS', '#475569')
        );
        const fotosGrid = [];
        for (let i = 0; i < dados.fotos.length; i += 2) {
            const row = {
                columns: [
                    { image: dados.fotos[i], width: 240, alignment: 'center', margin: [0, 0, 5, 10] },
                    dados.fotos[i+1] ? { image: dados.fotos[i+1], width: 240, alignment: 'center', margin: [5, 0, 0, 10] } : { text: '', width: 240 }
                ],
                alignment: 'center'
            };
            fotosGrid.push(row);
        }
        contentArray.push({ stack: fotosGrid, margin: [0, 10, 0, 0] });
    }

    // DEFINIÇÃO FINAL E GERAÇÃO
    const docDefinition: any = { 
        pageSize: 'A4', 
        pageMargins: [30, 30, 30, 30], 
        content: contentArray, 
        defaultStyle: { fontSize: 10, color: '#0f172a' },
        styles: { 
            mainTitle: { fontSize: 16, bold: true, alignment: 'center', color: '#1e3a8a', margin: [0, 0, 0, 2] }, 
            subTitle: { fontSize: 9, bold: true, alignment: 'center', color: '#64748b', margin: [0, 0, 0, 15] }, 
            dateTitle: { fontSize: 11, bold: true, alignment: 'center', color: '#b91c1c', margin: [0, 0, 0, 10], decoration: 'underline' } 
        } 
    };
    
    pdfMake.createPdf(docDefinition).download(`Relatorio_${dados.plantao || 'Plantao'}_${dados.data.replace(/\//g, '-')}.pdf`);
  } catch (err) { 
    console.error(err);
    alert("Erro ao gerar o PDF. Verifique se as imagens anexadas não são muito pesadas."); 
  }
};