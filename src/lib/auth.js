import { supabase } from '@/lib/supabase';

export async function loginStaff(email, password) {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return { success: false, error: authError.message };
  }

  const { data: perfilData, error: perfilError } = await supabase
    .from('perfis')
    .select('role')
    .eq('id', authData.user.id)
    .single();

  if (perfilError) {
    return { success: false, error: perfilError.message };
  }

  return { 
    success: true, 
    user: authData.user,
    role: perfilData.role 
  };
}

export async function signUpStaff(email, password, userData) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nome_completo: userData.nome_completo,
        cpf: userData.cpf,
        whatsapp: userData.whatsapp,
        data_nascimento: userData.data_nascimento,
        chave_pix: userData.chave_pix,
        foto_url: userData.foto_url,
      },
      emailRedirectTo: undefined,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function logoutStaff() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}