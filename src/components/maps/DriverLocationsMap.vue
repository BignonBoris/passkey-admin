<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from "vue";
import { DEFAULT_MAP_CENTER, loadGoogleMaps } from "@/utils/google-maps";

type DriverPoint = {
  id: string;
  name: string;
  position: google.maps.LatLngLiteral;
  isAvailable: boolean;
};

const props = defineProps<{
  drivers: Array<{
    id: string;
    name: string;
    latitude?: number | null;
    longitude?: number | null;
    isAvailable: boolean;
  }>;
  height?: string;
  fallbackCenter?: google.maps.LatLngLiteral;
}>();

const mapContainer = ref<HTMLDivElement | null>(null);
const mapInstance = ref<any | null>(null);
const googleRef = ref<NonNullable<typeof window.google> | null>(null);
const markers = ref<any[]>([]);
const loadError = ref("");
const hasLoaded = ref(false);
const fallbackCenter = computed(() => props.fallbackCenter ?? DEFAULT_MAP_CENTER);
const containerStyle = computed(() => ({ height: props.height ?? "360px", minHeight: props.height ?? "360px" }));

const validDrivers = computed<DriverPoint[]>(() => {
  console.log("Map Debug - Drivers reçus:", props.drivers);
  return props.drivers
    .map((driver) => {
      const lat = (driver as any).latitude;
      const lng = (driver as any).longitude;
      if (typeof lat !== 'number' || typeof lng !== 'number') return null;
      return {
        id: driver.id,
        name: driver.name,
        position: { lat, lng },
        isAvailable: driver.isAvailable,
      };
    })
    .filter((driver): driver is DriverPoint => driver !== null);
});

const createMap = async () => {
  await nextTick();
  if (!mapContainer.value) return;
  try {
    console.log("Map Debug - Chargement SDK...");
    googleRef.value = await loadGoogleMaps();
    console.log("Map Debug - Initialisation de l'instance Map...");
    mapInstance.value ??= new googleRef.value.maps.Map(mapContainer.value, {
      center: fallbackCenter.value,
      zoom: 13,
      disableDefaultUI: false,
    });
    hasLoaded.value = true;
    refreshMarkers();
  } catch (error: any) {
    console.error("Map Debug - Erreur:", error);
    loadError.value = error?.message || "Impossible de charger la carte.";
  }
};

const refreshMarkers = () => {
  if (!mapInstance.value || !googleRef.value) return;
  const google = googleRef.value;

  // Clear old markers
  markers.value.forEach((marker) => marker.setMap(null));
  markers.value = [];

  const points = validDrivers.value;
  console.log("Map Debug - Rafraîchissement des marqueurs. Points valides:", points);

  if (!points.length) {
    mapInstance.value.setCenter(fallbackCenter.value);
    return;
  }

  const bounds = new google.maps.LatLngBounds();
  points.forEach((point) => {
    const marker: any = new google.maps.Marker({
      position: point.position,
      map: mapInstance.value,
      title: `${point.name} (${point.isAvailable ? "En ligne" : "Hors ligne"})`,
      icon: point.isAvailable
        ? "https://maps.gstatic.com/mapfiles/ms2/micons/green-dot.png"
        : "https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png",
    });
    markers.value.push(marker);
    bounds.extend(point.position);
  });

  if (points.length === 1) {
    mapInstance.value.setCenter(points[0].position);
    mapInstance.value.setZoom(15);
  } else {
    mapInstance.value.fitBounds(bounds as any);
  }
};

onMounted(() => {
  void createMap();
});

onBeforeUnmount(() => {
  markers.value.forEach((marker) => marker.setMap(null));
  markers.value = [];
  mapInstance.value = null;
});

watch(validDrivers, () => {
  refreshMarkers();
}, { deep: true });
</script>

<template>
  <div class="relative w-full rounded-lg border border-ld/70" :style="containerStyle">
    <div ref="mapContainer" class="h-full w-full rounded-lg"></div>
    <div v-if="loadError"
      class="absolute inset-0 flex items-center justify-center rounded-lg bg-white/80 text-xs text-red-600">
      {{ loadError }}
    </div>
    <div v-else-if="hasLoaded && !validDrivers.length"
      class="absolute bottom-2 left-2 right-2 rounded-md bg-white/90 p-2 text-center text-xs text-muted-foreground shadow-sm">
      Aucune position précise disponible. Affichage par défaut.
    </div>
  </div>
</template>
