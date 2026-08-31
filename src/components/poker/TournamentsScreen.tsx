'use client';

import { useEffect, useState } from 'react';
import { Trophy, Calendar, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import type { Tournament } from '@/lib/store';

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusConfig(status: string): { label: string; className: string } {
  switch (status) {
    case 'upcoming':
      return {
        label: 'Em breve',
        className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      };
    case 'active':
      return {
        label: 'Em andamento',
        className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      };
    case 'completed':
      return {
        label: 'Finalizado',
        className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      };
    default:
      return {
        label: status,
        className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      };
  }
}

function TournamentCardSkeleton() {
  return (
    <div className="rounded-xl bg-[#1a1f2e] p-4 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-3/4 rounded-md bg-[#252b3b]" />
        <Skeleton className="h-6 w-20 rounded-full bg-[#252b3b]" />
      </div>
      <Skeleton className="h-4 w-1/2 rounded-md bg-[#252b3b]" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24 rounded-md bg-[#252b3b]" />
        <Skeleton className="h-4 w-16 rounded-md bg-[#252b3b]" />
      </div>
    </div>
  );
}

function TournamentCard({ tournament, onClick }: { tournament: Tournament; onClick: () => void }) {
  const { label, className } = statusConfig(tournament.status);

  return (
    <Card
      className="cursor-pointer border-[#252b3b] bg-[#1a1f2e] p-4 gap-0 py-4 transition-all hover:border-emerald-500/40 active:scale-[0.98]"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-white text-sm leading-tight line-clamp-1">
          {tournament.name}
        </h3>
        <Badge
          variant="outline"
          className={className}
        >
          {label}
        </Badge>
      </div>
      <div className="flex items-center gap-2 mt-2 text-gray-400 text-xs">
        <Calendar className="size-3.5 shrink-0" />
        <span>{formatDate(tournament.date)}</span>
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-amber-400 font-semibold text-sm">
          {formatCurrency(tournament.buyInPrice)}
        </span>
        <div className="flex items-center gap-1.5 text-gray-400 text-xs">
          <Users className="size-3.5" />
          <span>
            {tournament._count?.registrations ?? 0}
            {tournament.maxPlayers ? ` / ${tournament.maxPlayers}` : ''}
          </span>
        </div>
      </div>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-[#1a1f2e] p-4 mb-4">
        <Calendar className="size-8 text-gray-500" />
      </div>
      <p className="text-gray-400 text-sm">Nenhum torneio encontrado</p>
    </div>
  );
}

export default function TournamentsScreen() {
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const { setView, setCurrentTournament, setLoading: setGlobalLoading } = useAppStore();

  const fetchTournaments = async (status?: string) => {
    setLoading(true);
    try {
      const res = await api.tournaments.list(status);
      setTournaments(res.tournaments);
    } catch {
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments(activeTab);
  }, [activeTab]);

  const handleCardClick = async (tournament: Tournament) => {
    setGlobalLoading(true);
    try {
      const res = await api.tournaments.get(tournament.id);
      setCurrentTournament(res.tournament);
      setView('tournament-detail');
    } catch {
      // erro silencioso
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <div className="bg-[#0f1419] min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-[#0f1419]/95 backdrop-blur-sm border-b border-[#1e2536]">
        <div className="px-4 py-4 flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500/15 p-2">
            <Trophy className="size-5 text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold text-white">Torneios</h1>
        </div>
      </header>

      <div className="px-4 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#1a1f2e] border border-[#252b3b] w-full h-10 rounded-lg">
            <TabsTrigger
              value="all"
              className="text-xs data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:shadow-none rounded-md"
            >
              Todos
            </TabsTrigger>
            <TabsTrigger
              value="upcoming"
              className="text-xs data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 data-[state=active]:shadow-none rounded-md"
            >
              Em breve
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="text-xs data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:shadow-none rounded-md"
            >
              Em andamento
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="text-xs data-[state=active]:bg-gray-500/20 data-[state=active]:text-gray-400 data-[state=active]:shadow-none rounded-md"
            >
              Finalizados
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <TournamentCardSkeleton key={i} />
                ))}
              </div>
            ) : tournaments.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-3">
                {tournaments.map((t) => (
                  <TournamentCard
                    key={t.id}
                    tournament={t}
                    onClick={() => handleCardClick(t)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
