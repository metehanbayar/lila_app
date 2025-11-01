import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

function PageTransition({ children }) {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Her sayfa değişiminde animasyonu tetikle
    setIsTransitioning(true);
    
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className={isTransitioning ? 'animate-pageEnter' : ''}>
      {children}
    </div>
  );
}

export default PageTransition;

