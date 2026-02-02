import { User, UserInput } from "../../types/prisma/User";
import { prisma } from "../prisma";
import { User as FirebaseUser} from 'firebase/auth';

export async function createUserIfNotExists(user: FirebaseUser) {
  if (!user?.uid) return
  const userRef = await prisma.user.findUnique({
    where: { uid: user.uid },
  })
  
  if (userRef) return;
  await createUser({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || 'Anonymous',
    avatarURL: user.photoURL || '',
  })
}
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

export async function createUser(userData: UserInput): Promise<User> {
  if (!userData.uid || !userData.email) {
    throw new Error("User UID and email are required to create a user.");
  }

  return prisma.user.create({
    data: {
      uid: userData.uid,
      email: userData.email,
      displayName: userData.displayName,
      avatarURL: userData.avatarURL,
      createdAt: new Date(),
    },
  });
}