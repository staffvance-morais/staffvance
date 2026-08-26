export default function AuthCard({ children }) {
  return (
    <div className="flex w-full flex-col items-center gap-4 border-2 border-neutral-700 bg-neutral-800 px-6 py-12 text-center">
      {children}
    </div>
  );
}