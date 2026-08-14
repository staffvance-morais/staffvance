import Footer from "./Footer";

export default function AuthLayout({ children }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center rounded-none bg-neutral-900 p-6 font-sans text-center">
      <div
        className="relative flex w-full max-w-sm flex-col items-center [@media(min-width:1024px)_and_(pointer:fine)]:scale-80"
      >
        {children}
      </div>
      <Footer />
    </div>
  );
}