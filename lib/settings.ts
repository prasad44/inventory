import { createClient } from "@supabase/supabase-js";

export interface StoreSettings {
  waNumber: string | null;
  freeDeliveryThresholdLKR: number;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankBranch: string;
  storeName: string;
}

const FALLBACK: StoreSettings = {
  waNumber: process.env.NEXT_PUBLIC_STORE_WA_NUMBER ?? null,
  freeDeliveryThresholdLKR: 5000,
  bankName: "Commercial Bank PLC",
  bankAccountName: "VoltHub (Pvt) Ltd",
  bankAccountNumber: "1234567890",
  bankBranch: "Colombo 03",
  storeName: "VoltHub",
};

// Keep this synchronous export for existing callers that use STORE_SETTINGS directly.
export const STORE_SETTINGS: StoreSettings = FALLBACK;

/**
 * Server-side fetcher. Callers that need live settings (e.g. order confirmation,
 * checkout delivery threshold) should call this. Callers that need synchronous
 * access continue to use STORE_SETTINGS with fallback values.
 */
export async function fetchStoreSettings(): Promise<StoreSettings> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return FALLBACK;
  try {
    const sb = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await sb
      .from("store_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (!data) return FALLBACK;
    return {
      waNumber: data.wa_number ?? FALLBACK.waNumber,
      freeDeliveryThresholdLKR: Number(
        data.free_delivery_threshold ?? FALLBACK.freeDeliveryThresholdLKR
      ),
      bankName: data.bank_name ?? FALLBACK.bankName,
      bankAccountName: data.bank_account_name ?? FALLBACK.bankAccountName,
      bankAccountNumber: data.bank_account_number ?? FALLBACK.bankAccountNumber,
      bankBranch: data.bank_branch ?? FALLBACK.bankBranch,
      storeName: FALLBACK.storeName,
    };
  } catch {
    return FALLBACK;
  }
}
