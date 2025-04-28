import React, { useState } from 'react';
import { Contact } from '../types';
import { Users, Check } from 'lucide-react';
import { ActivationToggle } from './ActivationToggle';
import toast from 'react-hot-toast';

interface ContactListProps {
  contacts: Contact[];
  interactionNeededContacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  isLoading: boolean;
}

export function ContactList({ contacts, interactionNeededContacts, selectedContact, onSelectContact, isLoading }: ContactListProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'interaction'>('all');
  const [processingContact, setProcessingContact] = useState<number | null>(null);
  
  const displayContacts = activeTab === 'all' ? contacts : interactionNeededContacts;

  const handleDone = async (contact: Contact) => {
    const confirmed = window.confirm(
      "The contact will be removed from the 'Interaction Needed' list and the AI will be activated for the selected contact"
    );

    if (!confirmed) return;

    setProcessingContact(contact.wa_id);
    try {
      const response = await fetch(
        'https://aibackend.cp-devcode.com/webhook/2e01e095-3597-4fdd-aad4-b2bb841ef859',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ wa_id: contact.wa_id }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to process contact');
      }

      toast.success('Contact processed successfully');
    } catch (error) {
      console.error('Error processing contact:', error);
      toast.error('Failed to process contact. Please try again.');
    } finally {
      setProcessingContact(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 ${
            activeTab === 'all'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          All Contacts
        </button>
        <button
          onClick={() => setActiveTab('interaction')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 ${
            activeTab === 'interaction'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Interaction Needed
          {interactionNeededContacts.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full">
              {interactionNeededContacts.length}
            </span>
          )}
        </button>
      </div>

      {/* Contact List */}
      {displayContacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-4">
          <Users size={48} />
          <p className="mt-2">{activeTab === 'all' ? 'No contacts found' : 'No contacts need interaction'}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {activeTab === 'all' ? 'Check the database connection' : 'All contacts are up to date'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700 overflow-y-auto">
          {displayContacts.map((contact) => (
            <div
              key={contact.id}
              className={`p-4 transition-colors ${
                selectedContact?.id === contact.id 
                  ? 'bg-blue-50 dark:bg-blue-900/20' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => onSelectContact(contact)}
                  className="flex-1 text-left"
                >
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{contact.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">ID: {contact.wa_id}</p>
                </button>
                <div className="flex items-center gap-2">
                  {activeTab === 'interaction' && (
                    <button
                      onClick={() => handleDone(contact)}
                      disabled={processingContact === contact.wa_id}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg ${
                        processingContact === contact.wa_id
                          ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
                          : 'bg-green-500 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700'
                      }`}
                    >
                      {processingContact === contact.wa_id ? (
                        <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent" />
                      ) : (
                        <Check size={16} />
                      )}
                      <span className="text-sm font-medium">Done</span>
                    </button>
                  )}
                  <ActivationToggle 
                    contactId={contact.id}
                    waId={contact.wa_id}
                    onToggle={(isActive) => {
                      console.log(`Contact ${contact.id} activation: ${isActive}`);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}