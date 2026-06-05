import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useOrderStore } from '../store/orderStore';
import './BookPickup.css';

const BookPickup: React.FC = () => {
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [packageType, setPackageType] = useState('Standard');
  const [notes, setNotes] = useState('');
  const { createOrder, isLoading, error } = useOrderStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOrder({
        pickupAddress,
        deliveryAddress,
        packageType,
        notes,
      });
      navigate('/home');
    } catch {
      // Error handled in store
    }
  };

  return (
    <div className="book-pickup-container">
      <Navbar />
      <main className="book-pickup-content">
        <div className="form-card">
          <h1>Book a Pickup</h1>
          <p>Tell us where we need to go.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="pickup">Pickup Address</label>
              <textarea
                id="pickup"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Where should we pick up the package?"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="delivery">Delivery Address</label>
              <textarea
                id="delivery"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Where should we deliver it?"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type">Package Type</label>
                <select
                  id="type"
                  value={packageType}
                  onChange={(e) => setPackageType(e.target.value)}
                >
                  <option value="Standard">Standard</option>
                  <option value="Fragile">Fragile</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Document">Document</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes (Optional)</label>
              <input
                type="text"
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions?"
              />
            </div>

            {error && <p className="error-message">{error}</p>}

            <div className="form-actions">
              <button type="button" onClick={() => navigate('/home')} className="secondary-btn">
                Cancel
              </button>
              <button type="submit" className="primary-btn" disabled={isLoading}>
                {isLoading ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default BookPickup;
