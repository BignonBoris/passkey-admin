<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, computed, watch } from "vue";
import { Icon } from "@iconify/vue";
import axios from "@/utils/axios";
import { extractCountry, fetchCountries, mergeCountryOptions, type CountryOption } from "@/utils/countries";
import { socket } from "@/utils/socket";
import { loadGoogleMaps } from "@/utils/google-maps";
import Card from "@/components/ui/card/Card.vue";
import Input from "@/components/ui/input/Input.vue";
import Label from "@/components/ui/label/Label.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RideTrackingMap from "@/components/maps/RideTrackingMap.vue";
import InvoiceDialog from "@/components/rides/InvoiceDialog.vue";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import ConfirmDialog from "@/components/shared/ConfirmDialog.vue";
import { formatAmount } from "@/utils/format";

type RideStatus = "PENDING" | "ACCEPTED" | "COMPLETED" | "CANCELLED";
type AddressField = "pickup" | "destination";

interface Ride {
  id: string;
  publicCode?: string;
  userId: string;
  driverId: string;
  countryId: string;
  countryName: string;
  status: RideStatus;
  isArchived: boolean;
  price: number;
  createdAt: string;
  completionOtpValidatedAt?: string;
  pickupAddress: string;
  destinationAddress: string;
  paymentMethod?: string;
  vehicleType?: string;
  distance?: string;
  pricingSnapshotJson?: string;
  waitingFee?: number;
  searchFailureCount?: number;
  driverSearchStatsJson?: string;
}

interface SearchDriverSnapshot {
  id: string;
  name: string;
  phone: string;
}

interface SearchAttemptSnapshot {
  searchStartedAt: string;
  endedAt?: string;
  result: string;
  nearbyDriversCount: number;
  notifiedDrivers: SearchDriverSnapshot[];
  declinedDrivers: Array<SearchDriverSnapshot & { decisionAt: string }>;
  missedDrivers: SearchDriverSnapshot[];
}

interface RideSearchStats {
  failedSearchCount: number;
  attempts: SearchAttemptSnapshot[];
}

interface UserInfo {
  id: string;
  name: string;
  phone: string;
  email: string;
  identityVerified: boolean;
  accountStatus: string;
  createdAt: string;
}

interface TrackingPayload {
  order: Record<string, unknown>;
  driver?: Record<string, unknown> | null;
  eta?: Record<string, unknown> | null;
}

interface PlaceSuggestion {
  placeId: string;
  description: string;
}

const loading = ref(false);
const error = ref("");
const success = ref("");
const search = ref("");
const statusFilter = ref<"ALL" | RideStatus>("ALL");
const countryFilter = ref("all");
const showArchivedOnly = ref(false);
const rides = ref<Ride[]>([]);
const countries = ref<CountryOption[]>([]);
const pageSize = ref("10");
const currentPage = ref(1);
const showCreateRideModal = ref(false);
const creatingRide = ref(false);
const createRideError = ref("");
const createRideForm = ref({
  userId: "",
  pickupLocation: "",
  pickupAddress: "",
  pickupContact: "",
  destinationLocation: "",
  destinationAddress: "",
  destinationContact: "",
  vehicleType: "moto",
});
const pickupSuggestions = ref<PlaceSuggestion[]>([]);
const destinationSuggestions = ref<PlaceSuggestion[]>([]);
const placesLoading = ref(false);
const placesError = ref("");
const autocompleteService = ref<google.maps.places.AutocompleteService | null>(null);
const geocoder = ref<google.maps.Geocoder | null>(null);
const trackingDialogOpen = ref(false);
const trackingLoading = ref(false);
const trackingError = ref("");
const trackingData = ref<TrackingPayload | null>(null);
const trackingOrderId = ref<string | null>(null);
const trackingInterval = ref<ReturnType<typeof setInterval> | null>(null);
const trackingEtaUiInterval = ref<ReturnType<typeof setInterval> | null>(null);
const trackingEtaNowMs = ref(Date.now());
const trackingRefreshMs = 15_000;
const trackingRouteInfo = ref<{ distance: string; duration: string } | null>(null);
const usersById = ref<Record<string, UserInfo>>({});
const driversById = ref<Record<string, UserInfo>>({});
const showUserModal = ref(false);
const selectedUser = ref<UserInfo | null>(null);
const userLoading = ref(false);
const userError = ref("");
const selectedRideIds = ref<string[]>([]);
const deleteDialogOpen = ref(false);
const bulkDeleteDialogOpen = ref(false);
const deletingRideId = ref<string | null>(null);
const bulkDeleting = ref(false);
const deleteTarget = ref<Ride | null>(null);
const archiveDialogOpen = ref(false);
const archivingRideId = ref<string | null>(null);
const archiveTarget = ref<Ride | null>(null);
const cancelDialogOpen = ref(false);
const cancellingRideId = ref<string | null>(null);
const cancelTarget = ref<Ride | null>(null);
const cancelReason = ref("");
const detailsDialogOpen = ref(false);
const selectedRide = ref<Ride | null>(null);
const invoiceDialogOpen = ref(false);
const invoiceRide = ref<Ride | null>(null);
const failedSearchDialogOpen = ref(false);
const failedSearchRide = ref<Ride | null>(null);

function mapRide(raw: Record<string, unknown>): Ride {
  const country = extractCountry(raw);
  return {
    id: String(raw.id ?? "N/A"),
    publicCode: String(raw.publicCode ?? ""),
    userId: String(raw.userId ?? "-"),
    driverId: String(raw.driverId ?? "-"),
    countryId: country.countryId,
    countryName: country.countryName,
    status: (raw.status as RideStatus) ?? "PENDING",
    isArchived: Boolean(raw.isArchived ?? false),
    price: Number(raw.price ?? 0),
    createdAt: String(raw.createdAt ?? ""),
    completionOtpValidatedAt: raw.completionOtpValidatedAt ? String(raw.completionOtpValidatedAt) : undefined,
    pickupAddress: String(raw.pickupAddress ?? "-"),
    destinationAddress: String(raw.destinationAddress ?? "-"),
    paymentMethod: String(raw.paymentMethod ?? raw.payment_method ?? "CASH"),
    vehicleType: String(raw.vehicleType ?? "-"),
    distance: String(raw.distance ?? "-"),
    pricingSnapshotJson: String(raw.pricingSnapshotJson ?? ""),
    waitingFee: Number(raw.waitingFee ?? 0),
    searchFailureCount: Number(raw.searchFailureCount ?? 0),
    driverSearchStatsJson: raw.driverSearchStatsJson ? String(raw.driverSearchStatsJson) : "",
  };
}

function openRideDetails(ride: Ride) {
  selectedRide.value = ride;
  detailsDialogOpen.value = true;
}

function openInvoice(ride: Ride) {
  invoiceRide.value = ride;
  invoiceDialogOpen.value = true;
}

function parseRideSearchStats(ride: Ride | null): RideSearchStats {
  if (!ride?.driverSearchStatsJson) {
    return {
      failedSearchCount: Number(ride?.searchFailureCount ?? 0),
      attempts: [],
    };
  }

  try {
    const parsed = JSON.parse(ride.driverSearchStatsJson) as Partial<RideSearchStats>;
    return {
      failedSearchCount: Number(parsed.failedSearchCount ?? ride.searchFailureCount ?? 0),
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
    };
  } catch {
    return {
      failedSearchCount: Number(ride.searchFailureCount ?? 0),
      attempts: [],
    };
  }
}

function openFailedSearch(ride: Ride) {
  failedSearchRide.value = ride;
  failedSearchDialogOpen.value = true;
}

function canCancelRide(ride: Ride) {
  return !["COMPLETED", "CANCELLED"].includes(String(ride.status || "").trim().toUpperCase());
}

