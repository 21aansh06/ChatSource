import { prisma } from '../../infra/prisma.js';
import { clerkClient } from '@clerk/express';
import { UserPlan } from '@prisma/client';
import { UsageService } from './usage.service.js';

export class UsersService {
  /**
   * Retrieves user from database or syncs user details from Clerk if missing or updated.
   * Includes Usage metrics (sourcesAddedCount & successfulQueriesCount).
   */
  static async getOrCreateUser(userId: string) {
    if (!userId) return null;

    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        usage: true,
      },
    });

    if (!user) {
      try {
        const clerkUser = await clerkClient.users.getUser(userId);
        const primaryEmailObj = clerkUser.emailAddresses?.find(
          (e) => e.id === clerkUser.primaryEmailAddressId
        );
        const email =
          primaryEmailObj?.emailAddress ||
          clerkUser.emailAddresses?.[0]?.emailAddress ||
          `${userId}@clerk.user`;
        const firstName = clerkUser.firstName || null;
        const lastName = clerkUser.lastName || null;
        const imageUrl = clerkUser.imageUrl || null;

        user = await prisma.user.upsert({
          where: { id: userId },
          update: {
            email,
            firstName,
            lastName,
            imageUrl,
          },
          create: {
            id: userId,
            email,
            firstName,
            lastName,
            imageUrl,
            plan: UserPlan.FREE,
          },
          include: {
            usage: true,
          },
        });
      } catch (err) {
        console.warn(`[UsersService] Failed to fetch Clerk user ${userId}, creating fallback user record:`, err);

        user = await prisma.user.upsert({
          where: { id: userId },
          update: {},
          create: {
            id: userId,
            email: `${userId}@clerk.user`,
            plan: UserPlan.FREE,
          },
          include: {
            usage: true,
          },
        });
      }
    }

    let usageRecord = user.usage;
    if (!usageRecord) {
      usageRecord = await UsageService.getUserUsage(userId);
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      plan: user.plan,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      usage: usageRecord,
    };
  }
}
