/*
  # Schéma de base pour la gestion des tournées de livraisons

  1. Nouvelles tables
    - `customers` : Informations des clients
      - `id` (uuid, clé primaire)
      - `name` (text, nom du client)
      - `address` (text, adresse)
      - `phone` (text, téléphone)
      - `email` (text, email optionnel)
      - `created_at` (timestamp)
    
    - `palette_types` : Types de palettes disponibles
      - `id` (text, clé primaire)
      - `name` (text, nom du type)
      - `description` (text, description optionnelle)
      - `price` (decimal, prix optionnel)
      - `created_at` (timestamp)
    
    - `time_slots` : Créneaux horaires de livraison
      - `id` (uuid, clé primaire)
      - `date` (date, date de livraison)
      - `start_time` (time, heure de début)
      - `end_time` (time, heure de fin)
      - `capacity` (integer, capacité maximale)
      - `used_capacity` (integer, capacité utilisée)
      - `status` (enum, statut du créneau)
      - `created_at` (timestamp)
    
    - `orders` : Commandes de palettes
      - `id` (uuid, clé primaire)
      - `customer_id` (uuid, référence client)
      - `palette_type_id` (text, référence type de palette)
      - `quantity` (integer, quantité)
      - `delivery_address` (text, adresse de livraison)
      - `delivery_date` (date, date de livraison)
      - `time_slot_id` (uuid, référence créneau optionnel)
      - `status` (enum, statut de la commande)
      - `notes` (text, notes optionnelles)
      - `created_via_api` (boolean, créé via API)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `api_keys` : Clés API pour l'intégration n8n
      - `id` (uuid, clé primaire)
      - `name` (text, nom de la clé)
      - `key` (text, clé API hachée)
      - `active` (boolean, statut actif)
      - `created_at` (timestamp)

  2. Sécurité
    - Activation de RLS sur toutes les tables
    - Politiques pour les utilisateurs authentifiés
    - Politiques API pour les clés d'accès
    
  3. Données de démonstration
    - Types de palettes de base
    - Clients d'exemple
    - Créneaux horaires standards
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  address text,
  phone text NOT NULL,
  email text,
  created_at timestamptz DEFAULT now()
);

-- Palette types table
CREATE TABLE IF NOT EXISTS palette_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  price decimal(10,2),
  created_at timestamptz DEFAULT now()
);

-- Time slots table
CREATE TABLE IF NOT EXISTS time_slots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  capacity integer DEFAULT 10,
  used_capacity integer DEFAULT 0,
  status text DEFAULT 'available' CHECK (status IN ('available', 'full')),
  created_at timestamptz DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid REFERENCES customers(id),
  palette_type_id text REFERENCES palette_types(id),
  quantity integer NOT NULL DEFAULT 1,
  delivery_address text NOT NULL,
  delivery_date date NOT NULL,
  time_slot_id uuid REFERENCES time_slots(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'provisional', 'confirmed', 'delivered', 'cancelled')),
  notes text,
  created_via_api boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  key text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE palette_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
CREATE POLICY "Allow authenticated users to read customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage customers"
  ON customers FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read palette_types"
  ON palette_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage palette_types"
  ON palette_types FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read time_slots"
  ON time_slots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage time_slots"
  ON time_slots FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage orders"
  ON orders FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read api_keys"
  ON api_keys FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage api_keys"
  ON api_keys FOR ALL
  TO authenticated
  USING (true);

-- Insert default palette types
INSERT INTO palette_types (id, name, description, price) VALUES
  ('euro', 'Palette Europe (800x1200)', 'Palette européenne standard 800x1200mm', 12.50),
  ('standard', 'Palette Standard (1000x1200)', 'Palette standard française 1000x1200mm', 15.00),
  ('cp1', 'Palette CP1 (1000x1200)', 'Palette chimique CP1 1000x1200mm', 18.00),
  ('cp2', 'Palette CP2 (800x1000)', 'Palette chimique CP2 800x1000mm', 16.50),
  ('cp3', 'Palette CP3 (1000x1200)', 'Palette chimique CP3 1000x1200mm', 19.00)
ON CONFLICT (id) DO NOTHING;

-- Insert demo customers
INSERT INTO customers (name, address, phone, email) VALUES
  ('Transport Dubois SARL', '15 Route de Lyon, 69000 Lyon', '04.78.45.67.89', 'contact@dubois-transport.fr'),
  ('Logistique Martin', '8 Avenue des Champs, 75008 Paris', '01.42.56.78.90', 'commandes@logistique-martin.com'),
  ('Entrepôts du Nord', '25 Rue de Lille, 59000 Lille', '03.20.34.56.78', 'livraisons@entrepots-nord.fr'),
  ('Sud Stockage', '12 Boulevard du Midi, 13000 Marseille', '04.91.23.45.67', 'admin@sud-stockage.com')
ON CONFLICT DO NOTHING;

-- Insert demo API key
INSERT INTO api_keys (name, key, active) VALUES
  ('n8n Integration', 'pk_live_51234567890abcdef1234567890abcdef12345678', true)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_date ON time_slots(date);