// components/UI/HelpButton.tsx
"use client";
import { useState } from "react";

export default function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:scale-110 active:scale-95 hover:bg-blue-700 z-50"
        title="Ajuda do Sistema"
      >
        <span className="text-2xl font-bold">?</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="text-xl font-bold text-gray-800">Guia de Uso do Sistema</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-red-500 text-3xl leading-none font-bold transition-colors"
              >
                &times;
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto space-y-4 text-gray-600 pr-2">
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
                <h4 className="font-bold text-blue-800">1. Identificação Inicial</h4>
                <p className="mt-1 text-sm">Ao entrar, digite seu nome. Isso garante que todas as ações fiquem registradas no seu usuário.</p>
              </div>

              <div className="rounded-lg bg-orange-50 border border-orange-100 p-4">
                <h4 className="font-bold text-orange-800">2. Seleção de Plantão</h4>
                <p className="mt-1 text-sm">Escolha se o seu plantão é ALFA ou BETA (Diurno ou Noturno). Isso carrega automaticamente as equipes padrão na tela seguinte.</p>
              </div>
              
              <div className="rounded-lg bg-green-50 border border-green-100 p-4">
                <h4 className="font-bold text-green-800">3. Preenchimento do Relatório</h4>
                <p className="mt-1 text-sm">Preencha os checklists de materiais e a aba de ocorrências. Sempre que você alterar algo, o sistema salvará um log invisível para controle e segurança.</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg bg-gray-800 px-6 py-2 font-semibold text-white hover:bg-gray-700 active:scale-95 transition-all"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}