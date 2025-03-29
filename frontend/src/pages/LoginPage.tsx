import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { login } from '../store/auth.slice';
import AuthBackground from '../components/ui/AuthBackground';
import { 
  Button, 
  Input, 
  Card, 
  Link, 
  ErrorMessage
} from '../components/ui';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
      const redirectUrl = sessionStorage.getItem('redirectUrl') || '/home';
      sessionStorage.removeItem('redirectUrl');
      navigate(redirectUrl);
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('All fields are required');
      return;
    }

    setIsSubmitting(true);

    try {
      await dispatch(login({ username, password })).unwrap();
      
      // Прямое перенаправление после успешного входа,
      // не дожидаясь обновления Redux состояния
      const redirectUrl = sessionStorage.getItem('redirectUrl') || '/home';
      sessionStorage.removeItem('redirectUrl');
      navigate(redirectUrl);
    } catch (err: any) {
      console.error('Login error:', err);
      
      if (err.status === 401) {
        setError('Invalid username or password');
      } else if (err.status === 422) {
        setError('Please check your input data');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <AuthBackground />
      
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center mb-8">
            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg animate-pulse-soft">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-12 w-12 text-white" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                  />
                </svg>
              </div>
            </div>
            <h2 className="mt-4 text-3xl font-bold text-gray-900">
              Welcome to TaskFlow
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your account to continue
            </p>
          </div>
          
          <Card className="p-8 shadow-xl" hover>
            {error && <ErrorMessage message={error} />}
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <Input
                id="username"
                name="username"
                type="text"
                label="Username"
                required
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                icon={
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                }
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
                icon={
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                }
              />

              <Button 
                type="submit" 
                isLoading={isSubmitting || authLoading}
              >
                Sign in
              </Button>
              
              <div className="text-center mt-4">
                <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  Forgot password?
                </a>
              </div>
            </form>
          </Card>

          <div className="text-center">
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Don't have an account? <span className="font-semibold">Sign up now</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;