import React, { useState, useRef } from 'react';
import { Upload, Send, FileSpreadsheet, AlertCircle, ListFilter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

type Platform = 'WhatsApp' | 'Email';

interface Campaign {
  name: string;
  description: string;
  platform: Platform;
  prompt: string;
}

interface FileData {
  fileName: string;
  data: any[];
}

export default function LeadGeneration() {
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign>({
    name: '',
    description: '',
    platform: 'WhatsApp',
    prompt: ''
  });
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        complete: (results) => {
          setFileData({
            fileName: file.name,
            data: results.data
          });
          toast.success('CSV file uploaded successfully');
        },
        header: true,
        error: (error) => {
          console.error('Error parsing CSV:', error);
          toast.error('Failed to parse CSV file');
        }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          setFileData({
            fileName: file.name,
            data: jsonData
          });
          toast.success('Excel file uploaded successfully');
        } catch (error) {
          console.error('Error parsing Excel:', error);
          toast.error('Failed to parse Excel file');
        }
      };
      reader.readAsBinaryString(file);
    } else {
      toast.error('Please upload a CSV or Excel file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fileData) {
      toast.error('Please upload a file first');
      return;
    }

    setIsSending(true);
    try {
      // First, create the campaign in Supabase
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          name: campaign.name,
          description: campaign.description,
          contacts: fileData.data.length,
          status: 'Awaiting Confirmation'
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      try {
        // Send the data to the webhook
        const response = await fetch('https://aibackend.cp-devcode.com/webhook/ea426619-dbd6-42d5-ae85-c84c0a42a23b', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            campaign: {
              id: campaignData.id,
              name: campaign.name,
              description: campaign.description,
              platform: campaign.platform,
              prompt: campaign.prompt
            },
            data: fileData.data
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Reset form
        setCampaign({
          name: '',
          description: '',
          platform: 'WhatsApp',
          prompt: ''
        });
        setFileData(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        // If webhook fails, delete the campaign
        await supabase
          .from('campaigns')
          .delete()
          .eq('id', campaignData.id);
        throw error;
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Lead Generation Campaign
          </h1>
          <button
            onClick={() => navigate('/lead-generation/campaigns')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ListFilter size={16} />
            Campaigns
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Campaign Name
              </label>
              <input
                type="text"
                id="name"
                value={campaign.name}
                onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter campaign name"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                id="description"
                value={campaign.description}
                onChange={(e) => setCampaign({ ...campaign, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter campaign description"
              />
            </div>

            <div>
              <label htmlFor="platform" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Platform
              </label>
              <select
                id="platform"
                value={campaign.platform}
                onChange={(e) => setCampaign({ ...campaign, platform: e.target.value as Platform })}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Email">Email</option>
              </select>
            </div>

            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Prompt
              </label>
              <textarea
                id="prompt"
                value={campaign.prompt}
                onChange={(e) => setCampaign({ ...campaign, prompt: e.target.value })}
                rows={4}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your prompt"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Upload File
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  <div className="flex flex-col items-center">
                    {fileData ? (
                      <>
                        <FileSpreadsheet
                          className="mx-auto h-12 w-12 text-green-500"
                          aria-hidden="true"
                        />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {fileData.fileName}
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload
                          className="mx-auto h-12 w-12 text-gray-400"
                          aria-hidden="true"
                        />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Upload a CSV or Excel file
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        ref={fileInputRef}
                        type="file"
                        className="sr-only"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    CSV, XLSX up to 10MB
                  </p>
                </div>
              </div>
            </div>

            {fileData && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-blue-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      File Preview
                    </h3>
                    <div className="mt-2 text-sm text-blue-700 dark:text-blue-200">
                      <p>{fileData.data.length} records loaded</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSending || !fileData}
                className={`w-full flex justify-center items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white ${
                  isSending || !fileData
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                }`}
              >
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Send Campaign Data</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}