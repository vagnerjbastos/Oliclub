'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Spade } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';

export default function AuthScreen() {
  const { setPlayer, setView } = useAppStore();
  const [nickname, setNickname] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('login');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      setError('Informe seu apelido.');
      return;
    }
    if (pin.length < 4 || !/\d+/.test(pin)) {
      setError('O PIN deve conter pelo menos 4 dígitos.');
      return;
    }

    setLoading(true);
    try {
      const isLogin = activeTab === 'login';
      const result = isLogin
        ? await api.auth.login(trimmedNickname, pin)
        : await api.auth.register(trimmedNickname, pin);

      setPlayer(result.player);
      localStorage.setItem('token', result.token);

      if (!isLogin && result.player.isAdmin) {
        toast.success('Primeiro jogador! Você é o admin do clube.');
      }

      setView('home');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro inesperado.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1419] px-4">
      {/* Decorative background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/8 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-amber-500/5 blur-[100px]" />
      </div>

      <Card className="relative z-10 w-full max-w-sm border-emerald-500/20 bg-[#1a1f2e]/95 shadow-2xl shadow-emerald-900/20 backdrop-blur-sm">
        <CardHeader className="flex flex-col items-center gap-3 pb-2 text-center">
          {/* Logo */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/30">
            <Spade className="h-9 w-9 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Poker <span className="text-amber-400">Club</span>
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Gerencie seus torneios de poker
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setError(''); }}>
            <TabsList className="mb-4 grid w-full grid-cols-2 bg-[#0f1419]">
              <TabsTrigger
                value="login"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-emerald-600/30 text-slate-400 transition-all"
              >
                Entrar
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-emerald-600/30 text-slate-400 transition-all"
              >
                Cadastrar
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nickname" className="text-sm text-slate-300">
                  Apelido
                </Label>
                <Input
                  id="nickname"
                  placeholder="Seu apelido no clube"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="border-slate-600/50 bg-[#0f1419] text-white placeholder:text-slate-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30"
                  autoComplete="off"
                  maxLength={30}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin" className="text-sm text-slate-300">
                  PIN
                </Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setPin(val);
                  }}
                  className="border-slate-600/50 bg-[#0f1419] text-white placeholder:text-slate-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30 tracking-[0.3em] text-center text-lg"
                  inputMode="numeric"
                  maxLength={12}
                />
                <p className="text-xs text-slate-500">Mínimo 4 dígitos numéricos</p>
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-sm text-red-400">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-600/25 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>Aguarde...</span>
                  </div>
                ) : activeTab === 'login' ? (
                  'Entrar'
                ) : (
                  'Criar conta'
                )}
              </Button>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
