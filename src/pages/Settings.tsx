import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, LogOut, Key, UserPlus, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CompanyInfo, InfoType, Product, ProductAvailability } from '../types';
import { ThemeToggle } from '../components/ThemeToggle';
import toast from 'react-hot-toast';

interface InfoField {
  id?: number;
  type: InfoType;
  name: string;
  data: string;
  isNew?: boolean;
}

interface ProductField {
  id?: number;
  name: string;
  price: number;
  description: string;
  details: string;
  sku: string;
  availability: ProductAvailability;
  quantity?: number;
  isNew?: boolean;
  isModified?: boolean;
}

interface User {
  id: string;
  email: string;
  created_at: string;
}

type Tab = 'company' | 'products' | 'account';

const infoTypes: InfoType[] = ['Phone Number', 'Email', 'URL', 'Location', 'Other'];
const availabilityOptions: ProductAvailability[] = ['Available', 'Sold Out', 'Out of Stock', 'Coming Soon', 'Limited'];

function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('company');
  const [fields, setFields] = useState<InfoField[]>([]);
  const [products, setProducts] = useState<ProductField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState<number | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'company') {
      fetchCompanyInfo();
    } else if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'account') {
      fetchUsers();
    }
    fetchUserEmail();
  }, [activeTab]);

  const formatNumberWithCommas = (value: number | string): string => {
    if (!value && value !== 0) return '';
    const numStr = typeof value === 'number' ? value.toString() : value;
    const parts = numStr.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const parseFormattedNumber = (value: string): number => {
    if (!value) return 0;
    return parseFloat(value.replace(/,/g, ''));
  };

  const fetchUserEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      setUserEmail(user.email);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      const formattedProducts = data.map(product => ({
        ...product,
        isNew: false,
        isModified: false
      }));

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'list' }),
      });

      if (!response.ok) throw new Error('Failed to fetch users');
      const users = await response.json();
      setUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword) return;

    setIsAddingUser(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          email: newUserEmail,
          password: newUserPassword,
        }),
      });

      if (!response.ok) throw new Error('Failed to create user');
      
      toast.success('User created successfully');
      setNewUserEmail('');
      setNewUserPassword('');
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (isDeletingUser) return;

    setIsDeletingUser(userId);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          userId,
        }),
      });

      if (!response.ok) throw new Error('Failed to delete user');
      
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setIsDeletingUser(null);
    }
  };

  const fetchCompanyInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('company_info')
        .select('*');

      if (error) {
        console.error('Error fetching company info:', error);
        return;
      }

      const formattedFields = (data || []).map((info: CompanyInfo) => ({
        id: info.id,
        type: info.type as InfoType,
        name: info.name,
        data: info.data,
        isNew: false
      }));

      setFields(formattedFields);
    } catch (error) {
      console.error('Error fetching company info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addField = () => {
    if (activeTab === 'company') {
      setFields([...fields, { type: 'Other', name: '', data: '', isNew: true }]);
    } else if (activeTab === 'products') {
      setProducts([...products, {
        name: '',
        price: 0,
        description: '',
        details: '',
        sku: '',
        availability: 'Available',
        isNew: true,
        isModified: false
      }]);
    }
  };

  const removeField = async (index: number) => {
    if (activeTab === 'company') {
      const field = fields[index];
      if (!field.id) {
        setFields(fields.filter((_, i) => i !== index));
        return;
      }

      setIsRemoving(field.id);
      try {
        const response = await fetch('https://aibackend.cp-devcode.com/webhook/0de379a6-8f68-46cc-a8aa-1dec20a66800', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: field.id,
            type: field.type,
            name: field.name,
            data: field.data
          }),
        });

        if (!response.ok) throw new Error('Failed to remove field');
        await response.text();
        toast.success('Removed Successfully');
        setFields(fields.filter((_, i) => i !== index));
      } catch (error) {
        console.error('Error removing field:', error);
        toast.error('Failed to remove field. Please try again.');
      } finally {
        setIsRemoving(null);
      }
    } else if (activeTab === 'products') {
      const product = products[index];
      if (!product.id) {
        setProducts(products.filter((_, i) => i !== index));
        return;
      }

      setIsRemoving(product.id);
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', product.id);

        if (error) throw error;
        setProducts(products.filter((_, i) => i !== index));
        toast.success('Product removed successfully');
      } catch (error) {
        console.error('Error removing product:', error);
        toast.error('Failed to remove product. Please try again.');
      } finally {
        setIsRemoving(null);
      }
    }
  };

  const updateField = (index: number, field: Partial<InfoField | ProductField>) => {
    if (activeTab === 'company') {
      setFields(fields.map((f, i) => i === index ? { ...f, ...field } : f));
    } else if (activeTab === 'products') {
      setProducts(products.map((p, i) => i === index ? { ...p, ...field, isModified: !p.isNew } : p));
    }
  };

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      if (activeTab === 'company') {
        const newFields = fields.filter(field => field.isNew);
        if (newFields.length === 0) return;

        const response = await fetch('https://aibackend.cp-devcode.com/webhook/e63336a8-a27f-43da-9074-d2bdb11935af', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newFields),
        });

        if (!response.ok) throw new Error('Failed to save company info');
        await response.text();
        toast.success('Company info saved successfully! 🎉');
      } else if (activeTab === 'products') {
        const newProducts = products.filter(product => product.isNew);
        const modifiedProducts = products.filter(product => !product.isNew && product.isModified);

        if (newProducts.length > 0) {
          const { error: insertError } = await supabase
            .from('products')
            .insert(newProducts.map(({ isNew, isModified, ...product }) => product));

          if (insertError) throw insertError;
        }

        if (modifiedProducts.length > 0) {
          for (const product of modifiedProducts) {
            const { error: updateError } = await supabase
              .from('products')
              .update({ ...product, isNew: undefined, isModified: undefined })
              .eq('id', product.id);

            if (updateError) throw updateError;
          }
        }

        toast.success('Products saved successfully');
        fetchProducts();
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(`Failed to save ${activeTab === 'company' ? 'company info' : 'products'}. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleResetPassword = async () => {
    setIsResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      toast.success('Password reset email sent. Please check your inbox.');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to send reset password email. Please try again.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const renderProductFields = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {products.map((product, index) => (
          <div key={index} className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {product.isNew ? 'New Product' : product.name || 'Unnamed Product'}
              </h3>
              <button
                onClick={() => removeField(index)}
                disabled={isRemoving === product.id}
                className={`p-2 ${
                  isRemoving === product.id
                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400'
                }`}
              >
                {isRemoving === product.id ? (
                  <div className="animate-spin h-5 w-5 border-2 border-red-500 rounded-full border-t-transparent" />
                ) : (
                  <Trash2 size={20} />
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={product.name}
                  onChange={(e) => updateField(index, { name: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price
                </label>
                <input
                  type="text"
                  value={product.price ? formatNumberWithCommas(product.price) : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d.,]/g, '');
                    updateField(index, { price: parseFormattedNumber(value) });
                  }}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter price"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={product.description}
                  onChange={(e) => updateField(index, { description: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Product description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Details
                </label>
                <textarea
                  value={product.details}
                  onChange={(e) => updateField(index, { details: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Product details"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  value={product.sku}
                  onChange={(e) => updateField(index, { sku: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="SKU"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Availability
                  </label>
                  <select
                    value={product.availability}
                    onChange={(e) => {
                      const newAvailability = e.target.value as ProductAvailability;
                      updateField(index, {
                        availability: newAvailability,
                        quantity: newAvailability === 'Limited' ? (product.quantity || 0) : undefined
                      });
                    }}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availabilityOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                {product.availability === 'Limited' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantity
                    </label>
                    <input
                      type="text"
                      value={product.quantity ? formatNumberWithCommas(product.quantity) : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d,]/g, '');
                        updateField(index, { quantity: parseFormattedNumber(value) });
                      }}
                      className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter quantity"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-between items-center pt-4">
          <button
            onClick={addField}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
          >
            <Plus size={16} />
            Add Product
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving || (!products.some(p => p.isNew) && !products.some(p => p.isModified))}
            className={`px-4 py-2 rounded-lg text-white font-medium ${
              isSaving || (!products.some(p => p.isNew) && !products.some(p => p.isModified))
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
            }`}
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                <span>Saving...</span>
              </div>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft size={24} className="text-gray-700 dark:text-gray-200" />
              </button>
              <h1 className="ml-4 text-xl font-semibold text-gray-900 dark:text-gray-100">Settings</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('company')}
              className={`${
                activeTab === 'company'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
            >
              Company Details
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`${
                activeTab === 'products'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`${
                activeTab === 'account'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium`}
            >
              Account
            </button>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {activeTab === 'company' && (
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">Company Details</h2>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {field.isNew ? (
                          <>
                            <select
                              value={field.type}
                              onChange={(e) => updateField(index, { type: e.target.value as InfoType })}
                              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {infoTypes.map((type) => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={field.name}
                              onChange={(e) => updateField(index, { name: e.target.value })}
                              placeholder="Name"
                              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              value={field.data}
                              onChange={(e) => updateField(index, { data: e.target.value })}
                              placeholder="Data"
                              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </>
                        ) : (
                          <>
                            <div className="block w-full rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100">
                              {field.type}
                            </div>
                            <div className="block w-full rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100">
                              {field.name}
                            </div>
                            <div className="block w-full rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100">
                              {field.data}
                            </div>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => removeField(index)}
                        disabled={isRemoving === field.id}
                        className={`p-2 ${
                          isRemoving === field.id
                            ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                            : 'text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400'
                        }`}
                      >
                        {isRemoving === field.id ? (
                          <div className="animate-spin h-5 w-5 border-2 border-red-500 rounded-full border-t-transparent" />
                        ) : (
                          <Trash2 size={20} />
                        )}
                      </button>
                    </div>
                  ))}

                  <div className="flex justify-between items-center pt-4">
                    <button
                      onClick={addField}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                    >
                      <Plus size={16} />
                      Add Field
                    </button>
                    
                    <button
                      onClick={handleSave}
                      disabled={isSaving || !fields.some(f => f.isNew)}
                      className={`px-4 py-2 rounded-lg text-white font-medium ${
                        isSaving || !fields.some(f => f.isNew)
                          ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                          : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                      }`}
                    >
                      {isSaving ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                          <span>Saving...</span>
                        </div>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">Products</h2>
              {renderProductFields()}
            </div>
          )}

          {activeTab === 'account' && (
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">Account Settings</h2>
              
              <div className="space-y-8">
                {/* Current User Section */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{userEmail}</p>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={handleResetPassword}
                      disabled={isResettingPassword}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {isResettingPassword ? (
                        <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent" />
                      ) : (
                        <Key size={16} />
                      )}
                      Reset Password
                    </button>

                    <button
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      {isSigningOut ? (
                        <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent" />
                      ) : (
                        <LogOut size={16} />
                      )}
                      Sign Out
                    </button>
                  </div>
                </div>

                {/* User Management Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">User Management</h3>
                  
                  {/* Add New User Form */}
                  <form onSubmit={handleAddUser} className="space-y-4 mb-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Password
                      </label>
                      <input
                        type="password"
                        id="password"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isAddingUser}
                      className="flex items-center gap-2 w-full justify-center px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      {isAddingUser ? (
                        <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
                      ) : (
                        <UserPlus size={16} />
                      )}
                      Add User
                    </button>
                  </form>

                  {/* Users List */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Users size={20} />
                      <h4 className="font-medium">Users</h4>
                    </div>

                    {isLoadingUsers ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin h-6 w-6 border-2 border-gray-900 dark:border-gray-100 rounded-full border-t-transparent" />
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((user) => (
                          <div key={user.id} className="py-4 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.email}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Added {new Date(user.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={isDeletingUser === user.id || user.email === userEmail}
                              className={`p-2 rounded-lg ${
                                user.email === userEmail
                                  ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                  : 'text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                              }`}
                            >
                              {isDeletingUser === user.id ? (
                                <div className="animate-spin h-5 w-5 border-2 border-red-500 rounded-full border-t-transparent" />
                              ) : (
                                <Trash2 size={20} />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;