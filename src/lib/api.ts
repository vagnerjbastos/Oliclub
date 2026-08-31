const API_BASE = '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro na requisição');
  return data;
}

export const api = {
  auth: {
    register: (nickname: string, pin: string) =>
      request<{ player: Player; token: string }>('/api/auth/register', {
        method: 'POST', body: JSON.stringify({ nickname, pin }),
      }),
    login: (nickname: string, pin: string) =>
      request<{ player: Player; token: string }>('/api/auth/login', {
        method: 'POST', body: JSON.stringify({ nickname, pin }),
      }),
    me: () => request<{ player: Player }>('/api/auth/me'),
    logout: () => request<{ success: true }>('/api/auth/me', { method: 'DELETE' }),
  },
  tournaments: {
    list: (status?: string) =>
      request<{ tournaments: Tournament[] }>(`/api/tournaments${status && status !== 'all' ? `?status=${status}` : ''}`),
    get: (id: string) =>
      request<{ tournament: TournamentDetail }>(`/api/tournaments/${id}`),
    create: (data: Record<string, unknown>) =>
      request<{ tournament: Tournament }>('/api/tournaments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      request<{ tournament: Tournament }>(`/api/tournaments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/tournaments/${id}`, { method: 'DELETE' }),
  },
  register: {
    join: (tournamentId: string) =>
      request<{ registration: Registration }>(`/api/tournaments/${tournamentId}/register`, { method: 'POST' }),
    leave: (tournamentId: string) =>
      request<{ success: boolean }>(`/api/tournaments/${tournamentId}/register`, { method: 'DELETE' }),
  },
  registrations: {
    rebuy: (id: string) =>
      request<{ registration: Registration }>(`/api/registrations/${id}/rebuy`, { method: 'POST' }),
    addon: (id: string) =>
      request<{ registration: Registration }>(`/api/registrations/${id}/addon`, { method: 'POST' }),
    bonus: (id: string) =>
      request<{ registration: Registration }>(`/api/registrations/${id}/bonus`, { method: 'POST' }),
    result: (id: string, data: { position?: number; eliminated?: boolean }) =>
      request<{ registration: Registration }>(`/api/registrations/${id}/result`, { method: 'POST', body: JSON.stringify(data) }),
  },
  rankings: {
    list: () => request<{ rankings: RankingEntry[] }>('/api/rankings'),
  },
  players: {
    list: () => request<{ players: Player[] }>('/api/players'),
  },
};

import type { Player, Tournament, TournamentDetail, Registration, RankingEntry } from './store';
