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
          time_slot:time_slots(*),
          order_items(
            *,
            palette_type:palette_types(*)
          )
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
      
      // Utilise la Deno function au lieu d'insérer directement
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_API_ORDERS_URL;
      const response = await fetch(functionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création de la commande');
      }

      const newOrder = await response.json();
      
      // Met à jour le store avec la nouvelle commande complète
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