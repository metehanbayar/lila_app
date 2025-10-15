import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import FloatingCartButton from './FloatingCartButton';

function Layout({ children }) {
  const location = useLocation();
  const isCheckoutPage = location.pathname === '/checkout';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer />
      {!isCheckoutPage && <FloatingCartButton />}
    </div>
  );
}

export default Layout;

