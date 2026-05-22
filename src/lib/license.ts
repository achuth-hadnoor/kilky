import { fetch } from "@tauri-apps/plugin-http";
import { Store } from "@tauri-apps/plugin-store";

let _store: Store | null = null;

async function getStore() {
  if (!_store) {
    _store = await Store.load("store.bin");
  }
  return _store;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function activateLicense(key: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/license/activate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key,
        label: "Kliky Desktop",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || "Failed to activate license");
    }

    const data = await response.json();

    // Save license data to Tauri store
    const store = await getStore();
    await store.set("license-key", key);
    await store.set("license-activation", data);
    await store.save();

    return true;
  } catch (error) {
    console.error("License activation error:", error);
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
    const response = await fetch(`${API_URL}/api/license/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key }),
    });

    return response.ok;
  } catch (error) {
    console.error("License validation error:", error);
    return false; // Assuming invalid if offline? Alternatively, cache validation
  }
}
