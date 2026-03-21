import { useNavigate } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import StatusScreen from '../components/StatusScreen';

function NotFound() {
  const navigate = useNavigate();

  return (
    <StatusScreen
      icon={Search}
      tone="info"
      title="Sayfa bulunamadi"
      description="Aradiginiz sayfa mevcut degil ya da tasinmis olabilir."
      primaryAction={{
        label: 'Ana sayfaya don',
        icon: <Home className="h-4 w-4" />,
        onClick: () => navigate('/'),
      }}
    />
  );
}

export default NotFound;
