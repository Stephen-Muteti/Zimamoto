import {Outlet} from 'react-router-dom';
import { Helmet } from 'react-helmet';
import AdminSidebar from './AdminSidebar.js';
import React, { useState, useEffect } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { Footer } from './Footer.js';

export const Admin = () => {  
  return (
    <>
    <Helmet>
      <title>ZimaMoto | Admin</title>
    </Helmet>
    <AdminSidebar/>
    <div className="main-content">
      <SimpleBar className="page-content page-container-scroll">
          <Outlet/>   
          <Footer/>               
      </SimpleBar>    
    </div>
    </>
  );
};

export default Admin;
