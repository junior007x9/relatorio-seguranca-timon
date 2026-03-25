// components/Form/OcorrenciasSection.tsx
'use client';

import { RelatorioData } from '@/types';

interface Props {
  formData: RelatorioData;
  onChange: (e: any) => void;
  gerenciarArray: (campo: keyof RelatorioData, index: number, field?: string, value?: string, remover?: boolean, adicionar?: boolean, novoItem?: any) => void;
}

export default function OcorrenciasSection({ formData, onChange, gerenciarArray }: Props) {
  return (
    <div className="space-y-6 mt-8">
      
      {/* CARD: SAÍDA EXTERNA */}
      <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" name="temSaida" checked={formData.temSaida} onChange={onChange} className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
          <span className="font-black text-gray-800 text-lg group-hover:text-blue-600 transition-colors">🚗 Houve Saída Externa?</span>
        </label>
        
        {formData.temSaida && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 bg-blue-50/50 p-5 rounded-2xl border border-blue-100 animate-fade-in-up">
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Adolescente</label>
                <input type="text" name="saidaAdolescente" value={formData.saidaAdolescente} onChange={onChange} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" placeholder="Nome do adolescente" />
            </div>
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Educador</label>
                <input type="text" name="saidaEducador" value={formData.saidaEducador} onChange={onChange} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" placeholder="Nome do educador" />
            </div>
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Horário</label>
                <input type="time" name="saidaHorario" value={formData.saidaHorario} onChange={onChange} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
            </div>
          </div>
        )}
      </section>

      {/* CARD: ADMISSÕES */}
      <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" name="temAdmissao" checked={formData.temAdmissao} onChange={onChange} className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500 cursor-pointer" />
          <span className="font-black text-gray-800 text-lg group-hover:text-green-600 transition-colors">📥 Houve Admissão?</span>
        </label>

        {formData.temAdmissao && (
          <div className="mt-5 space-y-3 animate-fade-in-up">
            {formData.admissoes?.map((adm: any, i: number) => (
              <div key={i} className="flex gap-3 items-center bg-green-50/50 p-3 rounded-2xl border border-green-100">
                <input type="text" placeholder="Nome da Admissão" value={adm.nome} onChange={(e) => gerenciarArray('admissoes', i, 'nome', e.target.value)} className="flex-1 border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-green-400" />
                <button type="button" onClick={() => gerenciarArray('admissoes', i, '', '', true)} className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl transition-all border border-red-200 hover:border-transparent">✕</button>
              </div>
            ))}
            <button type="button" onClick={() => gerenciarArray('admissoes', 0, '', '', false, true, { nome: '' })} className="text-sm font-bold text-green-600 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-xl transition-colors border border-green-200 flex items-center gap-2">
              <span>➕</span> Adicionar Admissão
            </button>
          </div>
        )}
      </section>

      {/* CARD: DESLIGAMENTOS */}
      <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" name="temDesligamento" checked={formData.temDesligamento} onChange={onChange} className="w-5 h-5 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer" />
          <span className="font-black text-gray-800 text-lg group-hover:text-red-600 transition-colors">📤 Houve Desligamento?</span>
        </label>

        {formData.temDesligamento && (
          <div className="mt-5 space-y-3 animate-fade-in-up">
            {formData.desligamentos?.map((desl: any, i: number) => (
              <div key={i} className="flex gap-3 items-center bg-red-50/50 p-3 rounded-2xl border border-red-100">
                <input type="text" placeholder="Nome do Desligado" value={desl.nome} onChange={(e) => gerenciarArray('desligamentos', i, 'nome', e.target.value)} className="flex-1 border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-red-400" />
                <button type="button" onClick={() => gerenciarArray('desligamentos', i, '', '', true)} className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl transition-all border border-red-200 hover:border-transparent">✕</button>
              </div>
            ))}
            <button type="button" onClick={() => gerenciarArray('desligamentos', 0, '', '', false, true, { nome: '' })} className="text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors border border-red-200 flex items-center gap-2">
              <span>➕</span> Adicionar Desligamento
            </button>
          </div>
        )}
      </section>

      {/* CARD: OUTRAS INFORMAÇÕES (Folgas, Férias, etc) */}
      <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 transition-all hover:shadow-md">
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" name="temFolga" checked={formData.temFolga} onChange={onChange} className="w-4 h-4 text-purple-600 rounded" />
            <span className="font-bold text-gray-700 group-hover:text-purple-600">Folgas</span>
          </label>
          {formData.temFolga && <input type="text" name="educadoresFolga" value={formData.educadoresFolga} onChange={onChange} placeholder="Nomes..." className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-purple-400 animate-fade-in-up bg-purple-50/30" />}
        </div>
        
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" name="temFerias" checked={formData.temFerias} onChange={onChange} className="w-4 h-4 text-orange-600 rounded" />
            <span className="font-bold text-gray-700 group-hover:text-orange-600">Férias/Atestado</span>
          </label>
          {formData.temFerias && <input type="text" name="educadoresFerias" value={formData.educadoresFerias} onChange={onChange} placeholder="Nomes..." className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-400 animate-fade-in-up bg-orange-50/30" />}
        </div>
        
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" name="temApoioSemiliberdade" checked={formData.temApoioSemiliberdade} onChange={onChange} className="w-4 h-4 text-pink-600 rounded" />
            <span className="font-bold text-gray-700 group-hover:text-pink-600 text-sm">Apoio Semiliberdade</span>
          </label>
          {formData.temApoioSemiliberdade && <input type="text" name="educadoresApoioSemiliberdade" value={formData.educadoresApoioSemiliberdade} onChange={onChange} placeholder="Nomes..." className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-pink-400 animate-fade-in-up bg-pink-50/30" />}
        </div>
      </section>

    </div>
  );
}