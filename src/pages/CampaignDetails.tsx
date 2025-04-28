import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Edit2, X, Check, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface CampaignData {
  id: string;
  name: string;
  contact_info: string;
  message: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  is_ready: boolean;
}

interface ExpandedMessage {
  id: string | null;
  isExpanded: boolean;
}

interface EditingMessage {
  id: string | null;
  message: string;
}

export default function CampaignDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [campaignData, setCampaignData] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedMessage, setExpandedMessage] = useState<ExpandedMessage>({ id: null, isExpanded: false });
  const [editingMessage, setEditingMessage] = useState<EditingMessage>({ id: null, message: '' });

  useEffect(() => {
    if (id) {
      fetchCampaignDetails();
      subscribeToChanges();
    }

    return () => {
      supabase.removeChannel('campaign-data-changes');
    };
  }, [id]);

const subscribeToChanges = () => {
  const channel = supabase
    .channel('campaign-data-changes')
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'campaign_data',
        filter: `campaign_id=eq.${id}`,
      },
      (payload) => {
        const { eventType, new: newData, old: oldData } = payload;

        setCampaignData((prev) => {
          switch (eventType) {
            case 'INSERT':
              return [...prev, newData];

            case 'UPDATE':
              return prev.map((item) =>
                item.id === newData.id ? { ...item, ...newData } : item
              );

            case 'DELETE':
              return prev.filter((item) => item.id !== oldData.id);

            default:
              return prev;
          }
        });
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'campaigns',
        filter: `id=eq.${id}`,
      },
      (payload) => {
        const { eventType, new: newData, old: oldData } = payload;

        if (eventType === 'DELETE') {
          // Optional: handle the case when the campaign itself is deleted
          setCampaign(null);
          setCampaignData([]);
          toast.warning('This campaign was deleted.');
        } else if (newData) {
          // Handles both INSERT (rare for single item) and UPDATE
          setCampaign((prev) => ({ ...prev, ...newData }));
        }
      }
    )
    .subscribe();
};


  const fetchCampaignDetails = async () => {
    try {
      // Fetch campaign details
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (campaignError) throw campaignError;
      setCampaign(campaignData);

      // Fetch campaign data
      const { data: dataRows, error: dataError } = await supabase
        .from('campaign_data')
        .select('*')
        .eq('campaign_id', id);

      if (dataError) throw dataError;
      setCampaignData(dataRows || []);
    } catch (error) {
      console.error('Error fetching campaign details:', error);
      toast.error('Failed to fetch campaign details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!campaign || isProcessing || !campaign.is_ready) return;

    const confirmed = window.confirm(
      'NOTE: You are about to mass send messages to ALL the selected contacts. Are you sure you want to proceed?'
    );

    if (!confirmed) return;

    setIsProcessing(true);
    try {
      const response = await fetch(
        'https://aibackend.cp-devcode.com/webhook/242c1498-c640-45fd-bb59-8d39ee928b15',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ campaign_id: campaign.id }),
        }
      );

      if (!response.ok) throw new Error('Failed to confirm campaign');

      // Update campaign status in database
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ status: 'Confirmed' })
        .eq('id', campaign.id);

      if (updateError) throw updateError;

      toast.success('Campaign confirmed successfully');
      fetchCampaignDetails();
    } catch (error) {
      console.error('Error confirming campaign:', error);
      toast.error('Failed to confirm campaign');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevoke = async () => {
    if (!campaign || isProcessing || !campaign.is_ready) return;

    const confirmed = window.confirm(
      'Warning: You are about to revoke and delete the selected campaign. Are you sure you want to proceed?'
    );

    if (!confirmed) return;

    setIsProcessing(true);
    try {
      const response = await fetch(
        'https://aibackend.cp-devcode.com/webhook/8a4b23ba-f4d6-4307-8f5e-09b1da3ba2df',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ campaign_id: campaign.id }),
        }
      );

      if (!response.ok) throw new Error('Failed to revoke campaign');

      // Update campaign status in database
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ status: 'Revoked' })
        .eq('id', campaign.id);

      if (updateError) throw updateError;

      toast.success('Campaign revoked successfully');
      fetchCampaignDetails();
    } catch (error) {
      console.error('Error revoking campaign:', error);
      toast.error('Failed to revoke campaign');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditMessage = async () => {
    if (!editingMessage.id || !campaign) return;

    try {
      const { error } = await supabase
        .from('campaign_data')
        .update({ message: editingMessage.message })
        .eq('id', editingMessage.id);

      if (error) throw error;

      toast.success('Message updated successfully');
      setEditingMessage({ id: null, message: '' });
    } catch (error) {
      console.error('Error updating message:', error);
      toast.error('Failed to update message');
    }
  };

  const truncateMessage = (message: string, maxLength: number = 100) => {
    if (message.length <= maxLength) return message;
    return `${message.substring(0, maxLength)}...`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Campaign not found</h3>
                <div className="mt-2">
                  <button
                    onClick={() => navigate('/lead-generation/campaigns')}
                    className="text-sm font-medium text-red-800 dark:text-red-200 hover:text-red-600 dark:hover:text-red-300"
                  >
                    Return to campaigns list
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/lead-generation/campaigns')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft size={20} className="text-gray-700 dark:text-gray-200" />
              </button>
              <div className="ml-4">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {campaign.name}
                </h1>
                {campaign.description && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {campaign.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              {!campaign.is_ready && campaign.status === 'Awaiting Confirmation' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Processing campaign...</span>
                </div>
              )}
              {campaign.status !== 'Confirmed' && (
                <button
                  onClick={handleConfirm}
                  disabled={isProcessing || !campaign.is_ready}
                  className={`px-4 py-2 rounded-lg text-white text-center ${
                    isProcessing || !campaign.is_ready
                      ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700'
                  }`}
                >
                  {isProcessing ? 'Processing...' : 'Confirm Campaign'}
                </button>
              )}
              {campaign.status !== 'Revoked' && campaign.status !== 'Confirmed' && (
                <button
                  onClick={handleRevoke}
                  disabled={isProcessing || !campaign.is_ready}
                  className={`px-4 py-2 rounded-lg text-center ${
                    isProcessing || !campaign.is_ready
                      ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                  }`}
                >
                  {isProcessing ? 'Processing...' : 'Revoke Campaign'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Campaign Data Table */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Campaign Data
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              List of contacts and their campaign messages
            </p>
          </div>

          {/* Mobile View */}
          <div className="block sm:hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {campaignData.map((data) => (
                <div key={data.id} className="p-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Name</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{data.name}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Contact Info</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{data.contact_info}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Message</label>
                    {editingMessage.id === data.id ? (
                      <div className="mt-2 flex flex-col gap-2">
                        <textarea
                          value={editingMessage.message}
                          onChange={(e) => setEditingMessage({ ...editingMessage, message: e.target.value })}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={handleEditMessage}
                            className="p-2 text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => setEditingMessage({ id: null, message: '' })}
                            className="p-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1">
                        {expandedMessage.id === data.id && expandedMessage.isExpanded ? (
                          <div>
                            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                              {data.message}
                            </p>
                            <button
                              onClick={() => setExpandedMessage({ id: null, isExpanded: false })}
                              className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                            >
                              Show Less
                            </button>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                              {truncateMessage(data.message)}
                            </p>
                            {data.message.length > 100 && (
                              <button
                                onClick={() => setExpandedMessage({ id: data.id, isExpanded: true })}
                                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                              >
                                Read More
                              </button>
                            )}
                          </div>
                        )}
                        {campaign.status !== 'Confirmed' && (
                          <button
                            onClick={() => setEditingMessage({ id: data.id, message: data.message })}
                            className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {campaignData.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No campaign data available
                </div>
              )}
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Contact Info
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Message
                  </th>
                  {campaign.status !== 'Confirmed' && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {campaignData.map((data) => (
                  <tr key={data.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {data.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {data.contact_info}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {editingMessage.id === data.id ? (
                        <div className="flex items-start gap-2">
                          <textarea
                            value={editingMessage.message}
                            onChange={(e) => setEditingMessage({ ...editingMessage, message: e.target.value })}
                            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                          />
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={handleEditMessage}
                              className="p-1 text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setEditingMessage({ id: null, message: '' })}
                              className="p-1 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {expandedMessage.id === data.id && expandedMessage.isExpanded ? (
                            <div className="relative">
                              <p className="whitespace-pre-wrap">{data.message}</p>
                              <button
                                onClick={() => setExpandedMessage({ id: null, isExpanded: false })}
                                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                              >
                                Show Less
                              </button>
                            </div>
                          ) : (
                            <div>
                              <p className="whitespace-pre-wrap">{truncateMessage(data.message)}</p>
                              {data.message.length > 100 && (
                                <button
                                  onClick={() => setExpandedMessage({ id: data.id, isExpanded: true })}
                                  className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                                >
                                  Read More
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    {campaign.status !== 'Confirmed' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {editingMessage.id !== data.id && (
                          <button
                            onClick={() => setEditingMessage({ id: data.id, message: data.message })}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {campaignData.length === 0 && (
                  <tr>
                    <td
                      colSpan={campaign.status !== 'Confirmed' ? 4 : 3}
                      className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No campaign data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}