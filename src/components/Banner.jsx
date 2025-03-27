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
      className="bg-gradient-to-r from-custom-blue to-custom-cyan rounded-2xl p-8 text-white text-center shadow-xl"
    >
      <h2 className="text-3xl font-bold mb-4">Conecta con tu negocio local favorito y recibe en tu puerta</h2>
      <div className="flex justify-center gap-2">
        <Input
          placeholder="¿Qué estás buscando hoy?"
          className="w-[600px] max-w-full text-gray-800"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
        />
        <Button onClick={handleButtonSearch}>
          <Search className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}