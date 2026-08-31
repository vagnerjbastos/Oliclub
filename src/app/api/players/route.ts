import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionPlayer } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const player = await getSessionPlayer(request);
    if (!player) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const players = await db.player.findMany({
      select: {
        id: true,
        nickname: true,
        avatar: true,
        isAdmin: true,
        createdAt: true,
        _count: { select: { registrations: true, rankings: true } },
      },
      orderBy: { nickname: 'asc' },
    });

    return NextResponse.json({ players });
  } catch (error) {
    console.error('Players error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
