// components/Form/EquipeSection.tsx
'use client';

import { RelatorioData } from '@/types';
import EditableField from '../UI/EditableField';
import { registrarLog } from '@/lib/logger';

interface Props {
  formData: RelatorioData;
  onChange: (e: any) => void;
}

export default function EquipeSection({ formData, onChange }: Props) {
  const campos = [
    { label: 'Plantão', name: 'plantao', placeholder: 'Ex: Alfa Diurno' },
    { label: 'Coordenador(a)', name: 'coordenador', placeholder: 'Nome', isEditable: true },
    { label: 'Supervisor(a)', name: 'supervisor', placeholder: 'Nome' },
    { label: 'Educadores', name: 'educadores', placeholder: 'Nomes separados por vírgula' },
    { label: 'Apoio Geral', name: 'apoio', placeholder: 'Nome' },
    { label: 'Equipe Cozinha', name: 'cozinha', placeholder: 'Nome' },
    { label: 'Serviços Gerais', name: 'servicosGerais', placeholder: 'Nome' },
    { label: 'Portaria', name: 'portaria', placeholder: 'Nome' }
  ];

  // Intercepta a saída do campo (onBlur) para salvar o log silenciosamente
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>, label: string) => {
    const userName = typeof window !== "undefined" ? localStorage.getItem("usuarioAtual") || "Usuário" : "Usuário";
    const valor = e.target.value;
    
    // Só envia para a auditoria se o usuário não deixou o campo totalmente em branco
    if (valor.trim() !== '') {
      registrarLog(userName, 'Dados da Equipe', `Atualizou o campo ${label} para: ${valor}`);
    }
  };

  return (
    <section className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm relative mt-8 transition-all hover:shadow-md">
      <div className="absolute -top-4 left-6 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md tracking-wide flex items-center gap-2">
        <span>👥</span> DADOS DA EQUIPE
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {campos.map((campo, idx) => (
          <div key={idx} className="group">
            {campo.isEditable ? (
              <EditableField
                label={campo.label}
                name={campo.name}
                value={(formData as any)[campo.name] || ''}
                onChange={onChange}
                // Nota: se o seu EditableField for customizado para suportar onBlur, você pode passá-mo aqui também.
              />
            ) : (
              <>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-blue-600 transition-colors">
                  {campo.label}
                </label>
                <input
                  type="text"
                  name={campo.name}
                  value={(formData as any)[campo.name] || ''}
                  onChange={onChange}
                  onBlur={(e) => handleBlur(e, campo.label)} // <-- Injeção do Log Invisível
                  placeholder={campo.placeholder}
                  className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800 font-medium shadow-sm hover:border-blue-300"
                />
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}