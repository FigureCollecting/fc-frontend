import { useState, useEffect } from 'react';

export function useWebAuthn() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(
      typeof window !== 'undefined' &&
      window.PublicKeyCredential !== undefined
    );
  }, []);

  return { isSupported };
}
