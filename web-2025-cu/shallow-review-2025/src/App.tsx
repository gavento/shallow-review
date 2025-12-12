import { useEffect, useState } from 'react';
import { SunburstChart } from './components/SunburstChart';
import { AgendaModal } from './components/AgendaModal';
import { useTheme } from './contexts/ThemeContext';
import { getItemById, type ChartNode } from './utils/dataProcessing';
import type { DocumentItem } from './types';
import { Moon, Sun } from 'lucide-react';

function App() {
  const { theme, toggleTheme } = useTheme();
  const [selectedItem, setSelectedItem] = useState<DocumentItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync state with URL hash on load and hashchange
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // remove #
      if (hash) {
        const item = getItemById(hash);
        if (item) {
          setSelectedItem(item);
          setIsModalOpen(true);
        }
      } else {
        setIsModalOpen(false);
      }
    };

    // Initial check
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNodeClick = (node: ChartNode) => {
    // Update URL hash, which triggers the effect
    window.location.hash = node.id;
  };

  const handleCloseModal = () => {
    // Clear hash
    history.pushState("", document.title, window.location.pathname + window.location.search);
    setIsModalOpen(false);
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Shallow Review 2025</h1>
        <div className="controls">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
             {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      <main style={{ flex: 1, position: 'relative' }}>
        <SunburstChart onNodeClick={handleNodeClick} />
      </main>

      <AgendaModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        item={selectedItem} 
      />
    </div>
  );
}

export default App;
