"use client";

import { useState } from "react";
import LegalModal from "./LegalModal";

export default function Footer({ className = "" }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("termos");

  const openLegalModal = (type) => {
    setModalType(type);
    setModalOpen(true);
  };

  return (
    <>
      <footer
        className={`mt-8 flex flex-col gap-1.5 text-center text-sm text-neutral-700 ${className}`}
      >
        <p>© 2026 Sunset Field Solutions.</p>
        <p>Todos os direitos reservados.</p>
        <div className="flex items-center justify-center gap-2 pt-1 text-xs text-neutral-700">
          <button
            type="button"
            onClick={() => openLegalModal("termos")}
            className="cursor-pointer underline transition-colors hover:text-neutral-400"
          >
            Termos de Serviço
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => openLegalModal("privacidade")}
            className="cursor-pointer underline transition-colors hover:text-neutral-400"
          >
            Política de Privacidade
          </button>
        </div>
      </footer>

      <LegalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
      />
    </>
  );
}