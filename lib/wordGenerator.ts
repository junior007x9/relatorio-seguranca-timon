// lib/wordGenerator.ts

import { 
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
  WidthType, AlignmentType, BorderStyle, Header, ImageRun
} from 'docx';
import { saveAs } from 'file-saver';
import { RelatorioData } from '@/types';
import { calcularTotalAdolescentes, converterParaLista, carregarImagemBuffer } from './utils';

// Função auxiliar para extrair a lista inteligente no Word
const formatarSmartList = (lista: any[]) => {
  if (!lista || lista.length === 0) return 'Não informado';
  return lista.map(s => `${s.nome} (${s.cargo})`).join(', ');
};

export const gerarWord = async (dados: RelatorioData | any) => {
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

      // TABELA DE MATERIAIS DE SEGURANÇA (Ordem corrigida)
      childrenParagraphs.push(
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "MATERIAIS DE SEGURANÇA", bold: true, underline: {} })], spacing: { after: 50 } }),
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
                new TableRow({ children: [ new TableCell({ children: [new Paragraph({ text: "ITEM", bold: true, size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: "QTD", bold: true, size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: "ITEM", bold: true, size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: "QTD", bold: true, size: 18 })], ...cellStyle }) ] }),
                new TableRow({ children: [ new TableCell({ children: [new Paragraph({ text: "Tonfas", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: dados.tonfas || "0", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: "Celular + Carregador", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: dados.celular || "0", size: 18 })], ...cellStyle }) ] }),
                new TableRow({ children: [ new TableCell({ children: [new Paragraph({ text: "Algemas", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: dados.algemas || "0", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: "Rádio Celular", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: dados.radioCelular || "0", size: 18 })], ...cellStyle }) ] }),
                new TableRow({ children: [ new TableCell({ children: [new Paragraph({ text: "Chaves Acesso", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: dados.chavesAcesso || "0", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: "Rádio HT", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: dados.radioHT || "0", size: 18 })], ...cellStyle }) ] }),
                new TableRow({ children: [ new TableCell({ children: [new Paragraph({ text: "Chaves Algemas", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: dados.chavesAlgemas || "0", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: "Cadeados", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: dados.cadeados || "0", size: 18 })], ...cellStyle }) ] }),
                new TableRow({ children: [ new TableCell({ children: [new Paragraph({ text: "Escudos", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: dados.escudos || "0", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: "Pendrives", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: dados.pendrives || "0", size: 18 })], ...cellStyle }) ] }),
                new TableRow({ children: [ new TableCell({ children: [new Paragraph({ text: "Lanternas", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: dados.lanternas || "0", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: "", size: 18 })], ...cellStyle }), new TableCell({ children: [new Paragraph({ text: "", size: 18 })], ...cellStyle }) ] })
            ] }),
            new Paragraph({ text: "" }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ADOLESCENTES POR ALOJAMENTO", bold: true, underline: {} })], spacing: noSpacing })
      );

      // Lista de Quartos
      ['01', '02', '03', '04', '05', '06', '07', '08'].forEach(num => {
          if (dados.alojamentos[num].qtd && dados.alojamentos[num].qtd !== '0') {
             childrenParagraphs.push(new Paragraph({ children: [ new TextRun({ text: `AL-${num}: `, bold: true, size: 18 }), new TextRun({ text: `${dados.alojamentos[num].qtd} - `, size: 18 }), new TextRun({ text: dados.alojamentos[num].nomes || '', italics: true, size: 18 }) ], spacing: noSpacing }));
          }
      });

      // Total, Horário da Vistoria e Responsáveis
      childrenParagraphs.push(
          new Paragraph({ alignment: AlignmentType.RIGHT, children: [ new TextRun({ text: `TOTAL DE ADOLESCENTES: ${total}`, bold: true, size: 22 }) ], spacing: { before: 50, after: 0 } }),
          new Paragraph({ alignment: AlignmentType.RIGHT, children: [ new TextRun({ text: `Horário da Vistoria: ${dados.horarioVistoria || 'Não informado'}`, bold: true, size: 16 }) ], spacing: noSpacing }),
          new Paragraph({ alignment: AlignmentType.RIGHT, children: [ new TextRun({ text: `Vistoriado por: ${formatarSmartList(dados.responsaveisVistoria)}`, italics: true, size: 16 }) ], spacing: { after: 50 } })
      );

      // Resumo Geral
      childrenParagraphs.push(
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "RESUMO DO PLANTÃO", bold: true, underline: {} })], keepNext: true, spacing: noSpacing })
      );

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

      // OCORRÊNCIAS COM OS DADOS INTELIGENTES INJETADOS
      if (dados.temVisita) {
          childrenParagraphs.push(
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "VISITAS (SÁBADO)", bold: true, underline: {}, color: "4F46E5" })], spacing: { before: 200, after: 50 } }),
              new Paragraph({ children: [new TextRun({ text: `Revista realizada por: ${formatarSmartList(dados.responsaveisVisitas)}`, size: 18 })], bullet: { level: 0 } })
          );
      }

      if (dados.temSaida) {
          childrenParagraphs.push(
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SAÍDAS EXTERNAS", bold: true, underline: {}, color: "FF0000" })], spacing: { before: 200, after: 50 } })
          );
          if (dados.saidas && dados.saidas.length > 0) {
              dados.saidas.forEach((s: any) => {
                  childrenParagraphs.push(
                      new Paragraph({ 
                          children: [
                              new TextRun({ text: `Adolescente: ${s.adolescente} | Educadores: ${formatarSmartList(s.educadores)} | Horário: ${s.horario}`, size: 18 })
                          ], 
                          bullet: { level: 0 }, 
                          spacing: { after: 50 } 
                      })
                  );
              });
          } else {
              childrenParagraphs.push(new Paragraph({ children: [new TextRun("Sim (sem detalhes)")] }));
          }
      }

      if (dados.temAdmissao) {
          childrenParagraphs.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ADMISSÃO DE ADOLESCENTE", bold: true, underline: {}, color: "15803D" })], spacing: { before: 100 } }));
          if(dados.admissoes && dados.admissoes.length > 0) {
              dados.admissoes.forEach((a: any) => {
                  childrenParagraphs.push(new Paragraph({ children: [new TextRun({ text: `${a.nome} | Rec: ${a.quemRecebeu} | Vist: ${formatarSmartList(a.vistoriadores)} | Hora: ${a.horario}`, size: 18 })], bullet: { level: 0 }, spacing: noSpacing }));
              });
          } else { childrenParagraphs.push(new Paragraph({ children: [new TextRun("Sim (sem detalhes)")] })); }
      }

      if (dados.temDesligamento) {
          childrenParagraphs.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "DESLIGAMENTO", bold: true, underline: {}, color: "B91C1C" })], spacing: { before: 100 } }));
          if(dados.desligamentos && dados.desligamentos.length > 0) {
              dados.desligamentos.forEach((d: any) => {
                  childrenParagraphs.push(new Paragraph({ children: [new TextRun({ text: `${d.nome} | Levou: ${d.quemLevou} | Mot: ${d.motorista} | Vist: ${formatarSmartList(d.vistoriadores)} | Hora: ${d.horario}`, size: 18 })], bullet: { level: 0 }, spacing: noSpacing }));
              });
          } else { childrenParagraphs.push(new Paragraph({ children: [new TextRun("Sim (sem detalhes)")] })); }
      }

      // ASSINATURAS
      childrenParagraphs.push(
            new Paragraph({ text: "\n", keepNext: true, spacing: noSpacing }), 
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "___________________________        ___________________________" })], keepNext: true, spacing: noSpacing }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: `${dados.assinaturaDiurno || "(Sem nome)"}             ${dados.assinaturaNoturno || "(Sem nome)"}`, bold: true, size: 16 }) ], keepNext: true, spacing: noSpacing }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Supervisor Diurno                      Supervisor Noturno", size: 14 })], keepNext: true })
      );

      // FOTOS
      if(dados.fotos && dados.fotos.length > 0) {
          childrenParagraphs.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ANEXOS FOTOGRÁFICOS", bold: true, size: 20 })], pageBreakBefore: true }));
          for(const foto of dados.fotos) {
              const res = await fetch(foto);
              const buff = await res.blob();
              childrenParagraphs.push(new Paragraph({ children: [new ImageRun({ data: await buff.arrayBuffer(), transformation: { width: 400, height: 300 } })], alignment: AlignmentType.CENTER }));
              childrenParagraphs.push(new Paragraph({ text: "\n" }));
          }
      }

      const doc = new Document({ sections: [{ properties: { page: { margin: { top: 500, bottom: 500, left: 500, right: 500 } } } as any, headers: { default: new Header({ children: [ new Paragraph({ alignment: AlignmentType.CENTER, children: [ logoBuffer ? new ImageRun({ data: new Uint8Array(logoBuffer), transformation: { width: 650, height: 160 } }) : new TextRun("") ] }), new Paragraph({ text: "" }) ] }) }, children: childrenParagraphs }] });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Relatorio_${dados.data.replace(/\//g, '-')}.docx`);
  } catch (err) { 
    console.error(err);
    alert("Erro ao criar o arquivo do Word."); 
  }
};