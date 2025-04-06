import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { Button, Card, Input, ErrorMessage } from '../components/ui';
import { updateProfile, loadUserProfile } from '../store/auth.slice';
import { User } from '../store/types';

const ProfilePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load user data into form when component mounts or user changes
  useEffect(() => {
    if (user) {
      setFormData(prevState => ({
        ...prevState,
        username: user.username || '',
        email: user.email || '',
        full_name: user.full_name || ''
      }));
    }
  }, [user]);

  // Load user profile when component mounts
  useEffect(() => {
    if (!user?.id) {
      dispatch(loadUserProfile());
    }
  }, [dispatch, user?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const resetForm = () => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        full_name: user.full_name || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    }
    setChangePassword(false);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    resetForm();
    setIsEditing(false);
  };

  const validateForm = () => {
    if (!formData.email || !formData.username) {
      setError('Email and username are required');
      return false;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    if (changePassword) {
      if (!formData.current_password) {
        setError('Current password is required to change password');
        return false;
      }

      if (formData.new_password.length < 6) {
        setError('New password must be at least 6 characters long');
        return false;
      }

      if (formData.new_password !== formData.confirm_password) {
        setError('Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Prepare update data
      const updateData: Partial<User & {
        current_password?: string;
        new_password?: string;
      }> = {
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name || undefined
      };

      // Add password change data if requested
      if (changePassword) {
        updateData.current_password = formData.current_password;
        updateData.new_password = formData.new_password;
      }

      // Update profile
      await dispatch(updateProfile(updateData)).unwrap();

      setSuccess('Profile updated successfully');
      setIsEditing(false);
      setChangePassword(false);
      formData.current_password = '';
      formData.new_password = '';
      formData.confirm_password = '';
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !user) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Your Profile</h1>

      <Card className="mb-6">
        <div className="p-1">
          {!isEditing ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-700">Personal Information</h2>
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Username</h3>
                  <p className="text-gray-800">{user?.username}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                  <p className="text-gray-800">{user?.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Full Name</h3>
                  <p className="text-gray-800">{user?.full_name || '-'}</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-700">Edit Profile</h2>
              </div>

              {error && <ErrorMessage message={error} />}
              {success && (
                <div className="mb-4 bg-green-50 p-4 rounded-md">
                  <p className="text-green-700 text-sm">{success}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Input
                  label="Username"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Email"
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <div className="md:col-span-2">
                  <Input
                    label="Full Name"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name || ''}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="change-password"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={changePassword}
                    onChange={(e) => setChangePassword(e.target.checked)}
                  />
                  <label htmlFor="change-password" className="ml-2 block text-sm text-gray-700">
                    Change Password
                  </label>
                </div>
              </div>

              {changePassword && (
                <div className="space-y-4 mb-6">
                  <Input
                    label="Current Password"
                    id="current_password"
                    name="current_password"
                    type="password"
                    value={formData.current_password}
                    onChange={handleChange}
                    required={changePassword}
                  />
                  <Input
                    label="New Password"
                    id="new_password"
                    name="new_password"
                    type="password"
                    value={formData.new_password}
                    onChange={handleChange}
                    required={changePassword}
                  />
                  <Input
                    label="Confirm New Password"
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    required={changePassword}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>

      <Card className="bg-gray-50">
        <div className="p-1">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Account Information</h2>
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Account ID</h3>
            <p className="text-gray-800">#{user?.id}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;
