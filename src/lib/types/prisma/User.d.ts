import { User as PrismaUser } from "../../../../prisma/generated/client";

export type User = PrismaUser;

export type UserInput = {
  uid: string;
  email: string | null;
  displayName: string;
  avatarURL: string;
};

export type UserWithStatus = User & {
  relationshipStatus: 'friend' | 'request_sent_pending' | 'request_received_pending' | 'request_sent_accepted' | 'request_received_accepted'  | 'request_sent_blocked' | 'request_received_blocked' | 'none';
  canSendRequest: boolean;
  pendingRequestId?: string;
};