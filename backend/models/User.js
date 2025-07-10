const { supabase } = require('../database');

// Add new user
const createUser = async (name, email) => {
  const { data, error } = await supabase
    .from('users')
    .insert([{ name, email }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get user by email
const getUserByEmail = async (email) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) throw error;
  return data;
};
