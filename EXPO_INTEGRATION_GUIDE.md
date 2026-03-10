# StockUp Expo Mobile App — Full Integration Guide

> Drop this file into your Expo project root and follow it section by section.
> Covers: API integration, Supabase auth, shared types, and Landing Screen UI/UX spec matching the web storefront.

---

## Table of Contents

1. [Required Dependencies](#1-required-dependencies)
2. [Environment Setup](#2-environment-setup)
3. [Shared TypeScript Types](#3-shared-typescript-types)
4. [Supabase Client Setup](#4-supabase-client-setup)
5. [API Service Layer](#5-api-service-layer)
6. [Auth Service](#6-auth-service)
7. [Input Validators (Shared)](#7-input-validators-shared)
8. [Custom Hooks](#8-custom-hooks)
9. [Landing Screen — Design Spec](#9-landing-screen--design-spec)
10. [Landing Screen — Full Implementation](#10-landing-screen--full-implementation)
11. [Cart Implementation](#11-cart-implementation)
12. [API Endpoint Reference](#12-api-endpoint-reference)

---

## 1. Required Dependencies

```bash
# Supabase
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage

# Navigation
npx expo install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context

# UI essentials
npx expo install expo-linear-gradient expo-font @expo-google-fonts/playfair-display @expo-google-fonts/dm-sans

# Icons (Lucide equivalent for RN)
npm install lucide-react-native react-native-svg

# Toast notifications
npm install react-native-toast-message

# Image handling
npx expo install expo-image
```

---

## 2. Environment Setup

Create `env.ts` at your project root:

```typescript
// env.ts
export const ENV = {
  // Option A: Hit your deployed Next.js API directly
  API_BASE_URL: "https://your-deployed-nextjs-app.vercel.app",

  // Option B: Use Supabase directly (recommended for mobile)
  SUPABASE_URL: "https://your-project-ref.supabase.co",
  SUPABASE_ANON_KEY: "your-anon-key-here",
};
```

> **Which approach?**
> - **Option A (API proxy):** Call your Next.js `/api/*` routes. Simpler if you want one backend. Auth via Supabase JWT in `Authorization` header.
> - **Option B (Direct Supabase):** Skip the Next.js layer. Lower latency, real-time support, better for mobile. You replicate some business logic client-side.
> - **This guide provides both.** The store landing page uses the public products endpoint which works with either approach.

---

## 3. Shared TypeScript Types

Create `types/index.ts`:

```typescript
// types/index.ts
// Identical to the web app's lib/types.ts

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

// Cart types (mobile-specific)
export interface CartItem {
  product: Product;
  qty: number;
}
```

---

## 4. Supabase Client Setup

Create `lib/supabase.ts`:

```typescript
// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENV } from "../env";

export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // important for RN
  },
});
```

---

## 5. API Service Layer

Create `services/api.ts` — a complete service matching every Next.js API route:

```typescript
// services/api.ts
import { supabase } from "../lib/supabase";
import { ENV } from "../env";
import type {
  Product,
  Category,
  Supplier,
  Order,
  Profile,
  AuditLogEntry,
  ApiResponse,
  PaginatedResponse,
} from "../types";

// ─── Helper: get auth header for Next.js API proxy calls ───
async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

// ─── Helper: fetch wrapper for Next.js API proxy ───
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers = {
    "Content-Type": "application/json",
    ...(await authHeaders()),
    ...(options.headers || {}),
  };

  const res = await fetch(`${ENV.API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const json = await res.json();
  if (!res.ok) return { error: json.error || `HTTP ${res.status}` };
  return json;
}

// ═══════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════

export const ProductsAPI = {
  /** List products with filters (public — no auth needed for status=active) */
  async list(params?: {
    search?: string;
    category?: string;
    supplier?: string;
    status?: string;
    stock?: "low" | "out";
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Product>> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.category) qs.set("category", params.category);
    if (params?.supplier) qs.set("supplier", params.supplier);
    if (params?.status) qs.set("status", params.status);
    if (params?.stock) qs.set("stock", params.stock);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.pageSize) qs.set("pageSize", String(params.pageSize));

    const res = await apiFetch<Product[]>(`/api/products?${qs.toString()}`);
    return {
      data: res.data || [],
      count: (res as any).count || 0,
      page: (res as any).page || 1,
      pageSize: (res as any).pageSize || 20,
    };
  },

  /** Get single product by ID (requires auth — viewer+) */
  async get(id: string): Promise<ApiResponse<Product>> {
    return apiFetch(`/api/products/${id}`);
  },

  /** Create product (requires auth — manager+) */
  async create(
    product: Omit<Product, "id" | "created_at" | "updated_at" | "category" | "supplier">
  ): Promise<ApiResponse<Product>> {
    return apiFetch("/api/products", {
      method: "POST",
      body: JSON.stringify(product),
    });
  },

  /** Update product (requires auth — manager+) */
  async update(
    id: string,
    product: Partial<Product>
  ): Promise<ApiResponse<Product>> {
    return apiFetch(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(product),
    });
  },

  /** Delete product (requires auth — admin) */
  async delete(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiFetch(`/api/products/${id}`, { method: "DELETE" });
  },
};

// ═══════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════

export const CategoriesAPI = {
  /** List all categories (requires auth — viewer+) */
  async list(): Promise<ApiResponse<Category[]>> {
    return apiFetch("/api/categories");
  },

  /** Create category (requires auth — manager+) */
  async create(category: {
    name: string;
    description?: string;
    parent_id?: string;
  }): Promise<ApiResponse<Category>> {
    return apiFetch("/api/categories", {
      method: "POST",
      body: JSON.stringify(category),
    });
  },

  /** Update category (requires auth — manager+) */
  async update(category: {
    id: string;
    name: string;
    description?: string;
    parent_id?: string;
  }): Promise<ApiResponse<Category>> {
    return apiFetch("/api/categories", {
      method: "PUT",
      body: JSON.stringify(category),
    });
  },

  /** Delete category (requires auth — manager+) */
  async delete(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiFetch(`/api/categories?id=${id}`, { method: "DELETE" });
  },
};

// ═══════════════════════════════════════════════
// SUPPLIERS
// ═══════════════════════════════════════════════

export const SuppliersAPI = {
  /** List suppliers with optional search (requires auth — viewer+) */
  async list(search?: string): Promise<ApiResponse<Supplier[]>> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiFetch(`/api/suppliers${qs}`);
  },

  /** Create supplier (requires auth — manager+) */
  async create(supplier: {
    name: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
  }): Promise<ApiResponse<Supplier>> {
    return apiFetch("/api/suppliers", {
      method: "POST",
      body: JSON.stringify(supplier),
    });
  },

  /** Update supplier (requires auth — manager+) */
  async update(supplier: {
    id: string;
    name: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
  }): Promise<ApiResponse<Supplier>> {
    return apiFetch("/api/suppliers", {
      method: "PUT",
      body: JSON.stringify(supplier),
    });
  },

  /** Delete supplier (requires auth — manager+) */
  async delete(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiFetch(`/api/suppliers?id=${id}`, { method: "DELETE" });
  },
};

// ═══════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════

export const OrdersAPI = {
  /** List orders with filters (requires auth — viewer+) */
  async list(params?: {
    type?: "inbound" | "outbound" | "adjustment";
    status?: "pending" | "completed" | "cancelled";
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Order>> {
    const qs = new URLSearchParams();
    if (params?.type) qs.set("type", params.type);
    if (params?.status) qs.set("status", params.status);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.pageSize) qs.set("pageSize", String(params.pageSize));

    const res = await apiFetch<Order[]>(`/api/orders?${qs.toString()}`);
    return {
      data: res.data || [],
      count: (res as any).count || 0,
      page: (res as any).page || 1,
      pageSize: (res as any).pageSize || 20,
    };
  },

  /** Get single order (requires auth — viewer+) */
  async get(id: string): Promise<ApiResponse<Order>> {
    return apiFetch(`/api/orders/${id}`);
  },

  /** Create order with items (requires auth — manager+) */
  async create(order: {
    type: "inbound" | "outbound" | "adjustment";
    reference_number?: string;
    supplier_id?: string;
    notes?: string;
    items: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
    }>;
  }): Promise<ApiResponse<Order>> {
    return apiFetch("/api/orders", {
      method: "POST",
      body: JSON.stringify(order),
    });
  },

  /** Update pending order (requires auth — manager+) */
  async update(
    id: string,
    data: {
      reference_number?: string;
      supplier_id?: string;
      notes?: string;
      status?: "cancelled";
    }
  ): Promise<ApiResponse<Order>> {
    return apiFetch(`/api/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /** Complete order — triggers RPC stock update (requires auth — manager+) */
  async complete(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiFetch(`/api/orders/${id}/complete`, { method: "POST" });
  },
};

// ═══════════════════════════════════════════════
// STORE (PUBLIC — no auth required)
// ═══════════════════════════════════════════════

export const StoreAPI = {
  /** Public checkout — creates outbound order and reduces stock */
  async checkout(
    items: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
    }>
  ): Promise<ApiResponse<Order & { success: boolean }>> {
    return apiFetch("/api/store/checkout", {
      method: "POST",
      body: JSON.stringify({ items }),
    });
  },

  /** Get active products for the store (public, no auth) */
  async getProducts(params?: {
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Product>> {
    return ProductsAPI.list({ ...params, status: "active" });
  },
};

// ═══════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════

export const DashboardAPI = {
  /** Get dashboard stats (requires auth — viewer+) */
  async getStats(): Promise<
    ApiResponse<{
      totalProducts: number;
      activeProducts: number;
      lowStockCount: number;
      outOfStockCount: number;
      totalValue: number;
      totalSuppliers: number;
      pendingOrders: number;
    }>
  > {
    return apiFetch("/api/dashboard/stats");
  },

  /** Get low stock alerts (requires auth — viewer+) */
  async getAlerts(): Promise<
    ApiResponse<
      Array<{
        id: string;
        name: string;
        sku: string;
        quantity_in_stock: number;
        reorder_point: number;
        reorder_quantity: number;
        supplier: { id: string; name: string } | null;
      }>
    >
  > {
    return apiFetch("/api/dashboard/alerts");
  },
};

// ═══════════════════════════════════════════════
// USERS (admin only)
// ═══════════════════════════════════════════════

export const UsersAPI = {
  /** List all user profiles (requires auth — admin) */
  async list(): Promise<ApiResponse<Profile[]>> {
    return apiFetch("/api/users");
  },

  /** Update user role (requires auth — admin) */
  async updateRole(
    userId: string,
    role: "admin" | "manager" | "viewer"
  ): Promise<ApiResponse<Profile>> {
    return apiFetch("/api/users", {
      method: "PUT",
      body: JSON.stringify({ id: userId, role }),
    });
  },
};

// ═══════════════════════════════════════════════
// AUDIT LOG (admin only)
// ═══════════════════════════════════════════════

export const AuditLogAPI = {
  /** Get audit log entries (requires auth — admin) */
  async list(params?: {
    entityType?: string;
    action?: "created" | "updated" | "deleted";
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<AuditLogEntry>> {
    const qs = new URLSearchParams();
    if (params?.entityType) qs.set("entityType", params.entityType);
    if (params?.action) qs.set("action", params.action);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.pageSize) qs.set("pageSize", String(params.pageSize));

    const res = await apiFetch<AuditLogEntry[]>(
      `/api/audit-log?${qs.toString()}`
    );
    return {
      data: res.data || [],
      count: (res as any).count || 0,
      page: (res as any).page || 1,
      pageSize: (res as any).pageSize || 50,
    };
  },
};

// ═══════════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════════

export const ProfileAPI = {
  /** Ensure profile exists (creates from user_metadata if missing) */
  async ensure(): Promise<ApiResponse<{ profile: Profile }>> {
    return apiFetch("/api/profile/ensure", { method: "POST" });
  },
};
```

---

## 6. Auth Service

Create `services/auth.ts`:

```typescript
// services/auth.ts
import { supabase } from "../lib/supabase";

export const AuthService = {
  /** Sign up with email/password */
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: "viewer" },
      },
    });
    return { data, error };
  },

  /** Sign in with email/password */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  /** Sign in with OTP (magic link) */
  async signInWithOtp(email: string) {
    const { data, error } = await supabase.auth.signInWithOtp({ email });
    return { data, error };
  },

  /** Verify OTP token */
  async verifyOtp(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    return { data, error };
  },

  /** Sign out */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  /** Get current session */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  },

  /** Get current user */
  async getUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user, error };
  },

  /** Listen to auth state changes */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
```

---

## 7. Input Validators (Shared)

Create `lib/validators.ts` — identical to the web app:

```typescript
// lib/validators.ts

export function validateCategory(data: Record<string, unknown>) {
  const errors: string[] = [];
  if (
    !data.name ||
    typeof data.name !== "string" ||
    data.name.trim().length === 0
  ) {
    errors.push("Name is required");
  }
  return errors;
}

export function validateSupplier(data: Record<string, unknown>) {
  const errors: string[] = [];
  if (
    !data.name ||
    typeof data.name !== "string" ||
    data.name.trim().length === 0
  ) {
    errors.push("Name is required");
  }
  if (
    data.email &&
    typeof data.email === "string" &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
  ) {
    errors.push("Invalid email format");
  }
  return errors;
}

export function validateProduct(data: Record<string, unknown>) {
  const errors: string[] = [];
  if (
    !data.name ||
    typeof data.name !== "string" ||
    data.name.trim().length === 0
  ) {
    errors.push("Name is required");
  }
  if (
    !data.sku ||
    typeof data.sku !== "string" ||
    data.sku.trim().length === 0
  ) {
    errors.push("SKU is required");
  }
  if (
    data.price !== undefined &&
    (typeof data.price !== "number" || data.price < 0)
  ) {
    errors.push("Price must be a non-negative number");
  }
  if (
    data.cost_price !== undefined &&
    (typeof data.cost_price !== "number" || data.cost_price < 0)
  ) {
    errors.push("Cost price must be a non-negative number");
  }
  if (
    data.reorder_point !== undefined &&
    (typeof data.reorder_point !== "number" || data.reorder_point < 0)
  ) {
    errors.push("Reorder point must be a non-negative number");
  }
  return errors;
}

export function validateOrder(data: Record<string, unknown>) {
  const errors: string[] = [];
  if (
    !data.type ||
    !["inbound", "outbound", "adjustment"].includes(data.type as string)
  ) {
    errors.push("Type must be inbound, outbound, or adjustment");
  }
  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.push("At least one item is required");
  }
  return errors;
}
```

---

## 8. Custom Hooks

### `hooks/useAuth.ts`

```typescript
// hooks/useAuth.ts
import { useState, useEffect } from "react";
import { AuthService } from "../services/auth";
import { supabase } from "../lib/supabase";
import type { Profile } from "../types";

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    AuthService.getSession().then(({ session }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = AuthService.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setProfile(data as Profile);
    }
    setIsLoading(false);
  }

  return { user, profile, isLoading };
}
```

### `hooks/useRole.ts`

```typescript
// hooks/useRole.ts
import { useAuth } from "./useAuth";
import type { Role } from "../types";

const roleHierarchy: Record<Role, number> = {
  admin: 3,
  manager: 2,
  viewer: 1,
};

export function useRole() {
  const { user, profile, isLoading } = useAuth();
  const role = (profile?.role ?? "viewer") as Role;

  return {
    user,
    profile,
    role,
    isLoading,
    isAdmin: role === "admin",
    isManager: roleHierarchy[role] >= roleHierarchy.manager,
    canEdit: roleHierarchy[role] >= roleHierarchy.manager,
    canDelete: role === "admin",
  };
}
```

### `hooks/useCart.ts`

```typescript
// hooks/useCart.ts
import { useState, useCallback, useMemo } from "react";
import { StoreAPI } from "../services/api";
import type { Product, CartItem } from "../types";

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  }, []);

  const updateQty = useCallback((productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? { ...i, qty: Math.max(1, i.qty + delta) }
          : i
      )
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + i.product.price * i.qty, 0),
    [cart]
  );

  const cartCount = useMemo(
    () => cart.reduce((s, i) => s + i.qty, 0),
    [cart]
  );

  const checkout = useCallback(async () => {
    setIsCheckingOut(true);
    try {
      const res = await StoreAPI.checkout(
        cart.map((i) => ({
          product_id: i.product.id,
          quantity: i.qty,
          unit_price: i.product.price,
        }))
      );
      if (res.error) return { success: false, error: res.error };
      clearCart();
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || "Checkout failed" };
    } finally {
      setIsCheckingOut(false);
    }
  }, [cart, clearCart]);

  return {
    cart,
    cartCount,
    subtotal,
    isCheckingOut,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    checkout,
  };
}
```

---

## 9. Landing Screen — Design Spec

This section documents the exact visual design from the web storefront so you can replicate it pixel-perfectly in React Native.

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `charcoal` | `#2C2C2C` | Primary text, buttons, dark UI |
| `gold` | `#B8956A` | Accent, highlights, active states |
| `cream` | `#FDFBF7` | Background, light text on dark |
| `taupe` | `#8C8477` | Secondary/muted text |
| `beige` | `#E8E4DE` | Borders, dividers |
| `sand` | `#F0EBE3` | Placeholder backgrounds, skeleton loaders |
| `dark` | `#1A1A1A` | Footer, announcement bar, dark sections |

### Typography

| Element | Font | Size (mobile) | Weight | Letter Spacing | Transform |
|---------|------|---------------|--------|----------------|-----------|
| Logo "StockUp" | Playfair Display | 22 | 400 | 6 | uppercase |
| Hero heading | Playfair Display | 44-52 | 400 | 0 | none |
| Section heading | Playfair Display | 28-32 | 400 | 0 | none |
| Product name | Playfair Display | 17 | 400 | 0 | none |
| Body text | DM Sans | 14 | 400 | 0 | none |
| Small labels | DM Sans | 10-11 | 400 | 3-5 | uppercase |
| Button text | DM Sans | 12 | 500 | 4 | uppercase |
| Nav links | DM Sans | 11 | 400 | 4 | uppercase |

### Component Hierarchy (Landing Screen)

```
SafeAreaView (bg: cream)
├── AnnouncementBar (bg: dark, height: 36)
│   └── Animated horizontal scroll of trust items
├── Header (bg: cream/95 + blur, height: 72, sticky)
│   ├── Left: Hamburger icon (charcoal)
│   ├── Center: "— StockUp —" logo (serif, charcoal)
│   └── Right: User icon (taupe)
├── ScrollView
│   ├── HeroSection (minHeight: 85% screen)
│   │   ├── Gradient background (cream → warm beige)
│   │   ├── Decorative line + "Est. 2026" label
│   │   ├── "Thoughtfully\nCurated" (serif, charcoal + gold)
│   │   ├── Subtitle paragraph (taupe)
│   │   └── CTA button "Explore Collection →" (charcoal bg)
│   ├── TrustMarquee (bg: charcoal, py: 14)
│   │   └── Scrolling text items with gold dots
│   ├── ProductsSection (py: 80)
│   │   ├── Section header ("Explore" label + "Our Collection")
│   │   ├── Category pills (horizontal scroll)
│   │   ├── Search input
│   │   ├── Product grid (2 columns on mobile)
│   │   │   └── ProductCard
│   │   │       ├── Image (aspect 4:5, sand placeholder)
│   │   │       ├── Category label overlay
│   │   │       ├── "Sold Out" overlay (if stock=0)
│   │   │       ├── Product name (serif)
│   │   │       ├── Description (1 line, taupe)
│   │   │       ├── Price (gold)
│   │   │       └── "Add to Bag" button
│   │   └── Empty state (Package icon + message)
│   ├── ValuesSection (border top/bottom beige)
│   │   ├── "Free Shipping" + Truck icon
│   │   ├── "Quality Guarantee" + Shield icon
│   │   └── "Dedicated Support" + Headphones icon
│   ├── NewsletterSection (bg: charcoal)
│   │   ├── "Stay in the Know" heading
│   │   ├── Description
│   │   └── Email input + Subscribe button
│   └── Footer (bg: dark)
│       ├── "— StockUp —" brand
│       ├── Description
│       ├── Link columns (Shop, Help, Connect)
│       └── Copyright
└── FloatingCartButton (fixed, bottom-right)
    ├── ShoppingBag icon
    └── Badge (gold, count)
```

### Spacing Scale (React Native points)

| Web Tailwind | RN Points | Usage |
|-------------|-----------|-------|
| `py-2.5` | 10 | Announcement bar |
| `h-[72px]` | 72 | Header height |
| `py-4` | 16 | Standard button padding |
| `px-5` | 20 | Container horizontal padding |
| `gap-6` | 24 | Product grid gap |
| `mb-14` | 56 | Section heading bottom margin |
| `py-20` | 80 | Section vertical padding |
| `py-24` | 96 | Newsletter section vertical |

### Animations to Implement

1. **Announcement marquee:** Horizontal auto-scroll, 45s loop
2. **Hero fade-in:** Elements fade in + translateY(20→0), staggered 120ms each
3. **Product image scale:** On press, subtle scale 1→1.03

### Product Card Layout

```
┌─────────────────────┐
│  ┌─────────┐        │  ← Category label (top-left)
│  │ CATEGORY│        │
│  └─────────┘        │
│                     │
│     Product         │  ← aspect-ratio 4:5
│     Image           │     sand (#F0EBE3) if no image
│                     │
│  ┌─────────────┐    │  ← "Sold Out" overlay if stock=0
│  │  SOLD OUT   │    │
│  └─────────────┘    │
│                     │
│  [  ADD TO BAG  ]   │  ← Full-width button at bottom
├─────────────────────┤
│ Product Name        │  ← Playfair, 17px, charcoal
│ Short description...│  ← DM Sans, 13px, taupe, 1 line
│ $29.99              │  ← DM Sans, 14px, gold
└─────────────────────┘
```

---

## 10. Landing Screen — Full Implementation

Create `screens/LandingScreen.tsx`:

```tsx
// screens/LandingScreen.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Animated,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import {
  ShoppingBag,
  ArrowRight,
  Package,
  Truck,
  Shield,
  Headphones,
  Search,
  Menu,
  User,
  X,
  Plus,
  Minus,
} from "lucide-react-native";
import Toast from "react-native-toast-message";

import { StoreAPI } from "../services/api";
import { useCart } from "../hooks/useCart";
import type { Product } from "../types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const PRODUCT_GAP = 12;
const PRODUCT_CARD_WIDTH = (SCREEN_WIDTH - 40 - PRODUCT_GAP) / 2;

// ─── Color Tokens ───
const C = {
  charcoal: "#2C2C2C",
  gold: "#B8956A",
  cream: "#FDFBF7",
  taupe: "#8C8477",
  beige: "#E8E4DE",
  sand: "#F0EBE3",
  dark: "#1A1A1A",
};

// ─── Marquee Items ───
const TRUST_ITEMS = [
  "Free Shipping Over $50",
  "Premium Quality",
  "30-Day Returns",
  "Secure Checkout",
  "Curated Selection",
];

// ═══════════════════════════════════════════════════
// ANNOUNCEMENT BAR (Animated Marquee)
// ═══════════════════════════════════════════════════

function AnnouncementBar() {
  const scrollX = useRef(new Animated.Value(0)).current;
  const contentWidth = TRUST_ITEMS.length * 200; // approximate

  useEffect(() => {
    const animate = () => {
      scrollX.setValue(0);
      Animated.timing(scrollX, {
        toValue: -contentWidth,
        duration: 25000,
        useNativeDriver: true,
      }).start(() => animate());
    };
    animate();
  }, []);

  const items = [...TRUST_ITEMS, ...TRUST_ITEMS, ...TRUST_ITEMS];

  return (
    <View style={styles.announcementBar}>
      <Animated.View
        style={[
          styles.marqueeRow,
          { transform: [{ translateX: scrollX }] },
        ]}
      >
        {items.map((item, i) => (
          <View key={i} style={styles.marqueeItem}>
            <View style={styles.marqueeDot} />
            <Text style={styles.marqueeText}>{item}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

// ═══════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════

function Header({
  onCartPress,
  cartCount,
}: {
  onCartPress: () => void;
  cartCount: number;
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerLeft}>
        <Menu size={20} color={C.charcoal} />
      </TouchableOpacity>

      <View style={styles.headerCenter}>
        <View style={[styles.headerLine, { marginRight: 12 }]} />
        <Text style={styles.logoText}>STOCKUP</Text>
        <View style={[styles.headerLine, { marginLeft: 12 }]} />
      </View>

      <TouchableOpacity style={styles.headerRight}>
        <User size={20} color={C.taupe} />
      </TouchableOpacity>
    </View>
  );
}

// ═══════════════════════════════════════════════════
// HERO SECTION
// ═══════════════════════════════════════════════════

function HeroSection({ onExplore }: { onExplore: () => void }) {
  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim3 = useRef(new Animated.Value(0)).current;
  const fadeAnim4 = useRef(new Animated.Value(0)).current;
  const slideAnim1 = useRef(new Animated.Value(20)).current;
  const slideAnim2 = useRef(new Animated.Value(20)).current;
  const slideAnim3 = useRef(new Animated.Value(20)).current;
  const slideAnim4 = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const animations = [
      { fade: fadeAnim1, slide: slideAnim1, delay: 0 },
      { fade: fadeAnim2, slide: slideAnim2, delay: 120 },
      { fade: fadeAnim3, slide: slideAnim3, delay: 240 },
      { fade: fadeAnim4, slide: slideAnim4, delay: 360 },
    ];

    animations.forEach(({ fade, slide, delay }) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fade, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(slide, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start();
      }, delay);
    });
  }, []);

  return (
    <LinearGradient
      colors={["#FDFBF7", "#F5F0E8", "#EDE6D8"]}
      style={styles.hero}
    >
      {/* Decorative accent */}
      <Animated.View
        style={[
          styles.heroAccentRow,
          { opacity: fadeAnim1, transform: [{ translateY: slideAnim1 }] },
        ]}
      >
        <View style={[styles.accentLine, { width: 56 }]} />
        <Text style={styles.accentLabel}>EST. 2026</Text>
        <View style={[styles.accentLine, { width: 56 }]} />
      </Animated.View>

      {/* Heading */}
      <Animated.View
        style={{
          opacity: fadeAnim2,
          transform: [{ translateY: slideAnim2 }],
        }}
      >
        <Text style={styles.heroHeading}>
          Thoughtfully{"\n"}
          <Text style={styles.heroHeadingAccent}>Curated</Text>
        </Text>
      </Animated.View>

      {/* Subtitle */}
      <Animated.View
        style={{
          opacity: fadeAnim3,
          transform: [{ translateY: slideAnim3 }],
        }}
      >
        <Text style={styles.heroSubtitle}>
          Discover our collection of premium products, selected for exceptional
          quality and timeless design.
        </Text>
      </Animated.View>

      {/* CTA Button */}
      <Animated.View
        style={{
          opacity: fadeAnim4,
          transform: [{ translateY: slideAnim4 }],
        }}
      >
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={onExplore}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaButtonText}>EXPLORE COLLECTION</Text>
          <ArrowRight size={16} color={C.cream} />
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom decorative element */}
      <View style={styles.heroBottomDecor}>
        <View style={[styles.decorLine, { width: 24 }]} />
        <View style={styles.decorDiamond} />
        <View style={[styles.decorLine, { width: 24 }]} />
      </View>
    </LinearGradient>
  );
}

// ═══════════════════════════════════════════════════
// TRUST MARQUEE (Dark bar below hero)
// ═══════════════════════════════════════════════════

function TrustMarquee() {
  const scrollX = useRef(new Animated.Value(0)).current;
  const contentWidth = TRUST_ITEMS.length * 200;

  useEffect(() => {
    const animate = () => {
      scrollX.setValue(0);
      Animated.timing(scrollX, {
        toValue: -contentWidth,
        duration: 30000,
        useNativeDriver: true,
      }).start(() => animate());
    };
    animate();
  }, []);

  const items = [...TRUST_ITEMS, ...TRUST_ITEMS, ...TRUST_ITEMS, ...TRUST_ITEMS];

  return (
    <View style={styles.trustMarquee}>
      <Animated.View
        style={[
          styles.marqueeRow,
          { transform: [{ translateX: scrollX }] },
        ]}
      >
        {items.map((item, i) => (
          <View key={i} style={styles.trustItem}>
            <View style={styles.trustDot} />
            <Text style={styles.trustText}>{item}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

// ═══════════════════════════════════════════════════
// PRODUCT CARD
// ═══════════════════════════════════════════════════

function ProductCard({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart: (p: Product) => void;
}) {
  const isOutOfStock = product.quantity_in_stock <= 0;

  return (
    <View style={styles.productCard}>
      {/* Image */}
      <View style={styles.productImageWrapper}>
        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            style={styles.productImage}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Package size={40} color="#DAD4CA" />
          </View>
        )}

        {/* Category label */}
        {product.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {product.category.name.toUpperCase()}
            </Text>
          </View>
        )}

        {/* Sold out overlay */}
        {isOutOfStock && (
          <View style={styles.soldOutOverlay}>
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>SOLD OUT</Text>
            </View>
          </View>
        )}
      </View>

      {/* Add to Bag button (below image for mobile) */}
      {!isOutOfStock && (
        <TouchableOpacity
          style={styles.addToBagButton}
          onPress={() => onAddToCart(product)}
          activeOpacity={0.8}
        >
          <Text style={styles.addToBagText}>ADD TO BAG</Text>
        </TouchableOpacity>
      )}

      {/* Info */}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>
          {product.name}
        </Text>
        {product.description && (
          <Text style={styles.productDesc} numberOfLines={1}>
            {product.description}
          </Text>
        )}
        <Text style={styles.productPrice}>
          ${Number(product.price).toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════
// VALUES SECTION
// ═══════════════════════════════════════════════════

function ValuesSection() {
  const values = [
    {
      Icon: Truck,
      title: "Free Shipping",
      desc: "Complimentary shipping on all orders over $50, delivered with care.",
    },
    {
      Icon: Shield,
      title: "Quality Guarantee",
      desc: "Every product is vetted for exceptional quality and timeless craftsmanship.",
    },
    {
      Icon: Headphones,
      title: "Dedicated Support",
      desc: "Our team is here to help with anything you need, Monday through Friday.",
    },
  ];

  return (
    <View style={styles.valuesSection}>
      {values.map((v, i) => (
        <View key={i} style={styles.valueItem}>
          <View style={styles.valueIconCircle}>
            <v.Icon size={20} color={C.gold} />
          </View>
          <Text style={styles.valueTitle}>{v.title}</Text>
          <Text style={styles.valueDesc}>{v.desc}</Text>
        </View>
      ))}
    </View>
  );
}

// ═══════════════════════════════════════════════════
// NEWSLETTER SECTION
// ═══════════════════════════════════════════════════

function NewsletterSection() {
  const [email, setEmail] = useState("");

  const handleSubscribe = () => {
    if (!email) return;
    Toast.show({
      type: "success",
      text1: "Thanks for subscribing!",
      position: "bottom",
    });
    setEmail("");
  };

  return (
    <View style={styles.newsletter}>
      <Text style={styles.newsletterLabel}>NEWSLETTER</Text>
      <Text style={styles.newsletterHeading}>Stay in the Know</Text>
      <Text style={styles.newsletterDesc}>
        Be the first to discover new arrivals, exclusive offers, and curated
        collections delivered to your inbox.
      </Text>
      <View style={styles.newsletterForm}>
        <TextInput
          style={styles.newsletterInput}
          placeholder="your@email.com"
          placeholderTextColor="rgba(253,251,247,0.2)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.newsletterButton}
          onPress={handleSubscribe}
          activeOpacity={0.8}
        >
          <Text style={styles.newsletterButtonText}>SUBSCRIBE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════

function Footer() {
  return (
    <View style={styles.footer}>
      {/* Brand */}
      <View style={styles.footerBrand}>
        <View style={styles.footerBrandRow}>
          <View style={[styles.footerBrandLine]} />
          <Text style={styles.footerBrandText}>STOCKUP</Text>
          <View style={[styles.footerBrandLine]} />
        </View>
        <Text style={styles.footerBrandDesc}>
          Your destination for premium products, thoughtfully curated for the
          modern lifestyle.
        </Text>
      </View>

      <View style={styles.footerDivider} />

      {/* Links */}
      <View style={styles.footerLinks}>
        <View style={styles.footerColumn}>
          <Text style={styles.footerColumnTitle}>SHOP</Text>
          <Text style={styles.footerLink}>All Products</Text>
          <Text style={styles.footerLink}>New Arrivals</Text>
          <Text style={styles.footerLink}>Best Sellers</Text>
        </View>
        <View style={styles.footerColumn}>
          <Text style={styles.footerColumnTitle}>HELP</Text>
          <Text style={styles.footerLink}>FAQ</Text>
          <Text style={styles.footerLink}>Shipping & Returns</Text>
          <Text style={styles.footerLink}>Contact Us</Text>
        </View>
        <View style={styles.footerColumn}>
          <Text style={styles.footerColumnTitle}>CONNECT</Text>
          <Text style={styles.footerLink}>Instagram</Text>
          <Text style={styles.footerLink}>Twitter / X</Text>
          <Text style={styles.footerLink}>hello@stockup.com</Text>
        </View>
      </View>

      <View style={styles.footerDivider} />

      <Text style={styles.footerCopyright}>
        © 2026 StockUp. All rights reserved.
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════
// CART BOTTOM SHEET (simplified for mobile)
// ═══════════════════════════════════════════════════

function CartSheet({
  visible,
  onClose,
  cart,
  cartCount,
  subtotal,
  isCheckingOut,
  updateQty,
  removeFromCart,
  onCheckout,
}: {
  visible: boolean;
  onClose: () => void;
  cart: Array<{ product: Product; qty: number }>;
  cartCount: number;
  subtotal: number;
  isCheckingOut: boolean;
  updateQty: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  onCheckout: () => void;
}) {
  if (!visible) return null;

  return (
    <View style={styles.cartOverlay}>
      <TouchableOpacity
        style={styles.cartBackdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={styles.cartSheet}>
        {/* Header */}
        <View style={styles.cartHeader}>
          <View>
            <Text style={styles.cartLabel}>YOUR BAG</Text>
            <Text style={styles.cartTitle}>Shopping Bag ({cartCount})</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <X size={20} color={C.charcoal} />
          </TouchableOpacity>
        </View>

        <View style={styles.cartDivider} />

        {/* Items */}
        <ScrollView style={styles.cartItems}>
          {cart.length === 0 ? (
            <View style={styles.cartEmpty}>
              <ShoppingBag size={48} color={C.beige} />
              <Text style={styles.cartEmptyTitle}>Your bag is empty</Text>
              <Text style={styles.cartEmptyDesc}>
                Explore our collection to find something you love
              </Text>
            </View>
          ) : (
            cart.map((item) => (
              <View key={item.product.id} style={styles.cartItem}>
                {/* Thumbnail */}
                <View style={styles.cartThumb}>
                  {item.product.image_url ? (
                    <Image
                      source={{ uri: item.product.image_url }}
                      style={styles.cartThumbImage}
                      contentFit="cover"
                    />
                  ) : (
                    <Package size={24} color="#DAD4CA" />
                  )}
                </View>

                {/* Details */}
                <View style={styles.cartItemDetails}>
                  <View style={styles.cartItemTopRow}>
                    <Text style={styles.cartItemName} numberOfLines={1}>
                      {item.product.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeFromCart(item.product.id)}
                    >
                      <X size={16} color={C.taupe} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cartItemPrice}>
                    ${(item.product.price * item.qty).toFixed(2)}
                  </Text>
                  <View style={styles.qtyControl}>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => updateQty(item.product.id, -1)}
                    >
                      <Minus size={12} color={C.taupe} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.qty}</Text>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => updateQty(item.product.id, 1)}
                    >
                      <Plus size={12} color={C.taupe} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Footer */}
        {cart.length > 0 && (
          <View style={styles.cartFooter}>
            <View style={styles.cartSubtotalRow}>
              <Text style={styles.cartSubtotalLabel}>SUBTOTAL</Text>
              <Text style={styles.cartSubtotalValue}>
                ${subtotal.toFixed(2)}
              </Text>
            </View>
            <Text style={styles.cartShippingNote}>
              Shipping and taxes calculated at checkout.
            </Text>
            <TouchableOpacity
              style={[
                styles.checkoutButton,
                (cart.length === 0 || isCheckingOut) &&
                  styles.checkoutButtonDisabled,
              ]}
              onPress={onCheckout}
              disabled={cart.length === 0 || isCheckingOut}
              activeOpacity={0.8}
            >
              <Text style={styles.checkoutButtonText}>
                {isCheckingOut ? "PROCESSING..." : "CHECKOUT"}
              </Text>
              {!isCheckingOut && <ArrowRight size={16} color={C.cream} />}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════
// MAIN LANDING SCREEN
// ═══════════════════════════════════════════════════

export default function LandingScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartVisible, setCartVisible] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const productsYRef = useRef(0);

  const {
    cart,
    cartCount,
    subtotal,
    isCheckingOut,
    addToCart,
    updateQty,
    removeFromCart,
    checkout,
  } = useCart();

  // ─── Fetch products ───
  useEffect(() => {
    StoreAPI.getProducts()
      .then((res) => setProducts(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  // ─── Derived data ───
  const categories = [
    ...new Set(
      products.filter((p) => p.category).map((p) => p.category!.name)
    ),
  ];

  const filteredProducts = products.filter((p) => {
    const matchCat =
      activeCategory === "all" || p.category?.name === activeCategory;
    const matchSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // ─── Handlers ───
  const scrollToProducts = () => {
    scrollRef.current?.scrollTo({ y: productsYRef.current, animated: true });
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    Toast.show({
      type: "success",
      text1: "Added to bag",
      position: "bottom",
      visibilityTime: 1500,
    });
  };

  const handleCheckout = async () => {
    const { success, error } = await checkout();
    if (success) {
      setCartVisible(false);
      Toast.show({
        type: "success",
        text1: "Order placed!",
        text2: "Thank you for your purchase.",
        position: "bottom",
      });
    } else {
      Toast.show({
        type: "error",
        text1: "Checkout failed",
        text2: error || "Please try again",
        position: "bottom",
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <AnnouncementBar />
      <Header onCartPress={() => setCartVisible(true)} cartCount={cartCount} />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <HeroSection onExplore={scrollToProducts} />
        <TrustMarquee />

        {/* ── Products Section ── */}
        <View
          style={styles.productsSection}
          onLayout={(e) => {
            productsYRef.current = e.nativeEvent.layout.y;
          }}
        >
          {/* Section heading */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>EXPLORE</Text>
            <Text style={styles.sectionHeading}>Our Collection</Text>
            <View style={styles.sectionDivider}>
              <View style={[styles.decorLine, { width: 64 }]} />
              <View style={styles.decorDotGold} />
              <View style={[styles.decorLine, { width: 64 }]} />
            </View>
          </View>

          {/* Category pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryScrollContent}
          >
            <TouchableOpacity
              style={[
                styles.categoryPill,
                activeCategory === "all" && styles.categoryPillActive,
              ]}
              onPress={() => setActiveCategory("all")}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  activeCategory === "all" && styles.categoryPillTextActive,
                ]}
              >
                ALL
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryPill,
                  activeCategory === cat && styles.categoryPillActive,
                ]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    activeCategory === cat && styles.categoryPillTextActive,
                  ]}
                >
                  {cat.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Search
              size={16}
              color="rgba(140,132,119,0.5)"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor="rgba(140,132,119,0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Product grid */}
          {loading ? (
            <View style={styles.productGrid}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.skeletonCard}>
                  <View style={styles.skeletonImage} />
                  <View style={styles.skeletonText1} />
                  <View style={styles.skeletonText2} />
                </View>
              ))}
            </View>
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Package size={56} color={C.beige} />
              <Text style={styles.emptyTitle}>
                {searchQuery || activeCategory !== "all"
                  ? "No products match your criteria"
                  : "No products available yet"}
              </Text>
              {(searchQuery || activeCategory !== "all") && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                  }}
                >
                  <Text style={styles.clearFiltersText}>Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.productGrid}>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </View>
          )}
        </View>

        <ValuesSection />
        <NewsletterSection />
        <Footer />
      </ScrollView>

      {/* Floating Cart FAB */}
      <TouchableOpacity
        style={styles.cartFab}
        onPress={() => setCartVisible(true)}
        activeOpacity={0.8}
      >
        <ShoppingBag size={20} color={C.cream} />
        {cartCount > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cartCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Cart Sheet */}
      <CartSheet
        visible={cartVisible}
        onClose={() => setCartVisible(false)}
        cart={cart}
        cartCount={cartCount}
        subtotal={subtotal}
        isCheckingOut={isCheckingOut}
        updateQty={updateQty}
        removeFromCart={removeFromCart}
        onCheckout={handleCheckout}
      />

      <Toast />
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.cream,
  },
  scrollView: {
    flex: 1,
  },

  // ── Announcement Bar ──
  announcementBar: {
    backgroundColor: C.dark,
    height: 36,
    overflow: "hidden",
    justifyContent: "center",
  },
  marqueeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  marqueeItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
  },
  marqueeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: `${C.gold}80`,
    marginRight: 10,
  },
  marqueeText: {
    color: C.gold,
    fontSize: 10,
    letterSpacing: 3,
    textTransform: "uppercase",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },

  // ── Header ──
  header: {
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    backgroundColor: C.cream,
    borderBottomWidth: 1,
    borderBottomColor: C.beige,
  },
  headerLeft: {
    width: 60,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerLine: {
    height: 1,
    width: 24,
    backgroundColor: C.gold,
  },
  logoText: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 22,
    letterSpacing: 6,
    color: C.charcoal,
  },
  headerRight: {
    width: 60,
    alignItems: "flex-end",
  },

  // ── Hero ──
  hero: {
    minHeight: SCREEN_HEIGHT * 0.78,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  heroAccentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 48,
  },
  accentLine: {
    height: 1,
    backgroundColor: C.gold,
  },
  accentLabel: {
    color: C.gold,
    fontSize: 10,
    letterSpacing: 5,
    textTransform: "uppercase",
  },
  heroHeading: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 48,
    color: C.charcoal,
    textAlign: "center",
    lineHeight: 52,
    marginBottom: 32,
  },
  heroHeadingAccent: {
    color: C.gold,
  },
  heroSubtitle: {
    color: C.taupe,
    fontSize: 16,
    lineHeight: 26,
    textAlign: "center",
    maxWidth: 340,
    marginBottom: 56,
    alignSelf: "center",
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.charcoal,
    paddingVertical: 18,
    paddingHorizontal: 48,
  },
  ctaButtonText: {
    color: C.cream,
    fontSize: 12,
    letterSpacing: 4,
    fontWeight: "500",
  },
  heroBottomDecor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 64,
  },
  decorLine: {
    height: 1,
    backgroundColor: C.beige,
  },
  decorDiamond: {
    width: 6,
    height: 6,
    borderWidth: 1,
    borderColor: `${C.gold}66`,
    transform: [{ rotate: "45deg" }],
  },

  // ── Trust Marquee ──
  trustMarquee: {
    backgroundColor: C.charcoal,
    paddingVertical: 14,
    overflow: "hidden",
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 24,
  },
  trustDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.gold,
    marginRight: 12,
  },
  trustText: {
    color: `${C.cream}66`,
    fontSize: 10,
    letterSpacing: 3,
    textTransform: "uppercase",
  },

  // ── Products Section ──
  productsSection: {
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    alignItems: "center",
    marginBottom: 56,
  },
  sectionLabel: {
    color: C.gold,
    fontSize: 10,
    letterSpacing: 5,
    textTransform: "uppercase",
  },
  sectionHeading: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 30,
    color: C.charcoal,
    marginTop: 12,
  },
  sectionDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 24,
  },
  decorDotGold: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.gold,
  },

  // ── Category Pills ──
  categoryScroll: {
    marginBottom: 20,
  },
  categoryScrollContent: {
    gap: 4,
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  categoryPillActive: {
    backgroundColor: C.charcoal,
  },
  categoryPillText: {
    fontSize: 11,
    letterSpacing: 2,
    color: C.taupe,
  },
  categoryPillTextActive: {
    color: C.cream,
  },

  // ── Search ──
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.beige,
    marginBottom: 40,
  },
  searchIcon: {
    marginLeft: 14,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 14,
    color: C.charcoal,
  },

  // ── Product Grid ──
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: PRODUCT_GAP,
  },
  productCard: {
    width: PRODUCT_CARD_WIDTH,
    marginBottom: 20,
  },
  productImageWrapper: {
    aspectRatio: 4 / 5,
    backgroundColor: C.sand,
    overflow: "hidden",
    marginBottom: 8,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: `${C.cream}E6`,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  categoryBadgeText: {
    fontSize: 8,
    letterSpacing: 2,
    color: C.taupe,
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${C.cream}99`,
    alignItems: "center",
    justifyContent: "center",
  },
  soldOutBadge: {
    borderWidth: 1,
    borderColor: C.charcoal,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  soldOutText: {
    color: C.charcoal,
    fontSize: 10,
    letterSpacing: 3,
  },
  addToBagButton: {
    backgroundColor: C.charcoal,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  addToBagText: {
    color: C.cream,
    fontSize: 11,
    letterSpacing: 2,
  },
  productInfo: {
    gap: 4,
  },
  productName: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 15,
    color: C.charcoal,
  },
  productDesc: {
    fontSize: 13,
    color: C.taupe,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 14,
    color: C.gold,
    letterSpacing: 1,
    marginTop: 2,
  },

  // ── Skeleton ──
  skeletonCard: {
    width: PRODUCT_CARD_WIDTH,
  },
  skeletonImage: {
    aspectRatio: 4 / 5,
    backgroundColor: C.sand,
    marginBottom: 12,
  },
  skeletonText1: {
    height: 16,
    width: "66%",
    backgroundColor: C.sand,
    marginBottom: 8,
  },
  skeletonText2: {
    height: 12,
    width: "33%",
    backgroundColor: C.sand,
  },

  // ── Empty State ──
  emptyState: {
    alignItems: "center",
    paddingVertical: 96,
  },
  emptyTitle: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 18,
    color: C.taupe,
    marginTop: 20,
    textAlign: "center",
  },
  clearFiltersText: {
    color: C.gold,
    fontSize: 14,
    marginTop: 16,
    textDecorationLine: "underline",
  },

  // ── Values ──
  valuesSection: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.beige,
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 40,
  },
  valueItem: {
    alignItems: "center",
  },
  valueIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.beige,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  valueTitle: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 18,
    color: C.charcoal,
    marginBottom: 8,
  },
  valueDesc: {
    fontSize: 14,
    color: C.taupe,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },

  // ── Newsletter ──
  newsletter: {
    backgroundColor: C.charcoal,
    paddingVertical: 80,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  newsletterLabel: {
    color: C.gold,
    fontSize: 10,
    letterSpacing: 5,
  },
  newsletterHeading: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 30,
    color: C.cream,
    marginTop: 12,
    marginBottom: 16,
  },
  newsletterDesc: {
    color: `${C.cream}59`,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
    maxWidth: 340,
  },
  newsletterForm: {
    width: "100%",
    maxWidth: 400,
  },
  newsletterInput: {
    borderWidth: 1,
    borderColor: `${C.cream}26`,
    color: C.cream,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 14,
    marginBottom: 12,
  },
  newsletterButton: {
    backgroundColor: C.gold,
    paddingVertical: 16,
    alignItems: "center",
  },
  newsletterButtonText: {
    color: C.cream,
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: "500",
  },

  // ── Footer ──
  footer: {
    backgroundColor: C.dark,
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  footerBrand: {
    alignItems: "center",
    marginBottom: 40,
  },
  footerBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  footerBrandLine: {
    height: 1,
    width: 32,
    backgroundColor: `${C.gold}66`,
  },
  footerBrandText: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 22,
    letterSpacing: 6,
    color: C.cream,
  },
  footerBrandDesc: {
    color: `${C.cream}59`,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },
  footerDivider: {
    height: 1,
    backgroundColor: `${C.cream}14`,
    marginBottom: 40,
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  footerColumn: {
    gap: 12,
  },
  footerColumnTitle: {
    color: C.gold,
    fontSize: 10,
    letterSpacing: 3,
    marginBottom: 8,
  },
  footerLink: {
    color: `${C.cream}80`,
    fontSize: 13,
  },
  footerCopyright: {
    color: `${C.cream}40`,
    fontSize: 11,
    textAlign: "center",
    letterSpacing: 1,
  },

  // ── Cart FAB ──
  cartFab: {
    position: "absolute",
    bottom: 32,
    right: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.charcoal,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: C.gold,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: {
    color: C.cream,
    fontSize: 10,
    fontWeight: "bold",
  },

  // ── Cart Sheet ──
  cartOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  cartBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  cartSheet: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: Math.min(SCREEN_WIDTH * 0.85, 400),
    backgroundColor: C.cream,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: -4, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: { elevation: 16 },
    }),
  },
  cartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 0,
  },
  cartLabel: {
    fontSize: 10,
    letterSpacing: 3,
    color: C.taupe,
    marginBottom: 4,
  },
  cartTitle: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 22,
    color: C.charcoal,
  },
  cartDivider: {
    height: 1,
    backgroundColor: C.beige,
    marginHorizontal: 24,
    marginTop: 16,
  },
  cartItems: {
    flex: 1,
    paddingHorizontal: 24,
  },
  cartEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 96,
  },
  cartEmptyTitle: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 18,
    color: C.taupe,
    marginTop: 16,
  },
  cartEmptyDesc: {
    fontSize: 14,
    color: `${C.taupe}80`,
    marginTop: 6,
  },
  cartItem: {
    flexDirection: "row",
    gap: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.beige,
  },
  cartThumb: {
    width: 64,
    height: 80,
    backgroundColor: C.sand,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cartThumbImage: {
    width: 64,
    height: 80,
  },
  cartItemDetails: {
    flex: 1,
  },
  cartItemTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  cartItemName: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 14,
    color: C.charcoal,
    flex: 1,
  },
  cartItemPrice: {
    fontSize: 14,
    color: C.gold,
    marginTop: 6,
  },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.beige,
    alignSelf: "flex-start",
    marginTop: 10,
  },
  qtyButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  qtyText: {
    width: 32,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
    color: C.charcoal,
  },
  cartFooter: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: C.beige,
  },
  cartSubtotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cartSubtotalLabel: {
    fontSize: 10,
    letterSpacing: 3,
    color: C.taupe,
  },
  cartSubtotalValue: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 20,
    color: C.charcoal,
  },
  cartShippingNote: {
    fontSize: 11,
    color: `${C.taupe}80`,
    marginBottom: 20,
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.charcoal,
    paddingVertical: 16,
  },
  checkoutButtonDisabled: {
    opacity: 0.4,
  },
  checkoutButtonText: {
    color: C.cream,
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: "500",
  },
});
```

---

## 11. Cart Implementation

The cart is fully handled by the `useCart` hook (Section 8). It provides:

- `addToCart(product)` — Add or increment quantity
- `updateQty(productId, delta)` — +1 / -1 quantity (min 1)
- `removeFromCart(productId)` — Remove item
- `checkout()` — Calls `POST /api/store/checkout` (public, no auth)
- `cart`, `cartCount`, `subtotal`, `isCheckingOut` — Reactive state

The `CartSheet` component in the Landing Screen renders the drawer UI matching the web app's Sheet component.

---

## 12. API Endpoint Reference

Complete reference for every endpoint your Expo app can call:

### Public (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products?status=active` | List active products for storefront |
| `POST` | `/api/store/checkout` | Place order and reduce stock |

