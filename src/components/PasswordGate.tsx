import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player, type PlayerRef } from '@remotion/player';
import { IntroComposition } from '../remotion/IntroComposition';

const CORRECT_PASSWORD = '12345';

interface PasswordGateProps {
  onUnlock: () => void;
}

export function PasswordGate({ onUnlock }: PasswordGateProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const playerRef = useRef<PlayerRef>(null);

  useEffect(() => {
    playerRef.current?.play();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === CORRECT_PASSWORD) {
      setError(false);
      onUnlock();
    } else {
      setError(true);
      setShake((s) => s + 1);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="gate-screen">
      <div className="gate-backdrop" />
      <div className="gate-vignette" />

      <div className="gate-intro-player">
        <Player
          ref={playerRef}
          component={IntroComposition}
          durationInFrames={90}
          fps={30}
          compositionWidth={1280}
          compositionHeight={720}
          autoPlay
          loop
          controls={false}
          acknowledgeRemotionLicense
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      <motion.form
        className="gate-form"
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 30 }}
        animate={{
          opacity: 1,
          y: 0,
          x: error ? [0, -12, 12, -8, 8, 0] : 0,
        }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        key={shake}
      >
        <motion.h2
          className="gate-label"
          initial={{ letterSpacing: '0.4em', opacity: 0 }}
          animate={{ letterSpacing: '0.2em', opacity: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
        >
          Enter Access Code
        </motion.h2>

        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          className={`gate-input ${error ? 'gate-input-error' : ''}`}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(false);
          }}
          placeholder="•••••"
          autoFocus
        />

        <AnimatePresence>
          {error && (
            <motion.p
              className="gate-error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              Incorrect code. Try again.
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
          className="gate-button"
          whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(160,110,255,0.7)' }}
          whileTap={{ scale: 0.97 }}
        >
          Unlock
        </motion.button>
      </motion.form>
    </div>
  );
}
