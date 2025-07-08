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
    try {
      // Nécessite service role key côté serveur, ici on suppose que le SDK côté admin est configuré
      const { error } = await supabase.auth.admin.inviteUserByEmail(customer.email);
      if (error) throw error;
      toast.success(`Invitation envoyée à ${customer.email}`);
    } catch (err: any) {
      toast.error(err.message);
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestion des clients</h1>
      <button onClick={handleAdd} className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Ajouter un client</button>
      {loading ? <div>Chargement...</div> : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Nom</th>
              <th className="p-2 border">Téléphone</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Adresse</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id}>
                <td className="p-2 border">{c.name}</td>
                <td className="p-2 border">{c.phone}</td>
                <td className="p-2 border">{c.email}</td>
                <td className="p-2 border">{c.address}</td>
                <td className="p-2 border">
                  <button onClick={() => handleEdit(c)} className="mr-2 px-2 py-1 bg-yellow-400 rounded">Modifier</button>
                  <button onClick={() => handleDelete(c.id)} className="mr-2 px-2 py-1 bg-red-500 text-white rounded">Supprimer</button>
                  <button onClick={() => handleInvite(c)} className="px-2 py-1 bg-green-600 text-white rounded">Inviter</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <form onSubmit={handleModalSubmit} className="bg-white p-6 rounded shadow space-y-4 min-w-[320px]">
            <h2 className="text-lg font-bold mb-2">{isEdit ? 'Modifier' : 'Ajouter'} un client</h2>
            <input type="text" placeholder="Nom" value={editCustomer.name} onChange={e => setEditCustomer(c => ({ ...c, name: e.target.value }))} required className="w-full border p-2 rounded" />
            <input type="tel" placeholder="Téléphone" value={editCustomer.phone} onChange={e => setEditCustomer(c => ({ ...c, phone: e.target.value }))} required className="w-full border p-2 rounded" />
            <input type="email" placeholder="Email" value={editCustomer.email} onChange={e => setEditCustomer(c => ({ ...c, email: e.target.value }))} required className="w-full border p-2 rounded" />
            <input type="text" placeholder="Adresse" value={editCustomer.address} onChange={e => setEditCustomer(c => ({ ...c, address: e.target.value }))} className="w-full border p-2 rounded" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">{isEdit ? 'Enregistrer' : 'Ajouter'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement; 