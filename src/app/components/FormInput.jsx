export default function FormInput({ icon: Icon, ...props }) {
  return (
    <div className="flex w-full items-center gap-4 border-2 border-neutral-600 bg-neutral-700 p-4 text-neutral-400 transition-all focus-within:border-neutral-500">
      {Icon && <Icon className="h-8 w-8 shrink-0" />}
      <input
        {...props}
        className="w-full bg-transparent text-2xl outline-none placeholder:text-neutral-400"
      />
    </div>
  );
}