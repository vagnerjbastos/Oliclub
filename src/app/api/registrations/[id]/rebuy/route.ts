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
    const registration = await db.registration.findUnique({
      where: { id },
      include: { tournament: true },
    });

    if (!registration) {
      return NextResponse.json({ error: 'Inscrição não encontrada' }, { status: 404 });
    }

    if (registration.status === 'eliminated') {
      return NextResponse.json({ error: 'Jogador eliminado' }, { status: 400 });
    }

    const updated = await db.registration.update({
      where: { id },
      data: {
        rebuyCount: { increment: 1 },
        totalChips: { increment: registration.tournament.rebuyChips },
      },
      include: { player: { select: { id: true, nickname: true, avatar: true } } },
    });

    return NextResponse.json({ registration: updated });
  } catch (error) {
    console.error('Rebuy error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
