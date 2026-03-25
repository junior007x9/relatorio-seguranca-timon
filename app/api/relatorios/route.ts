// app/api/relatorios/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 1. SEGURANÇA: Usar a SERVICE_ROLE_KEY no servidor (NUNCA expor no frontend)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Crie esta variável no seu .env.local e na Vercel
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function DELETE(request: Request) {
    try {
        const body = await request.json();
        const { id, senha } = body;

        // 2. SEGURANÇA: Validação rigorosa dos tipos de input
        if (!id || typeof id !== 'number') {
            return NextResponse.json({ error: 'ID de relatório inválido ou ausente.' }, { status: 400 });
        }

        if (!senha || typeof senha !== 'string') {
            return NextResponse.json({ error: 'Senha inválida ou ausente.' }, { status: 400 });
        }

        // 3. SEGURANÇA: Remover o fallback inseguro ('1234')
        const SENHA_CORRETA = process.env.SENHA_EXCLUSAO_ADMIN;
        
        // Se a variável não estiver definida no .env, bloqueia o sistema por segurança
        if (!SENHA_CORRETA) {
            console.error("ERRO CRÍTICO: SENHA_EXCLUSAO_ADMIN não está definida no servidor.");
            return NextResponse.json({ error: 'Configuração de segurança do servidor ausente.' }, { status: 500 });
        }

        // Verificação da senha
        if (senha !== SENHA_CORRETA) {
            console.warn(`Tentativa de exclusão bloqueada para o relatório ID: ${id}. Senha incorreta.`);
            return NextResponse.json({ error: 'Senha incorreta. Acesso negado.' }, { status: 401 });
        }

        // Executar a exclusão (pedindo a contagem para confirmar que encontrou o registo)
        const { error, count } = await supabase
            .from('relatorios')
            .delete({ count: 'exact' })
            .eq('id', id);

        // 4. SEGURANÇA: Registar o erro internamente, mas não o enviar para o frontend
        if (error) {
            console.error("Erro na Base de Dados ao apagar relatório:", error.message);
            return NextResponse.json({ error: 'Ocorreu um erro interno ao tentar apagar o relatório.' }, { status: 500 });
        }

        // Verifica se realmente apagou alguma coisa
        if (count === 0) {
            return NextResponse.json({ error: 'Relatório não encontrado.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Relatório excluído com sucesso e segurança.' });
        
    } catch (err: any) {
        console.error("Erro interno na API de exclusão:", err);
        return NextResponse.json({ error: 'Erro interno no processamento da solicitação.' }, { status: 500 });
    }
}