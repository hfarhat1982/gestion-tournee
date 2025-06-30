import React, { useState, useEffect } from 'react';
import { X, User, Package, MapPin, Calendar, Phone, Mail } from 'lucide-react';
import { useOrderStore } from '../stores/orderStore';
import { Customer, PaletteType } from '../types';
import toast from 'react-hot-toast';
import { format, addDays } from 'date-fns';

interface OrderFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ onClose, onSuccess }) => {
  const { customers, paletteTypes, createOrder, fetchCustomers, fetchPaletteTypes } = useOrderStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    palette_type_id: '',
    quantity: 1,
    delivery_address: '',
    delivery_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    notes: '',
    created_via_api: false,
  });

  useEffect(() => {
    fetchCustomers();
    fetchPaletteTypes();
  }, [fetchCustomers, fetchPaletteTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, create or find customer
      let customerId = '';
      const existingCustomer = customers.find(c => 
        c.phone === formData.customer_phone || c.email === formData.customer_email
      );

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        // For demo purposes, we'll use a generated ID
        customerId = `customer_${Date.now()}`;
      }

      const orderData = {
        customer_id: customerId,
        palette_type_id: formData.palette_type_id,
        quantity: formData.quantity,
        delivery_address: formData.delivery_address,
        delivery_date: formData.delivery_date,
        status: 'provisional' as const,
        notes: formData.notes,
        created_via_api: formData.created_via_api,
      };

      await createOrder(orderData);
      toast.success('Commande créée avec succès !');
      onSuccess();
    } catch (error) {
      toast.error('Erreur lors de la création de la commande');
      console.error('Error creating order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Nouvelle commande</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-4">
                <User className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Informations client</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du client *
                  </label>
                  <input
                    type="text"
                    id="customer_name"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="customer_phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    id="customer_phone"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="customer_email"
                    name="customer_email"
                    value={formData.customer_email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="customer_address" className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse client
                  </label>
                  <input
                    type="text"
                    id="customer_address"
                    name="customer_address"
                    value={formData.customer_address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Product Information */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-4">
                <Package className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Produit</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="palette_type_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Type de palette *
                  </label>
                  <select
                    id="palette_type_id"
                    name="palette_type_id"
                    value={formData.palette_type_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Sélectionner un type</option>
                    <option value="euro">Palette Europe (800x1200)</option>
                    <option value="standard">Palette Standard (1000x1200)</option>
                    <option value="cp1">Palette CP1 (1000x1200)</option>
                    <option value="cp2">Palette CP2 (800x1000)</option>
                    <option value="cp3">Palette CP3 (1000x1200)</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Quantité *
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    min="1"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-4">
                <MapPin className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Livraison</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="delivery_address" className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse de livraison *
                  </label>
                  <input
                    type="text"
                    id="delivery_address"
                    name="delivery_address"
                    value={formData.delivery_address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="delivery_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date de livraison souhaitée *
                  </label>
                  <input
                    type="date"
                    id="delivery_date"
                    name="delivery_date"
                    value={formData.delivery_date}
                    onChange={handleInputChange}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes et instructions
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Instructions spéciales, horaires préférés, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="created_via_api"
                name="created_via_api"
                checked={formData.created_via_api}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="created_via_api" className="ml-2 block text-sm text-gray-700">
                Commande créée via API n8n (test)
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 order-2 sm:order-1"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
              >
                {loading ? 'Création...' : 'Créer la commande'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;