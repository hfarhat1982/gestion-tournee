export interface Customer {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  created_at: string;
}

export interface PaletteType {
  id: string;
  name: string;
  description?: string;
  price?: number;
  created_at: string;
}

export interface TimeSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  used_capacity: number;
  status: 'available' | 'full';
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  customer?: Customer;
  palette_type_id: string;
  palette_type?: PaletteType;
  quantity: number;
  delivery_address: string;
  delivery_date: string;
  time_slot_id?: string;
  time_slot?: TimeSlot;
  status: 'pending' | 'provisional' | 'confirmed' | 'delivered' | 'cancelled';
  notes?: string;
  created_via_api: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'operator';
  created_at: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  active: boolean;
  created_at: string;
}

export interface DashboardStats {
  totalOrders: number;
  confirmedToday: number;
  pendingOrders: number;
  deliveredToday: number;
  availableSlots: number;
}