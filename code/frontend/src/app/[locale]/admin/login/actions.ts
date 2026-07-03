"use server";

import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/routing';

export async function adminLogin(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { data: authData, error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  // Check if they are actually an admin
  const role = authData.user.user_metadata?.role;
  
  if (role !== 'admin') {
    // Force sign out because they are not an admin
    await supabase.auth.signOut();
    return { error: 'Tài khoản của bạn không có quyền Quản trị viên (Admin).' };
  }

  redirect({ href: '/admin', locale: 'vi' }); 
}
