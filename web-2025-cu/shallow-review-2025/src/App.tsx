import { useEffect, useState } from 'react';
import { SunburstChart } from './components/SunburstChart';
import { AgendaModal } from './components/AgendaModal';
import { DefinitionsModal, type DefinitionType } from './components/DefinitionsModal';
import { useTheme } from './contexts/ThemeContext';
import { getItemById, type ChartNode, type WeightMode } from './utils/dataProcessing';
import type { DocumentItem } from './types';
import { Moon, Sun } from 'lucide-react';

function App() {
  const { theme, toggleTheme } = useTheme();
  const [selectedItem, setSelectedItem] = useState<DocumentItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDefModalOpen, setIsDefModalOpen] = useState(false);
  const [defScrollToId, setDefScrollToId] = useState<string | undefined>(undefined);
  const [activeDefType, setActiveDefType] = useState<DefinitionType>('all');
  const [weightMode, setWeightMode] = useState<WeightMode>('uniform');

  // Sync state with URL hash on load and hashchange
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // remove #
      if (hash.startsWith('def:')) {
        setDefScrollToId(hash);
        
        // Parse type from hash #def:TYPE:ID
        const parts = hash.split(':');
        if (parts.length >= 2) {
             const type = parts[1];
             if (['approach', 'case', 'problem'].includes(type)) {
                 setActiveDefType(type as DefinitionType);
             } else {
                 setActiveDefType('all');
             }
        } else {
             setActiveDefType('all');
        }
        
        setIsDefModalOpen(true);
        // Ensure agenda modal is closed
        setIsModalOpen(false);
      } else if (hash) {
        const item = getItemById(hash);
        if (item) {
          setSelectedItem(item);
          setIsModalOpen(true);
          // Ensure def modal is closed
          setIsDefModalOpen(false);
        }
      } else {
        setIsModalOpen(false);
        setIsDefModalOpen(false);
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

  const handleCloseDefModal = () => {
    // Clear hash
    history.pushState("", document.title, window.location.pathname + window.location.search);
    setIsDefModalOpen(false);
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-left">
           <h1>Shallow Review of Technical AI Safety 2025</h1>
           <div className="weight-controls">
              <button 
                className={weightMode === 'uniform' ? 'active' : ''} 
                onClick={() => setWeightMode('uniform')}
              >Uniform</button>
              <button 
                className={weightMode === 'fte' ? 'active' : ''} 
                onClick={() => setWeightMode('fte')}
              >FTEs</button>
              <button 
                className={weightMode === 'papers' ? 'active' : ''} 
                onClick={() => setWeightMode('papers')}
              >Papers</button>
           </div>
        </div>
        <div className="controls">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
             {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      <main style={{ flex: 1, position: 'relative' }}>
        <SunburstChart onNodeClick={handleNodeClick} weightMode={weightMode} />
      </main>

      <AgendaModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        item={selectedItem} 
      />

      <DefinitionsModal
        isOpen={isDefModalOpen}
        onClose={handleCloseDefModal}
        initialScrollToId={defScrollToId}
        activeType={activeDefType}
      />
    </div>
  );
}

export default App;
