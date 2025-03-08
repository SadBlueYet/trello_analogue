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
  ErrorMessage,
  PageContainer,
  PageHeader
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
        <div className="max-w-md w-full space-y-8">
          <Card className="p-8 backdrop-blur-sm bg-white/80 shadow-xl">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg mb-2">
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                  />
                </svg>
              </div>
            </div>
            
            <PageHeader 
              title="Welcome Back"
              subtitle="Sign in to your account to continue"
            />
            
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <ErrorMessage message={error} />
              
              <div className="space-y-4">
                <Input
                  id="username"
                  name="username"
                  type="text"
                  label="Username"
                  required
                  placeholder="Enter your username"
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
              </div>

              <Button 
                type="submit" 
                isLoading={isSubmitting || authLoading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                Sign in
              </Button>
            </form>

            <div className="text-center mt-6">
              <Link to="/register" className="text-indigo-600 hover:text-indigo-500">
                Don't have an account? <span className="font-semibold">Sign up</span>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;