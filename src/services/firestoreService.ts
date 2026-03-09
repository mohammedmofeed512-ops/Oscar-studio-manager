import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";

export const firestoreService = {
  // Generic collection operations
  async getAll(collectionName: string) {
    if (!db) return [];
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.error(`Error getting all from ${collectionName}:`, e);
      return [];
    }
  },

  async getById(collectionName: string, id: string) {
    if (!db) return null;
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
    } catch (e) {
      console.error(`Error getting doc ${id} from ${collectionName}:`, e);
    }
    return null;
  },

  async add(collectionName: string, data: any) {
    if (!db) return null;
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        created_at: Timestamp.now()
      });
      return docRef.id;
    } catch (e) {
      console.error(`Error adding to ${collectionName}:`, e);
      return null;
    }
  },

  async update(collectionName: string, id: string, data: any) {
    if (!db) return;
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updated_at: Timestamp.now()
      });
    } catch (e) {
      console.error(`Error updating doc ${id} in ${collectionName}:`, e);
    }
  },

  async delete(collectionName: string, id: string) {
    if (!db) return;
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (e) {
      console.error(`Error deleting doc ${id} from ${collectionName}:`, e);
    }
  },

  // Sub-collection operations
  async getSubAll(parentCollection: string, parentId: string, subCollection: string) {
    if (!db) return [];
    try {
      const q = query(collection(db, parentCollection, parentId, subCollection));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.error(`Error getting sub-collection ${subCollection} from ${parentCollection}/${parentId}:`, e);
      return [];
    }
  },

  async addSub(parentCollection: string, parentId: string, subCollection: string, data: any) {
    if (!db) return null;
    try {
      const docRef = await addDoc(collection(db, parentCollection, parentId, subCollection), {
        ...data,
        created_at: Timestamp.now()
      });
      return docRef.id;
    } catch (e) {
      console.error(`Error adding to sub-collection ${subCollection} in ${parentCollection}/${parentId}:`, e);
      return null;
    }
  },

  async updateSub(parentCollection: string, parentId: string, subCollection: string, id: string, data: any) {
    if (!db) return;
    try {
      const docRef = doc(db, parentCollection, parentId, subCollection, id);
      await updateDoc(docRef, {
        ...data,
        updated_at: Timestamp.now()
      });
    } catch (e) {
      console.error(`Error updating sub-doc ${id} in ${parentCollection}/${parentId}/${subCollection}:`, e);
    }
  },

  async deleteSub(parentCollection: string, parentId: string, subCollection: string, id: string) {
    if (!db) return;
    try {
      const docRef = doc(db, parentCollection, parentId, subCollection, id);
      await deleteDoc(docRef);
    } catch (e) {
      console.error(`Error deleting sub-doc ${id} from ${parentCollection}/${parentId}/${subCollection}:`, e);
    }
  },

  // Real-time listener
  subscribe(collectionName: string, callback: (data: any[]) => void) {
    if (!db) {
      callback([]);
      return () => {};
    }
    try {
      const q = query(collection(db, collectionName));
      return onSnapshot(q, (querySnapshot) => {
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(items);
      }, (error) => {
        console.error(`Subscription error for ${collectionName}:`, error);
        callback([]);
      });
    } catch (e) {
      console.error(`Error setting up subscription for ${collectionName}:`, e);
      callback([]);
      return () => {};
    }
  }
};
