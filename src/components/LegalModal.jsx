"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import Divider from "./Divider";
import SolidButton from "./SolidButton";
import { TERMOS_DE_SERVICO, POLITICA_DE_PRIVACIDADE, TERMO_USO_IMAGEM } from "@/lib/legalContent";

export default function LegalModal({
  isOpen = false,
  onClose,
  type = "termos",
}) {
  const modalContentRef = useRef(null);

  const data =
    type === "privacidade"
      ? POLITICA_DE_PRIVACIDADE
      : type === "imagem"
      ? TERMO_USO_IMAGEM
      : TERMOS_DE_SERVICO;

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen && onClose) {
        onClose();
      }
    }

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && modalContentRef.current) {
      modalContentRef.current.scrollTop = 0;
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="relative flex h-[85vh] max-h-200 w-full max-w-lg md:max-w-xl flex-col border-2 border-neutral-700 bg-neutral-800 p-4 sm:p-6 text-neutral-300 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex w-full justify-end mb-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center border-2 border-neutral-600 bg-neutral-700 text-neutral-400 transition-colors hover:border-neutral-500 hover:bg-neutral-600 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div
          ref={modalContentRef}
          className="flex-1 overflow-y-auto pr-2 sm:pr-4 space-y-4 text-sm sm:text-base text-neutral-300 leading-relaxed scrollbar-thin scrollbar-thumb-neutral-600"
        >
          <div className="space-y-1 text-left">
            <h2 className="text-xl sm:text-2xl font-semibold text-neutral-200">
              {data.title}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400">
              {data.subtitle}
            </p>
          </div>

          <Divider />

          <div className="border border-neutral-700 bg-neutral-900/60 p-3 sm:p-4 text-xs sm:text-sm text-neutral-400 space-y-1 text-left">
            <p className="font-semibold text-neutral-300">
              WADJET SEGURANÇA LTDA — CNPJ: 54.011.901/0001-08
            </p>
            <p>
              Desenvolvimento e Gestão Tecnológica:{" "}
              <span className="text-neutral-300">Sunset Field Solutions</span>
            </p>
            <p className="text-[11px] sm:text-xs text-neutral-500 pt-1">
              Última atualização: {data.lastUpdated}
            </p>
          </div>

          {data.sections.map((section, idx) => (
            <div key={idx} className="space-y-2 text-left">
              <h3 className="text-sm sm:text-base font-semibold text-neutral-200">
                {section.title}
              </h3>
              <div className="space-y-1.5 text-xs sm:text-sm text-neutral-400">
                {section.content.map((paragraph, pIdx) => (
                  <p key={pIdx} className="text-justify leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 pb-3">
          <Divider />
        </div>

        <SolidButton
          type="button"
          onClick={onClose}
          variant="tertiary"
          className="w-full shrink-0"
        >
          Voltar
        </SolidButton>
      </div>
    </div>
  );
}
