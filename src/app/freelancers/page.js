"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import HeaderSuperior from "@/components/HeaderSuperior";
import AppNavigation from "@/components/AppNavigation";

export default function DashboardFreelancer() {
  const router = useRouter();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarPerfil() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push("/");
          return;
        }

        const { data: perfilData, error: perfilError } = await supabase
          .from("perfis")
          .select("*")
          .eq("id", user.id)
          .single();

        if (perfilError) throw perfilError;
        setPerfil(perfilData);
      } catch (error) {
        console.error("Erro ao carregar perfil:", error.message);
        router.push("/");
      } finally {
        setLoading(false);
      }
    }

    carregarPerfil();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <span className="text-neutral-500 font-medium animate-pulse">
          Carregando informações...
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

      <AppNavigation userProfile={perfil} userRole="staff" />
    </div>
  );
}