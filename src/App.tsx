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
import OrderDetailModal from './components/OrderDetailModal';
import { Order } from './types';

function App() {
  const { user, loading, initialize, userType } = useAuthStore();
  const [currentView, setCurrentView] = useState('dashboard');
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleCloseOrderModal = () => {
    setSelectedOrder(null);
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
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onViewChange={setCurrentView} onOrderClick={handleOrderClick} />;
      case 'orders':
        return <OrderManagement />;
      case 'planning':
        return <PlanningCalendar />;
      case 'customers':
        return <CustomerManagement />;
      case 'api':
        return <ApiSettings />;
      default:
        return <Dashboard onViewChange={setCurrentView} onOrderClick={handleOrderClick} />;
    }
  };

  return (
    <>
      <Layout currentView={currentView} onViewChange={setCurrentView}>
        {renderView()}
      </Layout>
      
      {/* Modal de détail de commande partagé */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={handleCloseOrderModal}
          onStatusUpdate={async (orderId: string, newStatus: Order['status']) => {
            // Cette fonction sera gérée par les stores individuels
            console.log('Status update:', orderId, newStatus);
            handleCloseOrderModal();
          }}
          onDeleteOrder={async (orderId: string) => {
            // Cette fonction sera gérée par les stores individuels
            console.log('Delete order:', orderId);
            handleCloseOrderModal();
          }}
          paletteTypes={[]}
          userType={userType}
        />
      )}
      
      <Toaster position="top-right" />
    </>
  );
}

export default App;