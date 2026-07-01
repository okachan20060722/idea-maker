import { db } from '../lib/firebase';
import { IdeaCondition } from '../types';
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp, 
  updateDoc,
  getDoc,
  where,
  collectionGroup,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';

export type Idea = {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  target: string;
  differentiation: string;
  monetization: string;
  keywords: string[];
  isFavorite?: boolean; // legacy
  favoritedBy?: string[];
  likedBy?: string[];
  likesCount?: number;
  isPublic?: boolean;
  createdAt: any;
  conditionData?: IdeaCondition;
  feasibilityScore?: number;
  feasibilityActionPlan?: string;
  tags?: string[];
  commentsEnabled?: boolean;
};

export interface IdeaComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: any;
}

export const ideaService = {
  saveIdea: async (idea: Omit<Idea, 'id' | 'createdAt' | 'isFavorite'>) => {
    const ideasRef = collection(db, 'users', idea.user_id, 'ideas');
    const docRef = await addDoc(ideasRef, {
      ...idea,
      favoritedBy: [],
      likedBy: [],
      likesCount: 0,
      createdAt: serverTimestamp(),
    });
    return { ...idea, id: docRef.id, favoritedBy: [], likedBy: [], likesCount: 0, createdAt: new Date() };
  },

  getIdeas: async (userId: string) => {
    const ideasRef = collection(db, 'users', userId, 'ideas');
    const q = query(ideasRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
    })) as Idea[];
  },

  deleteIdea: async (id: string, userId: string) => {
    const ideaRef = doc(db, 'users', userId, 'ideas', id);
    await deleteDoc(ideaRef);
  },

  toggleFavorite: async (ideaId: string, ownerId: string, currentUserId: string) => {
    const ideaRef = doc(db, 'users', ownerId, 'ideas', ideaId);
    const ideaSnap = await getDoc(ideaRef);
    if (!ideaSnap.exists()) {
      throw new Error("Idea not found");
    }
    const favoritedBy = ideaSnap.data().favoritedBy || [];
    const isFavorited = favoritedBy.includes(currentUserId);
    
    if (isFavorited) {
      await updateDoc(ideaRef, {
        favoritedBy: arrayRemove(currentUserId)
      });
      return false;
    } else {
      await updateDoc(ideaRef, {
        favoritedBy: arrayUnion(currentUserId)
      });
      return true;
    }
  },

  toggleLike: async (ideaId: string, ownerId: string, currentUserId: string) => {
    const ideaRef = doc(db, 'users', ownerId, 'ideas', ideaId);
    const ideaSnap = await getDoc(ideaRef);
    if (!ideaSnap.exists()) {
      throw new Error("Idea not found");
    }
    const likedBy = ideaSnap.data().likedBy || [];
    const isLiked = likedBy.includes(currentUserId);
    
    if (isLiked) {
      await updateDoc(ideaRef, {
        likedBy: arrayRemove(currentUserId),
        likesCount: increment(-1)
      });
      return false;
    } else {
      await updateDoc(ideaRef, {
        likedBy: arrayUnion(currentUserId),
        likesCount: increment(1)
      });
      return true;
    }
  },

  getFavorites: async (userId: string) => {
    const ideasRef = collectionGroup(db, 'ideas');
    const q = query(ideasRef, where('favoritedBy', 'array-contains', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
    })) as Idea[];
    // Memory sort to avoid index requirements
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  getLikedIdeas: async (userId: string) => {
    const ideasRef = collectionGroup(db, 'ideas');
    const q = query(ideasRef, where('likedBy', 'array-contains', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
    })) as Idea[];
    // Memory sort
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  checkIsFavorite: async (ideaId: string, ownerId: string, currentUserId: string) => {
    const ideaRef = doc(db, 'users', ownerId, 'ideas', ideaId);
    const ideaSnap = await getDoc(ideaRef);
    if (!ideaSnap.exists()) return false;
    const favoritedBy = ideaSnap.data().favoritedBy || [];
    return favoritedBy.includes(currentUserId);
  },

  getPublicIdeas: async () => {
    const ideasRef = collectionGroup(db, 'ideas');
    const q = query(ideasRef, where('isPublic', '==', true));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
    })) as Idea[];
    // Memory sort to avoid requiring a composite index for isPublic + createdAt
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  publishIdea: async (ideaId: string, userId: string, tags: string[], commentsEnabled: boolean) => {
    const ideaRef = doc(db, 'users', userId, 'ideas', ideaId);
    await updateDoc(ideaRef, {
      isPublic: true,
      tags,
      commentsEnabled
    });
    return true;
  },

  unpublishIdea: async (ideaId: string, userId: string) => {
    const ideaRef = doc(db, 'users', userId, 'ideas', ideaId);
    await updateDoc(ideaRef, {
      isPublic: false
    });
    return false;
  },

  getComments: async (ideaId: string, ownerId: string) => {
    const commentsRef = collection(db, 'users', ownerId, 'ideas', ideaId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
    })) as IdeaComment[];
  },

  addComment: async (ideaId: string, ownerId: string, userId: string, userName: string, text: string) => {
    const commentsRef = collection(db, 'users', ownerId, 'ideas', ideaId, 'comments');
    const docRef = await addDoc(commentsRef, {
      userId,
      userName,
      text,
      createdAt: serverTimestamp()
    });
    return {
      id: docRef.id,
      userId,
      userName,
      text,
      createdAt: new Date().toISOString()
    };
  },

  // Local storage methods for non-logged in users
  saveLocalIdea: (idea: Omit<Idea, 'id' | 'createdAt' | 'isFavorite'>) => {
    if (typeof window === 'undefined') return null;
    const localIdeas = ideaService.getLocalIdeas();
    const newIdea: Idea = {
      ...idea,
      id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      favoritedBy: [],
      likedBy: [],
      likesCount: 0,
      createdAt: new Date().toISOString()
    };
    localIdeas.unshift(newIdea); // Add to beginning
    sessionStorage.setItem('guest_ideas', JSON.stringify(localIdeas));
    return newIdea;
  },

  getLocalIdeas: (): Idea[] => {
    if (typeof window === 'undefined') return [];
    const stored = sessionStorage.getItem('guest_ideas');
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch (e) {
      return [];
    }
  },

  deleteLocalIdea: (id: string) => {
    if (typeof window === 'undefined') return;
    const localIdeas = ideaService.getLocalIdeas();
    const filtered = localIdeas.filter(idea => idea.id !== id);
    sessionStorage.setItem('guest_ideas', JSON.stringify(filtered));
  }
};
