// Vercel API route for reordering priorities with Supabase
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
    if (method !== 'PATCH') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { ids } = req.body;
    
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    // Update order for each priority (only if owned by user)
    for (let i = 0; i < ids.length; i++) {
      const { error: updateError } = await supabase
        .from('priorities')
        .update({ 
          item_order: i,
          updated_at: new Date().toISOString()
        })
        .eq('id', ids[i])
        .eq('user_id', userId); // Ensure ownership
      
      if (updateError) {
        console.error('Error updating priority:', ids[i], updateError);
      }
    }

    // Fetch updated priorities
    const { data: priorities, error: fetchError } = await supabase
      .from('priorities')
      .select('id, title, notes, item_order, created_at, updated_at')
      .eq('user_id', userId)
      .order('item_order', { ascending: true });
    
    if (fetchError) throw fetchError;

    const formatted = priorities.map(p => ({
      id: p.id,
      title: p.title,
      notes: p.notes || '',
      order: p.item_order,
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }));
    
    return res.status(200).json(formatted);
    
  } catch (err) {
    console.error('Reorder error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
