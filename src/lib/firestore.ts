import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { getApp } from 'firebase/app'
import { User } from 'firebase/auth'

const db = getFirestore(getApp())

export async function createUserIfNotExists(user: User) {
  if (!user?.uid) return

  const userRef = doc(db, 'users', user.uid)
  const snap = await getDoc(userRef)

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      avatarURL: user.photoURL || '',
      createdAt: serverTimestamp(),
    })
    console.log('✅ User document created in Firestore.')
  } else {
    console.log('👤 User already exists.')
  }
}