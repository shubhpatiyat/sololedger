import { useState, useCallback } from 'react';
import { openDB } from 'idb';

const DB_NAME = 'ozoo_audioDB';
const STORE_NAME = 'audios';
const MAX_AUDIO_COUNT = 50;

const getDB = async () => {
  return await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};

const saveAudio = async (key: string, blob: Blob) => {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const allKeys = await store.getAllKeys();

  if (allKeys.length >= MAX_AUDIO_COUNT && !allKeys.includes(key)) {
    const [oldestKey] = allKeys;
    await store.delete(oldestKey);
  }

  await store.put({ blob, timestamp: Date.now() }, key);
  await tx.done;
};

const getAudio = async (key: string): Promise<Blob | null> => {
  const db = await getDB();
  const result = await db.get(STORE_NAME, key);

  if (result) {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.objectStore(STORE_NAME).put({ blob: result.blob, timestamp: Date.now() }, key);
    await tx.done;
    return result.blob;
  }

  return null;
};

const hasAudio = async (key: string): Promise<boolean> => {
  const db = await getDB();
  const result = await db.get(STORE_NAME, key);
  return !!result;
};

let currentConversationId: string | null = null;

export const stopAudioOnConversationChange = (newConversationId: string) => {
  if (currentConversationId !== null && currentConversationId !== newConversationId) {
    // Stop all audio elements
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.pause();
      audio.src = '';
      audio.load();
    });
  }
  currentConversationId = newConversationId;
};

export const useAudio = () => {
  const [isLoadingAudio, setIsLoadingAudio] = useState<Record<string, boolean>>({});
  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({});
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      currentAudio.load();
      setCurrentAudio(null);
    }
    setIsPlaying({});
    setIsLoadingAudio({});
  }, [currentAudio]);

  const handleAudio = useCallback(async (messageId: string) => {
    if (isPlaying[messageId]) {
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
      }
      setIsPlaying(prev => ({ ...prev, [messageId]: false }));
      return;
    }

    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
    setIsPlaying({});
    setIsLoadingAudio(prev => ({ ...prev, [messageId]: true }));
    
    try {
      const audioKey = `audio_${messageId}`;
      
      // Check cache first
      if (await hasAudio(audioKey)) {
        const audioBlob = await getAudio(audioKey);
        if (!audioBlob) {
          throw new Error('Cached audio blob is null');
        }
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        setCurrentAudio(audio);
        
        audio.onplay = () => {
          setIsLoadingAudio(prev => ({ ...prev, [messageId]: false }));
          setIsPlaying(prev => ({ ...prev, [messageId]: true }));
        };
        
        audio.onended = () => {
          setIsPlaying(prev => ({ ...prev, [messageId]: false }));
          setCurrentAudio(null);
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.onerror = () => {
          setIsLoadingAudio(prev => ({ ...prev, [messageId]: false }));
          setIsPlaying(prev => ({ ...prev, [messageId]: false }));
          setCurrentAudio(null);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
        return;
      }
      
      // Use Audio element directly
      const audioUrl = `${import.meta.env.VITE_API_URL}/chat/aloud/${messageId}/`;
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);
      
      audio.oncanplay = () => {
        setIsLoadingAudio(prev => ({ ...prev, [messageId]: false }));
      };
      
      audio.onplay = () => {
        setIsPlaying(prev => ({ ...prev, [messageId]: true }));
      };
      
      audio.onended = () => {
        setIsPlaying(prev => ({ ...prev, [messageId]: false }));
        setCurrentAudio(null);
      };
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsLoadingAudio(prev => ({ ...prev, [messageId]: false }));
        setIsPlaying(prev => ({ ...prev, [messageId]: false }));
        setCurrentAudio(null);
      };
      
      await audio.play();
      
      // Cache audio in background
      fetch(audioUrl)
        .then(res => res.blob())
        .then(blob => saveAudio(audioKey, blob))
        .catch(e => console.error('Failed to cache audio:', e));

        
    } catch (error) {
      console.error('Handle audio error:', error);
      setIsLoadingAudio(prev => ({ ...prev, [messageId]: false }));
    }
  }, [isPlaying, currentAudio]);

  const stopAudioOnChange = useCallback((conversationId: string) => {
    stopAudioOnConversationChange(conversationId);
  }, []);

  return {
    isLoadingAudio,
    isPlaying,
    handleAudio,
    stopAudio,
    stopAudioOnChange
  };
};