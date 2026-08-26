import Divider from "./Divider";

export default function FormSectionHeader({ title, className = "" }) {
  return (
    <div className={`flex w-full flex-col gap-1 text-left ${className}`}>
      <h2 className="text-2xl font-semibold text-neutral-400">{title}</h2>
      <Divider />
    </div>
  );
}

