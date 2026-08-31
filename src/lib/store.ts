import { create } from 'zustand';

export type AppView =
  | 'auth'
  | 'home'
  | 'tournament-detail'
  | 'tournaments'
  | 'rankings'
  | 'profile'
  | 'admin-tournaments'
  | 'admin-create'
  | 'admin-manage';

export interface Player {
  id: string;
  nickname: string;
  isAdmin: boolean;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Tournament {
  id: string;
  name: string;
  date: string;
  status: string;
  buyInPrice: number;
  rebuyPrice: number;
  addonPrice: number;
  buyInChips: number;
  rebuyChips: number;
  addonChips: number;
  bonusChips: number;
  bonusTime: string | null;
  clubFeePercent: number;
  prizeConfig: PrizeEntry[];
  pointConfig: PointEntry[];
  maxPlayers: number | null;
  description: string | null;
  _count?: { registrations: number };
}

export interface PrizeEntry {
  position: number;
  percentage: number;
}

export interface PointEntry {
  position: number;
  points: number;
}

export interface Registration {
  id: string;
  playerId: string;
  tournamentId: string;
  status: string;
  buyInPaid: boolean;
  rebuyCount: number;
  addonTaken: boolean;
  bonusReceived: boolean;
  totalChips: number;
  finalPosition: number | null;
  prizeAmount: number | null;
  player: { id: string; nickname: string; avatar: string | null };
}

export interface TournamentDetail extends Tournament {
  registrations: Registration[];
  rankings: { id: string; playerId: string; position: number; points: number; player: { id: string; nickname: string; avatar: string | null } }[];
  stats: {
    totalPlayers: number;
    totalBuyIn: number;
    clubFee: number;
    prizePool: number;
    prizeBreakdown: { position: number; percentage: number; amount: number }[];
  };
}

export interface RankingEntry {
  id: string;
  nickname: string;
  avatar: string | null;
  totalPoints: number;
  tournamentsPlayed: number;
  victories: number;
  bestPosition: number | null;
}

interface AppState {
  view: AppView;
  player: Player | null;
  tournaments: Tournament[];
  currentTournament: TournamentDetail | null;
  rankings: RankingEntry[];
  loading: boolean;
  error: string | null;

  setView: (view: AppView) => void;
  setPlayer: (player: Player | null) => void;
  setTournaments: (tournaments: Tournament[]) => void;
  setCurrentTournament: (t: TournamentDetail | null) => void;
  setRankings: (rankings: RankingEntry[]) => void;
  setLoading: (l: boolean) => void;
  setError: (e: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: 'auth',
  player: null,
  tournaments: [],
  currentTournament: null,
  rankings: [],
  loading: false,
  error: null,

  setView: (view) => set({ view }),
  setPlayer: (player) => set({ player }),
  setTournaments: (tournaments) => set({ tournaments }),
  setCurrentTournament: (t) => set({ currentTournament: t }),
  setRankings: (rankings) => set({ rankings }),
  setLoading: (l) => set({ loading: l }),
  setError: (e) => set({ error: e }),
}));
