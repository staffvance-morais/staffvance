export default function SolidButton({
  children,
  variant = "primary",
  icon: Icon,
  className = "",
  as: Component = "button",
  ...props
}) {
  const baseClasses =
    "flex p-3 w-full cursor-pointer items-center justify-center gap-3 border-2 text-2xl transition-colors disabled:cursor-not-allowed disabled:opacity-50";

  const variantClasses = {
    primary:
      "font-semibold text-white border-green-500 bg-green-600 hover:border-green-400 hover:bg-green-500",
    secondary:
      "font-semibold text-white border-blue-600 bg-blue-700 hover:border-blue-500 hover:bg-blue-600",
    tertiary:
      "text-neutral-300 border-neutral-600 bg-neutral-700 hover:border-neutral-500 hover:bg-neutral-600",
  };

  return (
    <Component
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${className}`}
      {...props}
    >
      {Icon && <Icon className="h-6 w-6 shrink-0 text-neutral-400" />}
      {children && <span>{children}</span>}
    </Component>
  );
}