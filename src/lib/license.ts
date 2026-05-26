import { fetch } from "@tauri-apps/plugin-http";
import { Store } from "@tauri-apps/plugin-store";

let _store: Store | null = null;

async function getStore() {
  if (!_store) {
    _store = await Store.load("store.bin");
  }
  return _store;
}

const POLAR_API_URL = "https://api.polar.sh";
const ORGANIZATION_ID = "546f69f9-2e28-4a9c-b9db-dff9377f5023";

export async function activateLicense(key: string): Promise<boolean> {
  try {
    const response = await fetch(`${POLAR_API_URL}/v1/customer-portal/license-keys/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key,
        organization_id: ORGANIZATION_ID,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail?.[0]?.msg || errorData?.error || "Failed to validate license");
    }

    const data = await response.json();

    // Save license data to Tauri store
    const store = await getStore();
    await store.set("license-key", key);
    await store.set("license-validation", data);
    await store.set("is-activated", true);
    await store.save();

    return true;
  } catch (error) {
    console.error("License validation error:", error);
    throw error;
  }
}

export async function getStoredLicense(): Promise<string | null> {
  const store = await getStore();
  return (await store.get<string>("license-key")) || "";
}

export async function validateLicense(): Promise<boolean> {
  const key = await getStoredLicense();
  if (!key) return false;

  try {
    const response = await fetch(`${POLAR_API_URL}/v1/customer-portal/license-keys/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key,
        organization_id: ORGANIZATION_ID,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("License validation error:", error);
    return false; // Assuming invalid if offline? Alternatively, cache validation
  }
}

export interface TrialInfo {
  isTrialStarted: boolean;
  isTrialActive: boolean;
  daysLeft: number;
}

export async function getTrialInfo(): Promise<TrialInfo> {
  const store = await getStore();
  const startDateStr = await store.get<number>("trial-start-date");
  
  if (!startDateStr) {
    return { isTrialStarted: false, isTrialActive: false, daysLeft: 7 };
  }

  const now = Date.now();
  const daysPassed = (now - startDateStr) / (1000 * 60 * 60 * 24);
  const daysLeft = Math.max(0, Math.ceil(7 - daysPassed));
  
  return {
    isTrialStarted: true,
    isTrialActive: daysLeft > 0,
    daysLeft,
  };
}

export async function startTrial(): Promise<void> {
  const store = await getStore();
  await store.set("trial-start-date", Date.now());
  await store.save();
}

export async function getIsActivated(): Promise<boolean> {
  const store = await getStore();
  return (await store.get<boolean>("is-activated")) || false;
}
