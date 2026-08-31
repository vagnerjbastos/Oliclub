'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Trophy,
  TrendingUp,
  Award,
  CalendarClock,
  ChevronRight,
  Users,
  MapPin,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { useAppStore, type Tournament } from '@/lib/store';

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusConfig(status: string) {
  switch (status) {
    case 'upcoming':
      return { label: 'Em breve', className: 'bg-amber-500/15 text-amber-400 border-amber-500/25' };
    case 'registration_open':
      return { label: 'Inscrições abertas', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' };
    case 'in_progress':
      return { label: 'Em andamento', className: 'bg-blue-500/15 text-blue-400 border-blue-500/25' };
    case 'completed':
      return { label: 'Finalizado', className: 'bg-slate-500/15 text-slate-400 border-slate-500/25' };
    case 'cancelled':
      return { label: 'Cancelado', className: 'bg-red-500/15 text-red-400 border-red-500/25' };
    default:
      return { label: status, className: 'bg-slate-500/15 text-slate-400 border-slate-500/25' };
  }
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <Card className="flex-1 border-slate-700/50 bg-[#1a1f2e]/80 p-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-xl font-bold text-white">{value}</p>
          <p className="text-[11px] leading-tight text-slate-400">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function StatSkeleton() {
  return (
    <div className="flex-1 space-y-3 rounded-xl border border-slate-700/50 bg-[#1a1f2e]/80 p-4">
      <Skeleton className="mx-auto h-10 w-10 rounded-xl bg-slate-700/50" />
      <Skeleton className="mx-auto h-6 w-12 rounded bg-slate-700/50" />
      <Skeleton className="mx-auto h-3 w-20 rounded bg-slate-700/50" />
    </div>
  );
}

export default function HomeScreen() {
  const { player, rankings, setView, setCurrentTournament, setTournaments } =
    useAppStore();
  const [tournaments, setLocalTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [tournamentsRes, rankingsRes] = await Promise.all([
          api.tournaments.list('all'),
          api.rankings.list(),
        ]);
        setLocalTournaments(tournamentsRes.tournaments);
        setTournaments(tournamentsRes.tournaments);
        useAppStore.getState().setRankings(rankingsRes.rankings);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [setTournaments]);

  const myRanking = useMemo(
    () => rankings.find((r) => r.nickname === player?.nickname),
    [rankings, player]
  );

  const nextTournament = useMemo(() => {
    const now = new Date();
    return [...tournaments]
      .filter((t) => new Date(t.date) >= now && t.status !== 'cancelled' && t.status !== 'completed')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [tournaments]);

  const recentTournaments = useMemo(() => {
    return [...tournaments]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  }, [tournaments]);

  const handleTournamentClick = async (tournament: Tournament) => {
    try {
      const res = await api.tournaments.get(tournament.id);
      setCurrentTournament(res.tournament);
      setView('tournament-detail');
    } catch {
      // silently fail
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1419] px-4">
        <Card className="border-red-500/20 bg-[#1a1f2e]">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-red-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1419] pb-24 pt-6">
      <div className="mx-auto max-w-lg space-y-6 px-4">
        {/* Welcome header */}

        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-xl font-bold text-white shadow-lg shadow-emerald-500/20">
            {player?.avatar ? (
              <img
                src={player.avatar}
                alt={player.nickname}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              player?.nickname?.charAt(0).toUpperCase() || '?'
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              Olá, <span className="text-amber-400">{player?.nickname}</span>!
            </h1>
            <p className="text-sm text-slate-400">Bem-vindo ao Poker Club</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-3">
          {loading ? (
            <>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </>
          ) : (
            <>
              <StatCard
                icon={<Trophy className="h-5 w-5 text-emerald-400" />}
                label="Total de torneios"
                value={myRanking?.tournamentsPlayed ?? 0}
                accent="bg-emerald-500/15"
              />
              <StatCard
                icon={<Award className="h-5 w-5 text-amber-400" />}
                label="Vitórias"
                value={myRanking?.victories ?? 0}
                accent="bg-amber-500/15"
              />
              <StatCard
                icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
                label="Melhor posição"
                value={
                  myRanking?.bestPosition
                    ? `#${myRanking.bestPosition}`
                    : '—'
                }
                accent="bg-emerald-500/15"
              />
            </>
          )}
        </div>

        {/* Next Tournament */}

        <section>
          <div className="mb-3 flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Próximo Torneio
            </h2>
          </div>
          {loading ? (
            <Card className="border-slate-700/50 bg-[#1a1f2e]/80">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-48 rounded bg-slate-700/50" />
                  <Skeleton className="h-4 w-36 rounded bg-slate-700/50" />
                  <Skeleton className="h-4 w-24 rounded bg-slate-700/50" />
                </div>
              </CardContent>
            </Card>
          ) : nextTournament ? (
            <Card className="group cursor-pointer border-emerald-500/20 bg-[#1a1f2e]/80 transition-all hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-900/10"
              onClick={() => handleTournamentClick(nextTournament)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-white">
                        {nextTournament.name}
                      </h3>
                      <Badge
                        variant="outline"
                        className={statusConfig(nextTournament.status).className}
                      >
                        {statusConfig(nextTournament.status).label}
                      </Badge>
                    </div>
                    <div className="space-y-1.5 text-sm text-slate-400">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-3.5 w-3.5 text-slate-500" />
                        <span>{formatDate(nextTournament.date)}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                          <Trophy className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-amber-400 font-medium">
                            {formatCurrency(nextTournament.buyInPrice)}
                          </span>
                        </span>
                        {nextTournament._count && (
                          <span className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-slate-500" />
                            <span>{nextTournament._count.registrations} inscritos</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-400" />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-3 w-full border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTournamentClick(nextTournament);
                  }}
                >
                  Ver detalhes
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-700/30 bg-[#1a1f2e]/60">
              <CardContent className="p-6 text-center">
                <CalendarClock className="mx-auto mb-2 h-8 w-8 text-slate-600" />
                <p className="text-sm text-slate-500">
                  Nenhum torneio agendado no momento.
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Recent Tournaments */}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Torneios Recentes
              </h2>
            </div>
            {recentTournaments.length > 0 && (
              <button
                onClick={() => setView('tournaments')}
                className="text-xs font-medium text-amber-400 hover:text-amber-300"
              >
                Ver todos
              </button>
            )}
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-slate-700/50 bg-[#1a1f2e]/80">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40 rounded bg-slate-700/50" />
                      <Skeleton className="h-4 w-28 rounded bg-slate-700/50" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentTournaments.length > 0 ? (
            <div className="space-y-3">
              {recentTournaments.map((tournament) => {
                const sc = statusConfig(tournament.status);
                return (
                  <Card
                    key={tournament.id}
                    className="group cursor-pointer border-slate-700/50 bg-[#1a1f2e]/80 transition-all hover:border-emerald-500/30 hover:shadow-md hover:shadow-emerald-900/5"
                    onClick={() => handleTournamentClick(tournament)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-white">
                              {tournament.name}
                            </h3>
                            <Badge
                              variant="outline"
                              className={`shrink-0 text-[10px] ${sc.className}`}
                            >
                              {sc.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">
                            {formatDate(tournament.date)} · {formatCurrency(tournament.buyInPrice)}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-400" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-slate-700/30 bg-[#1a1f2e]/60">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-slate-500">Nenhum torneio encontrado.</p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
