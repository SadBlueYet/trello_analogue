import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import axios, { AxiosError } from 'axios';
import { authService } from '../services/auth.service';
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
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

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

    setIsLoading(true);

    try {
      const response = await authService.register({
        email,
        username,
        password,
      });

      const loginResponse = await authService.login({
        username,
        password,
      });

      dispatch(setCredentials({
        token: loginResponse.access_token,
        user: response
      }));

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
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <Card>
        <PageHeader 
          title="Create an account"
          subtitle="Sign up to get started"
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
            
            <Input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              label="Confirm password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button type="submit" isLoading={isLoading}>
            Create account
          </Button>
        </form>

        <div className="text-center mt-6">
          <Link to="/login">
            Already have an account? Sign in
          </Link>
        </div>
      </Card>
    </PageContainer>
  );
};

export default RegisterPage; 