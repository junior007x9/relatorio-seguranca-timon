// components/Form/OcorrenciasSection.tsx
'use client';

import { RelatorioData } from '@/types';
import { toast } from 'sonner';
import { registrarLog } from '@/lib/logger';
import SmartServerSelect from '../UI/SmartServerSelect'; 

interface Props {
  formData: any;
  onChange: (e: any) => void;
  gerenciarArray: (campo: string, index: number, field?: string, value?: string, remover?: boolean, adicionar?: boolean, novoItem?: any) => void;
  setFormData: React.Dispatch<React.SetStateAction<any>>; 
}

export default function OcorrenciasSection({ formData, onChange, gerenciarArray, setFormData }: Props) {
  
  const handleToggleCheckbox = (e: React.ChangeEvent<HTMLInputElement>, label: string) => {
    onChange(e); 
    const action = e.target.checked ? 'Ativou' : 'Desativou';
    const userName = typeof window !== "undefined" ? localStorage.getItem("usuarioAtual") || "Usuário" : "Usuário";
    registrarLog(userName, 'Ocorrências', `${action} a seção de ${label}`);
    if (e.target.checked) toast.info(`Preencha os dados de ${label}.`);
  };

  const handleAddArrayItem = (campo: string, label: string, novoItem: any) => {
    gerenciarArray(campo, 0, '', '', false, true, novoItem);
    const userName = typeof window !== "undefined" ? localStorage.getItem("usuarioAtual") || "Usuário" : "Usuário";
    registrarLog(userName, 'Ocorrências', `Adicionou um novo registro em ${label}`);
    toast.success(`Novo campo de ${label} adicionado!`);
  };

  const handleRemoveArrayItem = (campo: string, index: number, label: string) => {
    gerenciarArray(campo, index, '', '', true);
    const userName = typeof window !== "undefined" ? localStorage.getItem("usuarioAtual") || "Usuário" : "Usuário";
    registrarLog(userName, 'Ocorrências', `Removeu um registro de ${label}`);
    toast.warning(`Registro de ${label} removido.`);
  };

  return (
    <div className="space-y-6 mt-8">

      {/* CARD: VISITAS */}
      <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
        <label className="flex items-center gap-3 cursor-pointer group w-fit">
          <input 
            type="checkbox" 
            name="temVisita" 
            checked={formData.temVisita || false} 
            onChange={(e) => handleToggleCheckbox(e, 'Visitas de Familiares')} 
            className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer" 
          />
          <span className="font-black text-gray-800 text-lg group-hover:text-indigo-600 transition-colors">👨‍👩‍👧 Houve Visitas (Sábado)?</span>
        </label>

        {formData.temVisita && (
          <div className="mt-5 animate-fade-in-up">
             <SmartServerSelect 
                label="👮 Quem fez a REVISTA NAS VISITAS?" 
                campo="responsaveisVisitas" 
                formData={formData} 
                setFormData={setFormData} 
             />
          </div>
        )}
      </section>
      
      {/* CARD: SAÍDA EXTERNA */}
      <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
        <label className="flex items-center gap-3 cursor-pointer group w-fit">
          <input type="checkbox" name="temSaida" checked={formData.temSaida} onChange={(e) => handleToggleCheckbox(e, 'Saída Externa')} className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
          <span className="font-black text-gray-800 text-lg group-hover:text-blue-600 transition-colors">🚗 Houve Saída Externa?</span>
        </label>
        
        {formData.temSaida && (
          <div className="mt-5 space-y-4 animate-fade-in-up">
            {formData.saidas?.map((saida: any, i: number) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-blue-50/50 p-5 rounded-2xl border border-blue-100 relative mt-2">
                <button type="button" onClick={() => handleRemoveArrayItem('saidas', i, 'Saída Externa')} className="absolute -top-3 -right-3 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all border border-red-200 hover:border-transparent shadow-sm active:scale-90">✕</button>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Adolescente</label>
                    <input type="text" value={saida.adolescente || ''} onChange={(e) => gerenciarArray('saidas', i, 'adolescente', e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" placeholder="Nome do adolescente" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Educador</label>
                    <input type="text" value={saida.educador || ''} onChange={(e) => gerenciarArray('saidas', i, 'educador', e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" placeholder="Nome do educador" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Horário</label>
                    <input type="time" value={saida.horario || ''} onChange={(e) => gerenciarArray('saidas', i, 'horario', e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => handleAddArrayItem('saidas', 'Saída Externa', { adolescente: '', educador: '', horario: '' })} className="text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl active:scale-95 transition-all border border-blue-200 flex items-center gap-2 mt-4">
              <span>➕</span> Adicionar Saída Externa
            </button>
          </div>
        )}
      </section>

      {/* CARD: ADMISSÕES */}
      <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
        <label className="flex items-center gap-3 cursor-pointer group w-fit">
          <input type="checkbox" name="temAdmissao" checked={formData.temAdmissao} onChange={(e) => handleToggleCheckbox(e, 'Admissões')} className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500 cursor-pointer" />
          <span className="font-black text-gray-800 text-lg group-hover:text-green-600 transition-colors">📥 Houve Admissão?</span>
        </label>

        {formData.temAdmissao && (
          <div className="mt-5 space-y-4 animate-fade-in-up">
            {formData.admissoes?.map((adm: any, i: number) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-green-50/50 p-5 rounded-2xl border border-green-100 relative mt-2">
                <button type="button" onClick={() => handleRemoveArrayItem('admissoes', i, 'Admissão')} className="absolute -top-3 -right-3 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all border border-red-200 hover:border-transparent shadow-sm active:scale-90">✕</button>
                <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Adolescente</label>
                    <input type="text" value={adm.nome || ''} onChange={(e) => gerenciarArray('admissoes', i, 'nome', e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-green-400" placeholder="Nome do adolescente admitido" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Equipe Técnica / Supervisor</label>
                    <input type="text" value={adm.quemRecebeu || ''} onChange={(e) => gerenciarArray('admissoes', i, 'quemRecebeu', e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-green-400" placeholder="Quem recebeu?" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Quem fez a vistoria?</label>
                    <input type="text" value={adm.quemVistoria || ''} onChange={(e) => gerenciarArray('admissoes', i, 'quemVistoria', e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-green-400" placeholder="Nome do responsável" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Horário</label>
                    <input type="time" value={adm.horario || ''} onChange={(e) => gerenciarArray('admissoes', i, 'horario', e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-green-400 bg-white" />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => handleAddArrayItem('admissoes', 'Admissão', { nome: '', quemRecebeu: '', quemVistoria: '', horario: '' })} className="text-sm font-bold text-green-600 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-xl active:scale-95 transition-all border border-green-200 flex items-center gap-2 mt-4">
              <span>➕</span> Adicionar Admissão
            </button>
          </div>
        )}
      </section>

      {/* CARD: DESLIGAMENTOS */}
      <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
        <label className="flex items-center gap-3 cursor-pointer group w-fit">
          <input type="checkbox" name="temDesligamento" checked={formData.temDesligamento} onChange={(e) => handleToggleCheckbox(e, 'Desligamentos')} className="w-5 h-5 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer" />
          <span className="font-black text-gray-800 text-lg group-hover:text-red-600 transition-colors">📤 Houve Desligamento?</span>
        </label>

        {formData.temDesligamento && (
          <div className="mt-5 space-y-4 animate-fade-in-up">
            {formData.desligamentos?.map((desl: any, i: number) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-red-50/50 p-5 rounded-2xl border border-red-100 relative mt-2">
                <button type="button" onClick={() => handleRemoveArrayItem('desligamentos', i, 'Desligamento')} className="absolute -top-3 -right-3 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all border border-red-200 hover:border-transparent shadow-sm active:scale-90">✕</button>
                <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Adolescente</label>
                    <input type="text" value={desl.nome || ''} onChange={(e) => gerenciarArray('desligamentos', i, 'nome', e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-red-400" placeholder="Nome do adolescente desligado" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Quem levou?</label>
                    <input type="text" value={desl.quemLevou || ''} onChange={(e) => gerenciarArray('desligamentos', i, 'quemLevou', e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-red-400" placeholder="Ex: Educador João, Oficial de Justiça..." />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Motorista</label>
                    <input type="text" value={desl.motorista || ''} onChange={(e) => gerenciarArray('desligamentos', i, 'motorista', e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-red-400" placeholder="Nome do motorista" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Quem fez a vistoria?</label>
                    <input type="text" value={desl.quemVistoria || ''} onChange={(e) => gerenciarArray('desligamentos', i, 'quemVistoria', e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-red-400" placeholder="Nome do responsável pela vistoria" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Horário</label>
                    <input type="time" value={desl.horario || ''} onChange={(e) => gerenciarArray('desligamentos', i, 'horario', e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-red-400 bg-white" />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => handleAddArrayItem('desligamentos', 'Desligamento', { nome: '', quemLevou: '', motorista: '', quemVistoria: '', horario: '' })} className="text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl active:scale-95 transition-all border border-red-200 flex items-center gap-2 mt-4">
              <span>➕</span> Adicionar Desligamento
            </button>
          </div>
        )}
      </section>

      {/* CARD: OUTRAS INFORMAÇÕES */}
      <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 transition-all hover:shadow-md">
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer group w-fit">
            <input type="checkbox" name="temFolga" checked={formData.temFolga} onChange={(e) => handleToggleCheckbox(e, 'Folgas')} className="w-4 h-4 text-purple-600 rounded" />
            <span className="font-bold text-gray-700 group-hover:text-purple-600 transition-colors">Folgas</span>
          </label>
          {formData.temFolga && <input type="text" name="educadoresFolga" value={formData.educadoresFolga} onChange={onChange} placeholder="Nomes dos educadores..." className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-purple-400 animate-fade-in-up bg-purple-50/30" />}
        </div>
        
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer group w-fit">
            <input type="checkbox" name="temFerias" checked={formData.temFerias} onChange={(e) => handleToggleCheckbox(e, 'Férias/Atestado')} className="w-4 h-4 text-orange-600 rounded" />
            <span className="font-bold text-gray-700 group-hover:text-orange-600 transition-colors">Férias/Atestado</span>
          </label>
          {formData.temFerias && <input type="text" name="educadoresFerias" value={formData.educadoresFerias} onChange={onChange} placeholder="Nomes dos educadores..." className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-400 animate-fade-in-up bg-orange-50/30" />}
        </div>
        
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer group w-fit">
            <input type="checkbox" name="temApoioSemiliberdade" checked={formData.temApoioSemiliberdade} onChange={(e) => handleToggleCheckbox(e, 'Apoio Semiliberdade')} className="w-4 h-4 text-pink-600 rounded" />
            <span className="font-bold text-gray-700 group-hover:text-pink-600 text-sm transition-colors">Apoio Semiliberdade</span>
          </label>
          {formData.temApoioSemiliberdade && <input type="text" name="educadoresApoioSemiliberdade" value={formData.educadoresApoioSemiliberdade} onChange={onChange} placeholder="Nomes dos educadores..." className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-pink-400 animate-fade-in-up bg-pink-50/30" />}
        </div>
      </section>
    </div>
  );
}