import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard/Dashboard";
import "./index.css";
import "@fontsource/poppins"; // Defaults to weight 400
import Landingpage from './components/Auth/Landingpage';
//import Login from "./components/Login/Login";
import { Navigate } from 'react-router-dom';
// In your main App.js or index.js

import axios from 'axios';
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Add response interceptor to handle errors globally
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<Landingpage />} />
        {/* <Route path="/auth/login" element={<Login />} /> */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
