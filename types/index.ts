// types/index.ts

export type AlojamentoDados = { qtd: string; nomes: string; };
export type HistoricoEdicao = { usuario: string; dataHora: string; acao: string; }; 

export type AdmissaoItem = { 
    nome: string; 
    quemRecebeu: string; 
    quemVistoria: string;
    origem: string;
    horario: string; 
};

export type DesligamentoItem = {
    nome: string;
    quemLevou: string;
    motorista: string;
    quemVistoria: string;
    horario: string;
};

export type RelatorioData = {
  id?: number; 
  created_at?: string; 
  data: string; 
  supervisor: string; 
  educadores: string; 
  apoio: string; 
  plantao: string;
  tonfas: string; algemas: string; chavesAcesso: string; chavesAlgemas: string; escudos: string; lanternas: string;
  celular: string; radioCelular: string; radioHT: string; cadeados: string; pendrives: string;
  alojamentos: { [key: string]: AlojamentoDados };
  resumoPlantao: string; 
  assinaturaDiurno: string; 
  assinaturaNoturno: string;
  assinaturaDiurnoImg: string; 
  assinaturaNoturnoImg: string;
  fotos: string[];
  
  temSaida: boolean; saidaAdolescente: string; saidaEducador: string; saidaHorario: string;
  
  temAdmissao: boolean;
  admissoes: AdmissaoItem[]; 

  temDesligamento: boolean;
  desligamentos: DesligamentoItem[];

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