import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Eye, CheckCircle, X, Edit, Package, RefreshCw } from 'lucide-react';
import { Order, Customer, PaletteType } from '../types';
import { useOrderStore } from '../stores/orderStore';
import { useAuthStore } from '../stores/authStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import OrderForm from './OrderForm';
import { supabase } from '../lib/supabase';

const OrderManagement: React.FC = () => {
  const { orders, customers, paletteTypes, fetchOrders, fetchCustomers, fetchPaletteTypes, updateOrderStatus, deleteOrder } = useOrderStore();
  const { user, userType } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [generatingSlots, setGeneratingSlots] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchPaletteTypes();
  }, [fetchOrders, fetchCustomers, fetchPaletteTypes]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.palette_type?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.delivery_address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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

  const exportToCSV = () => {
    const headers = ['ID', 'Client', 'Types de palette', 'Quantités', 'Adresse', 'Date', 'Statut'];
    const csvData = filteredOrders.map(order => {
      if (order.order_items && order.order_items.length > 0) {
        const types = order.order_items.map((item: any) => paletteTypes.find(pt => pt.id === item.palette_type_id)?.name || item.palette_type_id).join(' | ');
        const quantities = order.order_items.map((item: any) => item.quantity).join(' | ');
        return [
          order.id,
          order.customer?.name || '',
          types,
          quantities,
          order.delivery_address,
          format(new Date(order.delivery_date), 'dd/MM/yyyy'),
          getStatusLabel(order.status)
        ];
      } else {
        return [
          order.id,
          order.customer?.name || '',
          order.palette_type?.name || '',
          order.quantity,
          order.delivery_address,
          format(new Date(order.delivery_date), 'dd/MM/yyyy'),
          getStatusLabel(order.status)
        ];
      }
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `commandes_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOrderCreated = async () => {
    await fetchOrders();
    toast.success('Commande créée avec succès !');
    setShowOrderForm(false);
  };

  const generateTimeSlots = async () => {
    setGeneratingSlots(true);
    try {
      console.log('Début de la génération des créneaux...');
      
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      console.log('Token récupéré:', !!accessToken);

      const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_API_ORDERS_URL;
      console.log('URL de la fonction:', functionsUrl);
      
      const payload = {
        start_date: new Date().toISOString().split('T')[0],
        days_ahead: 30
      };
      console.log('Payload envoyé:', payload);

      const response = await fetch(`${functionsUrl}/generate-slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
        },
        body: JSON.stringify(payload)
      });

      console.log('Réponse reçue:', response.status, response.statusText);

      const responseText = await response.text();
      console.log('Réponse brute:', responseText);

      if (!response.ok) {
        let errorMessage = 'Erreur lors de la génération des créneaux';
        
        if (responseText.trim()) {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorMessage;
          } catch (jsonParseError) {
            errorMessage = responseText;
          }
        } else {
          errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      let result;
      if (responseText.trim()) {
        try {
          result = JSON.parse(responseText);
          console.log('Résultat de la génération:', result);
        } catch (jsonParseError) {
          console.error('Erreur lors du parsing du résultat:', jsonParseError);
          result = { message: 'Créneaux générés avec succès' };
        }
      } else {
        result = { message: 'Créneaux générés avec succès' };
      }
      
      toast.success('Créneaux horaires générés avec succès !');
    } catch (error: any) {
      console.error('Erreur complète:', error);
      toast.error(error.message || 'Erreur lors de la génération des créneaux');
    } finally {
      setGeneratingSlots(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des commandes</h1>
          <p className="text-gray-600">Suivez et gérez toutes vos commandes</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {userType === 'admin' && (
            <button
              onClick={generateTimeSlots}
              disabled={generatingSlots}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${generatingSlots ? 'animate-spin' : ''}`} />
              {generatingSlots ? 'Génération...' : 'Générer créneaux'}
            </button>
          )}
          
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Exporter CSV
          </button>
          
          <button
            onClick={() => setShowOrderForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouvelle commande
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par client, type de palette ou adresse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Order['status'] | 'all')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="provisional">Provisoire</option>
              <option value="confirmed">Confirmée</option>
              <option value="delivered">Livrée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table - Desktop */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commande
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Livraison
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr 
                  key={order.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={(e) => {
                    if (!(e.target as HTMLElement).closest('button')) {
                      setSelectedOrder(order);
                    }
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          #{order.id.slice(0, 8)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.customer?.name || 'Client inconnu'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.customer?.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      {order.order_items && order.order_items.length > 0 ? (
                        <ul className="text-sm text-gray-900">
                          {order.order_items.map((item: any, idx: number) => (
                            <li key={idx}>
                              {item.quantity} × {paletteTypes.find(pt => pt.id === item.palette_type_id)?.name || item.palette_type_id}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm font-medium text-gray-900">
                          {order.palette_type?.name || 'Type inconnu'}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {format(new Date(order.delivery_date), 'dd MMM yyyy', { locale: fr })}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {order.delivery_address}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {order.status === 'provisional' && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="Confirmer"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'delivered')}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Marquer comme livré"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-gray-600 hover:text-gray-900 p-1 rounded"
                        title="Voir détails"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Supprimer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Orders Cards - Mobile */}
      <div className="lg:hidden space-y-4">
        {filteredOrders.map((order) => (
          <div 
            key={order.id} 
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:bg-gray-50"
            onClick={(e) => {
              if (!(e.target as HTMLElement).closest('button')) {
                setSelectedOrder(order);
              }
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    #{order.id.slice(0, 8)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                  </div>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div>
                <span className="text-xs font-medium text-gray-500">Client:</span>
                <p className="text-sm text-gray-900">{order.customer?.name || 'Client inconnu'}</p>
                <p className="text-xs text-gray-500">{order.customer?.phone}</p>
              </div>
              
              <div>
                <span className="text-xs font-medium text-gray-500">Produit:</span>
                {order.order_items && order.order_items.length > 0 ? (
                  <ul className="text-sm text-gray-900">
                    {order.order_items.map((item: any, idx: number) => (
                      <li key={idx}>
                        {item.quantity} × {paletteTypes.find(pt => pt.id === item.palette_type_id)?.name || item.palette_type_id}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-900">
                    {order.quantity} × {order.palette_type?.name || 'Type inconnu'}
                  </p>
                )}
              </div>
              
              <div>
                <span className="text-xs font-medium text-gray-500">Livraison:</span>
                <p className="text-sm text-gray-900">
                  {format(new Date(order.delivery_date), 'dd MMM yyyy', { locale: fr })}
                </p>
                <p className="text-xs text-gray-500 truncate">{order.delivery_address}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                {order.status === 'provisional' && (
                  <button
                    onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                    className="text-green-600 hover:text-green-900 p-2 rounded-lg bg-green-50"
                    title="Confirmer"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                )}
                {order.status === 'confirmed' && (
                  <button
                    onClick={() => handleStatusUpdate(order.id, 'delivered')}
                    className="text-blue-600 hover:text-blue-900 p-2 rounded-lg bg-blue-50"
                    title="Marquer comme livré"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="text-gray-600 hover:text-gray-900 p-2 rounded-lg bg-gray-50"
                  title="Voir détails"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => handleDeleteOrder(order.id)}
                className="text-red-600 hover:text-red-900 p-2 rounded-lg bg-red-50"
                title="Supprimer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Order Form Modal */}
      {showOrderForm && (
        <OrderForm
          onClose={() => setShowOrderForm(false)}
          onSuccess={handleOrderCreated}
        />
      )}

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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type(s) de palette</label>
                    {selectedOrder?.order_items && selectedOrder.order_items.length > 0 ? (
                      <ul className="text-sm text-gray-900">
                        {selectedOrder.order_items.map((item: any, idx: number) => (
                          <li key={idx}>
                            {item.quantity} × {paletteTypes.find(pt => pt.id === item.palette_type_id)?.name || item.palette_type_id}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-900">{selectedOrder?.palette_type?.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                    <p className="text-sm text-gray-900">{selectedOrder.quantity}</p>
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
    </div>
  );
};

export default OrderManagement;