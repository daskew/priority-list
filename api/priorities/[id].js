// Vercel API route for single priority CRUD with Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ztoiuatbnlrfhgxnfipc.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_3Xb5oMlfhUBuYjdSEKugCw_1cEBH9hT';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { method, query } = req;
  const { id } = query;
  
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
    // Get priority (only if owned by user)
    const { data: priority, error: getError } = await supabase
      .from('priorities')
      .select('id, user_id, title, notes, item_order, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (getError || !priority) {
      return res.status(404).json({ error: 'Priority not found' });
    }

    switch (method) {
      case 'GET':
        return res.status(200).json({
          id: priority.id,
          title: priority.title,
          notes: priority.notes || '',
          order: priority.item_order,
          createdAt: priority.created_at,
          updatedAt: priority.updated_at
        });
      
      case 'PUT':
        const { title, notes, order } = req.body;
        
        const updates = {
          updated_at: new Date().toISOString()
        };
        
        if (title !== undefined) updates.title = title;
        if (notes !== undefined) updates.notes = notes;
        if (order !== undefined) updates.item_order = order;
        
        const { data: updated, error: updateError } = await supabase
          .from('priorities')
          .update(updates)
          .eq('id', id)
          .eq('user_id', userId) // Ensure ownership
          .select()
          .single();
        
        if (updateError) throw updateError;
        
        return res.status(200).json({
          id: updated.id,
          title: updated.title,
          notes: updated.notes || '',
          order: updated.item_order,
          createdAt: updated.created_at,
          updatedAt: updated.updated_at
        });
      
      case 'DELETE':
        const { error: deleteError } = await supabase
          .from('priorities')
          .delete()
          .eq('id', id)
          .eq('user_id', userId); // Ensure ownership
        
        if (deleteError) throw deleteError;
        
        return res.status(204).end();
      
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('Priority CRUD error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
