const SDK_ID = "google-maps-sdk";
let loaderPromise: Promise<NonNullable<typeof window.google>> | null = null;

const getApiKey = () => {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) {
    console.warn("VITE_GOOGLE_MAPS_API_KEY is not set. Google Maps will not be loaded correctly.");
    return "";
  }
  return key;
};

export const loadGoogleMaps = (): Promise<NonNullable<typeof window.google>> => {
  if (loaderPromise) {
    return loaderPromise;
  }

  loaderPromise = new Promise<NonNullable<typeof window.google>>((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve(window.google);
      return;
    }

    const existing = document.getElementById(SDK_ID) as HTMLScriptElement | null;
    if (existing) {
      const handleLoad = () => {
        existing.removeEventListener("load", handleLoad);
        existing.removeEventListener("error", handleError);
        if (window.google && window.google.maps) {
          resolve(window.google);
        } else {
          reject(new Error("Google Maps SDK loaded but did not expose window.google"));
        }
      };
      const handleError = () => {
        existing.removeEventListener("load", handleLoad);
        existing.removeEventListener("error", handleError);
        reject(new Error("Failed to load Google Maps SDK"));
      };
      existing.addEventListener("load", handleLoad);
      existing.addEventListener("error", handleError);
      return;
    }

    const script = document.createElement("script");
    script.id = SDK_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(getApiKey())}&libraries=places`;
    script.async = true;
    script.defer = true;
    const handleLoad = () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
      if (window.google && window.google.maps) {
        resolve(window.google);
      } else {
        reject(new Error("Google Maps SDK loaded but did not expose window.google"));
      }
    };
    const handleError = () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
      reject(new Error("Failed to load Google Maps SDK"));
    };
    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);
    document.head.appendChild(script);
  });

  return loaderPromise;
};

export const DEFAULT_MAP_CENTER = { lat: 5.347, lng: -4.016 };
