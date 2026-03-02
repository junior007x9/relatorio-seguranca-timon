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

export const gerarPDF = async (dados: RelatorioData) => {
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

    if (dados.temSaida) {
      contentArray.push(
          { text: 'SAÍDA EXTERNA', style: 'sectionHeader', alignment: 'center', color: '#b91c1c' },
          { columns: [{ width: '*', text: [{ text: 'Adolescente: ', bold: true }, dados.saidaAdolescente], fontSize: 10 }, { width: '*', text: [{ text: 'Horário: ', bold: true }, dados.saidaHorario], fontSize: 10 }], margin: [0, 2] },
          { text: [{ text: 'Educador Responsável: ', bold: true }, dados.saidaEducador], margin: [0, 0, 0, 5], fontSize: 10 }
      );
    }

    if (dados.temAdmissao) {
        contentArray.push({ text: 'ADMISSÃO DE ADOLESCENTE', style: 'sectionHeader', alignment: 'center', color: '#15803d' });
        if(dados.admissoes && dados.admissoes.length > 0) {
            dados.admissoes.forEach(a => {
                contentArray.push({ 
                    text: [
                        { text: `• ${a.nome}`, bold: true },
                        { text: ` | Recebido: ${a.quemRecebeu} | Vist: ${a.quemVistoria} | Origem: ${a.origem} | Hora: ${a.horario}`, fontSize: 9 }
                    ], margin: [10, 0, 0, 2] 
                });
            });
        }
    }

    if (dados.temDesligamento) {
        contentArray.push({ text: 'DESLIGAMENTO', style: 'sectionHeader', alignment: 'center', color: '#b91c1c' });
        if(dados.desligamentos && dados.desligamentos.length > 0) {
            dados.desligamentos.forEach(d => {
                contentArray.push({ 
                    text: [
                        { text: `• ${d.nome}`, bold: true },
                        { text: ` | Levou: ${d.quemLevou} | Mot: ${d.motorista} | Vist: ${d.quemVistoria} | Hora: ${d.horario}`, fontSize: 9 }
                    ], margin: [10, 0, 0, 2] 
                });
            });
        }
    }

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

    if (dados.fotos && dados.fotos.length > 0) {
        contentArray.push({ text: 'REGISTROS FOTOGRÁFICOS', style: 'sectionHeader', alignment: 'center', pageBreak: 'before', margin: [0, 10, 0, 10] });
        const fotosGrid = [];
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
        pageSize: 'A4', pageMargins: [15, 15, 15, 15], content: contentArray, 
        defaultStyle: { fontSize: 10 },
        styles: { header: { fontSize: 16, bold: true, margin: [0, 0, 0, 2] }, subheader: { fontSize: 12, bold: true }, sectionHeader: { fontSize: 11, bold: true, decoration: 'underline', margin: [0, 5, 0, 2] }, tableExample: { margin: [0, 2, 0, 5] } } 
    };
    pdfMake.createPdf(docDefinition).download(`Relatorio_PDF_${dados.data.replace(/\//g, '-')}.pdf`);
  } catch (err) { 
    console.error(err);
    alert("Erro ao gerar PDF."); 
  }
};