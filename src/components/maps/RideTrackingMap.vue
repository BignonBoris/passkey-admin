<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import axios from "@/utils/axios";
import { DEFAULT_MAP_CENTER, loadGoogleMaps } from "@/utils/google-maps";

const props = defineProps<{
  pickup?: google.maps.LatLngLiteral | null;
  destination?: google.maps.LatLngLiteral | null;
  driver?: google.maps.LatLngLiteral | null;
  height?: string;
  fallbackCenter?: google.maps.LatLngLiteral;
}>();

const emit = defineEmits<{
  (e: "route-info", info: { distance: string; duration: string }): void;
}>();

type RouteApiResponse = {
  success?: boolean;
  polyline?: string;
  distanceText?: string;
  durationText?: string;
};

type RouteRequestPayload = {
  origin: string;
  destination: string;
  waypoint?: string;
};

const mapContainer = ref<HTMLDivElement | null>(null);
const mapInstance = ref<any | null>(null);
const googleRef = ref<any | null>(null);
const markers = ref<Record<string, any | null>>({
  pickup: null,
  destination: null,
  driver: null,
});
const directionsRenderer = ref<any | null>(null);
const directionsService = ref<any | null>(null);
const routePolyline = ref<any | null>(null);
const loadError = ref("");
const containerStyle = computed(() => ({
  height: props.height ?? "360px",
  minHeight: props.height ?? "360px",
}));

const mapPoints = computed(() => [
  {
    key: "pickup",
    position: props.pickup,
    title: "Point de depart",
    icon: "https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png",
  },
  {
    key: "destination",
    position: props.destination,
    title: "Destination",
    icon: "https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png",
  },
  {
    key: "driver",
    position: props.driver,
    title: "Livreur",
    icon: "https://maps.gstatic.com/mapfiles/ms2/micons/green-dot.png",
  },
]);

function decodePolyline(encoded: string): google.maps.LatLngLiteral[] {
  const points: google.maps.LatLngLiteral[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

const initializeMap = async () => {
  await nextTick();
  if (!mapContainer.value) return;
  try {
    googleRef.value = await loadGoogleMaps();

    if (mapInstance.value) return;

    mapInstance.value = new googleRef.value.maps.Map(mapContainer.value, {
      center: props.fallbackCenter ?? DEFAULT_MAP_CENTER,
      zoom: 13,
      disableDefaultUI: false,
    });

    // Conserve l'ancienne logique Google en commentaire pour retour rapide si besoin.
    directionsService.value = new googleRef.value.maps.DirectionsService();
    directionsRenderer.value = new googleRef.value.maps.DirectionsRenderer({
      map: null,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#0D47A1",
        strokeWeight: 5,
        strokeOpacity: 0.7,
      },
    });

    await refreshMap();
  } catch (error: any) {
    console.error("RideTrackingMap - Error:", error);
    loadError.value = error?.message || "Impossible de charger la carte.";
  }
};

const calculateRoute = async () => {
  if (!mapInstance.value || !googleRef.value || !props.pickup) return;

  routePolyline.value?.setMap(null);
  routePolyline.value = null;

  const originPoint = props.driver ?? props.pickup;
  const destinationPoint = props.destination ?? props.pickup;
  const shouldUsePickupWaypoint =
    !!props.driver &&
    !!props.destination &&
    (props.driver.lat !== props.pickup.lat || props.driver.lng !== props.pickup.lng);

  const routePayload: RouteRequestPayload = {
    origin: `${originPoint.lat},${originPoint.lng}`,
    destination: `${destinationPoint.lat},${destinationPoint.lng}`,
  };

  if (shouldUsePickupWaypoint) {
    routePayload.waypoint = `${props.pickup.lat},${props.pickup.lng}`;
  }

  // directionsService.value?.route(
  //   {
  //     origin: originPoint,
  //     destination: destinationPoint,
  //     travelMode: googleRef.value.maps.TravelMode.DRIVING,
  //   },
  //   (result: any, status: string) => {
  //     if (status === "OK") {
  //       directionsRenderer.value?.setDirections(result);
  //     }
  //   },
  // );

  try {
    const response = await axios.post<RouteApiResponse>("/maps/route", routePayload);

    const encodedPolyline = String(response.data?.polyline ?? "").trim();
    emit("route-info", {
      distance: String(response.data?.distanceText ?? "-").trim() || "-",
      duration: String(response.data?.durationText ?? "-").trim() || "-",
    });

    if (!encodedPolyline) return;

    const path = decodePolyline(encodedPolyline);
    if (path.length === 0) return;

    routePolyline.value = new googleRef.value.maps.Polyline({
      path,
      map: mapInstance.value,
      geodesic: true,
      strokeColor: "#0D47A1",
      strokeWeight: 5,
      strokeOpacity: 0.7,
    });
  } catch (error) {
    console.warn("Calcul d'itineraire via maps/route echoue:", error);
    emit("route-info", { distance: "-", duration: "-" });
  }
};

const refreshMap = async () => {
  if (!mapInstance.value || !googleRef.value) return;
  const googleMaps = googleRef.value.maps;

  Object.values(markers.value).forEach((marker) => marker?.setMap(null));
  Object.keys(markers.value).forEach((key) => {
    markers.value[key] = null;
  });
  routePolyline.value?.setMap(null);
  routePolyline.value = null;

  const bounds = new googleMaps.LatLngBounds();
  let addedPoint = false;

  mapPoints.value.forEach((point) => {
    if (!point.position) return;
    const marker = new googleMaps.Marker({
      position: point.position,
      map: mapInstance.value,
      title: point.title,
      icon: point.icon,
    });
    markers.value[point.key] = marker;
    bounds.extend(point.position);
    addedPoint = true;
  });

  await calculateRoute();

  if (addedPoint) {
    mapInstance.value.fitBounds(bounds);
    if (mapInstance.value.getZoom() > 16) {
      mapInstance.value.setZoom(16);
    }
  } else {
    mapInstance.value.setCenter(props.fallbackCenter ?? DEFAULT_MAP_CENTER);
    mapInstance.value.setZoom(13);
  }
};

onMounted(() => {
  void initializeMap();
});

onBeforeUnmount(() => {
  Object.values(markers.value).forEach((marker) => marker?.setMap(null));
  directionsRenderer.value?.setMap(null);
  routePolyline.value?.setMap(null);
});

watch(
  () => [props.pickup, props.destination, props.driver],
  () => {
    void refreshMap();
  },
  { deep: true },
);
</script>

<template>
  <div class="relative w-full rounded-lg border border-ld/70" :style="containerStyle">
    <div ref="mapContainer" class="h-full w-full rounded-lg"></div>
    <div
      v-if="loadError"
      class="absolute inset-0 flex items-center justify-center rounded-lg bg-white/80 text-xs text-red-600"
    >
      {{ loadError }}
    </div>
  </div>
</template>
