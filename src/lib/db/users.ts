import { User } from "../types/prisma/User";
import { prisma } from "./prisma";

export function getUserById(userId: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: {
      uid: userId,
    },
  });
}

export function getUsersByIds(userIds: string[]): Promise<User[]> {
  return prisma.user.findMany({
    where: {
      uid: { in: userIds },
    },
  });
}

export async function getAllUsers(): Promise<User[]> {
  return prisma.user.findMany();
}