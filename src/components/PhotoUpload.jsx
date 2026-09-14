"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import { ImagePlus, Check, Loader2, UserRound } from "lucide-react";
import imageCompression from "browser-image-compression";

export default function PhotoUpload({
  fotoPreview,
  setFotoPreview,
  setFotoArquivo,
  isCompressing,
  setIsCompressing,
  onError,
  hasError = false,
}) {
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (fotoPreview) {
        URL.revokeObjectURL(fotoPreview);
      }
    };
  }, [fotoPreview]);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    if (onError) onError("");

    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1024,
      useWebWorker: false,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      if (fotoPreview) {
        URL.revokeObjectURL(fotoPreview);
      }
      setFotoArquivo(compressedFile);
      setFotoPreview(URL.createObjectURL(compressedFile));
    } catch (err) {
      if (onError) onError("Erro ao processar a imagem. Tente outra foto.");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleClick = () => {
    if (fileInputRef.current && !isCompressing) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`relative flex w-full items-end justify-between border-2 p-4 transition-colors ${
      hasError ? "border-red-500 bg-red-950/20" : "border-neutral-700 bg-neutral-800"
    }`}>
      <div
        onClick={handleClick}
        className="relative flex h-48 w-48 cursor-pointer items-center justify-center overflow-hidden border border-neutral-400 bg-white transition-opacity hover:opacity-90"
        title="Clique para selecionar uma foto de perfil"
      >
        {isCompressing ? (
          <div className="flex flex-col items-center gap-2 p-2 text-center text-neutral-600">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-xs font-semibold">Processando...</span>
          </div>
        ) : fotoPreview ? (
          <Image
            src={fotoPreview}
            alt="Preview da Foto de Perfil"
            fill
            sizes="192px"
            unoptimized
            className="object-cover"
          />
        ) : (
          <UserRound className="h-24 w-24 text-neutral-300" />
        )}
      </div>

      <button
        type="button"
        onClick={handleClick}
        disabled={isCompressing}
        aria-label="Upload de foto de perfil"
        className={`flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center border-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          fotoPreview
            ? "border-green-500 bg-green-600 hover:border-green-400 hover:bg-green-500 text-white"
            : "border-blue-600 bg-blue-700 hover:border-blue-500 hover:bg-blue-600 text-white"
        }`}
      >
        {isCompressing ? (
          <Loader2 className="h-7 w-7 animate-spin text-white" />
        ) : fotoPreview ? (
          <Check className="h-7 w-7" />
        ) : (
          <ImagePlus className="h-7 w-7" />
        )}
      </button>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