**Checkout body:**
```json
{
  "items": [
    { "product_id": "uuid", "quantity": 2, "unit_price": 29.99 }
  ]
}
```

**Checkout response (201):**
```json
{
  "data": { "id": "order-uuid", "status": "completed", ... },
  "success": true
}
```

### Products (Auth Required)

| Method | Endpoint | Role | Params / Body |
|--------|----------|------|---------------|
| `GET` | `/api/products` | viewer+ | `?search=&category=&supplier=&status=&stock=low\|out&page=1&pageSize=20` |
| `GET` | `/api/products/:id` | viewer+ | — |
| `POST` | `/api/products` | manager+ | `{ name, sku, description?, price?, cost_price?, quantity_in_stock?, reorder_point?, supplier_id?, category_id?, image_url?, status? }` |
| `PUT` | `/api/products/:id` | manager+ | Same as POST body |
| `DELETE` | `/api/products/:id` | admin | — |

**Response shape:** `{ data: Product }` or `{ data: Product[], count, page, pageSize }`

### Categories (Auth Required)

| Method | Endpoint | Role | Params / Body |
|--------|----------|------|---------------|
| `GET` | `/api/categories` | viewer+ | — |
| `POST` | `/api/categories` | manager+ | `{ name, description?, parent_id? }` |
| `PUT` | `/api/categories` | manager+ | `{ id, name, description?, parent_id? }` |
| `DELETE` | `/api/categories?id=uuid` | manager+ | — |

