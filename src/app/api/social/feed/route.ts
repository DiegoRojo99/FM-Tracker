import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { ok } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';
import { buildSocialFeedItems, SocialFeedItem } from '@/lib/social/feed';

export async function GET(req: NextRequest) {
  return withAuth(req, async (uid: string) => {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const limit = Number(url.searchParams.get('limit') ?? '10');

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ user1Id: uid }, { user2Id: uid }],
      },
      select: {
        user1Id: true,
        user2Id: true,
      },
    });

    const friendIds = friendships
      .map((friendship) => (friendship.user1Id === uid ? friendship.user2Id : friendship.user1Id))
      .filter(Boolean);

    const [saves, trophies, challenges, seasons, friendSaves, friendTrophies, friendChallenges, friendSeasons] = await Promise.all([
      prisma.save.findMany({
        where: { userId: uid },
        include: { game: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.trophy.findMany({
        where: { save: { userId: uid } },
        include: { competitionGroup: true, team: true, save: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.careerChallenge.findMany({
        where: { userId: uid, completedAt: { not: null } },
        include: { challenge: true, save: true },
        orderBy: { completedAt: 'desc' },
        take: 10,
      }),
      prisma.season.findMany({
        where: { save: { userId: uid } },
        include: { save: true, team: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      friendIds.length > 0
        ? prisma.save.findMany({
            where: { userId: { in: friendIds } },
            include: { game: true, user: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
          })
        : [],
      friendIds.length > 0
        ? prisma.trophy.findMany({
            where: { save: { userId: { in: friendIds } } },
            include: { competitionGroup: true, team: true, save: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
          })
        : [],
      friendIds.length > 0
        ? prisma.careerChallenge.findMany({
            where: { userId: { in: friendIds }, completedAt: { not: null } },
            include: { challenge: true, save: true, user: true },
            orderBy: { completedAt: 'desc' },
            take: 10,
          })
        : [],
      friendIds.length > 0
        ? prisma.season.findMany({
            where: { save: { userId: { in: friendIds } } },
            include: { save: true, team: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
          })
        : [],
    ]);

    const feed: SocialFeedItem[] = [
      ...saves.map((save) => ({
        id: `save-${save.id}`,
        type: 'save.milestone' as const,
        title: 'Save milestone',
        message: `Started a new save in ${save.game.name} for ${save.season}.`,
        createdAt: save.createdAt.toISOString(),
        visibility: 'public' as const,
        saveId: save.id,
        metadata: { game: save.game.name, season: save.season },
      })),
      ...trophies.map((trophy) => ({
        id: `trophy-${trophy.id}`,
        type: 'trophy.added' as const,
        title: 'Trophy unlocked',
        message: `Won the ${trophy.competitionGroup.displayName} in ${trophy.season} with ${trophy.team.name}.`,
        createdAt: trophy.createdAt.toISOString(),
        visibility: 'public' as const,
        saveId: trophy.saveId ?? undefined,
        metadata: { competition: trophy.competitionGroup.displayName, season: trophy.season },
      })),
      ...challenges.map((challenge) => ({
        id: `challenge-${challenge.id}`,
        type: 'challenge.completed' as const,
        title: 'Challenge completed',
        message: `Completed ${challenge.challenge.name} in ${challenge.save?.gameId ? 'your save' : 'your profile'}.`,
        createdAt: challenge.completedAt?.toISOString() ?? challenge.startedAt.toISOString(),
        visibility: 'friends' as const,
        saveId: challenge.saveId ?? undefined,
        metadata: { challenge: challenge.challenge.name },
      })),
      ...seasons.map((season) => ({
        id: `season-${season.id}`,
        type: 'season.created' as const,
        title: 'Season added',
        message: `Added the ${season.season} season for ${season.team.name}.`,
        createdAt: season.createdAt.toISOString(),
        visibility: 'public' as const,
        saveId: season.saveId,
        metadata: { season: season.season, team: season.team.name },
      })),
      ...friendSaves.map((save) => ({
        id: `friend-save-${save.id}`,
        type: 'save.milestone' as const,
        title: 'Save milestone',
        message: `${save.user.displayName} started a new save in ${save.game.name} for ${save.season}.`,
        createdAt: save.createdAt.toISOString(),
        visibility: 'friends' as const,
        saveId: save.id,
        metadata: { game: save.game.name, season: save.season, user: save.user.displayName },
      })),
      ...friendTrophies.map((trophy) => ({
        id: `friend-trophy-${trophy.id}`,
        type: 'trophy.added' as const,
        title: 'Trophy unlocked',
        message: `A friend won the ${trophy.competitionGroup.displayName} in ${trophy.season} with ${trophy.team.name}.`,
        createdAt: trophy.createdAt.toISOString(),
        visibility: 'friends' as const,
        saveId: trophy.saveId ?? undefined,
        metadata: { competition: trophy.competitionGroup.displayName, season: trophy.season },
      })),
      ...friendChallenges.map((challenge) => ({
        id: `friend-challenge-${challenge.id}`,
        type: 'challenge.completed' as const,
        title: 'Challenge completed',
        message: `${challenge.user.displayName} completed ${challenge.challenge.name}.`,
        createdAt: challenge.completedAt?.toISOString() ?? challenge.startedAt.toISOString(),
        visibility: 'friends' as const,
        saveId: challenge.saveId ?? undefined,
        metadata: { challenge: challenge.challenge.name, user: challenge.user.displayName },
      })),
      ...friendSeasons.map((season) => ({
        id: `friend-season-${season.id}`,
        type: 'season.created' as const,
        title: 'Season added',
        message: `A friend added the ${season.season} season for ${season.team.name}.`,
        createdAt: season.createdAt.toISOString(),
        visibility: 'friends' as const,
        saveId: season.saveId,
        metadata: { season: season.season, team: season.team.name },
      })),
    ];

    if (feed.length === 0) {
      feed.push({
        id: `welcome-${uid}`,
        type: 'onboarding.welcome',
        title: 'Welcome to social',
        message: 'Follow your own milestones here first, then add friends when you want comparisons and shared progress. Social is optional and works best once your first save is active.',
        createdAt: new Date().toISOString(),
        visibility: 'public',
        metadata: { onboarding: true },
      });
    }

    const result = buildSocialFeedItems(feed, {
      page,
      limit,
      viewerIsFriend: true,
    });

    return ok(result);
  });
}
