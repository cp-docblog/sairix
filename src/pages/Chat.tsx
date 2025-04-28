import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Contact, Message } from '../types';
import { ContactList } from '../components/ContactList';
import { MessageList } from '../components/MessageList';
import { ArrowLeft } from 'lucide-react';

function Chat() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [interactionNeededContacts, setInteractionNeededContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    fetchContacts();
    fetchInteractionNeededContacts();
    subscribeToMessages();
    subscribeToContacts();
    subscribeToInteractionNeeded();
  }, []);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.wa_id);
    }
  }, [selectedContact]);

  function subscribeToContacts() {
    const channel = supabase.channel('contacts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
        },
        () => {
          fetchContacts();
        }
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to contacts changes');
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }

  async function fetchInteractionNeededContacts() {
    try {
      const { data: interactionData, error: interactionError } = await supabase
        .from('interaction_needed')
        .select('wa_id');

      if (interactionError) {
        console.error('Error fetching interaction needed:', interactionError);
        return;
      }

      const waIds = interactionData.map(item => item.wa_id);

      if (waIds.length > 0) {
        const { data: contactsData, error: contactsError } = await supabase
          .from('contacts')
          .select('*')
          .in('wa_id', waIds);

        if (contactsError) {
          console.error('Error fetching interaction needed contacts:', contactsError);
          return;
        }

        setInteractionNeededContacts(contactsData || []);
      } else {
        setInteractionNeededContacts([]);
      }
    } catch (error) {
      console.error('Error in fetchInteractionNeededContacts:', error);
    }
  }

  function subscribeToInteractionNeeded() {
    const channel = supabase.channel('interaction-needed-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interaction_needed',
        },
        () => {
          fetchInteractionNeededContacts();
        }
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to interaction needed changes');
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }

  async function fetchContacts() {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('from, to, time')
        .order('time', { ascending: false });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return;
      }

      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*');

      if (contactsError) {
        console.error('Error fetching contacts:', contactsError);
        setConnectionError(contactsError.message);
        return;
      }

      const latestMessageTimes = new Map<number, number>();
      messagesData?.forEach(message => {
        const waIds = [message.from, message.to].filter(Boolean) as number[];
        waIds.forEach(waId => {
          const currentLatest = latestMessageTimes.get(waId) || 0;
          const messageTime = new Date(message.time).getTime();
          if (messageTime > currentLatest) {
            latestMessageTimes.set(waId, messageTime);
          }
        });
      });

      const contactsWithTime = contactsData?.map(contact => ({
        ...contact,
        lastMessageTime: latestMessageTimes.get(contact.wa_id) || 0
      })) || [];

      const sortedContacts = contactsWithTime.sort((a, b) => {
        if (a.wa_id === 1) return -1;
        if (b.wa_id === 1) return 1;
        return (b.lastMessageTime || 0) - (a.lastMessageTime || 0);
      });

      setContacts(sortedContacts);
      setConnectionError(null);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setConnectionError('Failed to fetch contacts');
    } finally {
      setIsLoadingContacts(false);
    }
  }

  async function fetchMessages(waId: number) {
    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`from.eq.${waId},to.eq.${waId}`)
        .order('message_id', { ascending: true })
        .order('time', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }

  function subscribeToMessages() {
    const channel = supabase.channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as Message;
            setMessages(prev => {
              if (prev.some(msg => msg.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });

            fetchContacts();
          }
        }
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to messages channel');
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Contact List - Always visible on mobile, hidden when chat is open */}
      <div className={`flex flex-col h-full w-full md:w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${
        selectedContact ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Contacts</h2>
          {connectionError && (
            <p className="text-sm text-red-500 mt-1">{connectionError}</p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          <ContactList
            contacts={contacts}
            interactionNeededContacts={interactionNeededContacts}
            selectedContact={selectedContact}
            onSelectContact={setSelectedContact}
            isLoading={isLoadingContacts}
          />
        </div>
      </div>

      {/* Messages - Full width on mobile when contact is selected */}
      <div className={`flex flex-col flex-1 h-full bg-white dark:bg-gray-800 ${
        selectedContact ? 'flex' : 'hidden md:flex'
      }`}>
        {selectedContact && (
          <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 md:hidden">
            <button
              onClick={() => setSelectedContact(null)}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300"
            >
              <ArrowLeft size={20} />
              <span>Back to Contacts</span>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          <MessageList
            messages={messages}
            contacts={contacts}
            selectedContact={selectedContact}
            isLoading={isLoadingMessages}
          />
        </div>
      </div>
    </div>
  );
}

export default Chat;