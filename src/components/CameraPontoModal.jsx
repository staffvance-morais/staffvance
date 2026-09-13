"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  X,
  RotateCcw,
  Check,
  Loader2,
  MapPin,
  Clock,
  ShieldCheck,
  AlertCircle,
  Upload
} from "lucide-react";

export default function CameraPontoModal({
  isOpen,
  onClose,
  escalaId,
  eventoTitulo,
  tipo = "checkin", // "checkin" | "checkout"
  onSucesso,
}) {
  const [stream, setStream] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoBase64, setFotoBase64] = useState(null);
  const [tamanhoKb, setTamanhoKb] = useState(0);

  // Estados de Localização e Horário
  const [coordenadas, setCoordenadas] = useState({ lat: null, lng: null });
  const [statusGps, setStatusGps] = useState("obtendo"); // "obtendo" | "ok" | "erro"
  const [horaAtual, setHoraAtual] = useState("");

  // Estados de Câmera e Envio
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [erroCamera, setErroCamera] = useState("");
  const [enviando, setEnviando] = useState(false);

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      const agora = new Date();
      setHoraAtual(
        agora.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Inicialização ao abrir o modal
  useEffect(() => {
    if (!isOpen) {
      pararCamera();
      setFotoPreview(null);
      setFotoBase64(null);
      setEnviando(false);
      return;
    }

    iniciarGps();
    iniciarCamera();

    return () => {
      pararCamera();
    };
  }, [isOpen]);

  // Captura de GPS
  const iniciarGps = () => {
    setStatusGps("obtendo");
    if (!navigator.geolocation) {
      setStatusGps("erro");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordenadas({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setStatusGps("ok");
      },
      (err) => {
        console.warn("Aviso ao obter GPS:", err.message);
        setStatusGps("erro");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Iniciar fluxo de câmera (frontal)
  const iniciarCamera = async () => {
    setErroCamera("");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Câmera não suportada pelo navegador.");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraAtiva(true);
    } catch (err) {
      console.warn("Erro ao abrir stream de vídeo direto:", err.message);
      setErroCamera(
        "Acesso direto à câmera indisponível. Use o botão abaixo para tirar a foto usando a câmera do seu celular."
      );
      setCameraAtiva(false);
    }
  };

  const pararCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraAtiva(false);
  };

  // Algoritmo de Compressão via Canvas (WebP/JPEG ~60KB)
  const comprimirImagem = (imgSource, larguraMax = 720) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      let width = imgSource.videoWidth || imgSource.width;
      let height = imgSource.videoHeight || imgSource.height;

      if (width > larguraMax) {
        height = Math.round((height * larguraMax) / width);
        width = larguraMax;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      // Espelhar horizontalmente para selfie natural
      if (cameraAtiva) {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(imgSource, 0, 0, width, height);

      // Converte para JPEG com 0.72 de qualidade (ótima nitidez com menos de 70KB)
      const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
      const kb = Math.round((dataUrl.length * 3) / 4 / 1024);
      resolve({ dataUrl, kb });
    });
  };

  // Tirar foto via stream de vídeo
  const capturarFoto = async () => {
    if (!videoRef.current) return;
    const { dataUrl, kb } = await comprimirImagem(videoRef.current);
    setFotoPreview(dataUrl);
    setFotoBase64(dataUrl);
    setTamanhoKb(kb);
    pararCamera();
  };

  // Upload/Captura via Input nativo (Fallback)
  const handleArquivoFallback = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const { dataUrl, kb } = await comprimirImagem(img);
        setFotoPreview(dataUrl);
        setFotoBase64(dataUrl);
        setTamanhoKb(kb);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Resetar para tirar outra foto
  const handleTirarOutra = () => {
    setFotoPreview(null);
    setFotoBase64(null);
    setTamanhoKb(0);
    iniciarCamera();
  };

  // Enviar confirmação de presença
  const handleConfirmar = async () => {
    if (!fotoBase64) {
      alert("Por favor, tire a sua foto para confirmar a presença.");
      return;
    }

    setEnviando(true);
    try {
      const payload = {
        escalaId,
        tipo,
        fotoBase64,
        latitude: coordenadas.lat,
        longitude: coordenadas.lng,
      };

      const res = await fetch("/api/presencas/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao registrar presença.");
      }

      if (onSucesso) onSucesso(data);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erro ao confirmar presença: " + (err.message || "Tente novamente"));
    } finally {
      setEnviando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-sans animate-in fade-in duration-200">
      <div className="bg-[#181818] border border-[#333] w-full max-w-sm rounded-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Cabeçalho */}
        <div className="p-4 border-b border-[#2e2e2e] flex items-center justify-between bg-[#1f1f1f]">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                tipo === "checkin" ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"
              }`}
            >
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-white font-bold text-[15px] leading-tight">
                {tipo === "checkin" ? "Confirmar Chegada (Selfie)" : "Registrar Saída"}
              </h3>
              <p className="text-[11px] text-neutral-400 truncate max-w-[200px]">
                {eventoTitulo || "Operação de Segurança"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={enviando}
            className="text-neutral-400 hover:text-white p-1 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Informações ao Vivo: GPS e Hora */}
        <div className="px-4 py-2 bg-[#121212] border-b border-[#262626] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-neutral-300">
            <Clock size={12} className="text-blue-400" />
            <span className="font-mono font-bold text-white">{horaAtual || "--:--:--"}</span>
          </div>

          <div className="flex items-center gap-1">
            <MapPin
              size={12}
              className={
                statusGps === "ok"
                  ? "text-emerald-400"
                  : statusGps === "erro"
                  ? "text-amber-400"
                  : "text-neutral-400 animate-pulse"
              }
            />
            <span
              className={
                statusGps === "ok"
                  ? "text-emerald-400 font-medium"
                  : statusGps === "erro"
                  ? "text-amber-400"
                  : "text-neutral-400"
              }
            >
              {statusGps === "ok" ? "GPS Localizado" : statusGps === "erro" ? "GPS Indisponível" : "Obtendo GPS..."}
            </span>
          </div>
        </div>

        {/* Visor da Câmera / Preview da Foto */}
        <div className="relative w-full aspect-[4/5] bg-black flex items-center justify-center overflow-hidden">
          {fotoPreview ? (
            // Preview da foto capturada
            <div className="relative w-full h-full">
              <img
                src={fotoPreview}
                alt="Selfie do Ponto"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
                {tamanhoKb} KB (Comprimida)
              </div>
              <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-md p-2 rounded text-[10px] text-neutral-300 flex items-center justify-between">
                <span>Selfie nítida e com uniforme</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check size={12} /> Pronta
                </span>
              </div>
            </div>
          ) : cameraAtiva ? (
            // Feed da Câmera ao vivo
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
              {/* Guia de enquadramento da selfie */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-60 border-2 border-dashed border-white/40 rounded-full" />
              </div>
              <div className="absolute bottom-3 inset-x-0 text-center pointer-events-none">
                <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-neutral-300">
                  Enquadre seu rosto uniformizado
                </span>
              </div>
            </div>
          ) : (
            // Fallback para quando o stream não abre
            <div className="p-6 text-center space-y-3">
              <AlertCircle size={36} className="text-amber-400 mx-auto" />
              <p className="text-[12px] text-neutral-400">{erroCamera || "Abra a câmera para continuar."}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[12px] font-bold px-4 py-2.5 rounded transition-colors cursor-pointer"
              >
                <Camera size={16} />
                <span>Tirar Foto pelo Celular</span>
              </button>
            </div>
          )}

          {/* Input oculto para o fallback */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleArquivoFallback}
            className="hidden"
          />
        </div>

        {/* Rodapé e Botões de Ação */}
        <div className="p-4 bg-[#1f1f1f] border-t border-[#2e2e2e] space-y-2">
          {fotoPreview ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleTirarOutra}
                disabled={enviando}
                className="bg-[#2a2a2a] hover:bg-[#333] text-neutral-300 border border-[#444] py-3 rounded text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw size={15} />
                <span>Tirar Outra</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmar}
                disabled={enviando}
                className="bg-[#16a34a] hover:bg-[#15803d] text-white py-3 rounded text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-lg"
              >
                {enviando ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Confirmar</span>
                  </>
                )}
              </button>
            </div>
          ) : cameraAtiva ? (
            <div className="flex items-center justify-center py-1">
              <button
                type="button"
                onClick={capturarFoto}
                className="w-16 h-16 rounded-full border-4 border-white bg-red-600 hover:bg-red-500 flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform cursor-pointer"
              >
                <Camera size={24} />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={iniciarCamera}
                className="bg-[#2a2a2a] hover:bg-[#333] text-neutral-300 border border-[#444] py-2.5 rounded text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw size={14} />
                <span>Tentar Câmera</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white py-2.5 rounded text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Upload size={14} />
                <span>Abrir Câmera</span>
              </button>
            </div>
          )}

          <p className="text-[10px] text-center text-neutral-500 pt-1">
            🔒 Foto criptografada, comprimida e deletada automaticamente em 24h.
          </p>
        </div>
      </div>
    </div>
  );
}