const failedSearchStats = computed(() => parseRideSearchStats(failedSearchRide.value));
const failedAttempts = computed(() =>
  failedSearchStats.value.attempts.filter((attempt) => attempt.result === "NO_DRIVER_FOUND"),
);
const totalMissedDrivers = computed(() =>
  failedAttempts.value.reduce((sum, attempt) => sum + attempt.missedDrivers.length, 0),
);
const totalDeclinedDrivers = computed(() =>
  failedAttempts.value.reduce((sum, attempt) => sum + attempt.declinedDrivers.length, 0),
);

async function loadRides(silent = false) {
  if (!silent) loading.value = true;
  error.value = "";
  try {
    const response = await axios.get("/orders", {
      params: {
        archived: showArchivedOnly.value ? "true" : "false",
        ...(countryFilter.value !== "all" ? { countryId: countryFilter.value } : {}),
      },
    });
    const payload = Array.isArray(response.data) ? response.data : Array.isArray(response.data?.data) ? response.data.data : [];
    rides.value = payload.map((item: Record<string, unknown>) => mapRide(item));
    countries.value = mergeCountryOptions(countries.value, rides.value);
    await Promise.all([loadUsers(), loadDrivers()]);
  } catch {
    error.value = "Impossible de charger les courses.";
    rides.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadCountries() {
  countries.value = mergeCountryOptions(await fetchCountries(), rides.value);
}

async function loadUsers() {
  try {
    const response = await axios.get("/users", { params: { role: "usager" } });
    const payload = Array.isArray(response.data?.data) ? response.data.data : [];
    const map: Record<string, UserInfo> = {};
    payload.forEach((item: Record<string, unknown>) => {
      const id = String(item.id ?? "");
      if (!id) return;
      map[id] = {
        id,
        name: String(item.name ?? "").trim(),
        phone: String(item.phone ?? "-"),
        email: String(item.email ?? "-"),
        identityVerified: Boolean(item.identityVerified ?? false),
        accountStatus: String(item.accountStatus ?? "active"),
        createdAt: String(item.createdAt ?? ""),
      };
    });
    usersById.value = map;
  } catch {
    usersById.value = {};
  }
}

async function loadDrivers() {
  try {
    const response = await axios.get("/users", { params: { role: "livreur" } });
    const payload = Array.isArray(response.data?.data) ? response.data.data : [];
    const map: Record<string, UserInfo> = {};
    payload.forEach((item: Record<string, unknown>) => {
      const id = String(item.id ?? "");
      if (!id) return;
      map[id] = {
        id,
        name: String(item.name ?? "").trim(),
        phone: String(item.phone ?? "-"),
        email: String(item.email ?? "-"),
        identityVerified: Boolean(item.identityVerified ?? false),
        accountStatus: String(item.accountStatus ?? "active"),
        createdAt: String(item.createdAt ?? ""),
      };
    });
    driversById.value = map;
  } catch {
    driversById.value = {};
  }
}

onMounted(() => {
  void loadCountries();
  void loadRides();

  socket.emit("join_room", "rides");

  socket.on("ride:created", () => {
    void loadRides(true);
  });

  socket.on("ride:updated", (payload: any) => {
    // On met à jour l'entrée si elle existe, sinon on refresh tout
    const index = rides.value.findIndex((r) => r.id === payload.id || r.id === payload.orderId);
    if (index !== -1) {
      if (payload.status) rides.value[index].status = payload.status;
      if (payload.driverId) rides.value[index].driverId = payload.driverId;
      if (payload.isArchived !== undefined) rides.value[index].isArchived = payload.isArchived;
    } else {
      void loadRides(true);
    }
  });

  socket.on("ride:deleted", (payload: { orderId: string }) => {
    rides.value = rides.value.filter((r) => r.id !== payload.orderId);
  });

  socket.on("rides:bulk_deleted", (payload: { orderIds: string[] }) => {
    rides.value = rides.value.filter((r) => !payload.orderIds.includes(r.id));
  });

  socket.on("driver_location_updated", (payload: any) => {
    // Si on est en train de suivre cette commande spécifique
    if (trackingOrderId.value === payload.orderId && trackingData.value) {
      if (!trackingData.value.driver) trackingData.value.driver = {};
      trackingData.value.driver.latitude = payload.latitude;
      trackingData.value.driver.longitude = payload.longitude;
      trackingData.value.order.updatedAt = payload.timestamp || new Date().toISOString();
      if (payload.eta && typeof payload.eta === "object") {
        trackingData.value.eta = payload.eta;
      }
    }

    // On peut aussi mettre à jour la position globale si besoin, 
    // mais ici on se concentre sur le suivi individuel ouvert
  });
});

const filteredRides = computed(() => {
  const q = search.value.trim().toLowerCase();
  return rides.value.filter((ride) => {
    const matchesStatus = statusFilter.value === "ALL" || ride.status === statusFilter.value;
    if (!matchesStatus) return false;
    if (!q) return true;
    return [ride.id, ride.userId, ride.status, userLabel(ride.userId), driverLabel(ride.driverId)]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });
});

const totalPages = computed(() => {
  const size = Number(pageSize.value) || 10;
  return Math.max(1, Math.ceil(filteredRides.value.length / size));
});

const paginatedRides = computed(() => {
  const size = Number(pageSize.value) || 10;
  const start = (currentPage.value - 1) * size;
  return filteredRides.value.slice(start, start + size);
});

const paginatedRideIds = computed(() => paginatedRides.value.map((ride) => ride.id));

const allPageSelected = computed(() => {
  const ids = paginatedRideIds.value;
  if (!ids.length) return false;
  return ids.every((id) => selectedRideIds.value.includes(id));
});

const hasSelection = computed(() => selectedRideIds.value.length > 0);

watch([search, pageSize, statusFilter], () => {
  currentPage.value = 1;
  selectedRideIds.value = [];
});

watch([showArchivedOnly, countryFilter], () => {
  currentPage.value = 1;
  selectedRideIds.value = [];
  void loadRides();
});

watch(filteredRides, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value;
  }
  selectedRideIds.value = selectedRideIds.value.filter((id) =>
    filteredRides.value.some((ride) => ride.id === id)
  );
});

function isRideSelected(rideId: string) {
  return selectedRideIds.value.includes(rideId);
}

function toggleRideSelection(rideId: string, checked: boolean) {
  if (checked) {
    if (!selectedRideIds.value.includes(rideId)) {
      selectedRideIds.value = [...selectedRideIds.value, rideId];
    }
    return;
  }
  selectedRideIds.value = selectedRideIds.value.filter((id) => id !== rideId);
}

function toggleSelectCurrentPage(checked: boolean) {
  const pageIds = paginatedRideIds.value;
  if (checked) {
    selectedRideIds.value = Array.from(new Set([...selectedRideIds.value, ...pageIds]));
    return;
  }
  selectedRideIds.value = selectedRideIds.value.filter((id) => !pageIds.includes(id));
}

function onSelectCurrentPageChange(event: Event) {
  const target = event.target as HTMLInputElement | null;
  toggleSelectCurrentPage(Boolean(target?.checked));
}

function onRideSelectionChange(rideId: string, event: Event) {
  const target = event.target as HTMLInputElement | null;
  toggleRideSelection(rideId, Boolean(target?.checked));
}

function userLabel(userId: string) {
  const user = usersById.value[userId];
  if (!user) return "Non renseigne";
  if (user.name) return user.name;
  if (user.phone && user.phone !== "-") return user.phone;
  return "Non renseigne";
}

function driverLabel(driverId: string) {
  if (!driverId || driverId === "-") return "-";
  const driver = driversById.value[driverId];
  if (!driver) return "Non renseigne";
  if (driver.name) return driver.name;
  if (driver.phone && driver.phone !== "-") return driver.phone;
  return "Non renseigne";
}

function goPrev() {
  currentPage.value = Math.max(1, currentPage.value - 1);
}

function goNext() {
  currentPage.value = Math.min(totalPages.value, currentPage.value + 1);
}

const usagerOptions = computed(() =>
  Object.values(usersById.value).sort((a, b) => userLabel(a.id).localeCompare(userLabel(b.id), "fr"))
);

