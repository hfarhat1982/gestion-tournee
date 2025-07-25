import React from 'react';
import { X, CheckCircle, Edit } from 'lucide-react';
import { Order } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onStatusUpdate: (orderId: string, newStatus: Order['status']) => void;
  onDeleteOrder: (orderId: string) => void;
  onEditOrder?: (order: Order) => void;
  paletteTypes: any[];
  userType?: string;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
  onStatusUpdate,
  onDeleteOrder,
  onEditOrder,
  paletteTypes,
  userType
}) => {
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
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

  const handleStatusUpdate = (newStatus: Order['status']) => {
    onStatusUpdate(order.id, newStatus);
    onClose();
  };

  const handleCancel = () => {
    onStatusUpdate(order.id, 'cancelled');
    onClose();
  };

  const handleDelete = () => {
    onDeleteOrder(order.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Détails de la commande #{order.id.slice(0, 8)}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <p className="text-sm text-gray-900">{order.customer?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <p className="text-sm text-gray-900">{order.customer?.phone}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Produits commandés</label>
              {order?.order_items && order.order_items.length > 0 ? (
                <div className="space-y-2">
                  {order.order_items.map((item, index) => (
                    <div key={item.id || index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-900">
                        {item.palette_type?.name || paletteTypes.find(pt => pt.id === item.palette_type_id)?.name || `Type ${item.palette_type_id}`}
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
                      {order?.palette_type?.name || 'Type inconnu'}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {order.quantity} ×
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse de livraison</label>
              <p className="text-sm text-gray-900">{order.delivery_address}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de livraison</label>
                <p className="text-sm text-gray-900">
                  {format(new Date(order.delivery_date), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
            </div>

            {order.time_slot && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Créneau horaire</label>
                <p className="text-sm text-gray-900">
                  {format(new Date(`2000-01-01T${order.time_slot.start_time}`), 'HH:mm')} - {format(new Date(`2000-01-01T${order.time_slot.end_time}`), 'HH:mm')}
                </p>
              </div>
            )}

            {order.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <p className="text-sm text-gray-900">{order.notes}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              {/* Bouton modifier - visible pour admin et collaborateur */}
              {(userType === 'admin' || userType === 'collaborateur') && onEditOrder && (
                <button
                  onClick={() => {
                    onEditOrder(order);
                    onClose();
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </button>
              )}
              
              {order.status !== 'cancelled' && (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    Annuler la commande
                  </button>
                  
                  {order.status === 'provisional' && (
                    <button
                      onClick={() => handleStatusUpdate('confirmed')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Confirmer
                    </button>
                  )}
                  
                  {(order.status === 'confirmed' || order.status === 'provisional') && (
                    <button
                      onClick={() => handleStatusUpdate('delivered')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Marquer comme livrée
                    </button>
                  )}
                </>
              )}
              
              {/* Bouton supprimer - visible seulement pour les admins */}
              {userType === 'admin' && order.status === 'cancelled' && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Supprimer définitivement
                </button>
              )}
              
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;