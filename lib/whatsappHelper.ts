// lib/whatsappHelper.ts

import { RelatorioData } from '@/types';
import { calcularTotalAdolescentes, converterParaLista } from './utils';

export const gerarTextoWhatsApp = (dados: RelatorioData) => {
    const total = calcularTotalAdolescentes(dados);
    let texto = `*RELATÓRIO EQUIPE DE SEGURANÇA - CSIPRC*\n📅 Data: ${dados.data}\n`;
    texto += `\n*👮 COORDENAÇÃO*\nCoordenador de Segurança: ${dados.coordenador}\nSupervisor: ${dados.supervisor}`;
    texto += `\n\n*👥 EDUCADORES*\n${dados.educadores}`;
    if (dados.temFolga) texto += `\n🏖️ Folga: ${dados.educadoresFolga}`;
    if (dados.temFerias) texto += `\n✈️ Férias: ${dados.educadoresFerias}`;
    
    texto += `\n\n*🤝 EQUIPE DE APOIO*`;
    texto += `\nPortaria: ${dados.portaria || '-'}`;
    texto += `\nCozinha: ${dados.cozinha || '-'}`;
    texto += `\nServ. Gerais: ${dados.servicosGerais || '-'}`;
    texto += `\nOutros Apoios: ${dados.apoio || '-'}`;
    texto += `\n\n🕒 Plantão: ${dados.plantao}`;
    
    if (dados.temSaida) { 
        texto += `\n\n*🚨 SAÍDA EXTERNA*\n👤 Adolescente: ${dados.saidaAdolescente}\n👮 Educador: ${dados.saidaEducador}\n⏰ Horário: ${dados.saidaHorario}`; 
    }

    if (dados.temAdmissao) {
        texto += `\n\n*📥 ADMISSÃO DE ADOLESCENTE*`;
        if (dados.admissoes && dados.admissoes.length > 0) {
            dados.admissoes.forEach(adm => texto += `\n👤 ${adm.nome}\n   - Rec: ${adm.quemRecebeu}\n   - Vist: ${adm.quemVistoria}\n   - Orig: ${adm.origem}\n   - Hora: ${adm.horario}`);
        } else { texto += `\nSim (sem detalhes)`; }
    }

    if (dados.temDesligamento) {
        texto += `\n\n*📤 DESLIGAMENTO*`;
        if (dados.desligamentos && dados.desligamentos.length > 0) {
            dados.desligamentos.forEach(des => texto += `\n👤 ${des.nome}\n   - Levou: ${des.quemLevou}\n   - Mot: ${des.motorista}\n   - Vist: ${des.quemVistoria}\n   - Hora: ${des.horario}`);
        } else { texto += `\nSim (sem detalhes)`; }
    }

    if (dados.temApoioSemiliberdade) texto += `\n\n🔄 Apoio Semiliberdade: ${dados.educadoresApoioSemiliberdade}`;

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
    const linhasResumo = converterParaLista(dados.resumoPlantao);
    texto += `\n\n*📝 RESUMO DO PLANTÃO*\n` + (linhasResumo.length > 0 ? linhasResumo.map(l => `• ${l}`).join('\n') : 'Sem observações.');
    texto += `\n\n*✍️ ASSINATURAS*\n☀️ Diurno: ${dados.assinaturaDiurno}\n🌙 Noturno: ${dados.assinaturaNoturno}`;
    return texto;
};