import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AuthUser } from '../types';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [formData, setFormData] = useState<AuthUser>({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        throw error;
      }

      navigate('/');
    } catch (error) {
      console.error('Error logging in:', error);
      toast.error('Failed to log in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      toast.success('Password reset email sent. Please check your inbox.');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to send reset password email. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-gray-100">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isResetting}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
            >
              {isResetting ? 'Sending reset email...' : 'Forgot your password?'}
            </button>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading
                  ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}