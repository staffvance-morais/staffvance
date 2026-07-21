import { supabase } from '@/lib/supabase';

// 1. Função de Login Inteligente
export async function loginStaff(email, password) {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return { success: false, error: authError.message };
  }

  // Busca qual é o cargo dessa pessoa na tabela perfis
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

// 2. Função de Cadastro Completo (Atualizada para evitar confirmação de e-mail)
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
      // Este comando ajuda a não forçar o redirecionamento de e-mail de confirmação
      emailRedirectTo: undefined,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// 3. Função de Sair do Sistema (Logout)
export async function logoutStaff() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}