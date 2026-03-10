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
  description: string | null;
  parent_id: string | null;
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
