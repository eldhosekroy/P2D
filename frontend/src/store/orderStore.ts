import { create } from 'zustand';
import apiClient from '../api/apiClient';

interface Order {
  id: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  createdAt: string;
  packageType?: string;
  notes?: string;
  driverName?: string;
  driverPhone?: string;
}

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  createOrder: (orderData: Partial<Order>) => Promise<void>;
  getOrderById: (id: string) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/orders');
      set({ orders: response.data.data, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch orders';
      set({ error: message, isLoading: false });
    }
  },
  createOrder: async (orderData) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post('/orders', orderData);
      await get().fetchOrders();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create order';
      set({ error: message, isLoading: false });
      throw err;
    }
  },
  getOrderById: async (id) => {
    set({ isLoading: true, error: null, currentOrder: null });
    try {
      const response = await apiClient.get(`/orders/${id}`);
      set({ currentOrder: response.data.data, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch order details';
      set({ error: message, isLoading: false });
    }
  },
}));
