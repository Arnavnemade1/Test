import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PasswordGate } from './components/PasswordGate';
import { Gallery } from './components/Gallery';
import './App.css';

function App() {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <AnimatePresence mode="wait">
      {unlocked ? (
        <motion.div
          key="gallery"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Gallery onLock={() => setUnlocked(false)} />
        </motion.div>
      ) : (
        <motion.div
          key="gate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6 }}
        >
          <PasswordGate onUnlock={() => setUnlocked(true)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