// function openCreateRideModal() {
  // createRideError.value = "";
  // placesError.value = "";
  pickupSuggestions.value = [];
  destinationSuggestions.value = [];
  createRideForm.value = {
    userId: "",
    pickupLocation: "",
    pickupAddress: "",
    pickupContact: "",
    destinationLocation: "",
    destinationAddress: "",
    destinationContact: "",
    vehicleType: "moto",
  };
  void ensurePlacesReady();
  // showCreateRideModal.value = true;
// }

async function ensurePlacesReady() {
  if (autocompleteService.value && geocoder.value) return;
  placesLoading.value = true;
  placesError.value = "";
  try {
    const googleRef = await loadGoogleMaps();
    autocompleteService.value = new googleRef.maps.places.AutocompleteService();
    geocoder.value = new googleRef.maps.Geocoder();
  } catch {
    placesError.value = "Impossible de charger l'autocompletion d'adresses.";
  } finally {
    placesLoading.value = false;
  }
}

function fetchAddressSuggestions(field: AddressField) {
  const query =
    field === "pickup"
      ? createRideForm.value.pickupAddress.trim()
      : createRideForm.value.destinationAddress.trim();

  if (field === "pickup") pickupSuggestions.value = [];
  else destinationSuggestions.value = [];

  if (!query || query.length < 3 || !autocompleteService.value) return;

  autocompleteService.value.getPlacePredictions(
    {
      input: query,
      componentRestrictions: { country: "bj" },
    },
    (predictions, status) => {
      if (status !== "OK" || !predictions?.length) return;
      const mapped = predictions.map((item) => ({
        placeId: item.place_id,
        description: item.description,
      }));
      if (field === "pickup") pickupSuggestions.value = mapped;
      else destinationSuggestions.value = mapped;
    }
  );
}

function onPickupAddressInput() {
  createRideForm.value.pickupLocation = "";
  if (!autocompleteService.value) {
    void ensurePlacesReady();
    return;
  }
  fetchAddressSuggestions("pickup");
}

function onDestinationAddressInput() {
  createRideForm.value.destinationLocation = "";
  if (!autocompleteService.value) {
    void ensurePlacesReady();
    return;
  }
  fetchAddressSuggestions("destination");
}

function resolvePlaceCoordinates(placeId: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (!geocoder.value) {
      resolve(null);
      return;
    }
    geocoder.value.geocode({ placeId }, (results, status) => {
      if (status !== "OK" || !results?.length) {
        resolve(null);
        return;
      }
      const location = results[0].geometry?.location;
      if (!location) {
        resolve(null);
        return;
      }
      resolve(`${location.lat()},${location.lng()}`);
    });
  });
}

async function selectAddressSuggestion(field: AddressField, suggestion: PlaceSuggestion) {
  const latLng = await resolvePlaceCoordinates(suggestion.placeId);
  if (!latLng) {
    createRideError.value = "Impossible de recuperer les coordonnees de cette adresse.";
    return;
  }
  createRideError.value = "";
  if (field === "pickup") {
    createRideForm.value.pickupAddress = suggestion.description;
    createRideForm.value.pickupLocation = latLng;
    pickupSuggestions.value = [];
    return;
  }
  createRideForm.value.destinationAddress = suggestion.description;
  createRideForm.value.destinationLocation = latLng;
  destinationSuggestions.value = [];
}

async function createRide() {
  createRideError.value = "";
  success.value = "";
  const form = createRideForm.value;
  if (
    !form.userId ||
    !form.pickupLocation.trim() ||
    !form.pickupAddress.trim() ||
    !form.pickupContact.trim() ||
    !form.destinationLocation.trim() ||
    !form.destinationAddress.trim() ||
    !form.destinationContact.trim() ||
    !form.vehicleType
  ) {
    createRideError.value = "Usager, vehicule, adresses et contacts sont requis.";
    return;
  }

  creatingRide.value = true;
  try {
    await axios.post("/orders/deliveries", {
      userId: form.userId,
      pickupLocation: form.pickupLocation.trim(),
      pickupAddress: form.pickupAddress.trim(),
      pickupContact: form.pickupContact.trim(),
      destinationLocation: form.destinationLocation.trim(),
      destinationAddress: form.destinationAddress.trim(),
      destinationContact: form.destinationContact.trim(),
      vehicleType: form.vehicleType,
    });
    showCreateRideModal.value = false;
    await loadRides();
    success.value = "Course creee avec succes.";
    setTimeout(() => {
      success.value = "";
    }, 2500);
  } catch (err: any) {
    createRideError.value = err?.response?.data?.message || "Impossible de creer la course.";
  } finally {
    creatingRide.value = false;
  }
}

function requestDeleteRide(ride: Ride) {
  deleteTarget.value = ride;
  deleteDialogOpen.value = true;
}

function requestArchiveRide(ride: Ride) {
  archiveTarget.value = ride;
  archiveDialogOpen.value = true;
}

function requestCancelRide(ride: Ride) {
  if (!canCancelRide(ride)) return;
  cancelTarget.value = ride;
  cancelReason.value = "";
  cancelDialogOpen.value = true;
}

async function confirmArchiveRide() {
  if (!archiveTarget.value) return;
  archivingRideId.value = archiveTarget.value.id;
  try {
    await axios.patch(`/orders/${archiveTarget.value.id}/archive`);
    archiveDialogOpen.value = false;
    archiveTarget.value = null;
    selectedRideIds.value = selectedRideIds.value.filter((id) => id !== archivingRideId.value);
    await loadRides();
    success.value = "Course archivee avec succes.";
    setTimeout(() => {
      success.value = "";
    }, 2500);
  } catch (err: any) {
    error.value = err?.response?.data?.message || "Impossible d'archiver la course.";
  } finally {
    archivingRideId.value = null;
  }
}

async function confirmCancelRide() {
  if (!cancelTarget.value) return;
  cancellingRideId.value = cancelTarget.value.id;
  error.value = "";
  success.value = "";
  try {
    await axios.post(`/orders/${cancelTarget.value.id}/admin-cancel`, {
      cancellationReason: cancelReason.value.trim(),
    });
    cancelDialogOpen.value = false;
    cancelTarget.value = null;
    cancelReason.value = "";
    await loadRides();
    success.value = "La course a ete annulee sans frais pour l'usager.";
    setTimeout(() => {
      success.value = "";
    }, 2500);
  } catch (err: any) {
    error.value =
      err?.response?.data?.message || "Impossible d'annuler la course.";
  } finally {
    cancellingRideId.value = null;
  }
}

async function confirmDeleteRide() {
  if (!deleteTarget.value) return;
  deletingRideId.value = deleteTarget.value.id;
  try {
    await axios.delete(`/orders/${deleteTarget.value.id}`);
    deleteDialogOpen.value = false;
    deleteTarget.value = null;
    selectedRideIds.value = selectedRideIds.value.filter((id) => id !== deletingRideId.value);
    await loadRides();
    success.value = "Course supprimee avec succes.";
    setTimeout(() => {
      success.value = "";
    }, 2500);
  } catch (err: any) {
    error.value = err?.response?.data?.message || "Impossible de supprimer la course.";
  } finally {
    deletingRideId.value = null;
  }
}

function requestBulkDelete() {
  if (!selectedRideIds.value.length) return;
  bulkDeleteDialogOpen.value = true;
}

async function confirmBulkDelete() {
  if (!selectedRideIds.value.length) return;
  bulkDeleting.value = true;
  try {
    await axios.post("/orders/bulk-delete", {
      orderIds: selectedRideIds.value,
    });
    bulkDeleteDialogOpen.value = false;
    selectedRideIds.value = [];
    await loadRides();
    success.value = "Courses supprimees avec succes.";
    setTimeout(() => {
      success.value = "";
    }, 2500);
  } catch (err: any) {
    error.value = err?.response?.data?.message || "Impossible de supprimer les courses selectionnees.";
  } finally {
    bulkDeleting.value = false;
  }
}

