import React, { useEffect, useState } from 'react';
import { Package, CheckCircle, Clock, Truck, Calendar, TrendingUp } from 'lucide-react';
import { DashboardStats, Order } from '../types';
import { useOrderStore } from '../stores/orderStore';
import { format, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardProps {
  onViewChange: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const { orders, fetchOrders } = useOrderStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    confirmedToday: 0,
    pendingOrders: 0,
    deliveredToday: 0,
    availableSlots: 8,
  });

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (orders.length > 0) {
      const today = new Date();
      const todayOrders = orders.filter(order => 
        isToday(new Date(order.delivery_date))
      );

      setStats({
        totalOrders: orders.length,
        confirmedToday: todayOrders.filter(order => order.status === 'confirmed').length,
        pendingOrders: orders.filter(order => order.status === 'pending' || order.status === 'provisional').length,
        pendingOrders: orders.filter(order => order.status === 'provisional').length,
        deliveredToday: todayOrders.filter(order => order.status === 'delivered').length,
        availableSlots: 8 - todayOrders.length,
      });
    }
  }, [orders]);

  const recentOrders = orders.slice(0, 5);

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

  const statCards = [
    {
      title: 'Commandes totales',
      value: stats.totalOrders,
      icon: Package,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      title: 'Confirmées aujourd\'hui',
      value: stats.confirmedToday,
      icon: CheckCircle,
      color: 'bg-green-500',
      change: '+8%',
    },
    {
      title: 'En attente',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'bg-yellow-500',
      change: '-3%',
    },
    {
      title: 'Livrées aujourd\'hui',
      value: stats.deliveredToday,
      icon: Truck,
      color: 'bg-indigo-500',
      change: '+15%',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600">Vue d'ensemble de vos opérations</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onViewChange('orders')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Package className="h-4 w-4 mr-2" />
            Nouvelle commande
          </button>
          <button
            onClick={() => onViewChange('planning')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Voir planning
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600 truncate">{stat.title}</p>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-2 lg:p-3 rounded-lg ${stat.color} flex-shrink-0`}>
                  <Icon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1 flex-shrink-0" />
                <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                <span className="text-sm text-gray-500 ml-1 truncate">vs mois dernier</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders and Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Commandes récentes</h2>
              <button
                onClick={() => onViewChange('orders')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Voir tout
              </button>
            </div>
            <div className="space-y-3 lg:space-y-4">
              {recentOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                  onClick={() => onOrderClick && onOrderClick(order)}
                >
                  onClick={() => onOrderClick && onOrderClick(order)}
                      <Package className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {order.customer?.name || 'Client inconnu'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {order.quantity} × {order.palette_type?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(order.delivery_date), 'dd MMM', { locale: fr })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 lg:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
            <div className="space-y-3">
              <button
                onClick={() => onViewChange('orders')}
                className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center min-w-0 flex-1">
                  <Package className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                  <span className="font-medium text-blue-900">Créer une commande</span>
                </div>
                <span className="text-blue-600 flex-shrink-0">→</span>
              </button>
              
              <button
                onClick={() => onViewChange('planning')}
                className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center min-w-0 flex-1">
                  <Calendar className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="font-medium text-green-900">Gérer le planning</span>
                </div>
                <span className="text-green-600 flex-shrink-0">→</span>
              </button>
              
              <button
                onClick={() => onViewChange('api')}
                className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center min-w-0 flex-1">
                  <TrendingUp className="h-5 w-5 text-purple-600 mr-3 flex-shrink-0" />
                  <span className="font-medium text-purple-900">Exporter données</span>
                </div>
                <span className="text-purple-600 flex-shrink-0">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;