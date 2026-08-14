export default function LinkButton({ children, ...props }) {
  return (
    <button
      type="button"
      className="-mt-2 cursor-pointer text-xl text-neutral-400 underline transition-colors hover:text-neutral-300"
      {...props}
    >
      {children}
    </button>
  );
}