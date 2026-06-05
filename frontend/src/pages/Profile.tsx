import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuthStore } from '../store/authStore';
import { User, Mail, Phone, Shield, LogOut } from 'lucide-react';
import './Profile.css';

const Profile: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="profile-container">
      <Navbar />
      <main className="profile-content">
        <div className="profile-card">
          <div className="profile-header">
            <div className="avatar">
              <User size={48} />
            </div>
            <h1>{user.name}</h1>
            <span className="role-badge">{user.role}</span>
          </div>

          <div className="info-list">
            <div className="info-item">
              <Mail size={20} />
              <div>
                <label>Email</label>
                <p>{user.email}</p>
              </div>
            </div>

            <div className="info-item">
              <Phone size={20} />
              <div>
                <label>Phone</label>
                <p>{user.phone || 'Not provided'}</p>
              </div>
            </div>

            <div className="info-item">
              <Shield size={20} />
              <div>
                <label>Account Status</label>
                <p>Verified</p>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button className="logout-button" onClick={handleLogout}>
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
