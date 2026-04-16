// components/UI/EditableField.tsx
'use client';
import { useState } from 'react';

interface EditableFieldProps {
  label: string;
  value: string;
  name: string;
  onChange: (e: any) => void;
  type?: string;
}

export default function EditableField({ label, value, name, onChange, type = "text" }: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="flex flex-col group">
      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 group-focus-within:text-blue-600 transition-colors">{label}</label>
      {isEditing ? (
        <div className="flex gap-2">
          <input 
            type={type} name={name} value={value} onChange={onChange} 
            className="w-full bg-white border border-blue-400 p-3.5 rounded-xl text-gray-900 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
            autoFocus 
            onBlur={() => setIsEditing(false)} // Fecha ao clicar fora
            onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)} // Fecha ao dar Enter
          />
          <button type="button" onMouseDown={(e) => { e.preventDefault(); setIsEditing(false); }} className="bg-green-500 hover:bg-green-600 text-white px-4 rounded-xl font-bold transition shadow-sm">✔️</button>
        </div>
      ) : (
        <div className="flex justify-between items-center w-full border border-gray-200 p-3.5 rounded-xl bg-gray-50 hover:bg-blue-50/50 transition cursor-pointer" onClick={() => setIsEditing(true)}>
          <span className="text-gray-800 font-medium truncate pr-2">{value || <span className="text-gray-400 font-normal italic">Clique para adicionar...</span>}</span>
          <button type="button" className="text-gray-400 hover:text-blue-600 opacity-50 group-hover:opacity-100 transition text-lg" title="Editar">✏️</button>
        </div>
      )}
    </div>
  );
}