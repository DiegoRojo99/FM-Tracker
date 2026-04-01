import { FriendRequest as PrismaFriendRequest, Friendship as PrismaFriendship, FriendRequestStatus, User } from "../../../../prisma/generated/client";

export type FriendRequest = PrismaFriendRequest;
export type Friendship = PrismaFriendship;
export type { FriendRequestStatus };

// Extended types for API responses
export type FriendRequestWithUser = FriendRequest & {
  requester?: Pick<User, 'uid' | 'displayName' | 'email' | 'avatarURL'>;
  receiver?: Pick<User, 'uid' | 'displayName' | 'email' | 'avatarURL'>;
};

export type FriendshipWithUsers = Friendship & {
  user1: Pick<User, 'uid' | 'displayName' | 'email' | 'avatarURL' | 'createdAt'>;
  user2: Pick<User, 'uid' | 'displayName' | 'email' | 'avatarURL' | 'createdAt'>;
};

export type FriendWithDate = Pick<User, 'uid' | 'displayName' | 'email' | 'avatarURL' | 'createdAt'> & {
  friendshipDate: Date;
};

export type UserWithRelationshipStatus = Pick<User, 'uid' | 'displayName' | 'email' | 'avatarURL' | 'createdAt'> & {
  relationshipStatus: 'none' | 'friend' | 'request_sent_pending' | 'request_sent_rejected' | 'request_sent_blocked' | 'request_received_pending' | 'request_received_rejected' | 'request_received_blocked';
  canSendRequest: boolean;
  pendingRequestId?: string;
};

// Input types for API requests
export type SendFriendRequestInput = {
  receiverEmail: string;
  message?: string;
};

export type RespondToFriendRequestInput = {
  requestId: string;
  action: 'accept' | 'reject' | 'block';
};

export type RemoveFriendInput = {
  friendId: string;
};