import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, Package, User, MapPin } from 'lucide-react';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate('/home')}>
        P2D
      </div>
      <div className="navbar-links">
        <button onClick={() => navigate('/home')} title="Home">
          <Package size={20} />
          <span>Orders</span>
        </button>
        <button onClick={() => navigate('/book')} title="Book Pickup">
          <MapPin size={20} />
          <span>Book</span>
        </button>
        <button onClick={() => navigate('/profile')} title="Profile">
          <User size={20} />
          <span>{user?.name || 'Profile'}</span>
        </button>
        <button onClick={handleLogout} title="Logout" className="logout-btn">
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
