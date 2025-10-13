import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { Game, GameInput } from '../types/Game.d';

const COLLECTION_NAME = 'games';

export async function createGame(gameData: GameInput): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...gameData,
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
}

export async function getGame(gameId: string): Promise<Game | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, gameId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Game;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting game:', error);
    throw error;
  }
}

export async function getAllGames(): Promise<Game[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME));
    const querySnapshot = await getDocs(q);
    
    const games = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Game[];
    
    // Sort in memory: first by sortOrder, then by releaseDate descending
    return games.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return b.releaseDate.toMillis() - a.releaseDate.toMillis();
    });
  } catch (error) {
    console.error('Error getting all games:', error);
    throw error;
  }
}

export async function getActiveGames(): Promise<Game[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    
    const games = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Game[];
    
    // Sort in memory: first by sortOrder, then by releaseDate descending
    return games.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return b.releaseDate.toMillis() - a.releaseDate.toMillis();
    });
  } catch (error) {
    console.error('Error getting active games:', error);
    throw error;
  }
}

export async function updateGame(gameId: string, gameData: Partial<GameInput>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, gameId);
    await updateDoc(docRef, {
      ...gameData,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating game:', error);
    throw error;
  }
}

export async function deleteGame(gameId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, gameId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting game:', error);
    throw error;
  }
}