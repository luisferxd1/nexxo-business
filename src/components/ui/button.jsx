export function Button({ children, variant = "default", className = "", ...props }) {
  const base = "px-4 py-2 rounded-lg font-medium";
  const styles = {
    default: `${base} bg-blue-600 text-white hover:bg-custom-blue`,
    ghost: `${base} bg-transparent text-blue-600 hover:bg-gray-100`,
    outline: `${base} border border-blue-600 text-blue-600 hover:bg-custom-blue`,
  };
  return <button className={`${styles[variant]} ${className}`} {...props}>{children}</button>;
}

