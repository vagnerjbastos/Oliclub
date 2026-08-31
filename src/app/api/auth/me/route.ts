import { NextRequest, NextResponse } from 'next/server';
import { getSessionPlayer } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const player = await getSessionPlayer(request);
    if (!player) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    return NextResponse.json({ player });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('poker_session', '', { maxAge: 0, path: '/' });
  return response;
}
