import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import LoginForm from './components/LoginForm';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import OrderManagement from './components/OrderManagement';
import PlanningCalendar from './components/PlanningCalendar';
import ApiSettings from './components/ApiSettings';
import CustomerManagement from './components/CustomerManagement';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import { Order } from './types';
import { X, Package } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function App() {
  const { user, loading, initialize } = useAuthStore();
  const [currentView, setCurrentView] = useState('dashboard');
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'provisional':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'provisional':
        return 'Provisoire';
      case 'confirmed':
        return 'Confirmée';
      case 'delivered':
        return 'Livrée';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="mb-6 flex gap-4">
          <button onClick={() => setAuthView('login')} className={`px-4 py-2 rounded ${authView === 'login' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Connexion</button>
          <button onClick={() => setAuthView('signup')} className={`px-4 py-2 rounded ${authView === 'signup' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Créer un compte</button>
        </div>
        {authView === 'login' ? <Login /> : <Signup />}
        <Toaster position="top-right" />
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onViewChange={setCurrentView} />;
      case 'orders':
        return <OrderManagement />;
      case 'planning':
        return <PlanningCalendar onOrderClick={handleOrderClick} />;
      case 'customers':
        return <CustomerManagement />;
      case 'api':
        return <ApiSettings />;
      default:
        return <Dashboard onViewChange={setCurrentView} />;
    }
  };

  return (
    <>
      <Layout currentView={currentView} onViewChange={setCurrentView}>
        {renderView()}
      </Layout>
      
      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Détails de la commande #{selectedOrder.id.slice(0, 8)}
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                    <p className="text-sm text-gray-900">{selectedOrder.customer?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <p className="text-sm text-gray-900">{selectedOrder.customer?.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Produits commandés</label>
                    {selectedOrder?.order_items && selectedOrder.order_items.length > 0 ? (
                      <div className="space-y-2">
                        {selectedOrder.order_items.map((item, index) => (
                          <div key={item.id || index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-900">
                              {item.palette_type?.name || `Type ${item.palette_type_id}`}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {item.quantity} ×
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2 bg-gray-50 rounded">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-900">
                            {selectedOrder?.palette_type?.name || 'Type inconnu'}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {selectedOrder.quantity} ×
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse de livraison</label>
                  <p className="text-sm text-gray-900">{selectedOrder.delivery_address}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de livraison</label>
                    <p className="text-sm text-gray-900">
                      {format(new Date(selectedOrder.delivery_date), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusLabel(selectedOrder.status)}
                    </span>
                  </div>
                </div>

                {selectedOrder.time_slot && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Créneau horaire</label>
                    <p className="text-sm text-gray-900">
                      {format(new Date(`2000-01-01T${selectedOrder.time_slot.start_time}`), 'HH:mm')} - {format(new Date(`2000-01-01T${selectedOrder.time_slot.end_time}`), 'HH:mm')}
                    </p>
                  </div>
                )}

                {selectedOrder.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <p className="text-sm text-gray-900">{selectedOrder.notes}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Toaster position="top-right" />
    </>
  );
}

export default App;