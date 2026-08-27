export default function FormNotice({
  children,
  className = "",
  as: Component = "p",
  ...props
}) {
  return (
    <Component
      className={`w-full text-left text-base font-normal text-neutral-400 leading-normal ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

