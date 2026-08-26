/**
 * Aplica máscara de CPF no formato 000.000.000-00
 * @param {string} value
 * @returns {string}
 */
export function maskCPF(value = "") {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/**
 * Aplica máscara de telefone/WhatsApp no formato (00) 00000-0000 ou (00) 0000-0000
 * @param {string} value
 * @returns {string}
 */
export function maskPhone(value = "") {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  
  if (digits.length <= 2) {
    return digits.length > 0 ? `(${digits}` : "";
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Remove qualquer caractere não numérico
 * @param {string} value
 * @returns {string}
 */
export function unmask(value = "") {
  return value.replace(/\D/g, "");
}

