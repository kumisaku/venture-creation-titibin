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
  paymentQr?: string | null;
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
  usedBudget: number;
  remainingBudget: number | null;
  holdOverBudget: boolean;
  negotiationRequests: number;
  finished: boolean;
  dropPoint: string;
  catalogPhoto: string | null;
  potentialFee: number;
  pendingRequests: number;
  jastiper: User;
  orders?: Order[];
};

export type OrderStatus =
  | 'pending'
  | 'negotiation'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
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
  /** Price of one item; `itemPrice` is the subtotal for the whole quantity. */
  unitPrice: number;
  itemPrice: number;
  jastipFee: number;
  appFee: number;
  total: number;
  handoverPoint: string;
  photo: string | null;
  photos: string[];
  invoicePhoto: string | null;
  paymentQr: string | null;
  invoicedAt: string | null;
  paid: boolean;
  paidAt: string | null;
  completedAt: string | null;
  /** Extra budget the jastiper would need to accept a request held in negotiation. */
  budgetShortfall: number;
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

export type EarningsBucket = { key: string; fee: number; tip: number; total: number; orders: number };
export type EarningsPeriod = 'day' | 'week' | 'month' | 'year';
export type Earnings = {
  period: EarningsPeriod;
  series: EarningsBucket[];
  range: Omit<EarningsBucket, 'key'>;
  allTime: Omit<EarningsBucket, 'key'>;
  pendingFee: number;
};

export type JastiperReview = {
  orderId: number;
  code: string;
  productName: string;
  buyerName: string;
  rating: number;
  tags: string[];
  text: string;
  tip: number;
  createdAt: string;
};
