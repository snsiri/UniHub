// Footer.jsx - Place this INSIDE the main content area, NOT at the root App level
// The footer should be rendered within the page content wrapper, not alongside the sidebar

import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>Discover</h4>
          <ul>
            <li><Link to="/feed">Home Feed</Link></li>
            <li><Link to="/notes">Lecture Notes</Link></li>
            <li><Link to="/past-papers">Past Papers</Link></li>
            <li><Link to="/lab-sheets">Lab Sheets</Link></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Account</h4>
          <ul>
            <li><Link to="/profile">My Profile</Link></li>
            <li><Link to="/feedback">Feedback</Link></li>
            <li><Link to="/register">Register</Link></li>
            <li><Link to="/signin">Sign In</Link></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Support</h4>
          <ul>
            <li><Link to="/help">Help Center</Link></li>
            <li><Link to="/report">Report Issue</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms of Use</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 KNOWva . -NS-</p>
      </div>
    </footer>
  );
};

export default Footer;
