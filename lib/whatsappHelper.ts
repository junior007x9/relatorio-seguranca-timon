// lib/whatsappHelper.ts
import { RelatorioData } from '@/types';
import { calcularTotalAdolescentes } from './utils';

// Função para formatar a lista Inteligente nos relatórios
export const formatarSmartList = (lista: any[]) => {
  if (!lista || lista.length === 0) return 'Não informado';
  return lista.map(s => `${s.nome} (${s.cargo})`).join(', ');
};

export function gerarTextoWhatsApp(data: RelatorioData) {
  const totalAlojados = calcularTotalAdolescentes(data);
  
  let texto = `*RELATÓRIO DE PLANTÃO - ${data.plantao}*\n`;
  texto += `📅 Data: ${data.data}\n\n`;

  texto += `*👥 EQUIPE:*\n`;
  texto += `Coordenador(a): ${data.coordenador || 'Não informado'}\n`;
  texto += `Supervisor(a): ${data.supervisor || 'Não informado'}\n`;
  texto += `Educadores: ${data.educadores || 'Não informado'}\n`;
  texto += `Apoio Geral: ${data.apoio || 'Não informado'}\n`;
  texto += `Portaria: ${data.portaria || 'Não informado'}\n`;
  texto += `Cozinha: ${data.cozinha || 'Não informado'}\n`;
  texto += `Serviços Gerais: ${data.servicosGerais || 'Não informado'}\n\n`;

  texto += `*🎒 MATERIAIS:*\n`;
  texto += `Tonfas: ${data.tonfas}\n`;
  texto += `Algemas: ${data.algemas}\n`;
  texto += `Chaves de Acesso: ${data.chavesAcesso}\n`;
  texto += `Rádio Celular: ${data.radioCelular}\n`; // <-- INVERTIDO AQUI
  texto += `Escudos: ${data.escudos}\n`;
  texto += `Lanternas: ${data.lanternas}\n`;
  texto += `Celular: ${data.celular}\n`;
  texto += `Rádio HT: ${data.radioHT}\n`;
  texto += `Chaves Algemas: ${data.chavesAlgemas}\n`; // <-- INVERTIDO AQUI
  texto += `Cadeados: ${data.cadeados}\n`;
  texto += `Pendrives: ${data.pendrives}\n\n`;

  texto += `*🛏️ ALOJAMENTOS (Total: ${totalAlojados}):*\n`;
  Object.entries(data.alojamentos).forEach(([id, aloj]) => {
    if (Number(aloj.qtd) > 0) {
      texto += `Quarto ${id}: ${aloj.qtd} (${aloj.nomes})\n`;
    }
  });
  texto += `\n*⏰ Horário da Vistoria:* ${data.horarioVistoria || 'Não informado'}\n`;
  texto += `*🔎 Vistoriado por:* ${formatarSmartList(data.responsaveisVistoria)}\n\n`;

  texto += `*📝 RESUMO DO PLANTÃO:*\n${data.resumoPlantao}\n\n`;

  if (data.temVisita) {
    texto += `*👨‍👩‍👧 VISITAS (Sábado):*\n`;
    texto += `Revista feita por: ${formatarSmartList(data.responsaveisVisitas)}\n\n`;
  }

  if (data.temSaida && data.saidas?.length > 0) {
    texto += `*🚗 SAÍDAS EXTERNAS:*\n`;
    data.saidas.forEach((s: any) => {
      texto += `- Adolescente: ${s.adolescente || 'Não inf.'}\n`;
      texto += `  Educadores: ${formatarSmartList(s.educadores)}\n`;
      texto += `  Horário: ${s.horario || 'Não inf.'}\n`;
    });
    texto += `\n`;
  }

  if (data.temAdmissao && data.admissoes?.length > 0) {
    texto += `*📥 ADMISSÕES:*\n`;
    data.admissoes.forEach((a: any) => {
      texto += `- Adolescente(s): ${a.nome || 'Não inf.'}\n`;
      texto += `  Recebido por: ${a.quemRecebeu || 'Não inf.'}\n`;
      texto += `  Vistoriado por: ${formatarSmartList(a.vistoriadores)}\n`;
      texto += `  Horário: ${a.horario || 'Não inf.'}\n`;
    });
    texto += `\n`;
  }

  if (data.temDesligamento && data.desligamentos?.length > 0) {
    texto += `*📤 DESLIGAMENTOS:*\n`;
    data.desligamentos.forEach((d: any) => {
      texto += `- Adolescente: ${d.nome || 'Não inf.'}\n`;
      texto += `  Levado por: ${d.quemLevou || 'Não inf.'} (Mot: ${d.motorista || 'Não inf.'})\n`;
      texto += `  Vistoriado por: ${formatarSmartList(d.vistoriadores)}\n`;
      texto += `  Horário: ${d.horario || 'Não inf.'}\n`;
    });
    texto += `\n`;
  }

  const outrasOcorrencias = [];
  if (data.temFolga) outrasOcorrencias.push(`Folgas: ${data.educadoresFolga}`);
  if (data.temFerias) outrasOcorrencias.push(`Férias/Atestado: ${data.educadoresFerias}`);
  if (data.temApoioSemiliberdade) outrasOcorrencias.push(`Apoio Semiliberdade: ${data.educadoresApoioSemiliberdade}`);

  if (outrasOcorrencias.length > 0) {
    texto += `*📌 OUTRAS INFORMAÇÕES:*\n${outrasOcorrencias.join('\n')}\n\n`;
  }

  texto += `Ass. Diurno: ${data.assinaturaDiurno || 'Pendente'}\n`;
  texto += `Ass. Noturno: ${data.assinaturaNoturno || 'Pendente'}`;

  return texto;
}