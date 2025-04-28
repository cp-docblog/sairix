import React, { useState, useEffect } from 'react';
import { Power } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ActivationToggleProps {
  contactId: number;
  waId: number;
  onToggle: (isActive: boolean) => void;
}

export function ActivationToggle({ contactId, waId, onToggle }: ActivationToggleProps) {
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
  checkInactiveStatus();

  const unsubscribe = subscribeToInactiveChanges();

  return () => {
    unsubscribe(); // clean up when waId changes or component unmounts
  };
}, [waId]);

const subscribeToInactiveChanges = () => {
  const channel = supabase.channel(`inactive-${waId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // listen to INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'inactive',
      },
      (payload) => {
        const affectedWaId = payload.new?.wa_id || payload.old?.wa_id;

        if (affectedWaId === waId) {
          // If it's a DELETE event, the `new` field will be null
          // If it's an INSERT/UPDATE event, we can use `new.wa_id`
          checkInactiveStatus();
        }
      }
    )
    .subscribe(status => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscribed to inactive changes for wa_id ${waId}`);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
};
  
  const checkInactiveStatus = async () => {
    try {
      const { data } = await supabase
        .from('inactive')
        .select('wa_id')
        .eq('wa_id', waId)
        .single();
      
      setIsActive(!data);
    } catch (error) {
      console.error('Error checking inactive status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    if (isToggling) return;

    const newState = !isActive;
    setIsToggling(true);
    
    const url = newState 
      ? 'https://aibackend.cp-devcode.com/webhook/7a876b81-2c0f-4d66-a5e5-25f0eb801d29'
      : 'https://aibackend.cp-devcode.com/webhook/68fc20d5-4106-4af6-b621-34cdadd9ccd1';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId,
          waId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Wait for the response before updating the state
      await response.text();
      
      setIsActive(newState);
      onToggle(newState);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return (
      <button className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700">
        <div className="animate-spin h-4 w-4 border-2 border-gray-500 dark:border-gray-400 rounded-full border-t-transparent"></div>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isToggling}
      className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors ${
        isActive 
          ? 'bg-green-500 text-white hover:bg-green-600' 
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
      } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isToggling ? (
        <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent" />
      ) : (
        <Power size={16} className={isActive ? 'text-white' : ''} />
      )}
      <span className="text-sm font-medium">{isActive ? 'Active' : 'Inactive'}</span>
    </button>
  );
}