async function openUserModal(userId: string) {
  showUserModal.value = true;
  userError.value = "";
  userLoading.value = true;
  try {
    const response = await axios.get(`/users/${userId}`);
    const data = response.data?.data || {};
    selectedUser.value = {
      id: String(data.id ?? userId),
      name: String(data.name ?? "Sans nom"),
      phone: String(data.phone ?? "-"),
      email: String(data.email ?? "-"),
      identityVerified: Boolean(data.identityVerified ?? false),
      accountStatus: String(data.accountStatus ?? "active"),
      createdAt: String(data.createdAt ?? ""),
    };
  } catch {
    userError.value = "Impossible de charger l'usager.";
  } finally {
    userLoading.value = false;
  }
}

const selectedUserStats = computed(() => {
  const userId = selectedUser.value?.id;
  if (!userId) return null;
  const userRides = rides.value.filter((r) => r.userId === userId);
  const total = userRides.length;
  const completed = userRides.filter((r) => r.status === "COMPLETED").length;
  const cancelled = userRides.filter((r) => r.status === "CANCELLED").length;
  const pending = userRides.filter((r) => r.status === "PENDING").length;
  const accepted = userRides.filter((r) => r.status === "ACCEPTED").length;
  return { total, completed, cancelled, pending, accepted };
});

