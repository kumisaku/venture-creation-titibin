export type Role = 'buyer' | 'jastiper';

export type User = {
  id: number;
  name: string;
  nim: string;
  email: string;
  campus: string;
  about: string;
  role: Role;
  rating: number | null;
  ratingCount: number;
  stats?: { trips: number; requests: number };
};

export type Trip = {
  id: number;
  origin: string;
  destination: string;
  country: string;
  stores: string;
  departDate: string;
  returnDate: string;
  capacityKg: number;
  usedKg: number;
  remainingKg: number;
  slotsLeft: number | null;
  categories: string[];
  maxBudget: number | null;
  dropPoint: string;
  catalogPhoto: string | null;
  potentialFee: number;
  pendingRequests: number;
  jastiper: User;
  orders?: Order[];
};

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'paid'
  | 'bought'
  | 'arrived'
  | 'on_the_way'
  | 'completed';

export type Order = {
  id: number;
  code: string;
  productName: string;
  quantity: number;
  purchaseLocation: string;
  store: string;
  weightKg: number;
  itemPrice: number;
  jastipFee: number;
  appFee: number;
  total: number;
  handoverPoint: string;
  photo: string | null;
  paymentMethod: string | null;
  status: OrderStatus;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
  reviewed: boolean;
  trip: { id: number; origin: string; destination: string; country: string; dropPoint: string } | null;
  buyer: User;
  jastiper: User | null;
};

export type Message = {
  id: number;
  senderId: number;
  text: string;
  photo: string | null;
  createdAt: string;
};
