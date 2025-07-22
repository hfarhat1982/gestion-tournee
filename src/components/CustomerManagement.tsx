import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

const emptyCustomer = { id: '', name: '', phone: '', email: '', address: '' };

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer>(emptyCustomer);
  const [isEdit, setIsEdit] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { userType } = useAuthStore();

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('customers').select('*').order('name');
    if (error) toast.error(error.message);
    else setCustomers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleEdit = (customer: Customer) => {
    setEditCustomer(customer);
    setIsEdit(true);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditCustomer(emptyCustomer);
    setIsEdit(false);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce client ?')) return;
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Client supprimé');
      fetchCustomers();
    }
  };

  const handleInvite = async (customer: Customer) => {
    if (!customer.email) {
      toast.error('Ce client n\'a pas d\'email.');
      return;
    }
    
    if (userType !== 'admin') {
      toast.error('Seuls les administrateurs peuvent envoyer des invitations.');
      return;
    }
    
    try {
      // Utilise la fonction edge pour envoyer l'invitation
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ email: customer.email })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'envoi de l\'invitation');
      }
      
      toast.success(`Invitation envoyée à ${customer.email}`);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'envoi de l\'invitation');
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      const { error } = await supabase.from('customers').update({
        name: editCustomer.name,
        phone: editCustomer.phone,
        email: editCustomer.email,
        address: editCustomer.address
      }).eq('id', editCustomer.id);
      if (error) toast.error(error.message);
      else toast.success('Client modifié');
    } else {
      const { error } = await supabase.from('customers').insert({
        name: editCustomer.name,
        phone: editCustomer.phone,
        email: editCustomer.email,
        address: editCustomer.address
      });
      if (error) toast.error(error.message);
      else toast.success('Client ajouté');
    }
    setShowModal(false);
    fetchCustomers();
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des clients</h1>
          <p className="text-gray-600">Gérez vos clients et leurs accès</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Ajouter un client
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adresse</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.email || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.address || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(c)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {userType === 'admin' && (
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        {c.email && userType === 'admin' && (
                          <button
                            onClick={() => handleInvite(c)}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Inviter"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      {showModal && (
          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {filteredCustomers.map(c => (
              <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{c.name}</h3>
                    <p className="text-sm text-gray-600">{c.phone}</p>
                  </div>
                  {c.email && (
                    <div>
                      <span className="text-xs font-medium text-gray-500">Email:</span>
                      <p className="text-sm text-gray-900">{c.email}</p>
                    </div>
                  )}
                  {c.address && (
                    <div>
                      <span className="text-xs font-medium text-gray-500">Adresse:</span>
                      <p className="text-sm text-gray-900">{c.address}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(c)}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-lg bg-blue-50"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {userType === 'admin' && (
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-red-600 hover:text-red-900 p-2 rounded-lg bg-red-50"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      {c.email && userType === 'admin' && (
                        <button
                          onClick={() => handleInvite(c)}
                          className="text-green-600 hover:text-green-900 p-2 rounded-lg bg-green-50"
                          title="Inviter"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {isEdit ? 'Modifier' : 'Ajouter'} un client
              </h2>
              <form onSubmit={handleModalSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input
                    type="text"
    </div>
  );
};

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {filteredCustomers.map(c => (
              <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{c.name}</h3>
                    <p className="text-sm text-gray-600">{c.phone}</p>
                  </div>
                  {c.email && (
                    <div>
                      <span className="text-xs font-medium text-gray-500">Email:</span>
                      <p className="text-sm text-gray-900">{c.email}</p>
                    </div>
                  )}
                  {c.address && (
                    <div>
                      <span className="text-xs font-medium text-gray-500">Adresse:</span>
                      <p className="text-sm text-gray-900">{c.address}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(c)}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-lg bg-blue-50"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {userType === 'admin' && (
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-red-600 hover:text-red-900 p-2 rounded-lg bg-red-50"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      {c.email && userType === 'admin' && (
                        <button
                          onClick={() => handleInvite(c)}
                          className="text-green-600 hover:text-green-900 p-2 rounded-lg bg-green-50"
                          title="Inviter"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

export default CustomerManagement; 