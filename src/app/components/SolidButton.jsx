export default function SolidButton({
  children,
  variant = "primary",
  icon: Icon,
  ...props
}) {
  const baseClasses =
    "flex w-full cursor-pointer items-center justify-center gap-3 border-2 py-4 text-2xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

  const variantClasses = {
    primary:
      "text-white border-green-500 bg-green-600 hover:border-green-400 hover:bg-green-500",
    secondary:
      "text-white border-blue-600 bg-blue-700 hover:border-blue-500 hover:bg-blue-600",
    tertiary:
      "text-neutral-400 border-neutral-600 bg-neutral-700 hover:border-neutral-500 hover:bg-neutral-600",
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`} {...props}>
      {Icon && <Icon className="h-6 w-6 shrink-0" />}
      <span>{children}</span>
    </button>
  );
}