### Suppliers (Auth Required)

| Method | Endpoint | Role | Params / Body |
|--------|----------|------|---------------|
| `GET` | `/api/suppliers` | viewer+ | `?search=` |
| `POST` | `/api/suppliers` | manager+ | `{ name, contact_name?, email?, phone?, address?, notes? }` |
| `PUT` | `/api/suppliers` | manager+ | `{ id, name, contact_name?, email?, phone?, address?, notes? }` |
| `DELETE` | `/api/suppliers?id=uuid` | manager+ | — |

### Orders (Auth Required)

| Method | Endpoint | Role | Params / Body |
|--------|----------|------|---------------|
| `GET` | `/api/orders` | viewer+ | `?type=inbound\|outbound\|adjustment&status=pending\|completed\|cancelled&page=1&pageSize=20` |
| `GET` | `/api/orders/:id` | viewer+ | — |
| `POST` | `/api/orders` | manager+ | `{ type, reference_number?, supplier_id?, notes?, items: [{ product_id, quantity, unit_price }] }` |
| `PUT` | `/api/orders/:id` | manager+ | `{ reference_number?, supplier_id?, notes?, status?: "cancelled" }` |
| `POST` | `/api/orders/:id/complete` | manager+ | — (triggers RPC stock update) |

### Dashboard (Auth Required)

