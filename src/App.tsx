import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import LoginForm from './components/LoginForm';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import OrderManagement from './components/OrderManagement';
import PlanningCalendar from './components/PlanningCalendar';
import ApiSettings from './components/ApiSettings';

function App() {
  const { user, loading, initialize } = useAuthStore();
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginForm />
        <Toaster position="top-right" />
      </>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onViewChange={setCurrentView} />;
      case 'orders':
        return <OrderManagement />;
      case 'planning':
        return <PlanningCalendar />;
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
      <Toaster position="top-right" />
    </>
  );
}

export default App;