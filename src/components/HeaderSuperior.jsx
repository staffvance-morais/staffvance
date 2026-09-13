"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SmilePlus,
  Home,
  Contact,
  Calendar,
  Users,
  DollarSign,
  MapPin,
  LockKeyhole,
  KeyRound,
  ChevronRight,
} from "lucide-react";
import Divider from "./Divider";

const ROUTE_CONFIG = {
  "/cadastro": {
    icon: SmilePlus,
    items: [{ label: "Cadastre-se" }],
  },
  "/coordenador": {
    icon: Home,
    items: [{ label: "Página inicial" }],
  },
  "/admin": {
    icon: Home,
    items: [{ label: "Página inicial" }],
  },
  "/freelancers": {
    icon: Home,
    items: [{ label: "Página inicial" }],
  },
  "/dashboard": {
    icon: Home,
    items: [{ label: "Página inicial" }],
  },
  "/coordenador/equipe": {
    icon: Contact,
    items: [{ label: "Equipe" }],
  },
  "/coordenador/equipe/novo": {
    icon: Contact,
    items: [
      { label: "Equipe", href: "/coordenador/equipe" },
      { label: "Cadastrar funcionário" },
    ],
  },
  "/admin/funcionarios": {
    icon: Contact,
    items: [{ label: "Equipe" }],
  },
  "/admin/funcionarios/novo": {
    icon: Contact,
    items: [
      { label: "Equipe", href: "/admin/funcionarios" },
      { label: "Cadastrar funcionário" },
    ],
  },
  "/freelancers/eventos": {
    icon: Calendar,
    items: [{ label: "Eventos" }],
  },
  "/coordenador/eventos": {
    icon: Calendar,
    items: [{ label: "Eventos" }],
  },
  "/coordenador/eventos/cadastrar": {
    icon: Calendar,
    items: [
      { label: "Eventos", href: "/coordenador/eventos" },
      { label: "Cadastrar evento" },
    ],
  },
  "/admin/eventos": {
    icon: Calendar,
    items: [{ label: "Eventos" }],
  },
  "/admin/eventos/cadastrar": {
    icon: Calendar,
    items: [
      { label: "Eventos", href: "/admin/eventos" },
      { label: "Cadastrar evento" },
    ],
  },
  "/admin/clientes": {
    icon: Users,
    items: [{ label: "Clientes" }],
  },
  "/admin/clientes/cadastrar": {
    icon: Users,
    items: [
      { label: "Clientes", href: "/admin/clientes" },
      { label: "Cadastrar cliente" },
    ],
  },
  "/coordenador/clientes": {
    icon: Users,
    items: [{ label: "Clientes" }],
  },
  "/coordenador/clientes/cadastrar": {
    icon: Users,
    items: [
      { label: "Clientes", href: "/coordenador/clientes" },
      { label: "Cadastrar cliente" },
    ],
  },
  "/admin/financeiro": {
    icon: DollarSign,
    items: [{ label: "Financeiro" }],
  },
  "/admin/escalas": {
    icon: Calendar,
    items: [{ label: "Escalas" }],
  },
  "/mapa": {
    icon: MapPin,
    items: [{ label: "Mapa" }],
  },
  "/esqueci-senha": {
    icon: KeyRound,
    items: [{ label: "Esqueci a senha" }],
  },
  "/nova-senha": {
    icon: LockKeyhole,
    items: [{ label: "Nova senha" }],
  },
};

function resolveRouteConfig(pathname) {
  if (!pathname) return null;

  if (ROUTE_CONFIG[pathname]) {
    return ROUTE_CONFIG[pathname];
  }

  if (pathname.includes("/equipe/") || pathname.includes("/funcionarios/")) {
    const isCoordenador = pathname.startsWith("/coordenador");
    const baseHref = isCoordenador ? "/coordenador/equipe" : "/admin/funcionarios";
    return {
      icon: Contact,
      items: [
        { label: "Equipe", href: baseHref },
        { label: pathname.endsWith("/novo") ? "Cadastrar funcionário" : "Detalhes do funcionário" },
      ],
    };
  }

  if (pathname.includes("/eventos/")) {
    const isCoordenador = pathname.startsWith("/coordenador");
    const baseHref = isCoordenador ? "/coordenador/eventos" : "/admin/eventos";
    let subAction = "Detalhes do evento";
    if (pathname.endsWith("/escalar")) subAction = "Escalar equipe";
    else if (pathname.endsWith("/alocar")) subAction = "Alocar equipe";
    else if (pathname.endsWith("/editar")) subAction = "Editar evento";
    else if (pathname.endsWith("/cadastrar")) subAction = "Cadastrar evento";

    return {
      icon: Calendar,
      items: [
        { label: "Eventos", href: baseHref },
        { label: subAction },
      ],
    };
  }

  if (pathname.includes("/clientes/")) {
    const isCoordenador = pathname.startsWith("/coordenador");
    const baseHref = isCoordenador ? "/coordenador/clientes" : "/admin/clientes";
    return {
      icon: Users,
      items: [
        { label: "Clientes", href: baseHref },
        { label: "Detalhes do cliente" },
      ],
    };
  }

  if (pathname.includes("/financeiro/")) {
    return {
      icon: DollarSign,
      items: [
        { label: "Financeiro", href: "/admin/financeiro" },
        { label: "Detalhes financeiros" },
      ],
    };
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return { icon: Home, items: [{ label: "Página inicial" }] };
  }

  const items = segments.map((seg, idx) => {
    const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
    const href = "/" + segments.slice(0, idx + 1).join("/");
    return { label, href: idx < segments.length - 1 ? href : undefined };
  });

  return { icon: Home, items };
}

export default function HeaderSuperior({
  icon: customIcon,
  title: customTitle,
  items: customItems,
  breadcrumbs: customBreadcrumbs,
  className = "",
  showDivider = true,
}) {
  const pathname = usePathname();

  const autoConfig = resolveRouteConfig(pathname);
  const IconComponent = customIcon || autoConfig?.icon || Home;

  let resolvedItems = [];
  if (customItems || customBreadcrumbs) {
    resolvedItems = customItems || customBreadcrumbs;
  } else if (customTitle) {
    resolvedItems = [{ label: customTitle }];
  } else if (autoConfig?.items) {
    resolvedItems = autoConfig.items;
  } else {
    resolvedItems = [{ label: "Página inicial" }];
  }

  const itemsList = resolvedItems.map((item) =>
    typeof item === "string" ? { label: item } : item
  );

  return (
    <div className={`flex w-full flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2 text-base font-normal text-neutral-300">
        {IconComponent && (
          <IconComponent className="h-6 w-6 shrink-0 text-neutral-300" />
        )}

        <nav aria-label="Breadcrumb" className="flex items-center gap-2 overflow-hidden">
          {itemsList.map((item, index) => {
            const isLast = index === itemsList.length - 1;
            return (
              <React.Fragment key={index}>
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
                )}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="truncate text-neutral-400 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={`truncate ${
                      isLast ? "text-neutral-300" : "text-neutral-400"
                    }`}
                  >
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {showDivider && <Divider />}
    </div>
  );
}
