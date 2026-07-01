import { auth, db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  getDocs,
  query
} from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';

export type UserProfile = {
  userName?: string;
  age?: string;
};

export const userService = {
  getUserProfile: async (userId: string): Promise<UserProfile | null> => {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  },

  updateUserProfile: async (userId: string, data: UserProfile) => {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      await updateDoc(userRef, data);
    } else {
      await setDoc(userRef, data);
    }
  },

  deleteUserAccount: async (userId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      throw new Error("No authenticated user or user ID mismatch");
    }

    try {
      // 1. Delete all user ideas
      const ideasRef = collection(db, 'users', userId, 'ideas');
      const ideasSnap = await getDocs(query(ideasRef));
      const deletePromises = ideasSnap.docs.map(ideaDoc => deleteDoc(ideaDoc.ref));
      await Promise.all(deletePromises);

      // 2. Delete user profile
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);

      // 3. Delete Firebase Auth user
      await deleteUser(currentUser);
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        throw new Error("再ログインが必要です。セキュリティのため、一度ログアウトして再度ログインしてから退会処理を行ってください。");
      }
      throw error;
    }
  }
};
