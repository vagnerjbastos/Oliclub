'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft,
  Calendar,
  Coins,
  Users,
  RotateCcw,
  PlusCircle,
  Gift,
  Clock,
  Percent,
  Play,
  CheckCircle2,
  Trophy,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import type { TournamentDetail, Registration } from '@/lib/store';

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

export default function TournamentDetailScreen() {
  const {
    currentTournament: tournament,
    player,
    setCurrentTournament,
    setView,
  } = useAppStore();

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
    actionLabel: string;
    variant: 'default' | 'destructive';
  }>({
    open: false,
    title: '',
    description: '',
    action: async () => {},
    actionLabel: '',
    variant: 'default',
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTournament = useCallback(async () => {
    if (!tournament?.id) return;
    try {
      const res = await api.tournaments.get(tournament.id);
      setCurrentTournament(res.tournament);
    } catch {
      toast.error('Erro ao carregar torneio');
    }
  }, [tournament?.id, setCurrentTournament]);

  useEffect(() => {
    if (tournament?.id) {
      fetchTournament();
    }
  }, [tournament?.id, fetchTournament]);

  if (!tournament) {
    return (
      <div className="bg-[#0f1419] min-h-screen flex items-center justify-center pb-24">
        <p className="text-gray-400 text-sm">Torneio não encontrado</p>
      </div>
    );
  }

  const { label, className } = statusConfig(tournament.status);

  const myRegistration = tournament.registrations.find(
    (r: Registration) => r.playerId === player?.id
  );

  const canRegister =
    (tournament.status === 'upcoming' || tournament.status === 'active') &&
    !myRegistration;

  const handleRegister = () => {
    setConfirmDialog({
      open: true,
      title: 'Confirmar inscrição',
      description: `Deseja se inscrever no torneio "${tournament.name}" pelo valor de ${formatCurrency(tournament.buyInPrice)}?`,
      actionLabel: 'Inscrever-se',
      variant: 'default',
      action: async () => {
        setActionLoading(true);
        try {
          await api.register.join(tournament.id);
          toast.success('Inscrição realizada com sucesso!');
          await fetchTournament();
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Erro ao se inscrever';
          toast.error(message);
        } finally {
          setActionLoading(false);
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        }
      },
    });
  };

  const handleLeave = () => {
    setConfirmDialog({
      open: true,
      title: 'Cancelar inscrição',
      description: `Tem certeza que deseja cancelar sua inscrição no torneio "${tournament.name}"?`,
      actionLabel: 'Cancelar inscrição',
      variant: 'destructive',
      action: async () => {
        setActionLoading(true);
        try {
          await api.register.leave(tournament.id);
          toast.success('Inscrição cancelada');
          await fetchTournament();
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Erro ao cancelar inscrição';
          toast.error(message);
        } finally {
          setActionLoading(false);
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        }
      },
    });
  };

  const handleStartTournament = () => {
    setConfirmDialog({
      open: true,
      title: 'Iniciar torneio',
      description: `Deseja iniciar o torneio "${tournament.name}"? A ação não poderá ser desfeita.`,
      actionLabel: 'Iniciar',
      variant: 'default',
      action: async () => {
        setActionLoading(true);
        try {
          await api.tournaments.update(tournament.id, { status: 'active' });
          toast.success('Torneio iniciado!');
          await fetchTournament();
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Erro ao iniciar torneio';
          toast.error(message);
        } finally {
          setActionLoading(false);
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        }
      },
    });
  };

  const handleCompleteTournament = () => {
    setConfirmDialog({
      open: true,
      title: 'Finalizar torneio',
      description: `Deseja finalizar o torneio "${tournament.name}"? A ação não poderá ser desfeita.`,
      actionLabel: 'Finalizar',
      variant: 'destructive',
      action: async () => {
        setActionLoading(true);
        try {
          await api.tournaments.update(tournament.id, { status: 'completed' });
          toast.success('Torneio finalizado!');
          await fetchTournament();
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Erro ao finalizar torneio';
          toast.error(message);
        } finally {
          setActionLoading(false);
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        }
      },
    });
  };

  const avatarColors = [
    'bg-emerald-600',
    'bg-amber-600',
    'bg-rose-600',
    'bg-violet-600',
    'bg-cyan-600',
    'bg-orange-600',
    'bg-pink-600',
    'bg-teal-600',
  ];

  return (
    <div className="bg-[#0f1419] min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0f1419]/95 backdrop-blur-sm border-b border-[#1e2536]">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setView('tournaments')}
            className="rounded-lg bg-[#1a1f2e] p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white truncate">
              {tournament.name}
            </h1>
          </div>
          <Badge variant="outline" className={className}>
            {label}
          </Badge>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* Data do torneio */}
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Calendar className="size-4 shrink-0" />
          <span>{formatDate(tournament.date)}</span>
        </div>

        {/* Seção: Inscrição */}
        <Card className="border-[#252b3b] bg-[#1a1f2e] gap-0 py-0">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Coins className="size-4 text-amber-400" />
              Inscrição
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {canRegister ? (
              <Button
                onClick={handleRegister}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11 rounded-lg"
              >
                Inscrever-se
              </Button>
            ) : myRegistration ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">
                      <CheckCircle2 className="size-3" />
                      Inscrito
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLeave}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 text-xs"
                  >
                    <XCircle className="size-3.5 mr-1" />
                    Cancelar
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Coins className="size-4 text-amber-400" />
                  <span className="text-gray-300">Fichas atuais:</span>
                  <span className="text-amber-400 font-bold">
                    {myRegistration.totalChips.toLocaleString('pt-BR')}
                  </span>
                </div>
                {myRegistration.finalPosition !== null && (
                  <div className="flex items-center gap-2 text-sm">
                    <Trophy className="size-4 text-amber-400" />
                    <span className="text-gray-300">Posição final:</span>
                    <span className="text-white font-bold">#{myRegistration.finalPosition}°</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                {tournament.status === 'completed'
                  ? 'Este torneio já foi finalizado.'
                  : 'Inscrições não disponíveis no momento.'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Seção: Premiação */}
        <Card className="border-[#252b3b] bg-[#1a1f2e] gap-0 py-0">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Trophy className="size-4 text-amber-400" />
              Premiação
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="rounded-lg overflow-hidden border border-[#252b3b]">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#252b3b] hover:bg-transparent">
                    <TableHead className="text-gray-400 text-xs h-9">Posição</TableHead>
                    <TableHead className="text-gray-400 text-xs h-9 text-right">%</TableHead>
                    <TableHead className="text-gray-400 text-xs h-9 text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tournament.stats.prizeBreakdown.map((prize) => (
                    <TableRow key={prize.position} className="border-[#252b3b] hover:bg-[#252b3b]/50">
                      <TableCell className="text-white text-sm font-medium py-2.5">
                        {prize.position}°
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm text-right py-2.5">
                        {prize.percentage}%
                      </TableCell>
                      <TableCell className="text-amber-400 text-sm font-semibold text-right py-2.5">
                        {formatCurrency(prize.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Separator className="my-3 bg-[#252b3b]" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total arrecadado (buy-ins)</span>
                <span className="text-white font-medium">
                  {formatCurrency(tournament.stats.totalBuyIn)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Taxa do clube ({tournament.clubFeePercent}%)</span>
                <span className="text-red-400 font-medium">
                  -{formatCurrency(tournament.stats.clubFee)}
                </span>
              </div>
              <Separator className="bg-[#252b3b]" />
              <div className="flex justify-between">
                <span className="text-white font-semibold">Prêmio total</span>
                <span className="text-emerald-400 font-bold text-base">
                  {formatCurrency(tournament.stats.prizePool)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção: Configurações */}
        <Card className="border-[#252b3b] bg-[#1a1f2e] gap-0 py-0">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Gift className="size-4 text-emerald-400" />
              Configurações
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <ConfigItem
                icon={<Coins className="size-4 text-amber-400" />}
                label="Buy-in"
                value={`${formatCurrency(tournament.buyInPrice)} / ${tournament.buyInChips} fichas`}
              />
              <ConfigItem
                icon={<RotateCcw className="size-4 text-blue-400" />}
                label="Rebuy"
                value={`${formatCurrency(tournament.rebuyPrice)} / ${tournament.rebuyChips} fichas`}
              />
              <ConfigItem
                icon={<PlusCircle className="size-4 text-violet-400" />}
                label="Addon"
                value={`${formatCurrency(tournament.addonPrice)} / ${tournament.addonChips} fichas`}
              />
              <ConfigItem
                icon={<Clock className="size-4 text-cyan-400" />}
                label="Bônus"
                value={
                  tournament.bonusChips > 0
                    ? `${tournament.bonusChips} fichas${tournament.bonusTime ? ` (${tournament.bonusTime})` : ''}`
                    : 'Sem bônus'
                }
              />
              <ConfigItem
                icon={<Users className="size-4 text-emerald-400" />}
                label="Max. jogadores"
                value={tournament.maxPlayers ? String(tournament.maxPlayers) : 'Sem limite'}
              />
              <ConfigItem
                icon={<Percent className="size-4 text-orange-400" />}
                label="Taxa do clube"
                value={`${tournament.clubFeePercent}%`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Seção: Inscritos */}
        <Card className="border-[#252b3b] bg-[#1a1f2e] gap-0 py-0">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Users className="size-4 text-emerald-400" />
              Inscritos
              <Badge
                variant="secondary"
                className="bg-[#252b3b] text-gray-300 ml-auto"
              >
                {tournament.registrations.length} / {tournament.maxPlayers ?? '∞'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {tournament.registrations.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                Nenhum jogador inscrito ainda.
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tournament.registrations.map((reg: Registration, idx: number) => (
                  <div
                    key={reg.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0f1419]/60 border border-[#252b3b]"
                  >
                    {/* Avatar */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${avatarColors[idx % avatarColors.length]}`}
                    >
                      {reg.player.nickname.charAt(0).toUpperCase()}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {reg.player.nickname}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-amber-400 text-xs font-medium">
                          {reg.totalChips.toLocaleString('pt-BR')} fichas
                        </span>
                      </div>
                    </div>
                    {/* Badges */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {reg.rebuyCount > 0 && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] px-1.5 py-0">
                          {reg.rebuyCount}x
                        </Badge>
                      )}
                      {reg.addonTaken && (
                        <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px] px-1.5 py-0">
                          Addon
                        </Badge>
                      )}
                      {reg.bonusReceived && (
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px] px-1.5 py-0">
                          Bônus
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Controles de admin */}
        {player?.isAdmin && tournament.status !== 'completed' && (
          <Card className="border-red-500/30 bg-[#1a1f2e] gap-0 py-0">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-red-400 text-base flex items-center gap-2">
                <Play className="size-4" />
                Controles do Administrador
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {tournament.status === 'upcoming' && (
                <Button
                  onClick={handleStartTournament}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11 rounded-lg"
                >
                  <Play className="size-4 mr-2" />
                  Iniciar Torneio
                </Button>
              )}
              {tournament.status === 'active' && (
                <Button
                  onClick={handleCompleteTournament}
                  variant="destructive"
                  className="w-full h-11 rounded-lg font-semibold"
                >
                  <CheckCircle2 className="size-4 mr-2" />
                  Finalizar Torneio
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Espaçamento final */}
        <div className="h-4" />
      </div>

      {/* Dialog de confirmação */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className="bg-[#1a1f2e] border-[#252b3b] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">{confirmDialog.title}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {confirmDialog.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:flex-row">
            <Button
              variant="ghost"
              className="flex-1 text-gray-400 hover:text-white hover:bg-[#252b3b]"
              onClick={() =>
                setConfirmDialog((prev) => ({ ...prev, open: false }))
              }
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button
              variant={confirmDialog.variant}
              className="flex-1"
              onClick={() => confirmDialog.action()}
              disabled={actionLoading}
            >
              {actionLoading ? 'Aguarde...' : confirmDialog.actionLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConfigItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-[#0f1419]/60 border border-[#252b3b]">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-gray-500 text-xs font-medium">{label}</span>
      </div>
      <span className="text-white text-sm font-medium leading-tight">{value}</span>
    </div>
  );
}