const trackingPickup = computed(() => parseLatLng(trackingData.value?.order?.pickupLocation as string | undefined));
const trackingDestination = computed(() =>
  parseLatLng(trackingData.value?.order?.destinationLocation as string | undefined)
);
const trackingDriverPosition = computed(() => {
  const driver = trackingData.value?.driver;
  if (!driver) return null;
  const lat = Number(driver.latitude);
  const lng = Number(driver.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
});

const ridesStatsCards = computed(() => {
  const source = rides.value;
  const total = source.length;
  const accepted = source.filter((ride) => ride.status === "ACCEPTED").length;
  const completed = source.filter((ride) => ride.status === "COMPLETED").length;
  const cancelled = source.filter((ride) => ride.status === "CANCELLED").length;
  const today = source.filter((ride) => {
    const created = new Date(ride.createdAt);
    const now = new Date();
    return (
      created.getFullYear() === now.getFullYear() &&
      created.getMonth() === now.getMonth() &&
      created.getDate() === now.getDate()
    );
  }).length;
  const failedSearches = source.reduce(
    (sum, ride) => sum + Number(ride.searchFailureCount ?? 0),
    0,
  );
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return [
    {
      label: "Total courses",
      value: total.toLocaleString("fr-FR"),
      helper: `${today.toLocaleString("fr-FR")} aujourd'hui`,
      tone: "blue",
      icon: "solar:route-linear",
    },
    {
      label: "Acceptees",
      value: accepted.toLocaleString("fr-FR"),
      helper: "livreurs assignes",
      tone: "indigo",
      icon: "solar:check-circle-linear",
    },
    {
      label: "Terminees",
      value: completed.toLocaleString("fr-FR"),
      helper: `${completionRate}% de reussite`,
      tone: "green",
      icon: "solar:clipboard-check-linear",
    },
    {
      label: "Annulees",
      value: cancelled.toLocaleString("fr-FR"),
      helper: "a surveiller",
      tone: "red",
      icon: "solar:close-circle-linear",
    },
    {
      label: "Echouees",
      value: failedSearches.toLocaleString("fr-FR"),
      helper: "relances incluses",
      tone: "rose",
      icon: "solar:danger-triangle-linear",
    },
  ];
});
const trackingPickupAddress = computed(() => String(trackingData.value?.order?.pickupAddress ?? "-"));
const trackingDestinationAddress = computed(() => String(trackingData.value?.order?.destinationAddress ?? "-"));
const trackingDriverName = computed(() => String(trackingData.value?.driver?.name ?? "-"));
const trackingDriverPhone = computed(() => String(trackingData.value?.driver?.phone ?? "-"));
const trackingDriverStatusText = computed(() =>
  trackingData.value?.driver?.isAvailable ? "En ligne" : "Hors ligne"
);
const trackingOrderStatus = computed(() => String(trackingData.value?.order?.status ?? "-"));
const trackingEtaText = computed(() => {
  const eta = trackingData.value?.eta;
  const rawSeconds = Number(eta?.remainingSeconds ?? NaN);
  const computedAtRaw = String(eta?.computedAt ?? "").trim();
  const computedAtMs = computedAtRaw ? Date.parse(computedAtRaw) : NaN;
  if (Number.isFinite(rawSeconds) && Number.isFinite(computedAtMs)) {
    const elapsedSeconds = Math.max(0, Math.floor((trackingEtaNowMs.value - computedAtMs) / 1000));
    const remainingSeconds = Math.max(0, Math.floor(rawSeconds) - elapsedSeconds);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  const remainingText = String(eta?.remainingText ?? "").trim();
  if (remainingText) return remainingText;
  return String(trackingData.value?.order?.tracking_eta_text ?? "-").trim() || "-";
});

function clearTrackingInterval() {
  if (trackingInterval.value) {
    clearInterval(trackingInterval.value);
    trackingInterval.value = null;
  }
}

function clearTrackingEtaUiInterval() {
  if (trackingEtaUiInterval.value) {
    clearInterval(trackingEtaUiInterval.value);
    trackingEtaUiInterval.value = null;
  }
}

function cleanupTrackingState() {
  clearTrackingInterval();
  clearTrackingEtaUiInterval();
  trackingData.value = null;
  trackingError.value = "";
  trackingOrderId.value = null;
  trackingRouteInfo.value = null;
}

async function fetchTracking(orderId: string, silent = false) {
  if (!silent) trackingLoading.value = true;
  trackingError.value = "";
  try {
    const response = await axios.get(`/orders/deliveries/${orderId}/tracking`);
    const payload = response.data?.data;
    if (!payload?.order) {
      if (!silent) trackingError.value = "Aucune donnée de suivi disponible.";
      if (!silent) trackingData.value = null;
      return;
    }
    trackingData.value = {
      order: payload.order,
      driver: payload.driver ?? null,
      eta: payload.eta ?? null,
    };
  } catch {
    if (!silent) {
      trackingError.value = "Impossible de charger le suivi.";
      trackingData.value = null;
    }
  } finally {
    if (!silent) trackingLoading.value = false;
  }
}

function openTracking(ride: Ride) {
  trackingOrderId.value = ride.id;
  trackingDialogOpen.value = true;
  // On ne vide pas trackingData ici pour éviter le flash blanc si on rouvre
  // cleanupTrackingState() est appelé à la fermeture ou si orderId change

  trackingEtaNowMs.value = Date.now();
  clearTrackingEtaUiInterval();
  trackingEtaUiInterval.value = window.setInterval(() => {
    trackingEtaNowMs.value = Date.now();
  }, 1000);
  void fetchTracking(ride.id);
  trackingInterval.value = window.setInterval(() => {
    if (trackingOrderId.value) {
      void fetchTracking(trackingOrderId.value, true); // Chargement silencieux
    }
  }, trackingRefreshMs);
}

function closeTracking() {
  trackingDialogOpen.value = false;
  cleanupTrackingState();
}

function handleTrackingDialogChange(open: boolean) {
  if (!open) {
    cleanupTrackingState();
  }
}

onBeforeUnmount(() => {
  cleanupTrackingState();
  socket.off("ride:created");
  socket.off("ride:updated");
  socket.off("ride:deleted");
  socket.off("rides:bulk_deleted");
  socket.off("driver_location_updated");
});

function statusLabel(status: RideStatus) {
  if (status === "ACCEPTED") return "Acceptée";
  if (status === "COMPLETED") return "Terminée";
  if (status === "CANCELLED") return "Annulée";
  return "En attente";
}

function statusVariant(status: RideStatus): "success" | "warning" | "error" | "info" {
  if (status === "COMPLETED") return "success";
  if (status === "CANCELLED") return "error";
  if (status === "ACCEPTED") return "info";
  return "warning";
}

function formatDate(value: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString("fr-FR");
}

function parseLatLng(raw?: string | null): google.maps.LatLngLiteral | null {
  if (!raw) return null;
  const [latText, lngText] = raw.split(",").map((segment) => segment.trim());
  const lat = Number(latText);
  const lng = Number(lngText);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}
</script>

<template>
  <div>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <div
        v-for="item in ridesStatsCards"
        :key="item.label"
      >
        <div
          class="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-[0_8px_26px_rgba(15,23,42,0.06)]"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                {{ item.label }}
              </p>
              <p class="mt-2 truncate text-2xl font-black text-slate-900">
                {{ loading ? "..." : item.value }}
              </p>
              <p class="mt-2 text-xs font-semibold text-slate-500">
                {{ item.helper }}
              </p>
            </div>
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              :class="{
                'bg-[#0D47A1]/8 text-[#0D47A1]': item.tone === 'blue' || item.tone === 'indigo',
                'bg-sky-500/10 text-sky-600': item.tone === 'cyan',
                'bg-emerald-500/10 text-emerald-600': item.tone === 'green',
                'bg-red-500/10 text-red-500': item.tone === 'red' || item.tone === 'rose',
                'bg-amber-500/10 text-amber-600': item.tone === 'amber',
                'bg-slate-500/10 text-slate-600': item.tone === 'slate',
              }"
            >
              <Icon :icon="item.icon" class="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <Card class="mt-6 shadow-md">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div class="flex-1">
          <Input v-model="search" placeholder="Recherche (id, user, driver, statut)" class="form-control" />
        </div>
        <div class="flex flex-wrap items-end gap-3">
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-muted-foreground">Statut</span>
            <Select v-model="statusFilter">
              <SelectTrigger class="w-[180px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ALL">Tous les statuts</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="ACCEPTED">Acceptée</SelectItem>
                  <SelectItem value="COMPLETED">Terminée</SelectItem>
                  <SelectItem value="CANCELLED">Annulée</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-muted-foreground">Pays</span>
            <Select v-model="countryFilter">
              <SelectTrigger class="w-[180px]">
                <SelectValue placeholder="Pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Tous les pays</SelectItem>
                  <SelectItem v-for="country in countries" :key="country.id" :value="country.id">
                    {{ country.name }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div class="flex items-center gap-2">
            <Button variant="outline" @click="showArchivedOnly = !showArchivedOnly">
              {{ showArchivedOnly ? "Voir courses actives" : "Voir courses archivees" }}
            </Button>
            <Button variant="outline" :disabled="!hasSelection || bulkDeleting" @click="requestBulkDelete">
              Supprimer selection
            </Button>
          </div>
        </div>
      </div>

      <div class="mt-4">
        <p v-if="error" class="text-sm text-red-600 mb-3">{{ error }}</p>
        <p v-if="success" class="text-sm text-emerald-600 mb-3">{{ success }}</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <input type="checkbox" :checked="allPageSelected" @change="onSelectCurrentPageChange" />
              </TableHead>
              <TableHead>#</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Usager</TableHead>
              <TableHead>Livreur</TableHead>
              <TableHead>Pays</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Adresses</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="loading">
              <TableCell colspan="11" class="text-center text-sm text-muted-foreground">
                Chargement...
              </TableCell>
            </TableRow>
            <TableRow v-for="(ride, index) in paginatedRides" :key="ride.id">
              <TableCell>
                <input type="checkbox" :checked="isRideSelected(ride.id)"
                  @change="onRideSelectionChange(ride.id, $event)" />
              </TableCell>
              <TableCell class="font-medium">{{ (currentPage - 1) * (Number(pageSize) || 10) + index + 1 }}</TableCell>
              <TableCell class="font-medium text-[#0D47A1]">{{ ride.publicCode || '-' }}</TableCell>
              <TableCell class="font-medium">
                <button class="text-[#0D47A1] hover:underline" @click="openUserModal(ride.userId)">
                  {{ userLabel(ride.userId) }}
                </button>
              </TableCell>
              <TableCell>{{ driverLabel(ride.driverId) }}</TableCell>
              <TableCell>{{ ride.countryName }}</TableCell>
              <TableCell>
                <Badge :variant="statusVariant(ride.status)">{{ statusLabel(ride.status) }}</Badge>
              </TableCell>
              <TableCell>{{ formatAmount(ride.price, "F CFA") }}</TableCell>
              <TableCell>
                <div class="space-y-1 text-xs">
                  <p class="text-muted-foreground">Départ</p>
                  <p class="font-medium">{{ ride.pickupAddress }}</p>
                  <p class="text-muted-foreground">Arrivée</p>
                  <p class="font-medium">{{ ride.destinationAddress }}</p>
                </div>
                </TableCell>
                <TableCell>{{ formatDate(ride.createdAt) }}</TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                  <button
                    class="rounded-md border border-ld/70 px-2 py-1 text-xs font-medium text-[#0D47A1] hover:bg-lightprimary"
                    title="Détails"
                    @click="openRideDetails(ride)"
                  >
                    <Icon icon="solar:eye-linear" width="18" height="18" />
                  </button>
                  <button
                    class="rounded-md border border-ld/70 px-2 py-1 text-xs font-medium text-[#0D47A1] hover:bg-lightprimary"
                    title="Suivi"
                    @click="openTracking(ride)"
                  >
                    <Icon icon="solar:map-point-wave-linear" width="18" height="18" />
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        class="rounded-md border border-ld/70 px-2 py-1 text-xs font-medium text-[#0D47A1] hover:bg-lightprimary"
                        title="Actions"
                      >
                        <Icon icon="solar:menu-dots-bold" width="18" height="18" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" class="w-48">
                      <DropdownMenuItem class="flex items-center gap-2" @click="openInvoice(ride)">
                        <Icon icon="solar:bill-list-linear" width="16" height="16" />
                        <span>Facture</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem class="flex items-center gap-2" @click="openFailedSearch(ride)">
                        <Icon icon="solar:danger-circle-linear" width="16" height="16" />
                        <span>Recherche échouée</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        v-if="canCancelRide(ride)"
                        class="flex items-center gap-2 text-amber-700"
                        @click="requestCancelRide(ride)"
                      >
                        <Icon icon="solar:stop-circle-linear" width="16" height="16" />
                        <span>Annuler la course</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        v-if="!showArchivedOnly && !ride.isArchived"
                        class="flex items-center gap-2"
                        @click="requestArchiveRide(ride)"
                      >
                        <Icon icon="solar:archive-minimalistic-linear" width="16" height="16" />
                        <span>Archiver</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        class="flex items-center gap-2 text-red-600"
                        @click="requestDeleteRide(ride)"
                      >
                        <Icon icon="solar:trash-bin-trash-linear" width="16" height="16" />
                        <span>Supprimer</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            <TableRow v-if="!loading && paginatedRides.length === 0">
              <TableCell colspan="10" class="text-center text-muted-foreground">
                Aucune course trouvee.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div class="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div class="text-sm text-muted-foreground">
            Page {{ currentPage }} / {{ totalPages }} • {{ filteredRides.length }} courses
          </div>
          <div class="flex items-center gap-2">
            <button class="rounded-md border border-ld/70 px-3 py-1 text-sm hover:bg-lightprimary disabled:opacity-50"
              :disabled="currentPage === 1" @click="goPrev">
              Precedent
            </button>
            <button class="rounded-md border border-ld/70 px-3 py-1 text-sm hover:bg-lightprimary disabled:opacity-50"
              :disabled="currentPage === totalPages" @click="goNext">
              Suivant
            </button>
            <Select v-model="pageSize">
              <SelectTrigger class="w-[110px]">
                <SelectValue placeholder="Taille" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </Card>

    <Dialog v-model:open="showCreateRideModal">
      <DialogContent class="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Nouvelle course</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <Label for="ride-user">Usager</Label>
              <Select v-model="createRideForm.userId">
                <SelectTrigger id="ride-user" class="mt-1">
                  <SelectValue placeholder="Selectionner un usager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem v-for="user in usagerOptions" :key="user.id" :value="user.id">
                      {{ userLabel(user.id) }} ({{ user.phone }})
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label for="ride-vehicle">Vehicule</Label>
              <Select v-model="createRideForm.vehicleType">
                <SelectTrigger id="ride-vehicle" class="mt-1">
                  <SelectValue placeholder="Type de vehicule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="moto">Moto</SelectItem>
                    <SelectItem value="car">Voiture</SelectItem>
                    <SelectItem value="tricycle">Tricycle</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <Label for="ride-pickup-address">Adresse de recuperation</Label>
              <div class="relative">
                <Input id="ride-pickup-address" v-model="createRideForm.pickupAddress" class="form-control mt-1"
                  placeholder="Cadjehoun, Cotonou" @input="onPickupAddressInput" />
                <div v-if="pickupSuggestions.length > 0"
                  class="absolute z-20 mt-1 w-full rounded-md border border-ld bg-white shadow-md">
                  <button v-for="item in pickupSuggestions" :key="item.placeId" type="button"
                    class="block w-full px-3 py-2 text-left text-sm hover:bg-lightprimary"
                    @click="selectAddressSuggestion('pickup', item)">
                    {{ item.description }}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <Label for="ride-pickup-contact">Contact de recuperation</Label>
              <Input id="ride-pickup-contact" v-model="createRideForm.pickupContact" class="form-control mt-1"
                placeholder="+229 01 90 00 00 00" />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <Label for="ride-destination-address">Adresse de livraison</Label>
              <div class="relative">
                <Input id="ride-destination-address" v-model="createRideForm.destinationAddress"
                  class="form-control mt-1" placeholder="Ganhi, Cotonou" @input="onDestinationAddressInput" />
                <div v-if="destinationSuggestions.length > 0"
                  class="absolute z-20 mt-1 w-full rounded-md border border-ld bg-white shadow-md">
                  <button v-for="item in destinationSuggestions" :key="item.placeId" type="button"
                    class="block w-full px-3 py-2 text-left text-sm hover:bg-lightprimary"
                    @click="selectAddressSuggestion('destination', item)">
                    {{ item.description }}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <Label for="ride-destination-contact">Contact de livraison</Label>
              <Input id="ride-destination-contact" v-model="createRideForm.destinationContact" class="form-control mt-1"
                placeholder="+229 01 90 00 00 00" />
            </div>
          </div>
          <p v-if="placesLoading" class="text-xs text-muted-foreground">Chargement de l'autocompletion...</p>
          <p v-if="placesError" class="text-sm text-red-600">{{ placesError }}</p>
          <p v-if="createRideError" class="text-sm text-red-600">{{ createRideError }}</p>
        </div>
        <DialogFooter class="mt-4">
          <Button variant="outline" @click="showCreateRideModal = false">Annuler</Button>
          <Button :disabled="creatingRide" @click="createRide">
            {{ creatingRide ? "Creation..." : "Creer la course" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="showUserModal">
      <DialogContent class="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Profil usager</DialogTitle>
        </DialogHeader>
        <div v-if="userLoading" class="text-sm text-muted-foreground">Chargement...</div>
        <div v-else>
          <p v-if="userError" class="text-sm text-red-600">{{ userError }}</p>
          <div v-if="selectedUser" class="grid gap-4 md:grid-cols-2">
            <div>
              <p class="text-xs text-muted-foreground">Nom</p>
              <p class="font-medium">{{ selectedUser.name }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Telephone</p>
              <p class="font-medium">{{ selectedUser.phone }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Email</p>
              <p class="font-medium">{{ selectedUser.email }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Statut compte</p>
              <p class="font-medium">{{ selectedUser.accountStatus }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Identite verifiee</p>
              <p class="font-medium">{{ selectedUser.identityVerified ? "Oui" : "Non" }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Inscription</p>
              <p class="font-medium">{{ formatDate(selectedUser.createdAt) }}</p>
            </div>
          </div>

          <div v-if="selectedUserStats" class="mt-4 rounded-lg border border-ld/70 p-4">
            <h4 class="text-sm font-semibold mb-3">Statistiques commandes</h4>
            <div class="grid grid-cols-2 gap-3 md:grid-cols-5">
              <div>
                <p class="text-xs text-muted-foreground">Total</p>
                <p class="font-medium">{{ selectedUserStats.total }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">En attente</p>
                <p class="font-medium">{{ selectedUserStats.pending }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Acceptées</p>
                <p class="font-medium">{{ selectedUserStats.accepted }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Terminées</p>
                <p class="font-medium">{{ selectedUserStats.completed }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Annulées</p>
                <p class="font-medium">{{ selectedUserStats.cancelled }}</p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter class="mt-4">
          <Button variant="outline" @click="showUserModal = false">Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="trackingDialogOpen" @openChange="handleTrackingDialogChange">
      <DialogContent class="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl">
        <DialogHeader class="p-4 border-b bg-white shrink-0">
          <DialogTitle class="text-xl font-bold text-[#0D47A1]">Suivi de la course</DialogTitle>
        </DialogHeader>

        <div class="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/20">
          <div v-if="trackingLoading"
            class="flex h-40 items-center justify-center text-sm text-muted-foreground font-medium">
            <Icon icon="solar:restart-bold-duotone" class="mr-2 animate-spin text-primary" width="22" height="22" />
            Vérification de la localisation...
          </div>

          <div v-else-if="trackingError"
            class="flex h-40 items-center justify-center p-6 text-sm text-red-600 font-medium text-center bg-red-50/30 rounded-xl mx-4">
            <Icon icon="solar:danger-bold-duotone" class="mr-2 shrink-0" width="22" height="22" />
            {{ trackingError }}
          </div>

          <div v-else class="space-y-3">
            <!-- Map Container - Very Compact -->
            <div class="overflow-hidden rounded-xl border border-slate-400 bg-white shadow-sm ring-1 ring-slate-100">
              <RideTrackingMap v-if="trackingDialogOpen && trackingData" :pickup="trackingPickup"
                :destination="trackingDestination" :driver="trackingDriverPosition" height="300px"
                @route-info="(info) => trackingRouteInfo = info" />
            </div>

            <!-- Route Info Bar -->
            <div v-if="trackingRouteInfo"
              class="flex items-center justify-around rounded-xl bg-blue-100 p-2 text-blue-600">
              <div class="flex flex-col items-center">
                <span class="text-[8px] font-bold uppercase tracking-widest opacity-80 leading-none mb-1">Trajet</span>
                <div class="flex items-center gap-1">
                  <Icon icon="solar:route-bold" width="16" height="16" />
                  <span class="text-xs font-black">{{ trackingRouteInfo.distance }}</span>
                </div>
              </div>
              <div class="h-6 w-px bg-white/20"></div>
              <div class="flex flex-col items-center">
                <span class="text-[8px] font-bold uppercase tracking-widest opacity-80 leading-none mb-1">Temps</span>
                <div class="flex items-center gap-1">
                  <Icon icon="solar:clock-circle-bold" width="16" height="16" />
                  <span class="text-xs font-black">{{ trackingRouteInfo.duration }}</span>
                </div>
              </div>
              <div class="h-6 w-px bg-white/20"></div>
              <div class="flex flex-col items-center">
                <span class="text-[8px] font-bold uppercase tracking-widest opacity-80 leading-none mb-1">Restant</span>
                <div class="flex items-center gap-1">
                  <Icon icon="solar:stopwatch-bold" width="16" height="16" />
                  <span class="text-xs font-black">{{ trackingEtaText }}</span>
                </div>
              </div>
            </div>

            <!-- Compact Details Grid -->
            <div class="grid gap-2 grid-cols-2">
              <div class="flex items-center gap-2 rounded-lg bg-white p-2 shadow-sm border border-slate-100">
                <div
                  class="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-500 border border-slate-100">
                  <Icon icon="solar:info-circle-line-duotone" width="14" height="14" />
                </div>
                <div class="min-w-0">
                  <p class="text-[8px] font-bold uppercase text-slate-400 mb-0.5">Statut</p>
                  <p class="text-[10px] font-bold text-slate-700 truncate leading-none">{{ trackingOrderStatus }}</p>
                </div>
              </div>

              <div class="flex items-center gap-2 rounded-lg bg-white p-2 shadow-sm border border-slate-100">
                <div
                  class="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-500 border border-slate-100">
                  <Icon icon="solar:history-line-duotone" width="14" height="14" />
                </div>
                <div class="min-w-0">
                  <p class="text-[8px] font-bold uppercase text-slate-400 mb-0.5">Mis à jour</p>
                  <p class="text-[10px] font-bold text-slate-700 truncate leading-none">
                    {{ trackingData?.order?.updatedAt ? formatDate(String(trackingData.order?.updatedAt)) : "À l'instant" }}

                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 rounded-lg bg-white p-2 shadow-sm border border-slate-100">
                <div
                  class="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-500 border border-slate-100">
                  <Icon icon="solar:tag-price-line-duotone" width="14" height="14" />
                </div>
                <div class="min-w-0">
                  <p class="text-[8px] font-bold uppercase text-slate-400 mb-0.5">Code</p>
                  <p class="text-[10px] font-bold text-slate-700 truncate leading-none">
                    {{ String(trackingData?.order?.publicCode ?? '-') }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 rounded-lg bg-white p-2 shadow-sm border border-slate-100">
                <div
                  class="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-500 border border-slate-100">
                  <Icon icon="solar:stopwatch-bold-duotone" width="14" height="14" />
                </div>
                <div class="min-w-0">
                  <p class="text-[8px] font-bold uppercase text-slate-400 mb-0.5">Temps restant</p>
                  <p class="text-[10px] font-bold text-slate-700 truncate leading-none">{{ trackingEtaText }}</p>
                </div>
              </div>

              <div class="flex items-start gap-2 rounded-lg bg-white p-2 shadow-sm border border-slate-100">
                <div
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                  <Icon icon="solar:map-point-wave-bold" width="14" height="14" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-[8px] font-bold uppercase text-blue-400 mb-0.5">Départ</p>
                  <p class="text-[10px] font-medium text-slate-600 line-clamp-1 truncate leading-tight">{{
                    trackingPickupAddress }}</p>
                </div>
              </div>

              <div class="flex items-start gap-2 rounded-lg bg-white p-2 shadow-sm border border-slate-100">
                <div
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Icon icon="solar:map-point-bold" width="14" height="14" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-[8px] font-bold uppercase text-indigo-400 mb-0.5">Arrivée</p>
                  <p class="text-[10px] font-medium text-slate-600 line-clamp-1 truncate leading-tight">{{
                    trackingDestinationAddress }}</p>
                </div>
              </div>

              <!-- Compact Driver Info -->
              <div class="flex items-center gap-2 rounded-lg bg-blue-50/50 p-2 col-span-2 border border-blue-100">
                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm border border-blue-100">
                  <Icon icon="solar:user-bold" width="16" height="16" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2 mb-0.5">
                    <p class="text-[10px] font-black text-slate-800 truncate uppercase">{{ trackingDriverName }}</p>
                    <span class="bg-blue-600 px-2 py-0.5 rounded text-[9px] font-black text-white">
                      {{ trackingDriverPhone }}
                    </span>
                  </div>
                  <p class="text-[8px] font-bold text-slate-500">{{ trackingDriverStatusText }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter class="p-3 border-t bg-white shrink-0">
          <Button variant="outline" class="font-bold h-8 text-xs" @click="closeTracking">Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDialog v-model:open="deleteDialogOpen" title="Supprimer la course"
      description="Voulez-vous supprimer cette course ?" confirm-text="Supprimer" cancel-text="Annuler"
      :loading="deletingRideId !== null" @confirm="confirmDeleteRide" />

    <ConfirmDialog v-model:open="bulkDeleteDialogOpen" title="Suppression multiple"
      :description="`Voulez-vous supprimer ${selectedRideIds.length} course(s) ?`" confirm-text="Supprimer"
      cancel-text="Annuler" :loading="bulkDeleting" @confirm="confirmBulkDelete" />

    <ConfirmDialog v-model:open="archiveDialogOpen" title="Archiver la course"
      description="Voulez-vous archiver cette course ?" confirm-text="Archiver" cancel-text="Annuler"
      :loading="archivingRideId !== null" @confirm="confirmArchiveRide" />

    <Dialog v-model:open="cancelDialogOpen">
      <DialogContent class="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle class="text-xl font-bold text-[#0D47A1]">Annuler la course</DialogTitle>
        </DialogHeader>

        <div class="space-y-4">
          <p class="text-sm text-slate-600">
            Cette annulation est sans frais pour l'usager. Vous pouvez ajouter un motif optionnel avant confirmation.
          </p>

          <div class="space-y-2">
            <Label for="admin-cancel-reason">Motif d'annulation (optionnel)</Label>
            <textarea
              id="admin-cancel-reason"
              v-model="cancelReason"
              rows="4"
              class="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[#0D47A1] focus:ring-2 focus:ring-[#0D47A1]/10"
              placeholder="Exemple : incident logistique, demande invalide, consigne administrative..."
            />
          </div>
        </div>

        <DialogFooter class="mt-4">
          <Button
            variant="outline"
            class="font-bold text-xs h-8"
            :disabled="cancellingRideId !== null"
            @click="cancelDialogOpen = false"
          >
            Fermer
          </Button>
          <Button
            class="font-bold text-xs h-8 bg-red-600 hover:bg-red-700"
            :disabled="cancellingRideId !== null"
            @click="confirmCancelRide"
          >
            Confirmer l'annulation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

      <!-- Ride Details Dialog -->
    <Dialog v-model:open="detailsDialogOpen">
      <DialogContent class="sm:max-w-[700px] max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle class="text-xl font-bold text-[#0D47A1]">Détails de la course</DialogTitle>
        </DialogHeader>
        
        <div v-if="selectedRide" class="mt-4 space-y-6">
          <!-- Status & ID Header -->
          <div class="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
            <div>
              <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">ID de la course</p>
              <p class="text-sm font-black text-slate-700">#{{ selectedRide.id }}</p>
              <p v-if="selectedRide.publicCode" class="mt-1 text-xs font-bold text-[#0D47A1]">
                {{ selectedRide.publicCode }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Statut actuel</p>
              <Badge :variant="statusVariant(selectedRide.status)" class="px-3 py-1 text-xs font-bold">
                {{ statusLabel(selectedRide.status) }}
              </Badge>
            </div>
          </div>

          <!-- Timeline -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex items-center gap-3 rounded-lg border border-slate-100 p-3 bg-white shadow-sm">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Icon icon="solar:calendar-date-bold" width="20" height="20" />
              </div>
              <div>
                <p class="text-[10px] font-bold uppercase text-slate-400">Date de début</p>
                <p class="text-sm font-medium text-slate-700">{{ formatDate(selectedRide.createdAt) }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3 rounded-lg border border-slate-100 p-3 bg-white shadow-sm">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Icon icon="solar:calendar-check-linear" width="20" height="20" />
              </div>
              <div>
                <p class="text-[10px] font-bold uppercase text-slate-400">Date de fin</p>
                <p class="text-sm font-medium text-slate-700">
                  {{ selectedRide.completionOtpValidatedAt ? formatDate(selectedRide.completionOtpValidatedAt) : 'En cours / Non validée' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Logistics Group -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
             <div class="rounded-lg bg-slate-50/50 p-3 border border-slate-100">
               <p class="text-[9px] font-bold uppercase text-slate-400 mb-1">Pays</p>
               <div class="flex items-center gap-2">
                 <Icon icon="solar:globus-bold" width="14" height="14" class="text-slate-500" />
                 <span class="text-xs font-bold text-slate-700">{{ selectedRide.countryName }}</span>
               </div>
             </div>
             <div class="rounded-lg bg-slate-50/50 p-3 border border-slate-100">
               <p class="text-[9px] font-bold uppercase text-slate-400 mb-1">Véhicule</p>
               <div class="flex items-center gap-2">
                 <Icon icon="solar:bike-bold" width="14" height="14" class="text-slate-500" />
                 <span class="text-xs font-bold text-slate-700 uppercase">{{ selectedRide.vehicleType }}</span>
               </div>
             </div>
             <div class="rounded-lg bg-slate-50/50 p-3 border border-slate-100">
               <p class="text-[9px] font-bold uppercase text-slate-400 mb-1">Paiement</p>
               <div class="flex items-center gap-2">
                 <Icon icon="solar:card-bold" width="14" height="14" class="text-slate-500" />
                 <span class="text-xs font-bold text-slate-700">{{ selectedRide.paymentMethod }}</span>
               </div>
             </div>
             <div class="rounded-lg bg-slate-50/50 p-3 border border-slate-100">
               <p class="text-[9px] font-bold uppercase text-slate-400 mb-1">Distance</p>
               <div class="flex items-center gap-2">
                 <Icon icon="solar:route-bold" width="14" height="14" class="text-slate-500" />
                 <span class="text-xs font-bold text-slate-700">{{ selectedRide.distance }}</span>
               </div>
             </div>
          </div>

          <!-- Addresses -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Icon icon="solar:map-point-wave-bold" width="14" height="14" /> Trajet
            </h4>
            <div class="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 before:content-['']">
              <div class="relative">
                <div class="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-emerald-500 bg-white"></div>
                <p class="text-[10px] font-bold text-emerald-600 uppercase">Départ</p>
                <p class="text-sm text-slate-600 font-medium leading-tight">{{ selectedRide.pickupAddress }}</p>
              </div>
              <div class="relative">
                <div class="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-blue-500 bg-white"></div>
                <p class="text-[10px] font-bold text-blue-600 uppercase">Arrivée</p>
                <p class="text-sm text-slate-600 font-medium leading-tight">{{ selectedRide.destinationAddress }}</p>
              </div>
            </div>
          </div>

          <!-- Participants -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- User -->
            <div class="space-y-2">
               <h4 class="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                 <Icon icon="solar:user-bold" width="14" height="14" /> Usager
               </h4>
               <div v-if="usersById[selectedRide.userId]" class="rounded-xl border border-slate-100 p-3 bg-white shadow-sm space-y-1.5">
                  <p class="text-xs font-black text-slate-800 uppercase leading-none">{{ usersById[selectedRide.userId].name }}</p>
                  <div class="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <Icon icon="solar:phone-bold" width="10" height="10" />
                    <span>{{ usersById[selectedRide.userId].phone }}</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <Icon icon="solar:letter-bold" width="10" height="10" />
                    <span class="truncate">{{ usersById[selectedRide.userId].email }}</span>
                  </div>
               </div>
               <p v-else class="text-xs text-slate-400 italic">Informations non disponibles</p>
            </div>

            <!-- Driver -->
            <div class="space-y-2">
               <h4 class="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                 <Icon icon="solar:delivery-bold" width="14" height="14" /> Livreur
               </h4>
               <div v-if="selectedRide.driverId !== '-' && driversById[selectedRide.driverId]" class="rounded-xl border border-slate-100 p-3 bg-white shadow-sm space-y-1.5">
                  <p class="text-xs font-black text-slate-800 uppercase leading-none">{{ driversById[selectedRide.driverId].name }}</p>
                  <div class="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <Icon icon="solar:phone-bold" width="10" height="10" />
                    <span>{{ driversById[selectedRide.driverId].phone }}</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <Icon icon="solar:letter-bold" width="10" height="10" />
                    <span class="truncate">{{ driversById[selectedRide.driverId].email }}</span>
                  </div>
               </div>
               <p v-else class="text-xs text-slate-400 italic">Aucun livreur assigné</p>
            </div>
          </div>

          <!-- Total -->
          <div class="flex items-center justify-between rounded-xl bg-[#0D47A1] p-4 text-white shadow-lg shadow-blue-200">
            <div>
              <p class="text-[10px] font-bold uppercase opacity-70">Total de la course</p>
              <p class="text-2xl font-black">{{ formatAmount(selectedRide.price, "F CFA") }}</p>
            </div>
            <div class="h-12 w-12 flex items-center justify-center rounded-full bg-white/20">
              <Icon icon="solar:wallet-bold" width="24" height="24" />
            </div>
          </div>
        </div>

        <DialogFooter class="mt-6 border-t pt-4">
          <Button variant="outline" class="font-bold text-xs h-8" @click="detailsDialogOpen = false">Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="failedSearchDialogOpen">
      <DialogContent class="sm:max-w-[760px] max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle class="text-xl font-bold text-[#0D47A1]">Recherche échouée</DialogTitle>
        </DialogHeader>

        <div v-if="failedSearchRide" class="mt-4 space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nombre d'échecs</p>
              <p class="mt-1 text-2xl font-black text-slate-800">{{ failedSearchStats.failedSearchCount }}</p>
            </div>
            <div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Livreurs manqués</p>
              <p class="mt-1 text-2xl font-black text-slate-800">{{ totalMissedDrivers }}</p>
            </div>
            <div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Livreurs refusés</p>
              <p class="mt-1 text-2xl font-black text-slate-800">{{ totalDeclinedDrivers }}</p>
            </div>
          </div>

          <div v-if="failedAttempts.length === 0" class="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
            Aucune statistique de recherche échouée enregistrée pour cette course.
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="(attempt, index) in failedAttempts"
              :key="`${attempt.searchStartedAt}-${index}`"
              class="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p class="text-xs font-black text-slate-800">Échec #{{ index + 1 }}</p>
                  <p class="text-[11px] text-slate-500">
                    {{ formatDate(attempt.searchStartedAt) }}
                  </p>
                </div>
                <div class="text-right text-[11px] text-slate-500">
                  <p>{{ attempt.notifiedDrivers.length }} livreur(s) contacté(s)</p>
                  <p>{{ attempt.missedDrivers.length }} manqué(s) • {{ attempt.declinedDrivers.length }} refusé(s)</p>
                </div>
              </div>

              <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Livreurs manqués</p>
                  <ul v-if="attempt.missedDrivers.length" class="space-y-2">
                    <li
                      v-for="driver in attempt.missedDrivers"
                      :key="`missed-${attempt.searchStartedAt}-${driver.id}`"
                      class="text-sm text-slate-700"
                    >
                      <span class="font-semibold">{{ driver.name }}</span>
                      <span v-if="driver.phone" class="text-slate-500"> • {{ driver.phone }}</span>
                    </li>
                  </ul>
                  <p v-else class="text-sm text-slate-400">Aucun</p>
                </div>

                <div class="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Livreurs refusés</p>
                  <ul v-if="attempt.declinedDrivers.length" class="space-y-2">
                    <li
                      v-for="driver in attempt.declinedDrivers"
                      :key="`declined-${attempt.searchStartedAt}-${driver.id}`"
                      class="text-sm text-slate-700"
                    >
                      <span class="font-semibold">{{ driver.name }}</span>
                      <span v-if="driver.phone" class="text-slate-500"> • {{ driver.phone }}</span>
                    </li>
                  </ul>
                  <p v-else class="text-sm text-slate-400">Aucun</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter class="mt-6 border-t pt-4">
          <Button variant="outline" class="font-bold text-xs h-8" @click="failedSearchDialogOpen = false">Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <InvoiceDialog v-model:open="invoiceDialogOpen" :ride="invoiceRide" :client="usersById[invoiceRide?.userId ?? '']"
      :driver="driversById[invoiceRide?.driverId ?? '']" />
  </div>
</template>
