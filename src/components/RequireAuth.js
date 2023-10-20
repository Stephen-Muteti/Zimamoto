import { useAuth } from './auth.js';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios';

export const RequireAuth = ({ children, requiredRole }) => {
  const auth = useAuth();
  const navigate = useNavigate();

  const getUser = async () => {
    const userJSON = localStorage.getItem('user');
    return userJSON ? JSON.parse(userJSON) : null;
  };

  const validateSession = async () => {
    const authToken = localStorage.getItem('access_token');
    try {
      const response = await axios.get('https://zimamoto-deab7f8718a9.herokuapp.com/validate_session', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const jsonData = response.data;

      if (response.status === 200) {
        localStorage.setItem('user', JSON.stringify(jsonData.user));
        auth.login(jsonData.user);
        return true;
      }

      return false;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
      } else {
        console.log('An error occurred');
      }

      return false;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const validToken = await validateSession();
      const user = await getUser();

      if (!user || !validToken) {
        navigate('/login');
      } else if (requiredRole && !requiredRole.includes(user.role)) {
        navigate('/notfound', {replace : true});
      }
    };

    fetchData();
  }, [navigate, requiredRole]);

  return children;
};
