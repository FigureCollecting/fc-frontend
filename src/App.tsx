import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import TerminalThemeProvider from './components/TerminalThemeProvider';
import { useCustomTheme } from './hooks/useCustomTheme';
import { useSessionValidator } from './hooks/useSessionValidator';
import { useTokenRefresh } from './hooks/useTokenRefresh';
import Dashboard from './pages/Dashboard';
import FigureList from './pages/FigureList';
import FigureDetail from './pages/FigureDetail';
import AddFigure from './pages/AddFigure';
import EditFigure from './pages/EditFigure';
import Search from './pages/Search';
import Statistics from './pages/Statistics';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  const { colorProfile } = useCustomTheme();

  // Proactively validate session - redirects to login if expired
  useSessionValidator();

  // Manage automatic token refresh based on user activity
  useTokenRefresh();

  return (
    <TerminalThemeProvider key={colorProfile}>
      <Box>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="figures" element={<FigureList />} />
            <Route path="figures/:id" element={<FigureDetail />} />
            <Route path="figures/add" element={<AddFigure />} />
            <Route path="figures/edit/:id" element={<EditFigure />} />
            <Route path="search" element={<Search />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Box>
    </TerminalThemeProvider>
  );
};

export default App;
