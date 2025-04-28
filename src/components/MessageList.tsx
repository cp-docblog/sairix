import React, { useRef, useEffect, useState } from 'react';
import { Contact, Message } from '../types';
import { MessageSquare, Send, ArrowDown, Image as ImageIcon, X, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import mime from 'mime-types';

interface MessageListProps {
  messages: Message[];
  contacts: Contact[];
  selectedContact: Contact | null;
  isLoading: boolean;
}

export function MessageList({ messages, contacts, selectedContact, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedContact || (!newMessage.trim() && !selectedFile)) return;

    setIsSending(true);
    try {
      let formData = new FormData();
      formData.append('to', selectedContact.wa_id.toString());
      
      if (newMessage.trim()) {
        formData.append('message', newMessage.trim());
      }

      if (selectedFile) {
        formData.append('file', selectedFile);
        const mimeType = mime.lookup(selectedFile.name) || 'application/octet-stream';
        formData.append('mime_type', mimeType);
        formData.append('filename', selectedFile.name);
      }

      const response = await fetch('https://aibackend.cp-devcode.com/webhook/b12877ca-da3d-4431-ba3c-280b9fc7d3aa', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setNewMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMedia = (message: Message) => {
    if (!message.media_url) return null;

    switch (message.media_type) {
      case 'image':
        return (
          <img
            src={message.media_url}
            alt="Message attachment"
            className="max-w-full rounded-lg mb-2"
            loading="lazy"
          />
        );
      case 'video':
        return (
          <video
            src={message.media_url}
            controls
            className="max-w-full rounded-lg mb-2"
          />
        );
      case 'audio':
        return (
          <audio
            src={message.media_url}
            controls
            className="max-w-full mb-2"
          />
        );
      case 'document':
        return (
          <a
            href={message.media_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-500 hover:text-blue-600 mb-2"
          >
            <Paperclip size={16} />
            <span>Download attachment</span>
          </a>
        );
      default:
        return null;
    }
  };

  if (!selectedContact) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <MessageSquare size={48} />
        <p className="mt-2">Select a contact to view messages</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  const messageGroups = messages.reduce((groups, message) => {
    const group = groups.get(message.message_id) || [];
    group.push(message);
    groups.set(message.message_id, group);
    return groups;
  }, new Map<number, Message[]>());

  const sortedGroups = Array.from(messageGroups.entries()).sort(([, groupA], [, groupB]) => {
    const timeA = Math.min(...groupA.map(m => new Date(m.time || 0).getTime()));
    const timeB = Math.min(...groupB.map(m => new Date(m.time || 0).getTime()));
    return timeA - timeB;
  });

  return (
    <div className="flex flex-col h-full">
      <div ref={containerRef} className="flex-1 overflow-y-auto relative">
        <div className="space-y-4 p-4">
          {sortedGroups.map(([messageId, groupMessages]) => {
            const sortedGroupMessages = groupMessages.sort((a, b) => {
              const timeA = new Date(a.time || 0).getTime();
              const timeB = new Date(b.time || 0).getTime();
              return timeB - timeA;
            });

            return (
              <div key={messageId} className="space-y-2">
                {sortedGroupMessages.map((message) => {
                  const isFromSelectedContact = message.from === selectedContact.wa_id;
                  const sender = contacts.find(c => c.wa_id === message.from);

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isFromSelectedContact ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                          isFromSelectedContact 
                            ? 'bg-gray-100 dark:bg-gray-700 rounded-tl-none' 
                            : 'bg-blue-500 dark:bg-blue-600 rounded-tr-none'
                        }`}
                      >
                        <div className={`text-sm font-medium mb-1 ${
                          isFromSelectedContact 
                            ? 'text-gray-900 dark:text-gray-100' 
                            : 'text-white'
                        }`}>
                          {sender?.name || 'Unknown'}
                        </div>
                        {renderMedia(message)}
                        {message.body && (
                          <p className={`break-words ${
                            isFromSelectedContact 
                              ? 'text-gray-800 dark:text-gray-200' 
                              : 'text-white'
                          }`}>
                            {message.body}
                          </p>
                        )}
                        <div className={`text-xs mt-1 ${
                          isFromSelectedContact 
                            ? 'text-gray-500 dark:text-gray-400' 
                            : 'text-blue-100'
                        }`}>
                          {message.time ? format(new Date(message.time), 'MMM d, yyyy h:mm a') : 'No time'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-24 right-4 p-2 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-colors"
          >
            <ArrowDown size={20} />
          </button>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {selectedContact.wa_id !== 1 && (
        <div className="sticky bottom-0 border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <div className="flex flex-col gap-2 max-w-3xl mx-auto">
            {selectedFile && (
              <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-300 truncate flex-1">
                  {selectedFile.name}
                </span>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                >
                  <X size={16} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Attach file"
              >
                <ImageIcon size={20} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
                className="hidden"
              />
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 min-h-[40px] max-h-[120px] px-4 py-2 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y placeholder-gray-500 dark:placeholder-gray-400"
                disabled={isSending}
              />
              <button
                onClick={handleSendMessage}
                disabled={(!newMessage.trim() && !selectedFile) || isSending}
                className={`p-3 rounded-full transition-colors ${
                  (!newMessage.trim() && !selectedFile) || isSending
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700'
                }`}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}