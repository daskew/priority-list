// Vercel API route for priorities CRUD with Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ztoiuatbnlrfhgxnfipc.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_3Xb5oMlfhUBuYjdSEKugCw_1cEBH9hT';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { method } = req;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get user from token
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization required' });
  }
  
  const userId = authHeader.replace('Bearer ', '');
  if (!userId) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Verify user exists
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();
    
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    switch (method) {
      case 'GET':
        // GET /api/priorities - list all for user
        const { data: priorities, error: listError } = await supabase
          .from('priorities')
          .select('id, title, notes, item_order, created_at, updated_at')
          .eq('user_id', userId)
          .order('item_order', { ascending: true });
        
        if (listError) throw listError;
        
        // Format for frontend
        const formatted = priorities.map(p => ({
          id: p.id,
          title: p.title,
          notes: p.notes || '',
          order: p.item_order,
          createdAt: p.created_at,
          updatedAt: p.updated_at
        }));
        
        return res.status(200).json(formatted);
      
      case 'POST':
        // POST /api/priorities - create
        const { title, notes = '' } = req.body;
        
        if (!title) {
          return res.status(400).json({ error: 'Title is required' });
        }
        
        // Get max order
        const { data: maxOrder } = await supabase
          .from('priorities')
          .select('item_order')
          .eq('user_id', userId)
          .order('item_order', { ascending: false })
          .limit(1)
          .single();
        
        const newOrder = maxOrder ? maxOrder.item_order + 1 : 0;
        
        const { data: newPriority, error: createError } = await supabase
          .from('priorities')
          .insert({
            user_id: userId,
            title,
            notes,
            item_order: newOrder
          })
          .select()
          .single();
        
        if (createError) throw createError;
        
        return res.status(201).json({
          id: newPriority.id,
          title: newPriority.title,
          notes: newPriority.notes || '',
          order: newPriority.item_order,
          createdAt: newPriority.created_at,
          updatedAt: newPriority.updated_at
        });
      
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('Priorities API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