| Method | Endpoint | Role | Response |
|--------|----------|------|----------|
| `GET` | `/api/dashboard/stats` | viewer+ | `{ data: { totalProducts, activeProducts, lowStockCount, outOfStockCount, totalValue, totalSuppliers, pendingOrders } }` |
| `GET` | `/api/dashboard/alerts` | viewer+ | `{ data: [{ id, name, sku, quantity_in_stock, reorder_point, reorder_quantity, supplier }] }` |

### Users (Admin Only)

| Method | Endpoint | Role | Params / Body |
|--------|----------|------|---------------|
| `GET` | `/api/users` | admin | — |
| `PUT` | `/api/users` | admin | `{ id, role: "admin"\|"manager"\|"viewer" }` |

### Audit Log (Admin Only)

| Method | Endpoint | Role | Params |
|--------|----------|------|--------|
| `GET` | `/api/audit-log` | admin | `?entityType=&action=created\|updated\|deleted&page=1&pageSize=50` |

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/auth/callback` | — | OAuth/OTP callback (web redirect, not used in mobile) |
| `POST` | `/api/profile/ensure` | yes | Auto-creates profile if missing |

### Auth Headers

For authenticated endpoints, pass the Supabase JWT:

```
Authorization: Bearer <supabase-access-token>
```

The `authHeaders()` helper in `services/api.ts` handles this automatically.

### Error Response Shape

All endpoints return errors as:
```json
{ "error": "Human-readable error message" }
```

HTTP status codes: `400` (validation), `401` (unauthorized), `403` (forbidden), `404` (not found), `500` (server error)

---

## File Structure Summary

After implementing this guide, your Expo project should have:

```
your-expo-app/
├── env.ts                          # Environment config
├── EXPO_INTEGRATION_GUIDE.md       # This file
├── lib/
│   ├── supabase.ts                 # Supabase client with AsyncStorage
│   └── validators.ts               # Shared input validators
├── types/
│   └── index.ts                    # Shared TypeScript interfaces
├── services/
│   ├── api.ts                      # Full API service layer
│   └── auth.ts                     # Auth service
├── hooks/
│   ├── useAuth.ts                  # Auth state hook
│   ├── useRole.ts                  # Role-based permissions hook
│   └── useCart.ts                  # Cart state + checkout hook
└── screens/
    └── LandingScreen.tsx           # Full landing page implementation
```

---

## Font Setup Note

The Landing Screen uses `Platform.OS === "ios" ? "Georgia" : "serif"` as a fallback. For exact web parity, load the Google Fonts in your `App.tsx`:

```tsx
import {
  useFonts,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
} from "@expo-google-fonts/playfair-display";
import { DMSans_400Regular, DMSans_500Medium } from "@expo-google-fonts/dm-sans";

export default function App() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  if (!fontsLoaded) return null;

  // ... rest of app
}
```

Then replace all `fontFamily: Platform.OS === "ios" ? "Georgia" : "serif"` with `fontFamily: "PlayfairDisplay_400Regular"` and body text with `fontFamily: "DMSans_400Regular"`.
