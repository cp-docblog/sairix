import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  date_initiated: string;
  contacts: number | null;
  status: string;
}

export default function CampaignList() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
    subscribeToChanges();

    return () => {
      supabase.removeChannel('campaign-changes');
    };
  }, []);

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('campaign-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns',
        },
        () => {
          fetchCampaigns();
        }
      )
      .subscribe();
  };

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('status', { ascending: false }) // This puts "Awaiting Confirmation" first
        .order('date_initiated', { ascending: false });

      if (error) throw error;

      // Sort campaigns to ensure correct order
      const sortedData = (data || []).sort((a, b) => {
        // Custom sort order: Awaiting Confirmation > Confirmed > Revoked
        const statusOrder = {
          'Awaiting Confirmation': 0,
          'Confirmed': 1,
          'Revoked': 2
        };
        
        const statusCompare = statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
        if (statusCompare !== 0) return statusCompare;
        
        // If status is the same, sort by date (newest first)
        return new Date(b.date_initiated).getTime() - new Date(a.date_initiated).getTime();
      });

      setCampaigns(sortedData);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="py-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/lead-generation')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft size={20} className="text-gray-700 dark:text-gray-200" />
            </button>
            <h1 className="ml-4 text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Campaigns
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <p className="text-lg">No campaigns found</p>
              <p className="text-sm mt-2">Create your first campaign to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date Initiated
                    </th>
                    <th scope="col" className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Contacts
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {campaigns.map((campaign) => (
                    <tr
                      key={campaign.id}
                      onClick={() => navigate(`/lead-generation/campaigns/${campaign.id}`)}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {campaign.name}
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {campaign.description || '-'}
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(campaign.date_initiated), 'MMM d, yyyy h:mm a')}
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {campaign.contacts || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          campaign.status === 'Confirmed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : campaign.status === 'Revoked'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}>
                          {campaign.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}