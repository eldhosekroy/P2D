import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useOrderStore } from '../store/orderStore';
import { MapPin, Package, Truck, CheckCircle, ChevronLeft } from 'lucide-react';
import './Tracking.css';

const Tracking: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { currentOrder, getOrderById, isLoading, error } = useOrderStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (orderId) {
      getOrderById(orderId);
    }
  }, [orderId, getOrderById]);

  if (isLoading) return <div className="tracking-container"><Navbar /><p>Loading tracking info...</p></div>;
  if (error) return <div className="tracking-container"><Navbar /><p className="error-message">{error}</p></div>;
  if (!currentOrder) return null;

  const steps = [
    { label: 'Order Placed', status: 'pending', icon: <Package /> },
    { label: 'Driver Assigned', status: 'accepted', icon: <Truck /> },
    { label: 'Picked Up', status: 'picked_up', icon: <MapPin /> },
    { label: 'Delivered', status: 'delivered', icon: <CheckCircle /> },
  ];

  const currentStatusIndex = steps.findIndex(s => s.status === currentOrder.status.toLowerCase()) || 0;

  return (
    <div className="tracking-container">
      <Navbar />
      <main className="tracking-content">
        <button onClick={() => navigate('/home')} className="back-link">
          <ChevronLeft size={16} /> Back to Orders
        </button>

        <div className="tracking-header">
          <h1>Track Order #{currentOrder.id.slice(-6)}</h1>
          <span className={`status-badge ${currentOrder.status.toLowerCase()}`}>
            {currentOrder.status}
          </span>
        </div>

        <div className="status-timeline">
          {steps.map((step, index) => (
            <div 
              key={step.label} 
              className={`timeline-item ${index <= currentStatusIndex ? 'active' : ''}`}
            >
              <div className="timeline-icon">{step.icon}</div>
              <div className="timeline-label">{step.label}</div>
            </div>
          ))}
        </div>

        <div className="tracking-details">
          <div className="details-section">
            <h3>Addresses</h3>
            <div className="address-item">
              <label>Pickup</label>
              <p>{currentOrder.pickupAddress}</p>
            </div>
            <div className="address-item">
              <label>Delivery</label>
              <p>{currentOrder.deliveryAddress}</p>
            </div>
          </div>

          <div className="details-section">
            <h3>Package Info</h3>
            <p><strong>Type:</strong> {currentOrder.packageType || 'Standard'}</p>
            {currentOrder.notes && <p><strong>Notes:</strong> {currentOrder.notes}</p>}
          </div>

          {currentOrder.driverName && (
            <div className="details-section driver-info">
              <h3>Driver Assigned</h3>
              <p><strong>Name:</strong> {currentOrder.driverName}</p>
              <p><strong>Phone:</strong> {currentOrder.driverPhone}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Tracking;
