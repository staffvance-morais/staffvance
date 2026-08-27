export default function Alert({ children, variant = "error", className = "" }) {
  if (!children) return null;

  const baseClasses =
    "w-full border-2 p-3 text-center text-sm font-semibold text-white transition-all";

  const variantClasses = {
    error: "border-red-800 bg-red-900",
    success: "border-green-500 bg-green-600",
  };

  return (
    <div
      role="alert"
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.error} ${className}`}
    >
      {children}
    </div>
  );
}