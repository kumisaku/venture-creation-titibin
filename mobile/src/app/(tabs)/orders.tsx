import { BuyerOrders } from '@/screens/BuyerOrders';
import { JastiperRequests } from '@/screens/JastiperRequests';
import { useAuth } from '@/lib/auth';

export default function OrdersTab() {
  const { user } = useAuth();
  return user?.role === 'jastiper' ? <JastiperRequests /> : <BuyerOrders />;
}
