import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

export interface AuthPlayer {
  id: string;
  nickname: string;
  isAdmin: boolean;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getSessionPlayer(request: NextRequest): Promise<AuthPlayer | null> {
  try {
    const token = request.cookies.get('poker_session')?.value;
    if (!token) return null;

    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const playerId = decoded.split(':')[0];

    const player = await db.player.findUnique({ where: { id: playerId } });
    if (!player) return null;

    const { pin: _, ...safePlayer } = player;
    return safePlayer as AuthPlayer;
  } catch {
    return null;
  }
}

export async function requireAdmin(request: NextRequest): Promise<AuthPlayer | NextResponse> {
  const player = await getSessionPlayer(request);
  if (!player) {
    return new NextResponse(JSON.stringify({ error: 'Não autenticado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  if (!player.isAdmin) {
    return new NextResponse(JSON.stringify({ error: 'Acesso restrito ao admin' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }
  return player;
}
