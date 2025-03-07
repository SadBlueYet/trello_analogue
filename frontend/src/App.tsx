import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import BoardPage from './pages/BoardPage';
import PrivateRoute from './components/PrivateRoute';
import SessionProvider from './components/SessionProvider';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <SessionProvider>
          <div className="min-h-screen bg-gray-100">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/boards/:boardId"
                element={
                  <PrivateRoute>
                    <BoardPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/home"
                element={
                  <PrivateRoute>
                    <HomePage />
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Navigate to="/home" replace />} />
            </Routes>
          </div>
        </SessionProvider>
      </Router>
    </Provider>
  );
}

export default App;
