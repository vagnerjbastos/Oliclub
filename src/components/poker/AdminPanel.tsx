'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Shield,
  Plus,
  ArrowLeft,
  Pencil,
  Settings,
  Trash2,
  Users,
  CalendarClock,
  RefreshCw,
  Coins,
  Gift,
  Star,
  XCircle,
  Save,
  Check,
  AlertTriangle,
  Minus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { useAppStore, type Tournament, type TournamentDetail, type Registration, type PrizeEntry, type PointEntry } from '@/lib/store';
import { toast } from 'sonner';

// ─── Helpers ────────────────────────────────────────────────

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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

function toLocalDatetime(dateStr: string) {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type AdminSubView = 'list' | 'create' | 'edit' | 'manage';

// ─── Main Component ─────────────────────────────────────────

export default function AdminPanel() {
  const { setView } = useAppStore();
  const [subView, setSubView] = useState<AdminSubView>('list');
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [managingTournamentId, setManagingTournamentId] = useState<string | null>(null);

  const handleEdit = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setSubView('edit');
  };

  const handleManage = (tournamentId: string) => {
    setManagingTournamentId(tournamentId);
    setSubView('manage');
  };

  const handleBack = () => {
    setSubView('list');
    setEditingTournament(null);
    setManagingTournamentId(null);
  };

  if (subView === 'create' || subView === 'edit') {
    return (
      <TournamentForm
        tournament={subView === 'edit' ? editingTournament : null}
        onBack={handleBack}
      />
    );
  }

  if (subView === 'manage' && managingTournamentId) {
    return <ManageTournament tournamentId={managingTournamentId} onBack={handleBack} />;
  }

  return <AdminList onEdit={handleEdit} onManage={handleManage} onCreate={() => setSubView('create')} />;
}

// ─── Admin List View ────────────────────────────────────────

