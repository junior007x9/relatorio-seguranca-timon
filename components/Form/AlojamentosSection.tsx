// components/Form/AlojamentosSection.tsx
import { useState } from 'react';
import { RelatorioData } from '@/types';

interface AlojamentosSectionProps {
  formData: RelatorioData;
  handleAlojamentoChange: (id: string, field: 'qtd' | 'nomes', value: string) => void;
  totalAtual: number;
}

const numAlojamentos = ['01', '02', '03', '04', '05', '06', '07', '08'];

function AlojamentoRow({ num, data, handleAlojamentoChange }: any) {
    const [isEditing, setIsEditing] = useState(false);
    
    if (isEditing) {
        return (
            <div className="bg-blue-50 p-3 rounded border border-blue-300 flex gap-2 items-center w-full">
                <span className="font-bold text-blue-800 text-sm w-12">AL-{num}</span>
                <input type="number" placeholder="Qtd" value={data.qtd} onChange={(e) => handleAlojamentoChange(num, 'qtd', e.target.value)} className="w-16 border p-2 text-center rounded font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)} />
                <input type="text" placeholder="Nomes..." value={data.nomes} onChange={(e) => handleAlojamentoChange(num, 'nomes', e.target.value)} className="flex-1 border p-2 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)} />
                <button type="button" onClick={() => setIsEditing(false)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded font-bold transition">✔️</button>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 p-3 rounded border border-gray-200 flex justify-between items-center group cursor-pointer hover:bg-blue-50 transition" onClick={() => setIsEditing(true)}>
            <div className="flex items-center gap-2 truncate">
                <span className="font-bold text-blue-800 text-sm w-12">AL-{num}</span>
                <span className="bg-gray-200 text-gray-800 font-bold px-2 py-1 rounded text-xs">{data.qtd || '0'}</span>
                <span className="text-gray-700 text-sm truncate">{data.nomes || <span className="text-gray-400 italic">Sem nomes</span>}</span>
            </div>
            <button type="button" className="text-gray-400 hover:text-blue-600 opacity-50 group-hover:opacity-100 transition" title="Editar Alojamento">✏️</button>
        </div>
    );
}

export default function AlojamentosSection({ formData, handleAlojamentoChange, totalAtual }: AlojamentosSectionProps) {
  return (
    <section>
      <div className="flex justify-between items-center border-b-2 border-blue-200 mb-4 pb-2 mt-8">
        <h3 className="flex items-center text-blue-900 font-bold text-xl"><span className="mr-2">🔢</span> Adolescentes</h3>
        <div className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full font-bold text-sm">Total: {totalAtual}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {numAlojamentos.map((num) => (
          <AlojamentoRow key={num} num={num} data={formData.alojamentos[num]} handleAlojamentoChange={handleAlojamentoChange} />
        ))}
      </div>
    </section>
  );
}