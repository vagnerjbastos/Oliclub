import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const body = await request.json();
    const { position, eliminated } = body;

    const registration = await db.registration.findUnique({
      where: { id },
      include: { tournament: true },
    });

    if (!registration) {
      return NextResponse.json({ error: 'Inscrição não encontrada' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (eliminated && !position) {
      updateData.status = 'eliminated';
      updateData.eliminatedAt = new Date();
    }

    if (position) {
      updateData.finalPosition = position;
      updateData.status = 'finished';

      const pointConfig = JSON.parse(registration.tournament.pointConfig);
      const pointEntry = pointConfig.find((p: { position: number }) => p.position === position);
      const points = pointEntry ? pointEntry.points : 0;

      await db.ranking.upsert({
        where: { playerId_tournamentId: {
          playerId: registration.playerId,
          tournamentId: registration.tournamentId,
        }},
        create: {
          playerId: registration.playerId,
          tournamentId: registration.tournamentId,
          position,
          points,
        },
        update: { position, points },
      });
    }

    const updated = await db.registration.update({
      where: { id },
      data: updateData,
      include: { player: { select: { id: true, nickname: true, avatar: true } } }
    });

    return NextResponse.json({ registration: updated });
  } catch (error) {
    console.error('Result error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
