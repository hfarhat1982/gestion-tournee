import React, { useState, useEffect } from 'react';
import { X, User, Package, MapPin, Calendar, Phone, Mail } from 'lucide-react';
import { useOrderStore } from '../stores/orderStore';
import { Customer, PaletteType } from '../types';
import toast from 'react-hot-toast';
import { format, addDays } from 'date-fns';
import { supabase } from '../lib/supabase';

interface OrderFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ onClose, onSuccess }) => {
  const { customers, paletteTypes, timeSlots, createOrder, fetchCustomers, fetchPaletteTypes, fetchTimeSlots } = useOrderStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    delivery_address: '',
    delivery_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    notes: '',
    created_via_api: false,
    time_slot_id: '',
  });
  const [items, setItems] = useState([
    { palette_type_id: '', quantity: 1 }
  ]);

  useEffect(() => {
    fetchCustomers();
    fetchPaletteTypes();
    fetchTimeSlots();
  }, [fetchCustomers, fetchPaletteTypes, fetchTimeSlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Construction de la payload pour la Deno function
      const payload = {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email,
        customer_address: formData.customer_address,
        delivery_address: formData.delivery_address,
        delivery_date: formData.delivery_date,
        notes: formData.notes,
        created_via_api: formData.created_via_api,
        time_slot_id: formData.time_slot_id && !formData.time_slot_id.startsWith('demo-') ? formData.time_slot_id : undefined,
        items: items.filter(item => item.palette_type_id && item.quantity > 0)
      };

      // Récupère le token d'accès de l'utilisateur connecté
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_API_ORDERS_URL;
      const response = await fetch(functionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création de la commande');
      }

      toast.success('Commande créée avec succès !');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création de la commande');
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

  const handleItemChange = (index: number, field: string, value: string | number) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, { palette_type_id: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
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
                <h3 className="text-lg font-medium text-gray-900">Produits</h3>
              </div>
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type de palette *
                      </label>
                      <select
                        value={item.palette_type_id}
                        onChange={e => handleItemChange(idx, 'palette_type_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Sélectionner un type</option>
                        {paletteTypes.map(pt => (
                          <option key={pt.id} value={pt.id}>{pt.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantité *
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      {items.length > 1 && (
                        <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700 px-2 py-1 rounded">
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button type="button" onClick={handleAddItem} className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                  + Ajouter un type de palette
                </button>
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

                <div>
                  <label htmlFor="time_slot_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Créneau horaire
                  </label>
                  <select
                    id="time_slot_id"
                    name="time_slot_id"
                    value={formData.time_slot_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un créneau (optionnel)</option>
                    {timeSlots.length > 0 ? (
                      (() => {
                        const filteredSlots = timeSlots.filter(slot =>
                          format(new Date(slot.date), 'yyyy-MM-dd') === formData.delivery_date &&
                          slot.status === 'available'
                        );
                        
                        if (filteredSlots.length > 0) {
                          return filteredSlots.map(slot => {
                            const availablePlaces = slot.capacity - slot.used_capacity;
                            const isFull = availablePlaces <= 0;
                            
                            return (
                              <option key={slot.id} value={slot.id} disabled={isFull}>
                                {format(new Date(`2000-01-01T${slot.start_time}`), 'HH:mm')} - {format(new Date(`2000-01-01T${slot.end_time}`), 'HH:mm')} ({availablePlaces} places disponibles)
                              </option>
                            );
                          });
                        } else {
                          return (
                            <>
                              <option value="" disabled>Aucun créneau disponible pour le {format(new Date(formData.delivery_date), 'dd/MM/yyyy')}</option>
                              {/* Créneaux de démonstration */}
                              {Array.from({ length: 10 }, (_, i) => {
                                const hour = 8 + i;
                                const startTime = `${hour.toString().padStart(2, '0')}:00`;
                                const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
                                return (
                                  <option key={`demo-${i}`} value={`demo-${i}`} disabled>
                                    {startTime} - {endTime} (5 places disponibles) - DÉMO
                                  </option>
                                );
                              })}
                            </>
                          );
                        }
                      })()
                    ) : (
                      <>
                        <option value="" disabled>Aucun créneau trouvé en base de données</option>
                        {/* Créneaux de démonstration si aucun créneau n'est trouvé */}
                        {Array.from({ length: 10 }, (_, i) => {
                          const hour = 8 + i;
                          const startTime = `${hour.toString().padStart(2, '0')}:00`;
                          const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
                          return (
                            <option key={`demo-${i}`} value={`demo-${i}`} disabled>
                              {startTime} - {endTime} (5 places disponibles) - DÉMO
                            </option>
                          );
                        })}
                      </>
                    )}
                  </select>
                  {timeSlots.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Aucun créneau trouvé en base de données. Les créneaux de démonstration sont désactivés.
                    </p>
                  )}
                  {timeSlots.length > 0 && timeSlots.filter(slot => slot.date === formData.delivery_date && slot.status === 'available').length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Aucun créneau disponible pour cette date. Les créneaux de démonstration sont désactivés.
                    </p>
                  )}
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