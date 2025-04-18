// src/components/Banner.jsx
import { motion } from 'framer-motion';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search } from 'lucide-react';
import { useSearch } from '../context/SearchContext';
import { useNavigate } from 'react-router-dom';

export default function Banner() {
  const { searchQuery, setSearchQuery } = useSearch();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleButtonSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-custom-blue rounded-3xl p-4 md:p-6 text-white text-center shadow-2xl"
    >
      <h4 className="text-xl text-justify-center md:text-3xl font-bold mb-2 md:mb-4">Conecta con tu negocio local favorito y recibe en tu puerta</h4>
      <div className="flex justify-center gap-2">
        <Input
          placeholder="¿Qué estás buscando hoy?"
          className="w-full max-w-[400px] md:max-w-[600px]  text-gray-800 text-sm md:text-base rounded-3xl"
          style={{ borderRadius: '16px' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
        />
        <Button onClick={handleButtonSearch} className="p-2 bg-blue rounded-3xl" style={{ borderRadius: '9999px' }}>
          <Search className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}