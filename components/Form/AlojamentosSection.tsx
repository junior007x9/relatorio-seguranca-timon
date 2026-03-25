// components/Form/AlojamentosSection.tsx
'use client';

import { RelatorioData } from '@/types';

interface Props {
  formData: RelatorioData;
  handleAlojamentoChange: (id: string, field: 'qtd' | 'nomes', value: string) => void;
  totalAtual: number;
}

export default function AlojamentosSection({ formData, handleAlojamentoChange, totalAtual }: Props) {
  return (
    <section className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm relative mt-10">
      <div className="absolute -top-4 left-6 bg-teal-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md tracking-wide flex items-center gap-2">
        <span>🛏️</span> CONTROLE DE ALOJAMENTOS
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4 mb-6 pb-4 border-b border-gray-100">
        <p className="text-gray-500 text-sm">Registe a quantidade e os nomes dos adolescentes em cada quarto.</p>
        <div className="bg-teal-50 text-teal-800 px-4 py-2 rounded-xl font-black text-lg border border-teal-100 shadow-inner flex items-center gap-2">
          Total de Adolescentes: <span className="bg-white px-3 py-1 rounded-lg text-teal-600 shadow-sm">{totalAtual}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(formData.alojamentos).map(([id, dados]) => (
          <div key={id} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all group focus-within:ring-2 focus-within:ring-teal-100">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-black text-gray-700 text-lg flex items-center gap-1">
                <span className="text-teal-500 text-sm">#</span>{id}
              </h4>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Qtd:</label>
                <input
                  type="number"
                  min="0"
                  value={dados.qtd}
                  onChange={(e) => handleAlojamentoChange(id, 'qtd', e.target.value)}
                  className="w-16 bg-white border border-gray-300 p-1.5 rounded-lg text-center font-bold text-gray-800 outline-none focus:border-teal-500 transition-colors shadow-sm"
                />
              </div>
            </div>
            <div>
              <input
                type="text"
                placeholder="Nomes (separados por vírgula)"
                value={dados.nomes}
                onChange={(e) => handleAlojamentoChange(id, 'nomes', e.target.value)}
                className="w-full bg-white border border-gray-200 p-2.5 rounded-xl outline-none focus:border-teal-500 transition-colors text-sm text-gray-700 shadow-sm"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}