import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import Navbar from '@/components/Navbar';
import { TrophyIcon } from '@heroicons/react/24/outline';

const LeaderboardPage: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <Layout title="Leaderboard - RuneRogue">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Mock leaderboard data - will be replaced with real API data
  const mockLeaderboard = [
    { rank: 1, username: 'PlayerOne', score: 15420, level: 85 },
    { rank: 2, username: 'RuneMaster', score: 14150, level: 82 },
    { rank: 3, username: 'QuestSeeker', score: 13890, level: 80 },
    { rank: 4, username: 'SkillMaster', score: 12540, level: 77 },
    { rank: 5, username: 'AdventureKing', score: 11320, level: 74 },
  ];

  return (
    <Layout title="Leaderboard - RuneRogue">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <div className="flex items-center">
              <TrophyIcon className="h-8 w-8 text-yellow-500 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
            </div>
            <p className="mt-2 text-gray-600">Compete with other players and climb the ranks!</p>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {mockLeaderboard.map(player => (
                <li key={player.rank} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${
                            player.rank === 1
                              ? 'bg-yellow-500'
                              : player.rank === 2
                                ? 'bg-gray-400'
                                : player.rank === 3
                                  ? 'bg-orange-600'
                                  : 'bg-primary-600'
                          }`}
                        >
                          {player.rank}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{player.username}</div>
                        <div className="text-sm text-gray-500">Level {player.level}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {player.score.toLocaleString()} points
                      </div>
                      <div className="text-sm text-gray-500">Total Score</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <TrophyIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Coming Soon: Real-time Leaderboards
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    We're working on integrating real player data and live scoring. Stay tuned for
                    updates as we enhance the competitive experience!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LeaderboardPage;
