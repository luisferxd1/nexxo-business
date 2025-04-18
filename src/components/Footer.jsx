// src/components/Footer.jsx
export default function Footer() {
  return (
    <footer className="bg-custom-blue text-white text-center pt-3 pb-16 md:pt-4 md:pb-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-center gap-4 md:gap-6 mb-3 md:mb-4">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <img
              src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/facebook.svg"
              alt="Facebook"
              className="w-5 h-5 md:w-6 md:h-6 opacity-80 transition-opacity duration-300 hover:opacity-100 invert"
            />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <img
              src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg"
              alt="Instagram"
              className="w-5 h-5 md:w-6 md:h-6 opacity-80 transition-opacity duration-300 hover:opacity-100 invert"
            />
          </a>
          <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
            <img
              src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/tiktok.svg"
              alt="TikTok"
              className="w-5 h-5 md:w-6 md:h-6 opacity-80 transition-opacity duration-300 hover:opacity-100 invert"
            />
          </a>
          <a href="https://wa.me/503XXXXXXXX" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
            <img
              src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/whatsapp.svg"
              alt="WhatsApp"
              className="w-5 h-5 md:w-6 md:h-6 opacity-80 transition-opacity duration-300 hover:opacity-100 invert"
            />
          </a>
        </div>
        <p className="text-xs md:text-sm">© 2025 NEXXO Digital Solutions. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}