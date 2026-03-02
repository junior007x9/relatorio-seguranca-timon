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
    <div className="flex flex-col">
      <label className="text-xs font-bold text-gray-500 block mb-1 uppercase">{label}</label>
      {isEditing ? (
        <div className="flex gap-2">
          <input 
            type={type} name={name} value={value} onChange={onChange} 
            className="w-full border p-2 rounded bg-white text-gray-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500" 
            autoFocus 
            onBlur={() => setIsEditing(false)} // Fecha ao clicar fora
            onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)} // Fecha ao dar Enter
          />
          <button type="button" onMouseDown={(e) => { e.preventDefault(); setIsEditing(false); }} className="bg-green-500 hover:bg-green-600 text-white px-3 rounded font-bold transition">✔️</button>
        </div>
      ) : (
        <div className="flex justify-between items-center w-full border border-gray-200 p-2 rounded bg-gray-50 hover:bg-blue-50 transition group cursor-pointer" onClick={() => setIsEditing(true)}>
          <span className="text-gray-900 font-semibold truncate pr-2">{value || <span className="text-gray-400 font-normal italic">Vazio</span>}</span>
          <button type="button" className="text-gray-400 hover:text-blue-600 opacity-50 group-hover:opacity-100 transition" title="Editar">✏️</button>
        </div>
      )}
    </div>
  );
}