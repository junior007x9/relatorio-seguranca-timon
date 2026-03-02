// app/api/relatorios/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializa o Supabase no lado do Servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Vai buscar a senha segura que só existe no servidor
const SENHA_CORRETA = process.env.SENHA_EXCLUSAO_ADMIN || '1234'; 

export async function DELETE(request: Request) {
    try {
        // Lê os dados enviados pelo frontend
        const body = await request.json();
        const { id, senha } = body;

        // Validações básicas
        if (!id || !senha) {
            return NextResponse.json({ error: 'ID e senha são obrigatórios.' }, { status: 400 });
        }

        // VERIFICAÇÃO DE SEGURANÇA NO SERVIDOR
        if (senha !== SENHA_CORRETA) {
            return NextResponse.json({ error: 'Senha incorreta. Acesso negado.' }, { status: 401 });
        }

        // Se a senha estiver correta, apaga no Supabase
        const { error } = await supabase.from('relatorios').delete().eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Relatório excluído com sucesso.' });
        
    } catch (err: any) {
        return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
    }
}