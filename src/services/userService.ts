import { auth, db, storage } from '../lib/firebase';
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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export type UserProfile = {
  userName?: string;
  age?: string;
  avatarUrl?: string;
  followers?: string[];
  following?: string[];
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

  uploadAvatar: async (userId: string, file: File): Promise<string> => {
    const storageRef = ref(storage, `avatars/${userId}_${Date.now()}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
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
  },

  toggleFollow: async (currentUserId: string, targetUserId: string): Promise<boolean> => {
    if (currentUserId === targetUserId) return false;
    
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);
    
    const [currentSnap, targetSnap] = await Promise.all([
      getDoc(currentUserRef),
      getDoc(targetUserRef)
    ]);
    
    const currentData = currentSnap.data() || {};
    const targetData = targetSnap.data() || {};
    
    const following = currentData.following || [];
    const followers = targetData.followers || [];
    
    const isFollowing = following.includes(targetUserId);
    
    if (isFollowing) {
      await Promise.all([
        updateDoc(currentUserRef, { following: following.filter((id: string) => id !== targetUserId) }),
        updateDoc(targetUserRef, { followers: followers.filter((id: string) => id !== currentUserId) })
      ]);
      return false;
    } else {
      await Promise.all([
        updateDoc(currentUserRef, { following: [...following, targetUserId] }),
        updateDoc(targetUserRef, { followers: [...followers, currentUserId] })
      ]);
      return true;
    }
  },

  getFollowStatus: async (currentUserId: string, targetUserId: string): Promise<boolean> => {
    if (!currentUserId || !targetUserId) return false;
    const currentUserRef = doc(db, 'users', currentUserId);
    const snap = await getDoc(currentUserRef);
    if (!snap.exists()) return false;
    const data = snap.data();
    return (data.following || []).includes(targetUserId);
  }
};
