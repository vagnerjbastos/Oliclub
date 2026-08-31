import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionPlayer, requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const player = await getSessionPlayer(request);
    if (!player) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const tournaments = await db.tournament.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        _count: { select: { registrations: true } },
      },
    });

    return NextResponse.json({ tournaments });
  } catch (error) {
    console.error('Tournaments GET error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (admin instanceof NextResponse) return admin;

    const body = await request.json();
    const {
      name,
      date,
      buyInPrice,
      rebuyPrice,
      addonPrice,
      buyInChips,
      rebuyChips,
      addonChips,
      bonusChips = 0,
      bonusTime,
      clubFeePercent = 0,
      prizeConfig,
      pointConfig,
      maxPlayers,
      description,
    } = body;

    if (!name || !date || buyInPrice == null || buyInChips == null) {
      return NextResponse.json(
        { error: 'Nome, data, preço do buy-in e fichas do buy-in são obrigatórios' },
        { status: 400 }
      );
    }

    const defaultPrizeConfig = [
      { position: 1, percentage: 50 },
      { position: 2, percentage: 30 },
      { position: 3, percentage: 20 },
    ];

    const defaultPointConfig = [
      { position: 1, points: 100 },
      { position: 2, points: 70 },
      { position: 3, points: 50 },
      { position: 4, points: 30 },
      { position: 5, points: 20 },
    ];

    const tournament = await db.tournament.create({
      data: {
        name,
        date: new Date(date),
        buyInPrice: parseFloat(buyInPrice),
        rebuyPrice: parseFloat(rebuyPrice || 0),
        addonPrice: parseFloat(addonPrice || 0),
        buyInChips: parseInt(buyInChips),
        rebuyChips: parseInt(rebuyChips || 0),
        addonChips: parseInt(addonChips || 0),
        bonusChips: parseInt(bonusChips || 0),
        bonusTime: bonusTime || null,
        clubFeePercent: parseFloat(clubFeePercent || 0),
        prizeConfig: JSON.stringify(prizeConfig || defaultPrizeConfig),
        pointConfig: JSON.stringify(pointConfig || defaultPointConfig),
        maxPlayers: maxPlayers ? parseInt(maxPlayers) : null,
        description: description || null,
        status: 'upcoming',
      },
    });

    return NextResponse.json({ tournament }, { status: 201 });
  } catch (error) {
    console.error('Tournaments POST error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
