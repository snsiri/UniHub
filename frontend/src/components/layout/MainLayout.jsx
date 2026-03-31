import React from 'react';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import Footer from './Footer';

const MainLayout = ({ children, showRightSidebar = false }) => (
  <div className="app-layout">
    <Sidebar />
     <div className="content-wrapper">
      <main className="main-content">{children}</main>
      <Footer />   
    </div>
    {showRightSidebar && <RightSidebar />}
    
  </div>
);
export default MainLayout;



