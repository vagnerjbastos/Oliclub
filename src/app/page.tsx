'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import AuthScreen from '@/components/poker/AuthScreen';
import HomeScreen from '@/components/poker/HomeScreen';
import TournamentsScreen from '@/components/poker/TournamentsScreen';
import TournamentDetailScreen from '@/components/poker/TournamentDetailScreen';
import RankingsScreen from '@/components/poker/RankingsScreen';
import ProfileScreen from '@/components/poker/ProfileScreen';
import AdminPanel from '@/components/poker/AdminPanel';
import BottomNav from '@/components/poker/BottomNav';

export default function Home() {
  const { view, setPlayer, setView, player } = useAppStore();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !player) {
      api
        .me()
        .then((res) => {
          setPlayer(res.player);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setPlayer(null);
          setView('auth');
        });
    } else if (!player) {
      setView('auth');
    }
  }, [player, setPlayer, setView]);

  const renderView = () => {
    switch (view) {
      case 'auth':
        return <AuthScreen />;
      case 'home':
        return <HomeScreen />;
      case 'tournaments':
        return <TournamentsScreen />;
      case 'tournament-detail':
        return <TournamentDetailScreen />;
      case 'rankings':
        return <RankingsScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'admin-tournaments':
      case 'admin-create':
      case 'admin-manage':
        return <AdminPanel />;
      default:
        return <AuthScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1419]">
      {renderView()}
      <BottomNav />
    </div>
  );
}
