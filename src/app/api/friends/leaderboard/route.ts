import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { prisma } from '@/lib/db/prisma';

type LeaderboardEntry = {
  userId: string;
  displayName: string;
  email: string;
  avatarURL: string | null;
  score: number;
  rank: number;
  stats: {
    totalTrophies: number;
    promotions: number;
  };
  breakdown: {
    trophiesPoints: number;
    promotionsPoints: number;
  };
};

type LeaderboardResponse = {
  leaderboard: LeaderboardEntry[];
  participantCount: number;
  gameId: string | null;
  games: Array<{ id: string; name: string }>;
};

const SCORE_WEIGHTS = {
  trophy: 10,
  promotion: 5,
} as const;

function getScore(stats: {
  totalTrophies: number;
  promotions: number;
}) {
  const breakdown = {
    trophiesPoints: stats.totalTrophies * SCORE_WEIGHTS.trophy,
    promotionsPoints: stats.promotions * SCORE_WEIGHTS.promotion,
  };

  return {
    score: breakdown.trophiesPoints + breakdown.promotionsPoints,
    breakdown,
  };
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (uid: string) => {
    try {
      const { searchParams } = new URL(request.url);
      const gameId = searchParams.get('gameId');

      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [{ user1Id: uid }, { user2Id: uid }],
        },
        select: {
          user1Id: true,
          user2Id: true,
        },
      });

      const participantIds = Array.from(
        new Set([
          uid,
          ...friendships.map((friendship) =>
            friendship.user1Id === uid ? friendship.user2Id : friendship.user1Id
          ),
        ])
      );

      const users = await prisma.user.findMany({
        where: { uid: { in: participantIds } },
        select: {
          uid: true,
          displayName: true,
          email: true,
          avatarURL: true,
        },
      });

      const participantGames = await prisma.save.findMany({
        where: {
          userId: { in: participantIds },
        },
        distinct: ['gameId'],
        select: {
          gameId: true,
        },
      });

      const availableGameIds = participantGames.map((entry) => entry.gameId);
      const games = availableGameIds.length
        ? await prisma.game.findMany({
            where: { id: { in: availableGameIds } },
            select: { id: true, name: true },
            orderBy: { releaseDate: 'desc' },
          })
        : [];

      const leaderboard = await Promise.all(
        users.map(async (user) => {
          const [totalTrophies, promotions] = await Promise.all([
            prisma.trophy.count({
              where: {
                save: {
                  userId: user.uid,
                  ...(gameId ? { gameId } : {}),
                },
              },
            }),
            prisma.leagueResult.count({
              where: {
                promoted: true,
                season: {
                  save: {
                    userId: user.uid,
                    ...(gameId ? { gameId } : {}),
                  },
                },
              },
            }),
          ]);

          const stats = {
            totalTrophies,
            promotions,
          };

          const { score, breakdown } = getScore(stats);

          return {
            userId: user.uid,
            displayName: user.displayName,
            email: user.email,
            avatarURL: user.avatarURL,
            score,
            rank: 0,
            stats,
            breakdown,
          };
        })
      );

      leaderboard.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.stats.promotions !== a.stats.promotions) {
          return b.stats.promotions - a.stats.promotions;
        }
        if (b.stats.totalTrophies !== a.stats.totalTrophies) {
          return b.stats.totalTrophies - a.stats.totalTrophies;
        }
        return a.displayName.localeCompare(b.displayName);
      });

      let currentRank = 1;
      leaderboard.forEach((entry, index) => {
        if (index > 0) {
          const previous = leaderboard[index - 1];
          const isTie =
            previous.score === entry.score &&
            previous.stats.promotions === entry.stats.promotions &&
            previous.stats.totalTrophies === entry.stats.totalTrophies;

          if (!isTie) currentRank = index + 1;
        }

        entry.rank = currentRank;
      });

      const response: LeaderboardResponse = {
        leaderboard,
        participantCount: participantIds.length,
        gameId,
        games,
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error('Error fetching friends leaderboard:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }
  });
}
