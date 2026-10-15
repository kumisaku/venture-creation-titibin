import { BuyerHome } from '@/screens/BuyerHome';
import { JastiperHome } from '@/screens/JastiperHome';
import { useAuth } from '@/lib/auth';

export default function HomeTab() {
  const { user } = useAuth();
  return user?.role === 'jastiper' ? <JastiperHome /> : <BuyerHome />;
}
