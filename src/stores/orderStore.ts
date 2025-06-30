import { create } from 'zustand';
import { Order, TimeSlot, Customer, PaletteType } from '../types';
import { supabase, handleSupabaseError } from '../lib/supabase';

interface OrderState {
  orders: Order[];
  timeSlots: TimeSlot[];
  customers: Customer[];
  paletteTypes: PaletteType[];
  loading: boolean;
  fetchOrders: () => Promise<void>;
  fetchTimeSlots: () => Promise<void>;
  fetchCustomers: () => Promise<void>;
  fetchPaletteTypes: () => Promise<void>;
  createOrder: (order: Partial<Order>) => Promise<Order>;
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  timeSlots: [],
  customers: [],
  paletteTypes: [],
  loading: false,

  fetchOrders: async () => {
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*),
          palette_type:palette_types(*),
          time_slot:time_slots(*)
        `)
        .order('created_at', { ascending: false });

      if (error) handleSupabaseError(error);
      set({ orders: data || [] });
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchTimeSlots: async () => {
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .order('date', { ascending: true });

      if (error) handleSupabaseError(error);
      set({ timeSlots: data || [] });
    } catch (error) {
      console.error('Error fetching time slots:', error);
    }
  },

  fetchCustomers: async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (error) handleSupabaseError(error);
      set({ customers: data || [] });
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  },

  fetchPaletteTypes: async () => {
    try {
      const { data, error } = await supabase
        .from('palette_types')
        .select('*')
        .order('name', { ascending: true });

      if (error) handleSupabaseError(error);
      set({ paletteTypes: data || [] });
    } catch (error) {
      console.error('Error fetching palette types:', error);
    }
  },

  createOrder: async (orderData: Partial<Order>) => {
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) handleSupabaseError(error);
      
      const newOrder = data as Order;
      set(state => ({ orders: [newOrder, ...state.orders] }));
      return newOrder;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateOrderStatus: async (id: string, status: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) handleSupabaseError(error);

      set(state => ({
        orders: state.orders.map(order =>
          order.id === id ? { ...order, status } : order
        )
      }));
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  deleteOrder: async (id: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) handleSupabaseError(error);

      set(state => ({
        orders: state.orders.filter(order => order.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  },
}));