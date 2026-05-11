import React, { useState, useEffect, useRef } from 'react';

interface BlockScreenProps {
  icon: string;
  title: string;
  message: string;
  contact: string;
  onUnlock: () => void;
}

const BlockScreen: React.FC<BlockScreenProps> = ({ 
  icon, 
  title, 
  message, 
  contact, 
  onUnlock 
}) => {
  const [taps, setTaps] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTap = () => {
    if (isDone) return;

    // Clear existing timer on new tap
    if (timerRef.current) clearTimeout(timerRef.current);

    const nextTaps = taps + 1;
    
    if (nextTaps >= 5) {
      setIsDone(true);
      // Flash checkmark then unlock
      setTimeout(() => {
        onUnlock();
      }, 800);
    } else {
      setTaps(nextTaps);
      // Reset count if 3 seconds pass without a tap
      timerRef.current = setTimeout(() => {
        setTaps(0);
      }, 3000);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0a0a0a',
        color: '#f0f0f0',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
      id="system-block-screen"
    >
      <div 
        onClick={handleTap}
        style={{
          fontSize: '80px',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'transform 0.1s active',
          marginBottom: '24px',
          position: 'relative'
        }}
        id="block-icon"
      >
        {isDone ? '✓' : icon}
        {isDone && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            borderRadius: '50%',
            filter: 'blur(20px)'
          }} />
        )}
      </div>

      <h1 style={{ 
        fontSize: '28px', 
        fontWeight: 'bold', 
        color: '#ef4444', 
        marginBottom: '16px',
        maxWidth: '400px'
      }} id="block-title">
        {title}
      </h1>

      <p style={{ 
        fontSize: '16px', 
        lineHeight: '1.6', 
        color: '#a3a3a3', 
        marginBottom: '32px',
        maxWidth: '400px',
        whiteSpace: 'pre-wrap'
      }} id="block-message">
        {message}
      </p>

      {contact && (
        <div style={{
          padding: '16px 24px',
          backgroundColor: '#171717',
          borderRadius: '12px',
          border: '1px solid #262626',
          fontSize: '14px'
        }} id="block-contact-box">
          <span style={{ color: '#737373', display: 'block', marginBottom: '4px' }}>
            Contact Support
          </span>
          <a 
            href={`tel:${contact}`} 
            style={{ 
              color: '#f0f0f0', 
              textDecoration: 'none', 
              fontWeight: '600',
              fontSize: '18px'
            }}
          >
            {contact}
          </a>
        </div>
      )}

      <div style={{ 
        position: 'absolute', 
        bottom: '24px', 
        fontSize: '10px', 
        color: '#404040' 
      }}>
        System Integrity Verification Failed (Error 0x884)
      </div>
    </div>
  );
};

export default BlockScreen;
