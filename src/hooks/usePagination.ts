import { useState, useCallback } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  startAfter, 
  QueryDocumentSnapshot,
  DocumentData,
  where,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../services/firebase';

export function usePagination<T>(collectionName: string, itemsPerPage: number = 10, defaultOrderBy: string = 'createdAt') {
  const [items, setItems] = useState<T[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchItems = useCallback(async (isNext: boolean = false, constraints: QueryConstraint[] = []) => {
    setLoading(true);
    try {
      let q = query(
        collection(db, collectionName),
        orderBy(defaultOrderBy, 'desc'),
        ...constraints,
        limit(itemsPerPage)
      );

      if (isNext && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const newItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));

      if (isNext) {
        setItems(prev => [...prev, ...newItems]);
      } else {
        setItems(newItems);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === itemsPerPage);
    } catch (error) {
      console.error(`Erro ao buscar ${collectionName}:`, error);
    } finally {
      setLoading(false);
    }
  }, [collectionName, itemsPerPage, defaultOrderBy, lastDoc]);

  const reset = useCallback(() => {
    setItems([]);
    setLastDoc(null);
    setHasMore(true);
  }, []);

  return { items, loading, hasMore, fetchItems, reset };
}
