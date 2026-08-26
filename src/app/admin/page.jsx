"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import HeaderSuperior from "@/components/HeaderSuperior";
import AppNavigation from "@/components/AppNavigation";

export default function AdminPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    async function checkSecurity() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      const { data: perfilData } = await supabase
        .from("perfis")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!perfilData || perfilData.role !== "admin") {
        router.push("/freelancers");
      } else {
        setPerfil(perfilData);
        setIsAuthorized(true);
      }
    }

    checkSecurity();
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <span className="text-neutral-500 font-medium animate-pulse">
          Verificando credenciais...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-300 font-sans flex flex-col justify-between p-4">
      <div className="w-full max-w-sm mx-auto">
        <HeaderSuperior />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center my-8 text-center px-4">
        <p className="text-neutral-500 text-2xl font-normal">
          Em desenvolvimento
        </p>
      </main>

      <AppNavigation userProfile={perfil} userRole="admin" />
    </div>
  );
}