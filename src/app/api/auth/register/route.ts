import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashSync } from 'bcrypt-ts';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nickname, pin } = body;

    if (!nickname || !pin) {
      return NextResponse.json({ error: 'Nickname e PIN são obrigatórios' }, { status: 400 });
    }

    if (nickname.length < 2 || nickname.length > 20) {
      return NextResponse.json({ error: 'Nickname deve ter entre 2 e 20 caracteres' }, { status: 400 });
    }

    if (pin.length < 4) {
      return NextResponse.json({ error: 'PIN deve ter pelo menos 4 dígitos' }, { status: 400 });
    }

    const existing = await db.player.findUnique({ where: { nickname } });
    if (existing) {
      return NextResponse.json({ error: 'Nickname já existe' }, { status: 409 });
    }

    const isFirstPlayer = (await db.player.count()) === 0;

    const player = await db.player.create({
      data: {
        nickname,
        pin: hashSync(pin, 10),
        isAdmin: isFirstPlayer,
      },
    });

    const { pin: _, ...safePlayer } = player;
    const sessionToken = Buffer.from(`${player.id}:${Date.now()}`).toString('base64');

    const response = NextResponse.json({ player: safePlayer, token: sessionToken });
    response.cookies.set('poker_session', sessionToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
