export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const isAuth = (request: Request) => {
  const authHeader = request.headers.get('Authorization');
  const senha = authHeader?.replace('Bearer ', '');
  const senhaAdmin = process.env.ADMIN_PASSWORD || '123456';
  return senha === senhaAdmin;
};

export async function GET(request: Request) {
  try {
    if (!isAuth(request)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const licencas = await prisma.licenca.findMany({
      orderBy: { nomeEmpresa: 'asc' }
    });

    return NextResponse.json({ licencas });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao listar licenças' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isAuth(request)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id, nomeEmpresa, dataDaCompra, dataDeExpiracao, ativo, apolloLogin, apolloSenha } = await request.json();

    if (id) {
      const licencaAtualizada = await prisma.licenca.update({
        where: { id },
        data: {
          nomeEmpresa,
          dataDaCompra: dataDaCompra ? new Date(dataDaCompra) : undefined,
          dataDeExpiracao: dataDeExpiracao ? new Date(dataDeExpiracao) : undefined,
          apolloLogin,
          apolloSenha,
          ativo
        }
      });
      return NextResponse.json({ licenca: licencaAtualizada });
    } else {
      const chaveAcesso = `LIC_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const licencaNova = await prisma.licenca.create({
        data: {
          chaveAcesso,
          nomeEmpresa,
          dataDaCompra: dataDaCompra ? new Date(dataDaCompra) : new Date(),
          dataDeExpiracao: new Date(dataDeExpiracao),
          apolloLogin,
          apolloSenha,
          ativo: ativo !== undefined ? ativo : true
        }
      });
      return NextResponse.json({ licenca: licencaNova });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao salvar licença' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!isAuth(request)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
    }

    await prisma.licenca.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar licença' }, { status: 500 });
  }
}
