"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Contact,
  Handshake,
  Calendar,
  Wallet,
  Menu,
  X,
  SquareChevronDown,
  LogOut,
  UserRound,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Divider from "./Divider";
import LegalModal from "./LegalModal";
import SolidButton from "./SolidButton";

const ROLE_MENUS = {
  admin: [
    { label: "Página inicial", href: "/admin", icon: Home },
    { label: "Equipe", href: "/admin/funcionarios", icon: Contact },
    { label: "Clientes", href: "/admin/clientes", icon: Handshake },
    { label: "Eventos", href: "/admin/eventos", icon: Calendar },
    { label: "Financeiro", href: "/admin/financeiro", icon: Wallet },
  ],
  coordenador: [
    { label: "Página inicial", href: "/coordenador", icon: Home },
    { label: "Equipe", href: "/coordenador/equipe", icon: Contact },
    { label: "Clientes", href: "/coordenador/clientes", icon: Handshake },
    { label: "Eventos", href: "/coordenador/eventos", icon: Calendar },
  ],
  producao: [
    { label: "Página inicial", href: "/producao", icon: Home },
    { label: "Equipe", href: "/producao/equipe", icon: Contact },
    { label: "Clientes", href: "/producao/clientes", icon: Handshake },
    { label: "Eventos", href: "/producao/eventos", icon: Calendar },
  ],
  staff: [
    { label: "Página inicial", href: "/freelancers", icon: Home },
    { label: "Eventos", href: "/freelancers/eventos", icon: Calendar },
  ],
  freelancer: [
    { label: "Página inicial", href: "/freelancers", icon: Home },
    { label: "Eventos", href: "/freelancers/eventos", icon: Calendar },
  ],
};

const ROLE_LABELS = {
  admin: "Perfil de Administração",
  coordenador: "Perfil de Coordenação",
  producao: "Perfil de Produção",
  produção: "Perfil de Produção",
  staff: "Perfil de Staff",
  freelancer: "Perfil de Staff",
};

export default function AppNavigation({
  userRole,
  userProfile,
  className = "",
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profile, setProfile] = useState(userProfile || null);
  const [role, setRole] = useState(userRole || null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("termos");

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (userProfile && userRole) return;

    async function fetchUserData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("perfis")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!error && data) {
          setProfile(data);
          const detectedRole = (data.role || "staff").toLowerCase();
          setRole(detectedRole);
        }
      } catch (err) {
        console.error("Erro ao carregar dados de navegação:", err);
      }
    }

    fetchUserData();
  }, [userProfile, userRole]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const openLegalModal = (type) => {
    setModalType(type);
    setModalOpen(true);
  };

  const effectiveRole =
    role && ROLE_MENUS[role]
      ? role
      : role?.includes("admin")
      ? "admin"
      : role?.includes("coord")
      ? "coordenador"
      : (role?.includes("prod") || role === "produção")
      ? "producao"
      : "staff";

  const menuItems = ROLE_MENUS[effectiveRole] || ROLE_MENUS.staff;
  const roleLabel = ROLE_LABELS[effectiveRole] || "Perfil de Staff";
  const displayName =
    profile?.nome_completo?.split(" ")[0] || profile?.nome || "Usuário";

  return (
    <>
      <div className={`w-full max-w-sm mx-auto ${className}`}>
        <div className="w-full border-2 border-neutral-700 bg-neutral-800 p-4 flex justify-between items-center">
          <div className="relative h-9 w-9 flex items-center justify-center opacity-40 grayscale hover:opacity-70 transition-opacity">
            <Image
              src="/icon.png"
              alt="Logo Wadjet"
              width={36}
              height={36}
              className="h-full w-full object-contain"
            />
          </div>

          <SolidButton
            type="button"
            onClick={() => setIsMenuOpen(true)}
            variant="tertiary"
            aria-label="Abrir menu de navegação"
            className="!h-12 !w-12 !p-0"
          >
            <Menu className="h-6 w-6" />
          </SolidButton>
        </div>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 transition-opacity duration-300 animate-in fade-in"
            onClick={() => setIsMenuOpen(false)}
          />

          <div className="relative h-full w-full max-w-sm z-10 border-2 border-neutral-700 bg-neutral-800 p-4 text-neutral-300 flex flex-col justify-between overflow-hidden animate-in slide-in-from-bottom-6 duration-300 ease-out">
            <div className="flex justify-between items-start p-1">
              <div className="text-left text-sm text-neutral-500 space-y-1">
                <p>© 2026 Sunset Field Solutions.</p>
                <p>Todos os direitos reservados.</p>
                <div className="flex items-center gap-1.5 pt-0.5 text-xs text-neutral-500">
                  <button
                    type="button"
                    onClick={() => openLegalModal("termos")}
                    className="cursor-pointer underline transition-colors hover:text-neutral-200"
                  >
                    Termos de Serviço
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => openLegalModal("privacidade")}
                    className="cursor-pointer underline transition-colors hover:text-neutral-200"
                  >
                    Política de Privacidade
                  </button>
                </div>
                <p className="pt-3 text-sm text-neutral-500">
                  {roleLabel}
                </p>
              </div>

              <SolidButton
                type="button"
                onClick={() => setIsMenuOpen(false)}
                variant="tertiary"
                aria-label="Fechar menu"
                className="h-12! w-12! p-0!"
              >
                <X className="h-6 w-6" />
              </SolidButton>
            </div>

            <div className="flex flex-col gap-2.5 pt-4">
              <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[45vh] pr-0.5">
                {menuItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <SolidButton
                      key={idx}
                      as={Link}
                      href={item.href}
                      prefetch={true}
                      onClick={() => setIsMenuOpen(false)}
                      variant="tertiary"
                      icon={Icon}
                      className={`!justify-start !px-4 !text-xl shrink-0 ${
                        isActive ? "!border-neutral-500 !bg-neutral-650 !text-white" : ""
                      }`}
                    >
                      {item.label}
                    </SolidButton>
                  );
                })}
              </div>

              <div className="border-2 border-neutral-600 bg-neutral-700 p-4 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-neutral-600 bg-neutral-900 flex items-center justify-center">
                    {profile?.foto_url ? (
                      <Image
                        src={profile.foto_url}
                        alt="Foto do perfil"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <UserRound className="h-7 w-7 text-neutral-500" />
                    )}
                  </div>

                  <div className="flex flex-col text-left overflow-hidden">
                    <span className="truncate text-lg font-semibold text-white leading-tight">
                      {displayName}
                    </span>
                    <span className="text-xs text-neutral-400">
                      Toque para saber mais
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sair da conta"
                  className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center border border-neutral-500 bg-neutral-800 text-neutral-400 hover:bg-red-950/40 hover:text-red-400 hover:border-red-600 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>

              <div className="pt-1 pb-1">
                <Divider />
              </div>

              <div className="flex justify-between items-center">
                <div className="relative h-9 w-9 flex items-center justify-center opacity-40 grayscale">
                  <Image
                    src="/icon.png"
                    alt="Logo Wadjet"
                    width={36}
                    height={36}
                    className="h-full w-full object-contain"
                  />
                </div>

                <SolidButton
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  variant="tertiary"
                  aria-label="Recolher menu"
                  className="!h-12 !w-12 !p-0"
                >
                  <SquareChevronDown className="h-6 w-6" />
                </SolidButton>
              </div>
            </div>
          </div>
        </div>
      )}

      <LegalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
      />
    </>
  );
}
