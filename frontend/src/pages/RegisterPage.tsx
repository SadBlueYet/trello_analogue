import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { register } from '../store/auth.slice';
import AuthBackground from '../components/ui/AuthBackground';
import axios, { AxiosError } from 'axios';
import { 
  Button, 
  Input, 
  Card, 
  Link, 
  ErrorMessage,
  PageContainer,
  PageHeader
} from '../components/ui';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { isAuthenticated, isLoading: authLoading, error: authError } = useSelector(
    (state: RootState) => state.auth
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // Update error message if authentication fails
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    if (!email || !username || !password || !confirmPassword) {
      setError('All fields are required');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await dispatch(register({
        email,
        username,
        password,
      })).unwrap();
      
      // Прямое перенаправление после успешной регистрации
      navigate('/home');
    } catch (err) {
      console.error('Registration error:', err);
      
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<any>;
        if (axiosError.response) {
          const statusCode = axiosError.response.status;
          const errorDetail = axiosError.response.data?.detail;
          
          if (statusCode === 400) {
            setError(errorDetail || 'Invalid registration data');
          } else if (statusCode === 409) {
            setError('Email or username already exists');
          } else if (statusCode === 422) {
            setError('Please check your input data');
          } else {
            setError('Registration failed. Please try again.');
          }
        } else if (axiosError.request) {
          setError('Cannot connect to the server. Please check your internet connection.');
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <AuthBackground />
      
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-md w-full space-y-8">
          <Card className="p-8 backdrop-blur-sm bg-white/80 shadow-xl">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg mb-2">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-10 w-10 text-white" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" 
                  />
                </svg>
              </div>
            </div>
            
            <PageHeader 
              title="Join Us Today"
              subtitle="Create your account to get started"
            />
            
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <ErrorMessage message={error} />
              
              <div className="space-y-4">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  label="Email address"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/90"
                />
                
                <Input
                  id="username"
                  name="username"
                  type="text"
                  label="Username"
                  required
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-white/90"
                />
                
                <Input
                  id="password"
                  name="password"
                  type="password"
                  label="Password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/90"
                />
                
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  label="Confirm password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white/90"
                />
              </div>

              <Button 
                type="submit" 
                isLoading={isSubmitting || authLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Create account
              </Button>
            </form>

            <div className="text-center mt-6">
              <Link to="/login" className="text-indigo-600 hover:text-indigo-500">
                Already have an account? <span className="font-semibold">Sign in</span>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 