// Simple test endpoint - test insert
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = 'https://ztoiuatbnlrfhgxnfipc.supabase.co';
const supabaseKey = 'sb_publishable_3Xb5oMlfhUBuYjdSEKugCw_1cEBH9hT';

const supabase = createClient(supabaseUrl, supabaseKey);

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const salt = generateSalt();
    const hash = crypto.pbkdf2Sync('test123', salt, 100000, 64, 'sha512').toString('hex');
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: 'inserttest@test.com',
        name: 'Insert Test',
        password_hash: salt + ':' + hash
      })
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ error: error.message, code: error.code });
    }
    
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message, name: err.name });
  }
}
