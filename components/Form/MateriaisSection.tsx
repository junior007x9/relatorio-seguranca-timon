// components/Form/MateriaisSection.tsx
import { RelatorioData } from '@/types';
import EditableField from '../UI/EditableField';

interface MateriaisSectionProps {
  formData: RelatorioData;
  onChange: (e: any) => void;
}

const listaMateriais = ['tonfas', 'algemas', 'chavesAcesso', 'chavesAlgemas', 'escudos', 'lanternas', 'celular', 'radioCelular', 'radioHT', 'cadeados', 'pendrives'];

export default function MateriaisSection({ formData, onChange }: MateriaisSectionProps) {
  return (
    <section>
      <h3 className="flex items-center text-blue-900 font-bold border-b-2 border-blue-200 mb-4 pb-2 mt-8 text-xl">
        <span className="mr-2">🛡️</span> Materiais (Qtd)
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {listaMateriais.map((item) => (
          <EditableField 
            key={item}
            label={item.replace(/([A-Z])/g, ' $1')} 
            name={item} 
            value={formData[item as keyof RelatorioData] as string} 
            onChange={onChange}
            type="number"
          />
        ))}
      </div>
    </section>
  );
}