import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CHAVE_PADRAO = 'CLIENTE_DASHBOARD';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chave = searchParams.get('chave') || CHAVE_PADRAO;

    let licenca = await prisma.licenca.findUnique({
      where: { chaveAcesso: chave }
    });

    if (!licenca) {
      return NextResponse.json({ error: 'Chave de acesso não encontrada.' }, { status: 404 });
    }

    const agora = new Date();
    const dataVenc = new Date(licenca.dataDeExpiracao);
    
    const diffTime = dataVenc.getTime() - agora.getTime();
    const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return NextResponse.json({
      valida: diasRestantes > 0 && licenca.ativo,
      diasRestantes,
      dataVencimento: licenca.dataDeExpiracao,
      ativo: licenca.ativo,
      nomeEmpresa: licenca.nomeEmpresa
    });
  } catch (error) {
    console.error('Erro ao verificar licença:', error);
    return NextResponse.json({ error: 'Erro ao verificar licença' }, { status: 500 });
  }
}


