'use client';

import { useEffect, useState } from 'react';
import { LogOut, CalendarDays, Trophy, Award, TrendingUp, Zap, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { api } from '@/lib/api';
import { useAppStore, type RankingEntry } from '@/lib/store';

export default function ProfileScreen() {
  const { player, rankings, setPlayer, setView } = useAppStore();
  const [myRanking, setMyRanking] = useState<RankingEntry | null>(null);

  useEffect(() => {
    async function fetchRankings() {
      try {
        const res = await api.rankings.list();
        useAppStore.getState().setRankings(res.rankings);
        const found = res.rankings.find((r) => r.nickname === player?.nickname) ?? null;
        setMyRanking(found);
      } catch {
        // silently fail
      }
    }
    fetchRankings();
  }, [player?.nickname]);

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // proceed anyway
    }
    localStorage.clear();
    setPlayer(null);
    setView('auth');
  };

  const memberSince = player?.createdAt
    ? new Date(player.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const stats = [
    {
      icon: <Trophy className="h-5 w-5 text-emerald-400" />,
      label: 'Total de torneios',
      value: myRanking?.tournamentsPlayed ?? 0,
      accent: 'bg-emerald-500/15',
    },
    {
      icon: <Award className="h-5 w-5 text-amber-400" />,
      label: 'Vitórias',
      value: myRanking?.victories ?? 0,
      accent: 'bg-amber-500/15',
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-emerald-400" />,
      label: 'Melhor posição',
      value: myRanking?.bestPosition ? `#${myRanking.bestPosition}` : '—',
      accent: 'bg-emerald-500/15',
    },
    {
      icon: <Zap className="h-5 w-5 text-amber-400" />,
      label: 'Total de pontos',
      value: (myRanking?.totalPoints ?? 0).toLocaleString('pt-BR'),
      accent: 'bg-amber-500/15',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f1419] pb-24 pt-6">
      <div className="mx-auto max-w-lg space-y-6 px-4">
        {/* Avatar Section */}
        <Card className="border-slate-700/50 bg-[#1a1f2e]/80">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-3xl font-bold text-white shadow-xl shadow-emerald-500/20">
                {player?.nickname?.charAt(0).toUpperCase() || '?'}
              </div>
              {player?.isAdmin && (
                <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 shadow-md">
                  <ShieldCheck className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-2xl font-bold text-white">{player?.nickname}</h1>
                {player?.isAdmin && (
                  <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 text-[11px]">
                    Admin
                  </Badge>
                )}
              </div>
              {memberSince && (
                <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-slate-400">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Membro desde {memberSince}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, idx) => (
            <Card key={idx} className="border-slate-700/50 bg-[#1a1f2e]/80">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.accent}`}>
                  {stat.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                  <p className="text-[11px] leading-tight text-slate-400">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="bg-slate-700/50" />

        {/* Logout */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full border-red-500/25 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="border-slate-700/50 bg-[#1a1f2e]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Confirmar saída</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                Tem certeza que deseja sair da sua conta? Você precisará informar seu PIN para entrar novamente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-600/50 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogout}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                Sair
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
