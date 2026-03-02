// components/UI/SignaturePad.tsx
'use client';

import { useState, useEffect, useRef } from 'react';

interface SignaturePadProps {
    label: string;
    onSave: (data: string) => void;
    initialImage: string;
}

export default function SignaturePad({ label, onSave, initialImage }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        if (initialImage && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            const img = new Image();
            img.onload = () => ctx?.drawImage(img, 0, 0);
            img.src = initialImage;
        }
    }, [initialImage]);

    const getCoords = (e: any) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDrawing = (e: any) => {
        setIsDrawing(true);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            const { x, y } = getCoords(e);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#000';
        }
    };

    const draw = (e: any) => {
        if (!isDrawing || !canvasRef.current) return;
        if(e.type === 'touchmove') e.preventDefault(); 
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            const { x, y } = getCoords(e);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    };

    const endDrawing = () => {
        if (isDrawing && canvasRef.current) {
            setIsDrawing(false);
            onSave(canvasRef.current.toDataURL("image/png"));
        }
    };

    const clear = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && canvasRef.current) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            onSave('');
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
            <div className="border-2 border-gray-300 rounded bg-white touch-none">
                <canvas 
                    ref={canvasRef} 
                    width={300} 
                    height={150} 
                    className="w-full cursor-crosshair bg-white"
                    onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={endDrawing} onMouseLeave={endDrawing}
                    onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={endDrawing}
                />
            </div>
            <button type="button" onClick={clear} className="text-xs text-red-600 font-bold underline self-end">Limpar Assinatura</button>
        </div>
    );
}