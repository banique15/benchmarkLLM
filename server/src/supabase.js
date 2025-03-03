import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize the Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-supabase-service-role-key';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Missing Supabase environment variables. Using placeholder values for development.');
  console.warn('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file for production use.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default supabase;