function AdminList({
  onEdit,
  onManage,
  onCreate,
}: {
  onEdit: (t: Tournament) => void;
  onManage: (id: string) => void;
  onCreate: () => void;
}) {
  const { setView } = useAppStore();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTournaments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.tournaments.list('all');
      setTournaments(res.tournaments);
      useAppStore.getState().setTournaments(res.tournaments);
    } catch {
      toast.error('Erro ao carregar torneios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await api.tournaments.delete(id);
      toast.success('Torneio excluído com sucesso!');
      fetchTournaments();
    } catch {
      toast.error('Erro ao excluir torneio.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1419] pb-24 pt-6">
      <div className="mx-auto max-w-lg space-y-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
              <Shield className="h-5 w-5 text-amber-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Painel Admin</h1>
          </div>
          <Button
            onClick={onCreate}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            size="sm"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Criar Torneio
          </Button>
        </div>

        {/* Tournament List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-slate-700/50 bg-[#1a1f2e]/80">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="h-5 w-40 rounded bg-slate-700/50 animate-pulse" />
                    <div className="h-4 w-28 rounded bg-slate-700/50 animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <Card className="border-slate-700/30 bg-[#1a1f2e]/60">
            <CardContent className="p-8 text-center">
              <Shield className="mx-auto mb-3 h-10 w-10 text-slate-600" />
              <p className="text-sm text-slate-500">Nenhum torneio criado ainda.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tournaments.map((t) => {
              const sc = statusConfig(t.status);
              return (
                <Card key={t.id} className="border-slate-700/50 bg-[#1a1f2e]/80">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-white">{t.name}</h3>
                          <Badge variant="outline" className={`shrink-0 text-[10px] ${sc.className}`}>
                            {sc.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <CalendarClock className="h-3 w-3" />
                            {formatDate(t.date)}
                          </span>
                          {t._count && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {t._count.registrations} jogadores
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-slate-300 hover:bg-slate-700/50 hover:text-white"
                        onClick={() => onEdit(t)}
                      >
                        <Pencil className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                        onClick={() => onManage(t.id)}
                      >
                        <Settings className="mr-1 h-3 w-3" />
                        Gerenciar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            disabled={deletingId === t.id}
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            {deletingId === t.id ? 'Excluindo...' : 'Excluir'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-slate-700/50 bg-[#1a1f2e]">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Excluir torneio</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-400">
                              Tem certeza que deseja excluir o torneio &quot;{t.name}&quot;? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-slate-600/50 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white">
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(t.id)}
                              className="bg-red-500 text-white hover:bg-red-600"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tournament Form (Create/Edit) ──────────────────────────

interface FormField {
  name: string;
  date: string;
  buyInPrice: string;
  buyInChips: string;
  rebuyPrice: string;
  rebuyChips: string;
  addonPrice: string;
  addonChips: string;
  bonusChips: string;
  bonusTime: string;
  clubFeePercent: string;
  maxPlayers: string;
  description: string;
  prizeConfig: PrizeEntry[];
  pointConfig: PointEntry[];
}

function TournamentForm({
  tournament,
  onBack,
}: {
  tournament: Tournament | null;
  onBack: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormField>({
    name: tournament?.name ?? '',
    date: tournament ? toLocalDatetime(tournament.date) : '',
    buyInPrice: String(tournament?.buyInPrice ?? ''),
    buyInChips: String(tournament?.buyInChips ?? ''),
    rebuyPrice: String(tournament?.rebuyPrice ?? ''),
    rebuyChips: String(tournament?.rebuyChips ?? ''),
    addonPrice: String(tournament?.addonPrice ?? ''),
    addonChips: String(tournament?.addonChips ?? ''),
    bonusChips: String(tournament?.bonusChips ?? ''),
    bonusTime: tournament?.bonusTime ? tournament.bonusTime.slice(0, 5) : '',
    clubFeePercent: String(tournament?.clubFeePercent ?? ''),
    maxPlayers: tournament?.maxPlayers ? String(tournament.maxPlayers) : '',
    description: tournament?.description ?? '',
    prizeConfig: tournament?.prizeConfig ?? [{ position: 1, percentage: 50 }, { position: 2, percentage: 30 }, { position: 3, percentage: 20 }],
    pointConfig: tournament?.pointConfig ?? [{ position: 1, points: 10 }, { position: 2, points: 7 }, { position: 3, points: 5 }],
  });

  const isEdit = !!tournament;

  const updateField = (field: keyof FormField, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const prizeTotal = form.prizeConfig.reduce((sum, p) => sum + p.percentage, 0);
  const prizeWarning = prizeTotal !== 0 && prizeTotal !== 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prizeWarning) {
      toast.error('A distribuição de premiação deve somar 100%.');
      return;
    }
    try {
      setSaving(true);
      const payload: Record<string, unknown> = {
        name: form.name,
        date: new Date(form.date).toISOString(),
        buyInPrice: Number(form.buyInPrice) || 0,
        buyInChips: Number(form.buyInChips) || 0,
        rebuyPrice: Number(form.rebuyPrice) || 0,
        rebuyChips: Number(form.rebuyChips) || 0,
        addonPrice: Number(form.addonPrice) || 0,
        addonChips: Number(form.addonChips) || 0,
        bonusChips: Number(form.bonusChips) || 0,
        bonusTime: form.bonusTime || null,
        clubFeePercent: Number(form.clubFeePercent) || 0,
        maxPlayers: form.maxPlayers ? Number(form.maxPlayers) : null,
        description: form.description || null,
        prizeConfig: form.prizeConfig,
        pointConfig: form.pointConfig,
      };

      if (isEdit && tournament) {
        await api.tournaments.update(tournament.id, payload);
        toast.success('Torneio atualizado com sucesso!');
      } else {
        await api.tournaments.create(payload);
        toast.success('Torneio criado com sucesso!');
      }
      onBack();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar torneio.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1419] pb-24 pt-6">
      <div className="mx-auto max-w-lg space-y-6 px-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-white" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-white">
            {isEdit ? 'Editar Torneio' : 'Criar Torneio'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <ScrollArea className="max-h-[calc(100vh-220px)]">
            <div className="space-y-5 pb-4 pr-2">
              <Card className="border-slate-700/50 bg-[#1a1f2e]/80">
                <CardContent className="space-y-4 p-4">
                  {/* Nome */}
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-300">Nome do torneio</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Ex: Torneio Semanal #15"
                      className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500"
                      required
                    />
                  </div>

                  {/* Data e hora */}
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-300">Data e hora</Label>
                    <Input
                      type="datetime-local"
                      value={form.date}
                      onChange={(e) => updateField('date', e.target.value)}
                      className="border-slate-600/50 bg-slate-800/50 text-white"
                      required
                    />
                  </div>

                  {/* Buy-in */}
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-300">Buy-in</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[11px] text-slate-500">Preço (R$)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.buyInPrice}
                          onChange={(e) => updateField('buyInPrice', e.target.value)}
                          placeholder="0.00"
                          className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-500">Fichas</Label>
                        <Input
                          type="number"
                          min="0"
                          value={form.buyInChips}
                          onChange={(e) => updateField('buyInChips', e.target.value)}
                          placeholder="0"
                          className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rebuy */}
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-300">Rebuy</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[11px] text-slate-500">Preço (R$)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.rebuyPrice}
                          onChange={(e) => updateField('rebuyPrice', e.target.value)}
                          placeholder="0.00"
                          className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-500">Fichas</Label>
                        <Input
                          type="number"
                          min="0"
                          value={form.rebuyChips}
                          onChange={(e) => updateField('rebuyChips', e.target.value)}
                          placeholder="0"
                          className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Addon */}
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-300">Addon</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[11px] text-slate-500">Preço (R$)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.addonPrice}
                          onChange={(e) => updateField('addonPrice', e.target.value)}
                          placeholder="0.00"
                          className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-500">Fichas</Label>
                        <Input
                          type="number"
                          min="0"
                          value={form.addonChips}
                          onChange={(e) => updateField('addonChips', e.target.value)}
                          placeholder="0"
                          className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bônus de fichas */}
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-300">Bônus de fichas</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[11px] text-slate-500">Fichas</Label>
                        <Input
                          type="number"
                          min="0"
                          value={form.bonusChips}
                          onChange={(e) => updateField('bonusChips', e.target.value)}
                          placeholder="0"
                          className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-500">Horário do bônus</Label>
                        <Input
                          type="time"
                          value={form.bonusTime}
                          onChange={(e) => updateField('bonusTime', e.target.value)}
                          className="border-slate-600/50 bg-slate-800/50 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-slate-700/50" />

                  {/* Taxa do clube */}
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-300">Taxa do clube (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={form.clubFeePercent}
                      onChange={(e) => updateField('clubFeePercent', e.target.value)}
                      placeholder="0"
                      className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500 w-32"
                    />
                  </div>

                  {/* Máximo de jogadores */}
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-300">Máximo de jogadores (opcional)</Label>
                    <Input
                      type="number"
                      min="2"
                      value={form.maxPlayers}
                      onChange={(e) => updateField('maxPlayers', e.target.value)}
                      placeholder="Sem limite"
                      className="border-slate-600/50 bg-slate-800/50 text-white placeholder:text-slate-500 w-32"
                    />
                  </div>

                  {/* Descrição */}
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-300">Descrição (opcional)</Label>
                    <textarea
                      value={form.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="Informações adicionais sobre o torneio..."
                      rows={3}
                      className="flex w-full rounded-md border border-slate-600/50 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>

                  <Separator className="bg-slate-700/50" />

                  {/* Distribuição de premiação */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-slate-300">Distribuição de premiação</Label>
                      {prizeWarning && (
                        <span className="flex items-center gap-1 text-[11px] text-amber-400">
                          <AlertTriangle className="h-3 w-3" />
                          Soma: {prizeTotal}%
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {form.prizeConfig.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={p.position}
                            onChange={(e) => {
                              const newPrize = [...form.prizeConfig];
                              newPrize[idx] = { ...p, position: Number(e.target.value) || 1 };
                              setForm({ ...form, prizeConfig: newPrize });
                            }}
                            placeholder="Pos"
                            className="h-9 w-16 border-slate-600/50 bg-slate-800/50 text-center text-sm text-white placeholder:text-slate-500"
                          />
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={p.percentage}
                            onChange={(e) => {
                              const newPrize = [...form.prizeConfig];
                              newPrize[idx] = { ...p, percentage: Number(e.target.value) || 0 };
                              setForm({ ...form, prizeConfig: newPrize });
                            }}
                            placeholder="%"
                            className="h-9 w-20 border-slate-600/50 bg-slate-800/50 text-center text-sm text-white placeholder:text-slate-500"
                          />
                          <span className="text-xs text-slate-500">%</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            onClick={() => {
                              setForm({ ...form, prizeConfig: form.prizeConfig.filter((_, i) => i !== idx) });
                            }}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-dashed border-slate-600/50 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400"
                        onClick={() => {
                          const lastPos = form.prizeConfig.length > 0
                            ? Math.max(...form.prizeConfig.map((p) => p.position))
                            : 0;
                          setForm({
                            ...form,
                            prizeConfig: [...form.prizeConfig, { position: lastPos + 1, percentage: 0 }],
                          });
                        }}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Adicionar posição
                      </Button>
                    </div>
                  </div>

                  <Separator className="bg-slate-700/50" />

                  {/* Pontuação por posição */}
                  <div className="space-y-3">
                    <Label className="text-sm text-slate-300">Pontuação por posição</Label>
                    <div className="space-y-2">
                      {form.pointConfig.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={p.position}
                            onChange={(e) => {
                              const newPts = [...form.pointConfig];
                              newPts[idx] = { ...p, position: Number(e.target.value) || 1 };
                              setForm({ ...form, pointConfig: newPts });
                            }}
                            placeholder="Pos"
                            className="h-9 w-16 border-slate-600/50 bg-slate-800/50 text-center text-sm text-white placeholder:text-slate-500"
                          />
                          <Input
                            type="number"
                            min="0"
                            value={p.points}
                            onChange={(e) => {
                              const newPts = [...form.pointConfig];
                              newPts[idx] = { ...p, points: Number(e.target.value) || 0 };
                              setForm({ ...form, pointConfig: newPts });
                            }}
                            placeholder="Pts"
                            className="h-9 w-20 border-slate-600/50 bg-slate-800/50 text-center text-sm text-white placeholder:text-slate-500"
                          />
                          <span className="text-xs text-slate-500">pts</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            onClick={() => {
                              setForm({ ...form, pointConfig: form.pointConfig.filter((_, i) => i !== idx) });
                            }}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-dashed border-slate-600/50 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400"
                        onClick={() => {
                          const lastPos = form.pointConfig.length > 0
                            ? Math.max(...form.pointConfig.map((p) => p.position))
                            : 0;
                          setForm({
                            ...form,
                            pointConfig: [...form.pointConfig, { position: lastPos + 1, points: 0 }],
                          });
                        }}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Adicionar posição
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={saving}
          >
            {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar torneio'}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── Manage Tournament (Live Control) ───────────────────────

function ManageTournament({
  tournamentId,
  onBack,
}: {
  tournamentId: string;
  onBack: () => void;
}) {
  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [positionInputs, setPositionInputs] = useState<Record<string, string>>({});
  const [finishing, setFinishing] = useState(false);
  const [finishingDialogOpen, setFinishingDialogOpen] = useState(false);

  const fetchTournament = useCallback(async () => {
    try {
      const res = await api.tournaments.get(tournamentId);
      setTournament(res.tournament);
    } catch {
      toast.error('Erro ao carregar torneio.');
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

  const handleRebuy = async (regId: string) => {
    try {
      await api.registrations.rebuy(regId);
      toast.success('Rebuy realizado!');
      fetchTournament();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao realizar rebuy.');
    }
  };

  const handleAddon = async (regId: string) => {
    try {
      await api.registrations.addon(regId);
      toast.success('Addon concedido!');
      fetchTournament();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao conceder addon.');
    }
  };

  const handleBonus = async (regId: string) => {
    try {
      await api.registrations.bonus(regId);
      toast.success('Bônus concedido!');
      fetchTournament();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao conceder bônus.');
    }
  };

  const handleEliminate = async (regId: string) => {
    try {
      await api.registrations.result(regId, { eliminated: true });
      toast.success('Jogador eliminado!');
      fetchTournament();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao eliminar jogador.');
    }
  };

  const handleSavePosition = async (regId: string) => {
    const pos = Number(positionInputs[regId]);
    if (!pos || pos < 1) {
      toast.error('Informe uma posição válida.');
      return;
    }
    try {
      await api.registrations.result(regId, { position: pos });
      toast.success(`Posição #${pos} definida!`);
      setPositionInputs((prev) => {
        const next = { ...prev };
        delete next[regId];
        return next;
      });
      fetchTournament();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao definir posição.');
    }
  };

  const handleFinish = async () => {
    try {
      setFinishing(true);
      await api.tournaments.update(tournamentId, { status: 'completed' });
      toast.success('Torneio finalizado com sucesso!');
      fetchTournament();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao finalizar torneio.');
    } finally {
      setFinishing(false);
      setFinishingDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419] pb-24 pt-6">
        <div className="mx-auto max-w-lg space-y-6 px-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-slate-700/50 animate-pulse" />
            <div className="h-6 w-40 rounded bg-slate-700/50 animate-pulse" />
          </div>
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-slate-700/50 bg-[#1a1f2e]/80">
              <CardContent className="p-4 space-y-2">
                <div className="h-5 w-32 rounded bg-slate-700/50 animate-pulse" />
                <div className="h-4 w-48 rounded bg-slate-700/50 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1419] px-4">
        <Card className="border-slate-700/50 bg-[#1a1f2e]">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-slate-400">Torneio não encontrado.</p>
            <Button variant="ghost" className="mt-3 text-emerald-400" onClick={onBack}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sc = statusConfig(tournament.status);
  const isCompleted = tournament.status === 'completed';
  const activeRegs = tournament.registrations.filter((r) => r.status !== 'cancelled');

  return (
    <div className="min-h-screen bg-[#0f1419] pb-24 pt-6">
      <div className="mx-auto max-w-lg space-y-6 px-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-white" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-white">{tournament.name}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-[10px] ${sc.className}`}>
                {sc.label}
              </Badge>
              <span className="text-xs text-slate-500">{activeRegs.length} jogadores</span>
            </div>
          </div>
        </div>

        {/* Players */}
        <Card className="border-slate-700/50 bg-[#1a1f2e]/80">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-slate-300">
              Jogadores ({activeRegs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[500px]">
              <div className="divide-y divide-slate-700/40">
                {activeRegs.length === 0 ? (
                  <div className="p-6 text-center">
                    <Users className="mx-auto mb-2 h-8 w-8 text-slate-600" />
                    <p className="text-sm text-slate-500">Nenhum jogador inscrito.</p>
                  </div>
                ) : (
                  activeRegs.map((reg) => (
                    <PlayerRow
                      key={reg.id}
                      reg={reg}
                      tournament={tournament}
                      positionValue={positionInputs[reg.id] ?? ''}
                      onPositionChange={(val) =>
                        setPositionInputs((prev) => ({ ...prev, [reg.id]: val }))
                      }
                      onRebuy={() => handleRebuy(reg.id)}
                      onAddon={() => handleAddon(reg.id)}
                      onBonus={() => handleBonus(reg.id)}
                      onEliminate={() => handleEliminate(reg.id)}
                      onSavePosition={() => handleSavePosition(reg.id)}
                      disabled={isCompleted}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Finish button */}
        {!isCompleted && (
          <Dialog open={finishingDialogOpen} onOpenChange={setFinishingDialogOpen}>
            <Button
              className="w-full bg-red-600 text-white hover:bg-red-700"
              onClick={() => setFinishingDialogOpen(true)}
            >
              <Check className="mr-2 h-4 w-4" />
              Finalizar Torneio
            </Button>
            <DialogContent className="border-slate-700/50 bg-[#1a1f2e]">
              <DialogHeader>
                <DialogTitle className="text-white">Finalizar torneio</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Tem certeza que deseja finalizar o torneio &quot;{tournament.name}&quot;? Esta ação marcará o torneio como concluído.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  className="border-slate-600/50 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                  onClick={() => setFinishingDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-red-600 text-white hover:bg-red-700"
                  disabled={finishing}
                  onClick={handleFinish}
                >
                  {finishing ? 'Finalizando...' : 'Confirmar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

// ─── Player Row (Manage sub-view) ───────────────────────────

function PlayerRow({
  reg,
  tournament,
  positionValue,
  onPositionChange,
  onRebuy,
  onAddon,
  onBonus,
  onEliminate,
  onSavePosition,
  disabled,
}: {
  reg: Registration;
  tournament: TournamentDetail;
  positionValue: string;
  onPositionChange: (val: string) => void;
  onRebuy: () => void;
  onAddon: () => void;
  onBonus: () => void;
  onEliminate: () => void;
  onSavePosition: () => void;
  disabled: boolean;
}) {
  const isEliminated = reg.status === 'eliminated';

  return (
    <div className={`px-4 py-3 ${isEliminated ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
            reg.finalPosition === 1
              ? 'bg-gradient-to-br from-amber-500 to-amber-600'
              : reg.finalPosition === 2
                ? 'bg-gradient-to-br from-slate-400 to-slate-500'
                : reg.finalPosition === 3
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                  : 'bg-slate-700'
          }`}
        >
          {reg.player.nickname.charAt(0).toUpperCase()}
        </div>

        {/* Player info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-white">{reg.player.nickname}</p>
            {reg.finalPosition && (
              <Badge
                variant="outline"
                className={`shrink-0 text-[10px] ${
                  reg.finalPosition === 1
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                    : reg.finalPosition === 2
                      ? 'bg-slate-500/15 text-slate-300 border-slate-500/25'
                      : reg.finalPosition === 3
                        ? 'bg-orange-500/15 text-orange-400 border-orange-500/25'
                        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                }`}
              >
                #{reg.finalPosition}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1 font-medium text-amber-400">
              <Coins className="h-3 w-3" />
              {reg.totalChips.toLocaleString('pt-BR')}
            </span>
            {reg.rebuyCount > 0 && (
              <span className="text-slate-500">Rebuys: {reg.rebuyCount}</span>
            )}
            {reg.addonTaken && (
              <span className="text-emerald-500">Addon ✓</span>
            )}
            {reg.bonusReceived && (
              <span className="text-amber-400">Bônus ✓</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      {!disabled && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 border-emerald-500/25 bg-emerald-500/5 px-2.5 text-[11px] text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
            onClick={onRebuy}
            disabled={isEliminated}
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Rebuy +{tournament.rebuyChips.toLocaleString('pt-BR')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-7 border-blue-500/25 bg-blue-500/5 px-2.5 text-[11px] text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
            onClick={onAddon}
            disabled={reg.addonTaken || isEliminated}
          >
            <Gift className="mr-1 h-3 w-3" />
            Addon {reg.addonTaken ? '✓' : `+${tournament.addonChips.toLocaleString('pt-BR')}`}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-7 border-amber-500/25 bg-amber-500/5 px-2.5 text-[11px] text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
            onClick={onBonus}
            disabled={reg.bonusReceived || isEliminated}
          >
            <Star className="mr-1 h-3 w-3" />
            Bônus {reg.bonusReceived ? '✓' : `+${tournament.bonusChips.toLocaleString('pt-BR')}`}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-7 border-red-500/25 bg-red-500/5 px-2.5 text-[11px] text-red-400 hover:bg-red-500/10 hover:text-red-300"
            onClick={onEliminate}
            disabled={isEliminated}
          >
            <XCircle className="mr-1 h-3 w-3" />
            Eliminar
          </Button>
        </div>
      )}

      {/* Position input */}
      {!disabled && !isEliminated && (
        <div className="mt-2 flex items-center gap-2">
          <Label className="text-[11px] text-slate-500 shrink-0">Posição:</Label>
          <Input
            type="number"
            min="1"
            value={positionValue}
            onChange={(e) => onPositionChange(e.target.value)}
            placeholder="#"
            className="h-7 w-16 border-slate-600/50 bg-slate-800/50 px-2 text-center text-xs text-white placeholder:text-slate-500"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 border-emerald-500/25 bg-emerald-500/5 px-2.5 text-[11px] text-emerald-400 hover:bg-emerald-500/10"
            onClick={onSavePosition}
          >
            <Save className="mr-1 h-3 w-3" />
            Salvar
          </Button>
        </div>
      )}
    </div>
  );
}
