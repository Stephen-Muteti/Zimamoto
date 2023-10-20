import logo from './logo.svg';
import './assets/app.min.css';
import './assets/bootstrap.min.css';
import './assets/jsvectormap.min.css';
import './App.css';
import Header from './components/Header.js';
import Home from './components/Home.js';
import {ContactUs} from './components/ContactUs.js';
import {Stats} from './components/Stats.js';
import {AboutUs} from './components/AboutUs.js';
import Admin from './components/Admin.js';
import Operator from './components/operator/Operator.js';
import Dashboard from './components/Dashboard.js';
import ManageUsers from './components/user/ManageUsers.js';
import ManageBrigades from './components/brigade/ManageBrigades.js';
import DataAnalytics from './components/DataAnalytics.js';
import UserSupport from './components/UserSupport.js';
import AddUser from './components/user/AddUser.js';
import AddBrigade from './components/brigade/AddBrigade.js';
import EditUser from './components/user/EditUser.js';
import EditBrigade from './components/brigade/EditBrigade.js';
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login.js';
import { AuthProvider } from './components/auth.js';
import {RequireAuth} from './components/RequireAuth';
import NotFound from './components/NotFound.js';


function App() { 

  return (
    <AuthProvider>

    <div id="layout-wrapper">
      <Header/>
      <Routes>

      <Route path="/admin" element={<RequireAuth requiredRole={["administrator", "staff"]}><Admin /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="manage-users" element={<ManageUsers/>} />
          <Route path="manage-brigades" element={<ManageBrigades/>} />
          <Route path="analytics" element={<DataAnalytics/>} />
          <Route path="user-support" element={<UserSupport/>} />
        </Route>



        <Route path="/operator" element={<RequireAuth requiredRole={["operator"]}><Operator /></RequireAuth>} />
          <Route path="/" element={<Home />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/contact-us" element={<ContactUs />} />

          <Route path="/login" element={<Login />} />

        <Route path="/admin/manage-users/add-user" element={<AddUser />} />
        <Route path="/admin/manage-brigades/add-brigade" element={<AddBrigade />} />
        <Route path="admin/manage-users/edit-user/:userId" element={<EditUser />} />
        <Route path="admin/manage-brigades/edit-brigade/:BrigadeID" element={<EditBrigade />} />



        <Route path="*" element={<NotFound />} />

      </Routes>

    </div>
    </AuthProvider>

  );
}

export default App;
