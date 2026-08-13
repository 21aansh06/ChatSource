import { prisma } from '../../infra/prisma.js';
import { clerkClient } from '@clerk/express';
import { UserPlan } from '@prisma/client';

export class UsersService {
  static async getOrCreateUser(userId: string) {
    if (!userId) return null;

    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      return user;
    }
    
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
      });

      return user;
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
      });

      return user;
    }
  }
}
