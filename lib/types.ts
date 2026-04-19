export type Role = "admin" | "manager" | "viewer";

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  role: Role;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  icon: string | null;
  sort_order: number;
  created_at: string;
  children?: Category[];
}

export interface Supplier {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  barcode: string | null;
  category_id: string | null;
  price: number;
  cost_price: number;
  quantity_in_stock: number;
  reorder_point: number;
  reorder_quantity: number;
  supplier_id: string | null;
  image_url: string | null;
  status: "active" | "discontinued";
  created_at: string;
  updated_at: string;
  // E-commerce extensions (migration 010)
  brand: string | null;
  slug: string;
  specs: Record<string, unknown>;
  images: string[];
  discount_pct: number;
  rating_avg: number;
  rating_count: number;
  warranty_months: number;
  is_genuine: boolean;
  meta_title: string | null;
  meta_desc: string | null;
  // Joined fields
  category?: Category;
  supplier?: Supplier;
}

export interface Order {
  id: string;
  type: "inbound" | "outbound" | "adjustment";
  status: "pending" | "completed" | "cancelled";
  reference_number: string | null;
  supplier_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
  // E-commerce extensions (migration 017)
  payment_method: "cod" | "bank_transfer" | "card" | null;
  payment_status: "pending" | "paid" | "failed";
  shipping_address_id: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  delivery_city: string | null;
  delivery_fee: number;
  delivery_estimate: string | null;
  customer_notes: string | null;
  // Joined fields
  supplier?: Supplier;
  creator?: Profile;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  // E-commerce extensions (migration 017)
  discount_pct_snapshot: number;
  serial_number: string | null;
  // Joined
  product?: Product;
}

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: "created" | "updated" | "deleted";
  entity_type: string;
  entity_id: string;
  changes: Record<string, unknown> | null;
  created_at: string;
  // Joined
  user?: Profile;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number; // 1-5
  title: string | null;
  body: string | null;
  images: string[];
  verified_purchase: boolean;
  helpful_count: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  // Joined
  user?: Profile;
  product?: Product;
}

export interface FlashDeal {
  id: string;
  product_id: string;
  discount_pct: number;
  starts_at: string;
  ends_at: string;
  max_units: number | null;
  sold_units: number;
  is_active: boolean;
  created_at: string;
  // Joined
  product?: Product;
}

export interface Wishlist {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  // Joined
  product?: Product;
}

export interface RecentlyViewed {
  id: string;
  session_id: string;
  user_id: string | null;
  product_id: string;
  viewed_at: string;
  // Joined
  product?: Product;
}

export interface StockAlert {
  id: string;
  product_id: string;
  email: string;
  user_id: string | null;
  notified_at: string | null;
  created_at: string;
  // Joined
  product?: Product;
}

export interface PriceAlert {
  id: string;
  product_id: string;
  email: string;
  user_id: string | null;
  target_price: number | null;
  notified_at: string | null;
  created_at: string;
  // Joined
  product?: Product;
}

export interface DeliveryZone {
  id: string;
  city: string;
  district: string;
  est_min_days: number;
  est_max_days: number;
  delivery_fee: number;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  district: string;
  postal_code: string | null;
  is_default: boolean;
  created_at: string;
}

export interface CartItem {
  id: string;
  session_id: string | null;
  user_id: string | null;
  product_id: string;
  quantity: number;
  added_at: string;
  // Joined
  product?: Product;
}

export interface Recommendation {
  product_id: string;
  related_product_id: string;
  score: number;
  // Joined
  related_product?: Product;
}

export interface WaClick {
  id: string;
  product_id: string | null;
  session_id: string | null;
  user_id: string | null;
  clicked_at: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}
