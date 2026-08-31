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

    if (registration.addonTaken) {
      return NextResponse.json({ error: 'Addon já utilizado' }, { status: 400 });
    }

    const updated = await db.registration.update({
      where: { id },
      data: {
        addonTaken: true,
        totalChips: { increment: registration.tournament.addonChips },
      },
      include: { player: { select: { id: true, nickname: true, avatar: true } } },
    });

    return NextResponse.json({ registration: updated });
  } catch (error) {
    console.error('Addon error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
