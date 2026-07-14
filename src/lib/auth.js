import { supabase } from '@/lib/supabase';

// Função existente de login...
export async function loginStaff(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// NOVA FUNÇÃO: Cadastro de novo usuário com nome
export async function signUpStaff(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName, // É aqui que o gatilho do banco vai ler o nome!
      },
    },
  });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}