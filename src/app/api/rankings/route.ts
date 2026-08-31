import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionPlayer } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const player = await getSessionPlayer(request);
    if (!player) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const rankings = await db.player.findMany({
      include: {
        rankings: true,
        registrations: {
          where: { finalPosition: { not: null } },
          select: { finalPosition: true },
        },
        _count: { select: { registrations: true } },
      },
      orderBy: { nickname: 'asc' },
    });

    const rankingData = rankings.map(p => {
      const totalPoints = p.rankings.reduce((sum, r) => sum + r.points, 0);
      const tournamentsPlayed = p._count.registrations;
      const victories = p.rankings.filter(r => r.position === 1).length;
      const bestPosition = p.rankings.length > 0
        ? Math.min(...p.rankings.map(r => r.position))
        : null;

      return {
        id: p.id,
        nickname: p.nickname,
        avatar: p.avatar,
        totalPoints,
        tournamentsPlayed,
        victories,
        bestPosition,
      };
    });

    rankingData.sort((a, b) => b.totalPoints - a.totalPoints || b.victories - a.victories);

    return NextResponse.json({ rankings: rankingData });
  } catch (error) {
    console.error('Rankings error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
