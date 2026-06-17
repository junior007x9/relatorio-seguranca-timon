// lib/logger.ts

export interface LogEntry {
  id: string;
  usuario: string;
  acao: string;
  detalhes: string;
  dataHora: string;
}

export function registrarLog(usuario: string, acao: string, detalhes: string) {
  // Cria o novo registro
  const novoLog: LogEntry = {
    id: crypto.randomUUID(),
    usuario,
    acao,
    detalhes,
    dataHora: new Date().toISOString(),
  };

  // Resgata os logs antigos do navegador
  const logsAntigos = JSON.parse(localStorage.getItem("sistema_logs") || "[]");
  
  // Adiciona o novo log e salva
  logsAntigos.push(novoLog);
  localStorage.setItem("sistema_logs", JSON.stringify(logsAntigos));
  
  console.log("Log registrado pela auditoria:", novoLog);
}