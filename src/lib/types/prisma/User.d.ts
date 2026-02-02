import { User as PrismaUser } from "../../../../prisma/generated/client";

export type User = PrismaUser;

export type UserInput = {
  uid: string;
  email: string | null;
  displayName: string;
  avatarURL: string;
};