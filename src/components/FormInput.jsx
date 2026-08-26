export default function FormInput({ icon: Icon, className = "", ...props }) {
  return (
    <div
      className={`flex h-15 w-full items-center gap-4 border-2 border-neutral-600 bg-neutral-700 px-4 text-neutral-400 transition-all focus-within:border-neutral-500 ${className}`}
    >
      {Icon && <Icon className="h-8 w-8 shrink-0 text-neutral-400" />}
      <input
        {...props}
        className="w-full bg-transparent text-2xl text-neutral-200 outline-none placeholder:text-neutral-400"
      />
    </div>
  );
}