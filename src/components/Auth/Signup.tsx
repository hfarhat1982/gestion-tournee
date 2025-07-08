import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const Signup: React.FC = () => {
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password
      });
      if (error) throw error;
      // Crée le customer dans la table customers
      const { error: custError } = await supabase.from('customers').insert({
        name: form.name,
        phone: form.phone,
        address: form.address,
        email: form.email,
        id: data.user?.id // lie le customer à l'user
      });
      if (custError) throw custError;
      toast.success('Inscription réussie ! Vérifiez vos emails.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto mt-8 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Créer un compte client</h2>
      <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required className="w-full border p-2 rounded" />
      <input name="password" type="password" placeholder="Mot de passe" value={form.password} onChange={handleChange} required className="w-full border p-2 rounded" />
      <input name="name" type="text" placeholder="Nom" value={form.name} onChange={handleChange} required className="w-full border p-2 rounded" />
      <input name="phone" type="tel" placeholder="Téléphone" value={form.phone} onChange={handleChange} required className="w-full border p-2 rounded" />
      <input name="address" type="text" placeholder="Adresse" value={form.address} onChange={handleChange} className="w-full border p-2 rounded" />
      <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">{loading ? 'Création...' : 'Créer le compte'}</button>
    </form>
  );
};

export default Signup; 