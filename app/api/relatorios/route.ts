// app/api/relatorios/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(request: Request) {
    try {
        // 1. Movemos a inicialização para DENTRO da requisição para evitar erros no build da Vercel
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error("Variáveis do Supabase ausentes no servidor.");
            return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 2. Lendo os dados da requisição
        const body = await request.json();
        const { id, senha } = body;

        // 3. Validação rigorosa
        if (!id || typeof id !== 'number') {
            return NextResponse.json({ error: 'ID de relatório inválido ou ausente.' }, { status: 400 });
        }

        if (!senha || typeof senha !== 'string') {
            return NextResponse.json({ error: 'Senha inválida ou ausente.' }, { status: 400 });
        }

        // 4. Verificação de senha Admin
        const SENHA_CORRETA = process.env.SENHA_EXCLUSAO_ADMIN;
        if (!SENHA_CORRETA) {
            console.error("ERRO CRÍTICO: SENHA_EXCLUSAO_ADMIN não está definida no servidor.");
            return NextResponse.json({ error: 'Configuração de segurança do servidor ausente.' }, { status: 500 });
        }

        if (senha !== SENHA_CORRETA) {
            return NextResponse.json({ error: 'Senha incorreta. Acesso negado.' }, { status: 401 });
        }

        // 5. Exclusão no Supabase
        const { error, count } = await supabase
            .from('relatorios')
            .delete({ count: 'exact' })
            .eq('id', id);

        if (error) {
            console.error("Erro na BD:", error.message);
            return NextResponse.json({ error: 'Ocorreu um erro interno ao tentar apagar o relatório.' }, { status: 500 });
        }

        if (count === 0) {
            return NextResponse.json({ error: 'Relatório não encontrado.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Relatório excluído com sucesso.' });
        
    } catch (err: any) {
        console.error("Erro na API:", err);
        return NextResponse.json({ error: 'Erro interno no processamento.' }, { status: 500 });
    }
}