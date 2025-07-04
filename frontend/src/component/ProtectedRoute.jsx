import React, { Children } from "react";
import { Navigate } from "react-router-dom";
import { useApp } from '../context/AppContext';

// Prevent access of user if user is unauthenticated or user is unauthorized
const ProtectedRoute = ({children, allowedRole}) => {
  const { user } = useApp();

  if (!user || (allowedRole && user.role !== allowedRole)) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;