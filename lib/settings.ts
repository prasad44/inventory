export interface StoreSettings {
  waNumber: string | null;
  freeDeliveryThresholdLKR: number;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankBranch: string;
  storeName: string;
}

export const STORE_SETTINGS: StoreSettings = {
  waNumber: process.env.NEXT_PUBLIC_STORE_WA_NUMBER ?? null,
  freeDeliveryThresholdLKR: 5000,
  bankName: "Commercial Bank PLC",
  bankAccountName: "VoltHub (Pvt) Ltd",
  bankAccountNumber: "1234567890",
  bankBranch: "Colombo 03",
  storeName: "VoltHub",
};
