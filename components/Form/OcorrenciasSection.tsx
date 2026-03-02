// components/Form/OcorrenciasSection.tsx
import { RelatorioData } from '@/types';

interface OcorrenciasSectionProps {
  formData: RelatorioData;
  onChange: (e: any) => void;
  gerenciarArray: (campo: keyof RelatorioData, index: number, field?: string, value?: string, remover?: boolean, adicionar?: boolean, novoItem?: any) => void;
}

export default function OcorrenciasSection({ formData, onChange, gerenciarArray }: OcorrenciasSectionProps) {
  return (
    <section className="mt-8 space-y-6">
      <h3 className="text-xl font-bold text-blue-900 border-b-2 border-blue-200 pb-2">⚠️ Ocorrências Especiais</h3>

      {/* SAÍDA EXTERNA */}
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <div className="flex items-center gap-3 mb-4">
          <input type="checkbox" id="temSaida" name="temSaida" checked={formData.temSaida} onChange={onChange} className="w-6 h-6 text-red-600" />
          <label htmlFor="temSaida" className="text-lg font-bold text-red-900 cursor-pointer">Houve Saída Externa?</label>
        </div>
        {formData.temSaida && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="text-xs font-bold text-red-800 block mb-1">Adolescente</label><input placeholder="Ex: João" name="saidaAdolescente" value={formData.saidaAdolescente} onChange={onChange} className="w-full border p-2 rounded bg-white text-gray-900" /></div>
            <div><label className="text-xs font-bold text-red-800 block mb-1">Educador</label><input placeholder="Ex: Maria" name="saidaEducador" value={formData.saidaEducador} onChange={onChange} className="w-full border p-2 rounded bg-white text-gray-900" /></div>
            <div><label className="text-xs font-bold text-red-800 block mb-1">Horário</label><input placeholder="Ex: 14:00" name="saidaHorario" value={formData.saidaHorario} onChange={onChange} className="w-full border p-2 rounded bg-white text-gray-900" /></div>
          </div>
        )}
      </div>

      {/* ADMISSÃO */}
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <div className="flex items-center gap-3 mb-4">
          <input type="checkbox" id="temAdmissao" name="temAdmissao" checked={formData.temAdmissao} onChange={onChange} className="w-6 h-6 text-green-600" />
          <label htmlFor="temAdmissao" className="text-lg font-bold text-green-900 cursor-pointer">Houve Admissão?</label>
        </div>
        {formData.temAdmissao && (
          <div className="space-y-3">
            {(formData.admissoes || []).map((adm, idx) => (
              <div key={idx} className="flex flex-wrap gap-2 items-end bg-white p-3 rounded shadow-sm border border-green-100">
                <div className="w-full sm:w-[22%]"><label className="text-[10px] uppercase font-bold text-gray-500">Nome</label><input value={adm.nome} onChange={(e) => gerenciarArray('admissoes', idx, 'nome', e.target.value)} className="w-full border p-2 rounded text-sm text-gray-900" /></div>
                <div className="w-full sm:w-[18%]"><label className="text-[10px] uppercase font-bold text-gray-500">Rec.</label><input value={adm.quemRecebeu} onChange={(e) => gerenciarArray('admissoes', idx, 'quemRecebeu', e.target.value)} className="w-full border p-2 rounded text-sm text-gray-900" /></div>
                <div className="w-full sm:w-[18%]"><label className="text-[10px] uppercase font-bold text-gray-500">Vistoria</label><input value={adm.quemVistoria} onChange={(e) => gerenciarArray('admissoes', idx, 'quemVistoria', e.target.value)} className="w-full border p-2 rounded text-sm text-gray-900" /></div>
                <div className="w-full sm:w-[18%]"><label className="text-[10px] uppercase font-bold text-gray-500">Origem</label><input value={adm.origem} onChange={(e) => gerenciarArray('admissoes', idx, 'origem', e.target.value)} className="w-full border p-2 rounded text-sm text-gray-900" /></div>
                <div className="w-full sm:w-[10%]"><label className="text-[10px] uppercase font-bold text-gray-500">Hora</label><input type="time" value={adm.horario} onChange={(e) => gerenciarArray('admissoes', idx, 'horario', e.target.value)} className="w-full border p-2 rounded text-sm text-gray-900" /></div>
                <button type="button" onClick={() => gerenciarArray('admissoes', idx, undefined, undefined, true)} className="bg-red-500 text-white px-3 py-2 rounded font-bold h-10 mb-0.5">X</button>
              </div>
            ))}
            <button type="button" onClick={() => gerenciarArray('admissoes', 0, undefined, undefined, false, true, { nome: '', quemRecebeu: '', quemVistoria: '', origem: '', horario: '' })} className="text-sm bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700">➕ Adicionar</button>
          </div>
        )}
      </div>

      {/* DESLIGAMENTO */}
      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
        <div className="flex items-center gap-3 mb-4">
          <input type="checkbox" id="temDesligamento" name="temDesligamento" checked={formData.temDesligamento} onChange={onChange} className="w-6 h-6 text-orange-600" />
          <label htmlFor="temDesligamento" className="text-lg font-bold text-orange-900 cursor-pointer">Houve Desligamento?</label>
        </div>
        {formData.temDesligamento && (
          <div className="space-y-3">
            {(formData.desligamentos || []).map((des, idx) => (
              <div key={idx} className="flex flex-wrap gap-2 items-end bg-white p-3 rounded shadow-sm border border-orange-100">
                <div className="w-full sm:w-[22%]"><label className="text-[10px] uppercase font-bold text-gray-500">Nome</label><input value={des.nome} onChange={(e) => gerenciarArray('desligamentos', idx, 'nome', e.target.value)} className="w-full border p-2 rounded text-sm text-gray-900" /></div>
                <div className="w-full sm:w-[18%]"><label className="text-[10px] uppercase font-bold text-gray-500">Levou</label><input value={des.quemLevou} onChange={(e) => gerenciarArray('desligamentos', idx, 'quemLevou', e.target.value)} className="w-full border p-2 rounded text-sm text-gray-900" /></div>
                <div className="w-full sm:w-[18%]"><label className="text-[10px] uppercase font-bold text-gray-500">Mot.</label><input value={des.motorista} onChange={(e) => gerenciarArray('desligamentos', idx, 'motorista', e.target.value)} className="w-full border p-2 rounded text-sm text-gray-900" /></div>
                <div className="w-full sm:w-[18%]"><label className="text-[10px] uppercase font-bold text-gray-500">Vistoria</label><input value={des.quemVistoria} onChange={(e) => gerenciarArray('desligamentos', idx, 'quemVistoria', e.target.value)} className="w-full border p-2 rounded text-sm text-gray-900" /></div>
                <div className="w-full sm:w-[10%]"><label className="text-[10px] uppercase font-bold text-gray-500">Hora</label><input type="time" value={des.horario} onChange={(e) => gerenciarArray('desligamentos', idx, 'horario', e.target.value)} className="w-full border p-2 rounded text-sm text-gray-900" /></div>
                <button type="button" onClick={() => gerenciarArray('desligamentos', idx, undefined, undefined, true)} className="bg-red-500 text-white px-3 py-2 rounded font-bold h-10 mb-0.5">X</button>
              </div>
            ))}
            <button type="button" onClick={() => gerenciarArray('desligamentos', 0, undefined, undefined, false, true, { nome: '', quemLevou: '', motorista: '', quemVistoria: '', horario: '' })} className="text-sm bg-orange-600 text-white px-4 py-2 rounded font-bold hover:bg-orange-700">➕ Adicionar</button>
          </div>
        )}
      </div>
    </section>
  );
}