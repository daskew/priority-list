// Simple test endpoint
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ztoiuatbnlrfhgxnfipc.supabase.co';
const supabaseKey = 'sb_publishable_3Xb5oMlfhUBuYjdSEKugCw_1cEBH9hT';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Test simple query
    const { data, error } = await supabase.from('users').select('count');
    
    if (error) {
      return res.status(500).json({ error: error.message, detail: 'Query error' });
    }
    
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
