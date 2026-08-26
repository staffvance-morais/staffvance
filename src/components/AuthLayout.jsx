import Footer from "./Footer";

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-neutral-900 px-6 py-8 font-sans text-center">
      <div className="flex w-full max-w-sm flex-1 flex-col items-center justify-center">
        {children}
      </div>
      <Footer />
    </div>
  );
}