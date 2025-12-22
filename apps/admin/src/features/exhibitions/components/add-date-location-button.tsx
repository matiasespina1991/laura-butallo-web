'use client';

import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc } from 'firebase/firestore';
import { useState } from 'react';

export default function AddDateLocationButton() {
  const [status, setStatus] = useState<
    'idle' | 'saving' | 'success' | 'error'
  >('idle');

  const handleAddField = async () => {
    setStatus('saving');
    try {
      const snapshot = await getDocs(collection(db, 'exhibitions'));
      const updates = snapshot.docs.map((docSnap) =>
        updateDoc(docSnap.ref, { dateAndLocation: '' })
      );
      await Promise.all(updates);
      setStatus('success');
    } catch (error) {
      console.error('[Exhibitions] dateAndLocation update error', error);
      setStatus('error');
    }
  };

  return (
    <Button
      variant='outline'
      onClick={handleAddField}
      disabled={status === 'saving'}
    >
      {status === 'saving'
        ? 'Adding dateAndLocation...'
        : 'Add dateAndLocation field'}
    </Button>
  );
}
