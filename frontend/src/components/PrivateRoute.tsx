import { Navigate } from 'react-router-dom';
import { getToken } from '../utils/token';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { token } = getToken();

  if (!token) {
    // Save the current URL before redirecting
    sessionStorage.setItem('redirectUrl', window.location.pathname);
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export default PrivateRoute; 