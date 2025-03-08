import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { login } from '../store/auth.slice';
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
    <PageContainer>
      <Card>
        <PageHeader 
          title="Sign in to your account"
          subtitle="Welcome back! Please enter your details"
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
            />
          </div>

          <Button type="submit" isLoading={isSubmitting || authLoading}>
            Sign in
          </Button>
        </form>

        <div className="text-center mt-6">
          <Link to="/register">
            Don't have an account? Sign up
          </Link>
        </div>
      </Card>
    </PageContainer>
  );
};

export default LoginPage;