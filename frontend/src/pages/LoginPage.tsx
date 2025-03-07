import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { login } from '../store/auth.slice';
import { getToken } from '../utils/token';
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
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // Redirect if already logged in
  useEffect(() => {
    const { token } = getToken();
    if (token) {
      const redirectUrl = sessionStorage.getItem('redirectUrl') || '/';
      sessionStorage.removeItem('redirectUrl');
      navigate(redirectUrl);
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('All fields are required');
      return;
    }

    setIsLoading(true);

    try {
      await dispatch(login({ username, password })).unwrap();
      const redirectUrl = sessionStorage.getItem('redirectUrl') || '/';
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
      setIsLoading(false);
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

          <Button type="submit" isLoading={isLoading}>
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