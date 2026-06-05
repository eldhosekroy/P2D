import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useOrderStore } from '../store/orderStore';
import './Home.css';

const Home: React.FC = () => {
  const { orders, fetchOrders, isLoading, error } = useOrderStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="home-container">
      <Navbar />
      <main className="home-content">
        <header className="content-header">
          <h1>My Orders</h1>
          <button className="primary-btn" onClick={() => navigate('/book')}>New Order</button>
        </header>

        {isLoading && <p>Loading orders...</p>}
        {error && <p className="error-message">{error}</p>}

        {!isLoading && orders.length === 0 && (
          <div className="empty-state">
            <p>No orders yet. Start by creating a new one!</p>
          </div>
        )}

        <div className="orders-grid">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <span className="order-id">#{order.id.slice(-6)}</span>
                <span className={`status-badge ${order.status.toLowerCase()}`}>
                  {order.status}
                </span>
              </div>
              <div className="order-details">
                <div className="detail-item">
                  <label>From:</label>
                  <span>{order.pickupAddress}</span>
                </div>
                <div className="detail-item">
                  <label>To:</label>
                  <span>{order.deliveryAddress}</span>
                </div>
              </div>
              <div className="order-footer">
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                <button 
                  className="secondary-btn" 
                  onClick={() => navigate(`/tracking/${order.id}`)}
                >
                  Track Order
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Home;
