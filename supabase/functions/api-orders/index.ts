import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface CreateOrderRequest {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address?: string;
  palette_type_id: string;
  quantity: number;
  delivery_address: string;
  delivery_date: string;
  notes?: string;
  created_via_api?: boolean;
}

interface Order {
  id: string;
  customer_id: string;
  palette_type_id: string;
  quantity: number;
  delivery_address: string;
  delivery_date: string;
  time_slot_id?: string;
  status: 'pending' | 'provisional' | 'confirmed' | 'delivered' | 'cancelled';
  notes?: string;
  created_via_api: boolean;
  created_at: string;
  updated_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Extract and validate JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const method = req.method

    // Handle time slots generation endpoint (doit être avant la logique des commandes)
    if (pathParts.length >= 3 && pathParts[2] === 'generate-slots' && method === 'POST') {
      const { start_date, days_ahead } = await req.json();
      
      const { data, error } = await supabaseClient
        .rpc('api_generate_time_slots', {
          start_date: start_date || new Date().toISOString().split('T')[0],
          days_ahead: days_ahead || 30
        });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Route handling - Accept both /commandes and direct POST
    if ((pathParts.length >= 3 && pathParts[2] === 'commandes') || 
        (method === 'POST' && pathParts.length >= 2)) {
      const orderId = pathParts[3]
      const action = pathParts[4]

      switch (method) {
        case 'GET':
          if (orderId) {
            // Get specific order
            const { data, error } = await supabaseClient
              .from('orders')
              .select(`
                *,
                customer:customers(*),
                palette_type:palette_types(*),
                time_slot:time_slots(*)
              `)
              .eq('id', orderId)
              .single()

            if (error) {
              return new Response(JSON.stringify({ error: error.message }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              })
            }

            return new Response(JSON.stringify(data), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          } else {
            // Get all orders
            const { data, error } = await supabaseClient
              .from('orders')
              .select(`
                *,
                customer:customers(*),
                palette_type:palette_types(*),
                time_slot:time_slots(*)
              `)
              .order('created_at', { ascending: false })

            if (error) {
              return new Response(JSON.stringify({ error: error.message }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              })
            }

            return new Response(JSON.stringify(data), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

        case 'POST':
          // Create new order
          const orderData = await req.json();

          // Nouvelle gestion : items multiples
          const items = orderData.items || [
            {
              palette_type_id: orderData.palette_type_id,
              quantity: orderData.quantity
            }
          ];

          // Validation
          if (!orderData.customer_name || !orderData.customer_phone ||
              !items.length || !orderData.delivery_address || !orderData.delivery_date) {
            return new Response(JSON.stringify({
              error: 'Missing required fields'
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          // Create or find customer
          let customerId = ''
          const { data: existingCustomer } = await supabaseClient
            .from('customers')
            .select('id')
            .eq('phone', orderData.customer_phone)
            .single()

          if (existingCustomer) {
            customerId = existingCustomer.id
          } else {
            // Create new customer
            const { data: newCustomer, error: customerError } = await supabaseClient
              .from('customers')
              .insert([{
                name: orderData.customer_name,
                phone: orderData.customer_phone,
                email: orderData.customer_email,
                address: orderData.customer_address
              }])
              .select()
              .single()

            if (customerError) {
              return new Response(JSON.stringify({ error: customerError.message }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              })
            }

            customerId = newCustomer.id
          }

          // Crée la commande (pour compatibilité, on garde le premier item dans orders)
          const { data: newOrder, error: orderError } = await supabaseClient
            .from('orders')
            .insert([{
              customer_id: customerId,
              palette_type_id: items[0].palette_type_id,
              quantity: items[0].quantity,
              delivery_address: orderData.delivery_address,
              delivery_date: orderData.delivery_date,
              time_slot_id: orderData.time_slot_id || null,
              status: 'provisional',
              notes: orderData.notes,
              created_via_api: orderData.created_via_api || true
            }])
            .select('*')
            .single()

          if (orderError) {
            return new Response(JSON.stringify({ error: orderError.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          // Insère les items dans order_items
          const itemsToInsert = items.map(item => ({
            order_id: newOrder.id,
            palette_type_id: item.palette_type_id,
            quantity: item.quantity
          }));

          const { error: itemsError } = await supabaseClient
            .from('order_items')
            .insert(itemsToInsert)

          if (itemsError) {
            return new Response(JSON.stringify({ error: itemsError.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          // Met à jour la capacité utilisée du créneau si un créneau est sélectionné
          if (orderData.time_slot_id) {
            const { error: slotError } = await supabaseClient
              .from('time_slots')
              .update({ 
                used_capacity: supabaseClient.raw('used_capacity + 1'),
                status: supabaseClient.raw('CASE WHEN used_capacity + 1 >= capacity THEN \'full\' ELSE status END')
              })
              .eq('id', orderData.time_slot_id);

            if (slotError) {
              console.error('Error updating time slot capacity:', slotError);
              // On ne fait pas échouer la création de commande pour cette erreur
            }
          }

          // Retourne la commande avec ses items
          const { data: orderWithItems, error: fetchError } = await supabaseClient
            .from('orders')
            .select(`
              *,
              customer:customers(*),
              palette_type:palette_types(*),
              time_slot:time_slots(*),
              order_items(*)
            `)
            .eq('id', newOrder.id)
            .single()

          if (fetchError) {
            return new Response(JSON.stringify({ error: fetchError.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          return new Response(JSON.stringify(orderWithItems), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })

        case 'PUT':
          if (orderId && action === 'valider') {
            // Confirm order
            const { data, error } = await supabaseClient
              .from('orders')
              .update({ 
                status: 'confirmed',
                updated_at: new Date().toISOString()
              })
              .eq('id', orderId)
              .select()
              .single()

            if (error) {
              return new Response(JSON.stringify({ error: error.message }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              })
            }

            return new Response(JSON.stringify(data), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }
          break

        case 'DELETE':
          if (orderId) {
            // Récupère d'abord la commande pour connaître le créneau
            const { data: orderToCancel, error: fetchError } = await supabaseClient
              .from('orders')
              .select('time_slot_id')
              .eq('id', orderId)
              .single();

            if (fetchError) {
              return new Response(JSON.stringify({ error: fetchError.message }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              })
            }

            // Diminue la capacité utilisée du créneau si la commande avait un créneau
            if (orderToCancel.time_slot_id) {
              const { error: slotError } = await supabaseClient
                .from('time_slots')
                .update({ 
                  used_capacity: supabaseClient.raw('GREATEST(used_capacity - 1, 0)'),
                  status: supabaseClient.raw('CASE WHEN used_capacity - 1 < capacity THEN \'available\' ELSE status END')
                })
                .eq('id', orderToCancel.time_slot_id);

              if (slotError) {
                console.error('Error updating time slot capacity:', slotError);
              }
            }

            // Cancel order
            const { data, error } = await supabaseClient
              .from('orders')
              .update({ 
                status: 'cancelled',
                updated_at: new Date().toISOString()
              })
              .eq('id', orderId)
              .select()
              .single()

            if (error) {
              return new Response(JSON.stringify({ error: error.message }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              })
            }

            return new Response(JSON.stringify(data), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }
          break
      }
    }

    // Handle agenda endpoint
    if (pathParts.length >= 3 && pathParts[2] === 'agenda' && method === 'GET') {
      const { data, error } = await supabaseClient
        .from('time_slots')
        .select('*')
        .eq('status', 'available')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { 
      status: 404, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('API Error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})