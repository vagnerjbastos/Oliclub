import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionPlayer, requireAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const player = await getSessionPlayer(request);
    if (!player) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const tournament = await db.tournament.findUnique({
      where: { id },
      include: {
        registrations: {
          include: { player: { select: { id: true, nickname: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
        rankings: {
          include: { player: { select: { id: true, nickname: true, avatar: true } } },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Torneio não encontrado' }, { status: 404 });
    }

    const prizeConfig = JSON.parse(tournament.prizeConfig);
    const pointConfig = JSON.parse(tournament.pointConfig);

    const paidRegistrations = tournament.registrations.filter(r => r.buyInPaid);
    const totalBuyIn = paidRegistrations.reduce((sum, r) => {
      const rebuyCost = r.rebuyCount * tournament.rebuyPrice;
      const addonCost = r.addonTaken ? tournament.addonPrice : 0;
      return sum + tournament.buyInPrice + rebuyCost + addonCost;
    }, 0);

    const clubFee = totalBuyIn * (tournament.clubFeePercent / 100);
    const prizePool = totalBuyIn - clubFee;

    const prizeBreakdown = prizeConfig.map((p: { position: number; percentage: number }) => ({
      position: p.position,
      percentage: p.percentage,
      amount: Math.round((prizePool * p.percentage) / 100 * 100) / 100,
    }));

    return NextResponse.json({
      tournament: {
        ...tournament,
        prizeConfig,
        pointConfig,
        stats: {
          totalPlayers: paidRegistrations.length,
          totalBuyIn,
          clubFee,
          prizePool,
          prizeBreakdown,
        },
      },
    });
  } catch (error) {
    console.error('Tournament GET error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const body = await request.json();

    const existing = await db.tournament.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Torneio não encontrado' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'name', 'date', 'buyInPrice', 'rebuyPrice', 'addonPrice',
      'buyInChips', 'rebuyChips', 'addonChips', 'bonusChips',
      'bonusTime', 'clubFeePercent', 'prizeConfig', 'pointConfig',
      'maxPlayers', 'description', 'status',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'date') {
          updateData[field] = new Date(body[field]);
        } else if (['buyInPrice', 'rebuyPrice', 'addonPrice', 'clubFeePercent'].includes(field)) {
          updateData[field] = parseFloat(body[field]);
        } else if (['buyInChips', 'rebuyChips', 'addonChips', 'bonusChips', 'maxPlayers'].includes(field)) {
          updateData[field] = parseInt(body[field]);
        } else if (['prizeConfig', 'pointConfig'].includes(field)) {
          updateData[field] = JSON.stringify(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    const tournament = await db.tournament.update({ where: { id }, data: updateData });
    return NextResponse.json({ tournament });
  } catch (error) {
    console.error('Tournament PUT error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    await db.registration.deleteMany({ where: { tournamentId: id } });
    await db.ranking.deleteMany({ where: { tournamentId: id } });
    await db.tournament.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tournament DELETE error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
