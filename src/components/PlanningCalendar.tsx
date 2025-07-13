import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Package, MapPin } from 'lucide-react';
import { Order } from '../types';
import { useOrderStore } from '../stores/orderStore';
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import OrderDetailModal from './OrderDetailModal';
import toast from 'react-hot-toast';

interface PlanningCalendarProps {
  onOrderClick?: (order: Order) => void;
}

const PlanningCalendar: React.FC<PlanningCalendarProps> = ({ onOrderClick }) => {
  const { orders, paletteTypes, fetchOrders, fetchPaletteTypes, updateOrderStatus, deleteOrder } = useOrderStore();
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
    fetchPaletteTypes();
  }, [fetchOrders, fetchPaletteTypes]);

  // Créneaux horaires de 8h à 18h
  const timeSlots = [
    { id: '08', label: '8h - 9h', start: '08:00', end: '09:00' },
    { id: '09', label: '9h - 10h', start: '09:00', end: '10:00' },
    { id: '10', label: '10h - 11h', start: '10:00', end: '11:00' },
    { id: '11', label: '11h - 12h', start: '11:00', end: '12:00' },
    { id: '12', label: '12h - 13h', start: '12:00', end: '13:00' },
    { id: '13', label: '13h - 14h', start: '13:00', end: '14:00' },
    { id: '14', label: '14h - 15h', start: '14:00', end: '15:00' },
    { id: '15', label: '15h - 16h', start: '15:00', end: '16:00' },
    { id: '16', label: '16h - 17h', start: '16:00', end: '17:00' },
    { id: '17', label: '17h - 18h', start: '17:00', end: '18:00' },
  ];

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  const getOrdersForDayAndSlot = (date: Date, slotId: string) => {
    return orders.filter(order => {
      if (!isSameDay(new Date(order.delivery_date), date)) return false;
      
      // Si la commande a un créneau horaire assigné, l'utiliser
      if (order.time_slot && order.time_slot.start_time) {
        const slotStartHour = parseInt(order.time_slot.start_time.split(':')[0]);
        const targetHour = parseInt(slotId);
        return slotStartHour === targetHour;
      }
      
      // Sinon, ne pas afficher la commande dans les créneaux horaires
      return false;
    });
  };

  const getSlotColor = (orders: Order[]) => {
    if (orders.length === 0) return 'bg-gray-50 hover:bg-gray-100 border-gray-200';
    
    const hasProvisional = orders.some(order => order.status === 'provisional');
    const hasConfirmed = orders.some(order => order.status === 'confirmed');
    const hasDelivered = orders.some(order => order.status === 'delivered');
    
    if (hasDelivered) return 'bg-blue-50 border-blue-200';
    if (hasConfirmed) return 'bg-green-50 border-green-200';
    if (hasProvisional) return 'bg-yellow-50 border-yellow-200';
    
    return 'bg-gray-50 hover:bg-gray-100 border-gray-200';
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(direction === 'next' ? addWeeks(currentWeek, 1) : subWeeks(currentWeek, 1));
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // Dimanche ou Samedi
  };

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success('Statut mis à jour avec succès');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
      try {
        await deleteOrder(orderId);
        toast.success('Commande supprimée avec succès');
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    if (onOrderClick) {
      onOrderClick(order);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planning des livraisons</h1>
          <p className="text-gray-600">Vue hebdomadaire détaillée par créneaux horaires</p>
        </div>
        
        <div className="flex items-center space-x-4 overflow-x-auto">
          <div className="flex items-center space-x-2 text-sm whitespace-nowrap">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-200 rounded border"></div>
              <span>Libre</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-200 rounded border border-yellow-300"></div>
              <span>Provisoire</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-200 rounded border border-green-300"></div>
              <span>Confirmé</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-200 rounded border border-blue-300"></div>
              <span>Livré</span>
            </div>
          </div>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateWeek('prev')}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Semaine précédente</span>
            <span className="sm:hidden">Précédent</span>
          </button>
          
          <div className="text-center">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
              {format(currentWeek, 'MMMM yyyy', { locale: fr })}
            </h2>
            <p className="text-sm text-gray-500">
              Du {format(currentWeek, 'dd', { locale: fr })} au {format(addDays(currentWeek, 6), 'dd MMMM', { locale: fr })}
            </p>
          </div>
          
          <button
            onClick={() => navigateWeek('next')}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="hidden sm:inline">Semaine suivante</span>
            <span className="sm:hidden">Suivant</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-8 gap-0">
              {/* Header */}
              <div className="bg-gray-50 p-2 lg:p-3 font-medium text-gray-700 border-b border-r">
                <Clock className="h-4 w-4 mb-1" />
                <span className="text-xs lg:text-sm">Créneaux</span>
              </div>
              {weekDays.map((day) => (
                <div 
                  key={day.toISOString()} 
                  className={`bg-gray-50 p-2 lg:p-3 text-center border-b border-r ${
                    isWeekend(day) ? 'bg-gray-100' : ''
                  }`}
                >
                  <div className={`font-medium text-xs lg:text-sm ${isWeekend(day) ? 'text-gray-500' : 'text-gray-900'}`}>
                    <span className="hidden sm:inline">{format(day, 'EEEE', { locale: fr })}</span>
                    <span className="sm:hidden">{format(day, 'EEE', { locale: fr })}</span>
                  </div>
                  <div className={`text-xs ${isWeekend(day) ? 'text-gray-400' : 'text-gray-600'}`}>
                    {format(day, 'dd MMM', { locale: fr })}
                  </div>
                  {isWeekend(day) && (
                    <div className="text-xs text-gray-400 mt-1">Fermé</div>
                  )}
                </div>
              ))}

              {/* Time Slots */}
              {timeSlots.map((slot) => (
                <React.Fragment key={slot.id}>
                  <div className="p-2 lg:p-3 border-b border-r bg-gray-50 font-medium text-gray-700 text-xs lg:text-sm">
                    <span className="hidden sm:inline">{slot.label}</span>
                    <span className="sm:hidden">{slot.id}h</span>
                  </div>
                  {weekDays.map((day) => {
                    const dayOrders = getOrdersForDayAndSlot(day, slot.id);
                    const isWeekendDay = isWeekend(day);
                    
                    return (
                      <div
                        key={`${day.toISOString()}-${slot.id}`}
                        className={`p-1 lg:p-2 border-b border-r min-h-[60px] lg:min-h-[80px] transition-colors ${
                          isWeekendDay 
                            ? 'bg-gray-100' 
                            : getSlotColor(dayOrders)
                        }`}
                      >
                        {!isWeekendDay && dayOrders.length > 0 && (
                          <div className="space-y-1">
                            {dayOrders.slice(0, 2).map((order) => (
                              <div
                                key={order.id}
                                className="bg-white rounded-md p-1 lg:p-2 shadow-sm border text-xs hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => handleOrderClick(order)}
                              >
                                <div className="flex items-center justify-center">
                                  <span className="font-medium text-gray-900 text-xs">
                                    #{order.id.slice(0, 8)}
                                  </span>
                                  <span className={`px-1 lg:px-1.5 py-0.5 rounded text-xs font-medium ${
                                    order.status === 'provisional' 
                                      ? 'bg-yellow-100 text-yellow-800' 
                                      : order.status === 'confirmed'
                                      ? 'bg-green-100 text-green-800'
                                      : order.status === 'delivered'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {order.status === 'provisional' ? 'P' : 
                                     order.status === 'confirmed' ? 'C' :
                                     order.status === 'delivered' ? 'L' : 'A'}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {dayOrders.length > 2 && (
                              <button 
                                className="w-full text-xs text-center text-blue-600 bg-blue-50 hover:bg-blue-100 rounded py-1 cursor-pointer transition-colors"
                                onClick={() => {
                                  if (dayOrders[2] && onOrderClick) {
                                    handleOrderClick(dayOrders[2]);
                                  }
                                }}
                              >
                                +{dayOrders.length - 2} autres
                              </button>
                            )}
                          </div>
                        )}
                        {!isWeekendDay && dayOrders.length === 0 && (
                          <div className="h-full flex items-center justify-center text-gray-300">
                            <Calendar className="h-4 w-4 lg:h-5 lg:w-5" />
                          </div>
                        )}
                        {isWeekendDay && (
                          <div className="h-full flex items-center justify-center text-gray-400">
                            <span className="text-xs">Fermé</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 lg:p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 lg:h-6 lg:w-6 text-yellow-600" />
            </div>
            <div className="ml-3 lg:ml-4 min-w-0">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Créneaux provisoires</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {orders.filter(order => order.status === 'provisional').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 lg:p-3 bg-green-100 rounded-lg">
              <Calendar className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
            </div>
            <div className="ml-3 lg:ml-4 min-w-0">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Créneaux confirmés</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {orders.filter(order => order.status === 'confirmed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 lg:p-3 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
            </div>
            <div className="ml-3 lg:ml-4 min-w-0">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Livraisons effectuées</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {orders.filter(order => order.status === 'delivered').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 lg:p-3 bg-indigo-100 rounded-lg">
              <Package className="h-5 w-5 lg:h-6 lg:w-6 text-indigo-600" />
            </div>
            <div className="ml-3 lg:ml-4 min-w-0">
              <p className="text-xs lg:text-sm font-medium text-gray-600">Total palettes</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {orders.reduce((sum, order) => sum + order.quantity, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
          onDeleteOrder={handleDeleteOrder}
          paletteTypes={paletteTypes}
        />
      )}
    </div>
  );
};

export default PlanningCalendar;