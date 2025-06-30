import { collection, doc, getDoc } from "firebase/firestore";
import { db } from '@/lib/db/firebase';
import { User } from "../types/User";
import { getDocs } from "firebase/firestore";

export function getUserById(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    return getDoc(userRef).then(doc => {
      if (!doc.exists) {
        throw new Error("User not found");
      }
      return {...doc.data() } as User;
    });
  }
  catch (error) {
    console.error("Error fetching user by ID:", error);
    throw error;
  }
}

export function getUsersByIds(userIds: string[]) {
  const userRefs = userIds.map(id => doc(db, 'users', id));
  return Promise.all(userRefs.map(ref => getDoc(ref)))
    .then(docs => {
      return docs.map(doc => {
        if (!doc.exists) {
          throw new Error(`User with ID ${doc.id} not found`);
        }
        return { ...doc.data() } as User;
      });
    });
}

export async function getAllUsers(): Promise<User[]> {
  const collectionRef = collection(db, 'users');
  const users = await getDocs(collectionRef);
  return users.docs.map(doc => ({ ...doc.data() })) as User[];
}