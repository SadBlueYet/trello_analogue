import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../store';
import { checkAuth } from '../store/auth.slice';

interface SessionProviderProps {
  children: React.ReactNode;
}

const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const authCheckPerformedRef = useRef(false);

  // Check authentication status on mount, only once
  useEffect(() => {
    if (!authCheckPerformedRef.current) {
      // Выполняем проверку аутентификации только один раз при монтировании
      dispatch(checkAuth());
      authCheckPerformedRef.current = true;
    }
  }, [dispatch]);

  // Redirect to home if authenticated and on login/register page
  useEffect(() => {
    const path = window.location.pathname;
    if (isAuthenticated && (path === '/login' || path === '/register')) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);

  return <>{children}</>;
};

export default SessionProvider;
