// lib/utils.ts

import { RelatorioData } from '@/types';

export const calcularTotalAdolescentes = (dados: RelatorioData) => {
  return Object.values(dados.alojamentos).reduce((acc, curr) => {
    const qtd = parseInt(curr.qtd) || 0;
    return acc + qtd;
  }, 0);
};

export const limparTexto = (texto: string) => {
  if (!texto) return "";
  const limpo = texto.replace(/[^\w\sÀ-ÿ.,;:\-()\/%@!?:'"\n]/g, "").replace(/As1|Asl|As\|/g, "Às").replace(/As\s/g, "Às ").replace(/[ \t]+/g, " ");
  return limpo.trim();
};

export const converterParaLista = (texto: string) => {
  if (!texto) return [];
  const limpo = limparTexto(texto);
  const linhas = limpo.split(/\n/);
  return linhas.filter(l => l.trim().length > 0).map(l => l.trim());
};

export const carregarImagemBuffer = async (url: string) => { 
  try { 
    const r = await fetch(url); 
    if (!r.ok) return null; 
    const b = await r.blob(); 
    return await b.arrayBuffer(); 
  } catch { 
    return null; 
  } 
};

export const getBase64ImageFromURL = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image(); 
    img.setAttribute("crossOrigin", "anonymous");
    img.onload = () => { 
      const c = document.createElement("canvas"); 
      c.width = img.width; 
      c.height = img.height; 
      const ctx = c.getContext("2d"); 
      ctx?.drawImage(img, 0, 0); 
      resolve(c.toDataURL("image/png")); 
    };
    img.onerror = () => resolve(null); 
    img.src = url;
  });
};