import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionPlayer } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const player = await getSessionPlayer(request);
    if (!player) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const tournament = await db.tournament.findUnique({ where: { id } });
    if (!tournament) {
      return NextResponse.json({ error: 'Torneio não encontrado' }, { status: 404 });
    }

    if (tournament.status === 'completed' || tournament.status === 'cancelled') {
      return NextResponse.json({ error: 'Inscrições encerradas' }, { status: 400 });
    }

    const existing = await db.registration.findUnique({
      where: { playerId_tournamentId: { playerId: player.id, tournamentId: id } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Já inscrito neste torneio' }, { status: 409 });
    }

    if (tournament.maxPlayers) {
      const count = await db.registration.count({ where: { tournamentId: id } });
      if (count >= tournament.maxPlayers) {
        return NextResponse.json({ error: 'Torneio lotado' }, { status: 400 });
      }
    }

    const registration = await db.registration.create({
      data: {
        playerId: player.id,
        tournamentId: id,
        buyInPaid: true,
        totalChips: tournament.buyInChips,
        status: 'registered',
      },
      include: { player: { select: { id: true, nickname: true, avatar: true } } },
    });

    return NextResponse.json({ registration }, { status: 201 });
  } catch (error) {
    console.error('Register tournament error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const player = await getSessionPlayer(request);
    if (!player) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const registration = await db.registration.findUnique({
      where: { playerId_tournamentId: { playerId: player.id, tournamentId: id } },
    });

    if (!registration) {
      return NextResponse.json({ error: 'Inscrição não encontrada' }, { status: 404 });
    }

    if (registration.status !== 'registered') {
      return NextResponse.json({ error: 'Não é possível cancelar' }, { status: 400 });
    }

    await db.registration.delete({ where: { id: registration.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unregister error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
