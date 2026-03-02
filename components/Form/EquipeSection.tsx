// components/Form/EquipeSection.tsx
import { RelatorioData } from '@/types';
import EditableField from '../UI/EditableField';

interface EquipeSectionProps {
  formData: RelatorioData;
  onChange: (e: any) => void;
}

export default function EquipeSection({ formData, onChange }: EquipeSectionProps) {
  return (
    <section>
      <h3 className="flex items-center text-blue-900 font-bold border-b-2 border-blue-200 mb-4 pb-2 text-xl">
        <span className="mr-2">👥</span> Equipe
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <EditableField label="Coordenador de Segurança" name="coordenador" value={formData.coordenador} onChange={onChange} />
        <EditableField label="Supervisor" name="supervisor" value={formData.supervisor} onChange={onChange} />
        <div className="col-span-full">
            <EditableField label="Educadores" name="educadores" value={formData.educadores} onChange={onChange} />
        </div>
        
        <div className="col-span-full border-t border-gray-100 pt-3 mt-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-2 rounded border border-gray-200">
            <div className="flex items-center gap-2 mb-2"><input type="checkbox" id="temFolga" name="temFolga" checked={formData.temFolga} onChange={onChange} className="w-4 h-4" /><label htmlFor="temFolga" className="text-xs font-bold text-gray-600 cursor-pointer uppercase">Educador de Folga?</label></div>
            {formData.temFolga && <input placeholder="Nome de quem está de folga" name="educadoresFolga" value={formData.educadoresFolga} onChange={onChange} className="w-full border p-2 rounded text-sm text-gray-900" />}
          </div>
          <div className="bg-gray-50 p-2 rounded border border-gray-200">
            <div className="flex items-center gap-2 mb-2"><input type="checkbox" id="temFerias" name="temFerias" checked={formData.temFerias} onChange={onChange} className="w-4 h-4" /><label htmlFor="temFerias" className="text-xs font-bold text-gray-600 cursor-pointer uppercase">Educador de Férias?</label></div>
            {formData.temFerias && <input placeholder="Nome de quem está de férias" name="educadoresFerias" value={formData.educadoresFerias} onChange={onChange} className="w-full border p-2 rounded text-sm text-gray-900" />}
          </div>
          <div className="bg-gray-50 p-2 rounded border border-gray-200">
            <div className="flex items-center gap-2 mb-2"><input type="checkbox" id="temApoioSemiliberdade" name="temApoioSemiliberdade" checked={formData.temApoioSemiliberdade} onChange={onChange} className="w-4 h-4" /><label htmlFor="temApoioSemiliberdade" className="text-xs font-bold text-gray-600 cursor-pointer uppercase">Apoio Semiliberdade?</label></div>
            {formData.temApoioSemiliberdade && <input placeholder="Nome do educador" name="educadoresApoioSemiliberdade" value={formData.educadoresApoioSemiliberdade} onChange={onChange} className="w-full border p-2 rounded text-sm text-gray-900" />}
          </div>
        </div>

        <EditableField label="Portaria" name="portaria" value={formData.portaria} onChange={onChange} />
        <EditableField label="Cozinha" name="cozinha" value={formData.cozinha} onChange={onChange} />
        <EditableField label="Serv. Gerais" name="servicosGerais" value={formData.servicosGerais} onChange={onChange} />
        <EditableField label="Outro Apoio" name="apoio" value={formData.apoio} onChange={onChange} />
        
        <div className="col-span-full mt-4">
            <EditableField label="Plantão (Alfa / Beta)" name="plantao" value={formData.plantao} onChange={onChange} />
        </div>
      </div>
    </section>
  );
}