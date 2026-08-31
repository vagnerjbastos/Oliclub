import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { compareSync } from 'bcrypt-ts';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nickname, pin } = body;

    if (!nickname || !pin) {
      return NextResponse.json({ error: 'Nickname e PIN são obrigatórios' }, { status: 400 });
    }

    const player = await db.player.findUnique({ where: { nickname } });
    if (!player) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const valid = compareSync(pin, player.pin);
    if (!valid) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

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
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
