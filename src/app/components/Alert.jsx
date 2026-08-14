export default function Alert({ children, variant = "error" }) {
  if (!children) return null;

  const baseClasses =
    "mb-6 w-full border-2 p-4 text-center text-xl text-white font-semibold";

  const variantClasses = {
    error: "border-red-600 bg-red-700",
    success: "border-green-500 bg-green-600",
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </div>
  );
}