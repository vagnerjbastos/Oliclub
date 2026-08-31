'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Trophy, Crown, Medal, Award, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';
import { useAppStore, type RankingEntry } from '@/lib/store';

export default function RankingsScreen() {
  const { player } = useAppStore();
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRankings() {
      try {
        setLoading(true);
        const res = await api.rankings.list();
        setRankings(res.rankings);
        useAppStore.getState().setRankings(res.rankings);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar ranking.');
      } finally {
        setLoading(false);
      }
    }
    fetchRankings();
  }, []);

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);

  const podiumColors = [
    { bg: 'from-amber-500 to-amber-600', ring: 'ring-amber-400/40', text: 'text-amber-400', icon: Crown, label: '1º' },
    { bg: 'from-slate-400 to-slate-500', ring: 'ring-slate-400/40', text: 'text-slate-300', icon: Medal, label: '2º' },
    { bg: 'from-orange-500 to-orange-600', ring: 'ring-orange-400/40', text: 'text-orange-400', icon: Award, label: '3º' },
  ];

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
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Ranking Geral</h1>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : rankings.length === 0 ? (
          <Card className="border-slate-700/30 bg-[#1a1f2e]/60">
            <CardContent className="p-8 text-center">
              <BarChart3 className="mx-auto mb-3 h-10 w-10 text-slate-600" />
              <p className="text-sm text-slate-500">Nenhum dado de ranking ainda</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Podium Section */}
            {top3.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {top3.map((entry, idx) => {
                  const cfg = podiumColors[idx];
                  const Icon = cfg.icon;
                  return (
                    <Card
                      key={entry.id}
                      className={`relative overflow-hidden border-slate-700/50 bg-[#1a1f2e]/80 ${idx === 0 ? 'col-span-1' : ''}`}
                    >
                      <CardContent className="flex flex-col items-center gap-2 p-4 pt-5">
                        <div className="relative">
                          <Icon className={`absolute -top-2 -right-2 h-5 w-5 ${cfg.text} opacity-60`} />
                          <div
                            className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${cfg.bg} text-xl font-bold text-white shadow-lg ring-4 ${cfg.ring}`}
                          >
                            {entry.nickname.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-slate-400">{cfg.label}</p>
                          <p className="mt-1 max-w-[100px] truncate text-sm font-semibold text-white">
                            {entry.nickname}
                          </p>
                          <p className={`text-base font-bold ${cfg.text}`}>
                            {entry.totalPoints.toLocaleString('pt-BR')} pts
                          </p>
                          <p className="text-[11px] text-slate-500">
                            <Trophy className="mr-0.5 inline h-3 w-3 text-amber-500" />
                            {entry.victories} vitória{entry.victories !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Full Rankings List */}
            {rankings.length > 3 && (
              <Card className="border-slate-700/50 bg-[#1a1f2e]/80">
                <ScrollArea className="max-h-[420px] overflow-y-auto">
                  <div className="divide-y divide-slate-700/40">
                    {rankings.map((entry, idx) => {
                      const isCurrentPlayer = entry.nickname === player?.nickname;
                      return (
                        <div
                          key={entry.id}
                          className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                            isCurrentPlayer
                              ? 'border-l-2 border-emerald-500 bg-emerald-500/5'
                              : 'hover:bg-slate-800/50'
                          }`}
                        >
                          {/* Position */}
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                              idx < 3
                                ? podiumColors[idx].text
                                : 'text-slate-500'
                            }`}
                          >
                            {idx + 1}
                          </div>

                          {/* Avatar */}
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${
                              idx === 0
                                ? 'bg-gradient-to-br from-amber-500 to-amber-600'
                                : idx === 1
                                  ? 'bg-gradient-to-br from-slate-400 to-slate-500'
                                  : idx === 2
                                    ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                                    : 'bg-slate-700'
                            }`}
                          >
                            {entry.nickname.charAt(0).toUpperCase()}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-sm font-semibold text-white">
                                {entry.nickname}
                              </p>
                              {isCurrentPlayer && (
                                <span className="text-[10px] font-medium text-emerald-400">
                                  (você)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span>{entry.tournamentsPlayed} torneio{entry.tournamentsPlayed !== 1 ? 's' : ''}</span>
                              <span>
                                <Trophy className="mr-0.5 inline h-3 w-3 text-amber-500" />
                                {entry.victories}
                              </span>
                              {entry.bestPosition && <span>Melhor: #{entry.bestPosition}</span>}
                            </div>
                          </div>

                          {/* Points */}
                          <div className="text-right">
                            <p className="text-sm font-bold text-white">
                              {entry.totalPoints.toLocaleString('pt-BR')}
                            </p>
                            <p className="text-[10px] text-slate-500">pontos</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Podium skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-slate-700/50 bg-[#1a1f2e]/80">
            <CardContent className="flex flex-col items-center gap-3 p-4 pt-5">
              <Skeleton className="h-14 w-14 rounded-full bg-slate-700/50" />
              <div className="space-y-2 text-center">
                <Skeleton className="mx-auto h-3 w-8 rounded bg-slate-700/50" />
                <Skeleton className="mx-auto h-4 w-20 rounded bg-slate-700/50" />
                <Skeleton className="mx-auto h-5 w-16 rounded bg-slate-700/50" />
                <Skeleton className="mx-auto h-3 w-16 rounded bg-slate-700/50" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* List skeleton */}
      <Card className="border-slate-700/50 bg-[#1a1f2e]/80">
        <div className="divide-y divide-slate-700/40">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-8 w-8 rounded-lg bg-slate-700/50" />
              <Skeleton className="h-9 w-9 rounded-full bg-slate-700/50" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-28 rounded bg-slate-700/50" />
                <Skeleton className="h-3 w-40 rounded bg-slate-700/50" />
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="ml-auto h-4 w-12 rounded bg-slate-700/50" />
                <Skeleton className="ml-auto h-3 w-10 rounded bg-slate-700/50" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
