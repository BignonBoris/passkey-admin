<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import axios from "@/utils/axios";
import { extractCountry, fetchCountries, mergeCountryOptions, type CountryOption } from "@/utils/countries";
import { socket } from "@/utils/socket";
import BaseBreadcrumb from "@/components/shared/BaseBreadcrumb.vue";
import Card from "@/components/ui/card/Card.vue";
import Input from "@/components/ui/input/Input.vue";
import Label from "@/components/ui/label/Label.vue";
import IntlPhoneField from "@/components/forms/IntlPhoneField.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DriverLocationsMap from "@/components/maps/DriverLocationsMap.vue";
import { Icon } from "@iconify/vue";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import ConfirmDialog from "@/components/shared/ConfirmDialog.vue";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type AccountStatus = "active" | "suspended";
type VerificationStatus = "verified" | "unverified";

interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  countryId?: string;
  countryName?: string;
  country?: { id: string; name: string };
  dateOfBirth: string;
  photoUrl: string | null;
  accountStatus: AccountStatus;
  identityVerified: boolean;
  isActive: boolean;
  isAvailable: boolean;
  createdAt: string;
  latitude?: number | null;
  longitude?: number | null;
  // Champs pour le véhicule principal
  primaryVehicleId?: string;
  vehicleType?: string;
  plateNumber?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: string | number;
  account?: { balance: number };
}

interface DriverDocumentItem {
  id: string;
  type: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  url: string | null;
  createdAt: string;
}

const page = ref({ title: "Livreurs" });
const breadcrumbs = ref([
  { text: "Utilisateurs", href: "#" },
  { text: "Livreurs", href: "/users/drivers" },
]);

const loading = ref(false);
const error = ref("");
const success = ref("");
// const countries = ref<{ id: string; name: string }[]>([]);
const search = ref("");
const statusFilter = ref<"all" | AccountStatus>("all");
const verificationFilter = ref<"all" | VerificationStatus>("all");
const activeFilter = ref<"all" | "active" | "inactive">("all");
const availabilityFilter = ref<"all" | "available" | "unavailable">("all");
const countryFilter = ref("all");
const drivers = ref<Driver[]>([]);
const countries = ref<CountryOption[]>([]);
const vehicleTypes = ref<any[]>([]);
const refreshIntervalMs = 15_000;
const refreshTimer = ref<ReturnType<typeof setInterval> | null>(null);
const showDriverLocationModal = ref(false);
const selectedDriverForLocation = ref<Driver | null>(null);
const showDriverDocsModal = ref(false);
const selectedDriverForDocs = ref<Driver | null>(null);
const showDriverDocPreviewModal = ref(false);
const selectedDriverDocPreview = ref<DriverDocumentItem | null>(null);
const driverDocPreviewMode = ref<"image" | "iframe">("iframe");
const driverDocPreviewUrl = ref("");
const driverDocPreviewLoading = ref(false);
const driverDocPreviewError = ref("");
const driverDocsLoading = ref(false);
const driverDocsError = ref("");
const driverDocs = ref<DriverDocumentItem[]>([]);
const docsVerifying = ref(false);
const pageSize = ref("10");
const currentPage = ref(1);
const showCreateModal = ref(false);
const creating = ref(false);
const createError = ref("");
function defaultCreateForm() {
  return {
    name: "",
    phone: "",
    email: "",
    countryId: "",
    dateOfBirth: "",
    vehicleType: "",
    vehicleBrand: "",
    vehicleModel: "",
    vehicleYear: "",
    plateNumber: "",
    password: "",
  };
}
const createForm = ref(defaultCreateForm());
const showEditModal = ref(false);
const editing = ref(false);
const editError = ref("");
const editForm = ref<Driver | null>(null);
const showVehiclesModal = ref(false);
const vehiclesLoading = ref(false);
const vehiclesError = ref("");
const selectedDriver = ref<Driver | null>(null);
const driverVehicles = ref<
  Array<{
    id: string;
    type: string;
    plateNumber: string;
    brand: string;
    model: string;
    year: number | null;
    status: string;
    isPrimary: boolean;
  }>
>([]);
const vehicleForm = ref({
  type: "",
  plateNumber: "",
  brand: "",
  model: "",
  year: "",
  status: "ACTIVE",
  isPrimary: false,
});
const vehicleSaving = ref(false);
const vehicleError = ref("");
const vehicleDeletingId = ref<string | null>(null);
const confirmVehicleDeleteOpen = ref(false);
const confirmVehicleId = ref<string | null>(null);
const selectedDriverIds = ref<string[]>([]);
const confirmDeleteOpen = ref(false);
const confirmTarget = ref<Driver | null>(null);
const deletingId = ref<string | null>(null);
const bulkDeleteOpen = ref(false);
const bulkDeleting = ref(false);
const newDocType = ref("");
const newDocFile = ref<File | null>(null);
const uploadingDoc = ref(false);
const showFundModal = ref(false);
const fundingDriver = ref<Driver | null>(null);
const fundingAction = ref<"ADD" | "SUBTRACT">("ADD");
const fundingAmount = ref("");
const fundingLoading = ref(false);
const fundingError = ref("");
const showHistoryModal = ref(false);
const historyDriver = ref<Driver | null>(null);
const fundingHistory = ref<any[]>([]);
const historyLoading = ref(false);
const historyError = ref("");

function parseCoordinate(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapDriver(raw: Record<string, unknown>): Driver {
  const country = extractCountry(raw);
  const photoCandidate =
    raw.photoUrl ??
    raw.photo ??
    raw.avatar ??
    raw.profilePicture ??
    raw.profilePhoto ??
    raw.imageUrl;

  return {
    id: String(raw.id ?? "N/A"),
    name: String(raw.name ?? "Non renseigne"),
    phone: String(raw.phone ?? "-"),
    email: String(raw.email ?? "-"),
    countryId: country.countryId || String(raw.countryId ?? ""),
    countryName: country.countryName,
    country: raw.country ? (raw.country as { id: string; name: string }) : undefined,
    dateOfBirth: raw.dateOfBirth ? String(raw.dateOfBirth) : "",
    photoUrl: photoCandidate ? String(photoCandidate) : null,
    accountStatus: (raw.accountStatus as AccountStatus) ?? "active",
    identityVerified: Boolean(raw.identityVerified ?? false),
    isActive: Boolean(raw.isActive ?? false),
    isAvailable: Boolean(raw.isAvailable ?? false),
    createdAt: String(raw.createdAt ?? ""),
    latitude: parseCoordinate(raw.latitude),
    longitude: parseCoordinate(raw.longitude),
    account: raw.account ? (raw.account as { balance: number }) : undefined,
  };
}

async function loadDrivers(silent = false) {
  if (!silent) loading.value = true;
  error.value = "";
  try {
    const params: Record<string, string> = { role: "livreur" };
    if (search.value.trim()) params.search = search.value.trim();
    if (statusFilter.value !== "all") params.accountStatus = statusFilter.value;
    if (verificationFilter.value !== "all") {
      params.identityVerified = verificationFilter.value === "verified" ? "true" : "false";
    }
    if (activeFilter.value !== "all") params.isActive = activeFilter.value === "active" ? "true" : "false";
    if (availabilityFilter.value !== "all") {
      params.isAvailable = availabilityFilter.value === "available" ? "true" : "false";
    }
    if (countryFilter.value !== "all") params.countryId = countryFilter.value;

    const response = await axios.get("/users", { params });
    const payload = Array.isArray(response.data?.data) ? response.data.data : [];
    drivers.value = payload.map((item: Record<string, unknown>) => mapDriver(item));
    countries.value = mergeCountryOptions(countries.value, drivers.value);
  } catch {
    error.value = "Impossible de charger les livreurs.";
    drivers.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadCountries() {
  try {
    countries.value = await fetchCountries();
  } catch {
    console.error("Impossible de charger les pays.");
  }
}

async function loadVehicleTypes() {
  try {
    const response = await axios.get("/vehicle-types");
    vehicleTypes.value = response.data?.data || [];
  } catch {
    console.error("Impossible de charger les types de vehicule.");
  }
}

onMounted(() => {
  void loadCountries();
  void loadDrivers();
  void loadVehicleTypes();

  // Rejoindre la salle des livreurs pour le temps réel
  socket.emit("join_driver_room");

  // Ecouter les mises à jour en temps réel
  socket.on("driver:location_updated", (payload: { id: string; latitude: number; longitude: number }) => {
    const driver = drivers.value.find((d) => d.id === payload.id);
    if (driver) {
      driver.latitude = payload.latitude;
      driver.longitude = payload.longitude;

      // Si c'est le livreur sélectionné pour la carte, mettre à jour la sélection
      if (selectedDriverForLocation.value?.id === payload.id) {
        selectedDriverForLocation.value = { ...driver };
      }
    }
  });

  socket.on("driver:status_updated", (payload: { id: string; accountStatus: AccountStatus }) => {
    const driver = drivers.value.find((d) => d.id === payload.id);
    if (driver) driver.accountStatus = payload.accountStatus;
  });

  socket.on("driver:availability_updated", (payload: { id: string; isAvailable: boolean }) => {
    const driver = drivers.value.find((d) => d.id === payload.id);
    if (driver) driver.isAvailable = Boolean(payload.isAvailable);
  });

  socket.on("driver:profile_updated", (updatedDriver: any) => {
    const index = drivers.value.findIndex((d) => d.id === updatedDriver.id);
    if (index !== -1) {
      drivers.value[index] = { ...drivers.value[index], ...mapDriver(updatedDriver) };
    }
  });

  refreshTimer.value = window.setInterval(() => {
    void loadDrivers(true); // Chargement silencieux toutes les 15s
  }, refreshIntervalMs);
});

onBeforeUnmount(() => {
  socket.off("driver:location_updated");
  socket.off("driver:status_updated");
  socket.off("driver:availability_updated");
  socket.off("driver:profile_updated");
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value);
    refreshTimer.value = null;
  }
});

watch([search, statusFilter, verificationFilter, activeFilter, availabilityFilter, countryFilter], () => {
  currentPage.value = 1;
  selectedDriverIds.value = [];
  void loadDrivers();
});

watch(showDriverDocsModal, (open) => {
  if (!open) closeDriverDocPreview();
});

const filteredDrivers = computed(() => drivers.value);
const totalPages = computed(() => {
  const size = Number(pageSize.value) || 10;
  return Math.max(1, Math.ceil(filteredDrivers.value.length / size));
});
const paginatedDrivers = computed(() => {
  const size = Number(pageSize.value) || 10;
  const start = (currentPage.value - 1) * size;
  return filteredDrivers.value.slice(start, start + size);
});
const paginatedDriverIds = computed(() => paginatedDrivers.value.map((driver) => driver.id));
const allPageSelected = computed(() => {
  const ids = paginatedDriverIds.value;
  if (!ids.length) return false;
  return ids.every((id) => selectedDriverIds.value.includes(id));
});
const hasSelection = computed(() => selectedDriverIds.value.length > 0);

watch(filteredDrivers, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value;
  }
  selectedDriverIds.value = selectedDriverIds.value.filter((id) =>
    filteredDrivers.value.some((driver) => driver.id === id)
  );
});

function isDriverSelected(driverId: string) {
  return selectedDriverIds.value.includes(driverId);
}

function toggleDriverSelection(driverId: string, checked: boolean) {
  if (checked) {
    if (!selectedDriverIds.value.includes(driverId)) {
      selectedDriverIds.value = [...selectedDriverIds.value, driverId];
    }
    return;
  }
  selectedDriverIds.value = selectedDriverIds.value.filter((id) => id !== driverId);
}

function toggleSelectCurrentPage(checked: boolean) {
  const pageIds = paginatedDriverIds.value;
  if (checked) {
    selectedDriverIds.value = Array.from(new Set([...selectedDriverIds.value, ...pageIds]));
    return;
  }
  selectedDriverIds.value = selectedDriverIds.value.filter((id) => !pageIds.includes(id));
}

function onSelectCurrentPageChange(event: Event) {
  const target = event.target as HTMLInputElement | null;
  toggleSelectCurrentPage(Boolean(target?.checked));
}

function onDriverSelectionChange(driverId: string, event: Event) {
  const target = event.target as HTMLInputElement | null;
  toggleDriverSelection(driverId, Boolean(target?.checked));
}

function goPrev() {
  currentPage.value = Math.max(1, currentPage.value - 1);
}

function goNext() {
  currentPage.value = Math.min(totalPages.value, currentPage.value + 1);
}

function statusLabel(status: AccountStatus): string {
  return status === "suspended" ? "Suspendu" : "Actif";
}

function statusVariant(status: AccountStatus): "success" | "warning" {
  return status === "suspended" ? "warning" : "success";
}

function verificationLabel(value: boolean): string {
  return value ? "Verifie" : "Non verifie";
}

function verificationVariant(value: boolean): "success" | "warning" {
  return value ? "success" : "warning";
}

function availabilityLabel(value: boolean): string {
  return value ? "Disponible" : "Indisponible";
}

function availabilityVariant(value: boolean): "success" | "warning" {
  return value ? "success" : "warning";
}

function formatDate(value: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("fr-FR");
}

function formatInputDate(value: string) {
  if (!value || value === "-") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function docTypeLabel(type: string): string {
  const map: Record<string, string> = {
    ID_CARD: "Piece d'identite",
    DRIVER_LICENSE: "Permis",
    ID_PHOTO: "Photo d'identite",
    VEHICLE_IMAGE: "Photo du vehicule",
    VEHICLE_REGISTRATION: "Carte grise",
    VEHICLE_INSURANCE: "Assurance vehicule",
  };
  return map[type] || type;
}

async function openDriverDocPreview(doc: DriverDocumentItem) {
  if (!doc.url) return;
  closeDriverDocPreview();
  selectedDriverDocPreview.value = doc;
  driverDocPreviewMode.value = isPdfDocument(doc.url) ? "iframe" : "image";
  driverDocPreviewLoading.value = true;
  driverDocPreviewError.value = "";
  showDriverDocPreviewModal.value = true;

  try {
    const resolvedUrl = resolveDocumentUrl(doc.url);
    const response = await axios.get(resolvedUrl, { responseType: "blob" });
    const blob = response.data as Blob;
    driverDocPreviewUrl.value = URL.createObjectURL(blob);

    if (blob.type?.includes("pdf")) {
      driverDocPreviewMode.value = "iframe";
    } else if (blob.type?.startsWith("image/")) {
      driverDocPreviewMode.value = "image";
    } else {
      driverDocPreviewMode.value = "iframe";
    }
  } catch {
    driverDocPreviewError.value = "Impossible de charger ce document dans la modal.";
  } finally {
    driverDocPreviewLoading.value = false;
  }
}

function closeDriverDocPreview() {
  showDriverDocPreviewModal.value = false;
  selectedDriverDocPreview.value = null;
  driverDocPreviewMode.value = "iframe";
  driverDocPreviewLoading.value = false;
  driverDocPreviewError.value = "";
  if (driverDocPreviewUrl.value) {
    URL.revokeObjectURL(driverDocPreviewUrl.value);
    driverDocPreviewUrl.value = "";
  }
}

function isPdfDocument(url: string): boolean {
  return /\.pdf(\?.*)?$/i.test(url);
}

function onDriverPreviewImageError() {
  driverDocPreviewMode.value = "iframe";
}

function resolveDocumentUrl(url: string): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;

  const apiBase = String(import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api");
  // const apiBase = String(import.meta.env.VITE_API_BASE_URL || "https://passkey-api.onrender.com/api");
  const apiOrigin = apiBase.replace(/\/api\/?$/i, "");
  if (url.startsWith("/")) return `${apiOrigin}${url}`;
  return `${apiOrigin}/${url}`;
}

function driverInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (words.length === 0) return "L";
  return words.map((word) => word.charAt(0).toUpperCase()).join("");
}

async function toggleStatus(user: Driver) {
  const nextStatus = user.accountStatus === "suspended" ? "active" : "suspended";
  try {
    await axios.patch(`/users/${user.id}/status`, {
      accountStatus: nextStatus,
    });
    user.accountStatus = nextStatus;
  } catch {
    error.value = "Impossible de mettre a jour le statut.";
  }
}

async function toggleIdentity(user: Driver) {
  try {
    const nextValue = !user.identityVerified;
    await axios.patch(`/users/${user.id}/identity`, {
      identityVerified: nextValue,
    });
    user.identityVerified = nextValue;
  } catch {
    error.value = "Impossible de mettre a jour la verification.";
  }
}

async function openEdit(user: Driver) {
  editError.value = "";
  editForm.value = {
    ...user,
    email: user.email === "-" ? "" : user.email,
    countryId: user.countryId || "",
    dateOfBirth: formatInputDate(user.dateOfBirth),
    // Reset vehicle fields initially
    primaryVehicleId: "",
    vehicleType: "",
    plateNumber: "",
    vehicleBrand: "",
    vehicleModel: "",
    vehicleYear: "",
  };
  showEditModal.value = true;
  
  // Charger le véhicule principal
  try {
    const response = await axios.get("/driver-vehicles", {
      params: { driverId: user.id }
    });
    const vehicles = Array.isArray(response.data?.data) ? response.data.data : [];
    const primary = vehicles.find((v: any) => v.isPrimary);
    if (primary && editForm.value) {
      editForm.value.primaryVehicleId = String(primary.id);
      editForm.value.vehicleType = String(primary.type || "");
      editForm.value.plateNumber = String(primary.plateNumber || "");
      editForm.value.vehicleBrand = String(primary.brand || "");
      editForm.value.vehicleModel = String(primary.model || "");
      editForm.value.vehicleYear = primary.year ? String(primary.year) : "";
    }
  } catch (err) {
    console.error("Erreur lors du chargement du vehicule principal", err);
  }
}

async function saveEdit() {
  if (!editForm.value) return;
  editError.value = "";
  editing.value = true;
  try {
    // 1. Mettre à jour le profil
    await axios.put(`/users/${editForm.value.id}`, {
      name: editForm.value.name,
      email: editForm.value.email,
      phone: editForm.value.phone,
      countryId: editForm.value.countryId || null,
      dateOfBirth: editForm.value.dateOfBirth || null,
    });

    // 2. Mettre à jour le véhicule si des infos sont saisies
    if (editForm.value.vehicleType && editForm.value.plateNumber) {
      const vehicleData = {
        driverId: editForm.value.id,
        type: editForm.value.vehicleType,
        plateNumber: editForm.value.plateNumber,
        brand: editForm.value.vehicleBrand || null,
        model: editForm.value.vehicleModel || null,
        year: editForm.value.vehicleYear ? Number(editForm.value.vehicleYear) : null,
        status: "ACTIVE",
        isPrimary: true,
      };

      if (editForm.value.primaryVehicleId) {
        await axios.put(`/driver-vehicles/${editForm.value.primaryVehicleId}`, vehicleData);
      } else {
        await axios.post("/driver-vehicles", vehicleData);
      }
    }

    const index = drivers.value.findIndex((u) => u.id === editForm.value?.id);
    if (index >= 0 && editForm.value) {
      drivers.value[index] = { ...editForm.value };
    }
    showEditModal.value = false;
    success.value = "Profil et véhicule mis à jour avec succès.";
    setTimeout(() => (success.value = ""), 2500);
  } catch (err: any) {
    const message =
      err?.response?.data?.message ||
      err?.message ||
      "Impossible de mettre a jour le livreur.";
    editError.value = message;
  } finally {
    editing.value = false;
  }
}

async function createDriver() {
  createError.value = "";
  if (
    !createForm.value.name ||
    !createForm.value.phone ||
    !createForm.value.vehicleType ||
    !createForm.value.vehicleBrand ||
    !createForm.value.vehicleYear ||
    !createForm.value.plateNumber
  ) {
    createError.value = "Nom, telephone et informations du vehicule sont requis.";
    return;
  }

  const parsedVehicleYear = Number(createForm.value.vehicleYear);
  if (
    !Number.isInteger(parsedVehicleYear) ||
    parsedVehicleYear < 1950 ||
    parsedVehicleYear > new Date().getFullYear() + 1
  ) {
    createError.value = "L'annee du vehicule est invalide.";
    return;
  }
  creating.value = true;
  try {
    const signUp = await axios.post("/auth/sign-up", {
      phone: createForm.value.phone,
      password: createForm.value.password || "PassKey123!",
      role: "livreur",
    });
    const userId = signUp.data?.data?.userId;
    if (userId) {
      await axios.put(`/users/${userId}`, {
        name: createForm.value.name,
        email: createForm.value.email || undefined,
        countryId: createForm.value.countryId || undefined,
        dateOfBirth: createForm.value.dateOfBirth || undefined,
        isActive: true,
        isAvailable: false,
        accountStatus: "active",
      });

      await axios.post("/driver-vehicles", {
        driverId: userId,
        type: createForm.value.vehicleType,
        plateNumber: createForm.value.plateNumber,
        brand: createForm.value.vehicleBrand,
        model: createForm.value.vehicleModel || null,
        year: parsedVehicleYear,
        status: "ACTIVE",
        isPrimary: true,
      });
    }
    showCreateModal.value = false;
    createForm.value = defaultCreateForm();
    await loadDrivers();
    success.value = "Livreur enregistre avec succes.";
    setTimeout(() => {
      success.value = "";
    }, 2500);
  } catch (err: any) {
    const message =
      err?.response?.data?.message ||
      err?.message ||
      "Impossible de creer le livreur.";
    createError.value = message;
  } finally {
    creating.value = false;
  }
}

async function openVehicles(driver: Driver) {
  selectedDriver.value = driver;
  vehiclesError.value = "";
  showVehiclesModal.value = true;
  await loadDriverVehicles(driver.id);
}

function openDriverLocation(driver: Driver) {
  selectedDriverForLocation.value = driver;
  showDriverLocationModal.value = true;
}

function closeDriverLocation() {
  showDriverLocationModal.value = false;
  selectedDriverForLocation.value = null;
}

async function openDriverDocuments(driver: Driver) {
  selectedDriverForDocs.value = driver;
  showDriverDocsModal.value = true;
  driverDocsError.value = "";
  driverDocsLoading.value = true;
  driverDocs.value = [];
  try {
    const response = await axios.get("/driver-documents", {
      params: { userId: driver.id },
    });
    const payload = Array.isArray(response.data?.data) ? response.data.data : [];
    driverDocs.value = payload.map((item: Record<string, unknown>) => ({
      id: String(item.id ?? ""),
      type: String(item.type ?? "-"),
      status: (item.status as DriverDocumentItem["status"]) ?? "PENDING",
      url: item.url ? String(item.url) : null,
      createdAt: String(item.createdAt ?? ""),
    }));
  } catch {
    driverDocsError.value = "Impossible de charger les documents.";
  } finally {
    driverDocsLoading.value = false;
  }
}

async function validateDriverFromDocs() {
  if (!selectedDriverForDocs.value) return;
  docsVerifying.value = true;
  try {
    await axios.patch(`/users/${selectedDriverForDocs.value.id}/identity`, {
      identityVerified: true,
    });
    const idx = drivers.value.findIndex((d) => d.id === selectedDriverForDocs.value?.id);
    if (idx >= 0) drivers.value[idx].identityVerified = true;
    selectedDriverForDocs.value.identityVerified = true;
    success.value = "Compte livreur valide avec succes.";
    setTimeout(() => (success.value = ""), 2500);
  } catch {
    driverDocsError.value = "Impossible de valider le compte.";
  } finally {
    docsVerifying.value = false;
  }
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    newDocFile.value = target.files[0];
  }
}

async function uploadDocument() {
  if (!selectedDriverForDocs.value || !newDocType.value || !newDocFile.value) {
    driverDocsError.value = "Type et fichier sont requis.";
    return;
  }

  uploadingDoc.value = true;
  driverDocsError.value = "";
  try {
    const formData = new FormData();
    formData.append("userId", selectedDriverForDocs.value.id);
    formData.append("type", newDocType.value);
    formData.append("file", newDocFile.value);

    await axios.post("/driver-documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    newDocType.value = "";
    newDocFile.value = null;
    // Reset file input manually if needed
    const fileInput = document.getElementById("new-doc-file") as HTMLInputElement;
    if (fileInput) fileInput.value = "";

    await openDriverDocuments(selectedDriverForDocs.value);
    success.value = "Document ajoute avec succes.";
    setTimeout(() => (success.value = ""), 2500);
  } catch (err: any) {
    driverDocsError.value = err?.response?.data?.message || "Impossible d'ajouter le document.";
  } finally {
    uploadingDoc.value = false;
  }
}

async function deleteDocument(docId: string) {
  if (!confirm("Voulez-vous supprimer ce document ?")) return;
  try {
    await axios.delete(`/driver-documents/${docId}`);
    if (selectedDriverForDocs.value) {
      await openDriverDocuments(selectedDriverForDocs.value);
    }
    success.value = "Document supprime avec succes.";
    setTimeout(() => (success.value = ""), 2500);
  } catch (err: any) {
    driverDocsError.value = "Impossible de supprimer le document.";
  }
}

async function loadDriverVehicles(driverId: string) {
  vehiclesLoading.value = true;
  vehiclesError.value = "";
  try {
    const response = await axios.get("/driver-vehicles", {
      params: { driverId },
    });
    const payload = Array.isArray(response.data?.data) ? response.data.data : [];
    driverVehicles.value = payload.map((item: Record<string, unknown>) => ({
      id: String(item.id ?? ""),
      type: String(item.type ?? "-"),
      plateNumber: String(item.plateNumber ?? "-"),
      brand: String(item.brand ?? ""),
      model: String(item.model ?? ""),
      year: typeof item.year === "number" ? item.year : item.year ? Number(item.year) : null,
      status: String(item.status ?? "ACTIVE"),
      isPrimary: Boolean(item.isPrimary ?? false),
    }));
  } catch {
    vehiclesError.value = "Impossible de charger les vehicules.";
    driverVehicles.value = [];
  } finally {
    vehiclesLoading.value = false;
  }
}

async function addVehicle() {
  if (!selectedDriver.value) return;
  vehicleError.value = "";
  if (!vehicleForm.value.type || !vehicleForm.value.plateNumber) {
    vehicleError.value = "Type et plaque sont requis.";
    return;
  }
  vehicleSaving.value = true;
  try {
    await axios.post("/driver-vehicles", {
      driverId: selectedDriver.value.id,
      type: vehicleForm.value.type,
      plateNumber: vehicleForm.value.plateNumber,
      brand: vehicleForm.value.brand || null,
      model: vehicleForm.value.model || null,
      year: vehicleForm.value.year ? Number(vehicleForm.value.year) : null,
      status: vehicleForm.value.status,
      isPrimary: vehicleForm.value.isPrimary,
    });
    vehicleForm.value = {
      type: "",
      plateNumber: "",
      brand: "",
      model: "",
      year: "",
      status: "ACTIVE",
      isPrimary: false,
    };
    await loadDriverVehicles(selectedDriver.value.id);
  } catch (err: any) {
    vehicleError.value = err?.response?.data?.message || "Impossible d'ajouter le vehicule.";
  } finally {
    vehicleSaving.value = false;
  }
}

async function deleteVehicle(vehId: string) {
  if (!selectedDriver.value) return;
  vehicleDeletingId.value = vehId;
  try {
    await axios.delete(`/driver-vehicles/${vehId}`);
    await loadDriverVehicles(selectedDriver.value.id);
  } catch {
    vehiclesError.value = "Impossible de retirer le vehicule.";
  } finally {
    vehicleDeletingId.value = null;
  }
}

function requestVehicleDelete(vehId: string) {
  confirmVehicleId.value = vehId;
  confirmVehicleDeleteOpen.value = true;
}

async function confirmVehicleDelete() {
  if (!confirmVehicleId.value) return;
  await deleteVehicle(confirmVehicleId.value);
  confirmVehicleDeleteOpen.value = false;
  confirmVehicleId.value = null;
}

function requestDelete(driver: Driver) {
  confirmTarget.value = driver;
  confirmDeleteOpen.value = true;
}

async function deleteDriverById(driverId: string) {
  await axios.delete(`/users/${driverId}`);
}

async function confirmDelete() {
  if (!confirmTarget.value) return;
  deletingId.value = confirmTarget.value.id;
  try {
    await deleteDriverById(confirmTarget.value.id);
    selectedDriverIds.value = selectedDriverIds.value.filter((id) => id !== confirmTarget.value?.id);
    confirmDeleteOpen.value = false;
    confirmTarget.value = null;
    await loadDrivers();
    success.value = "Livreur supprime avec succes.";
    setTimeout(() => (success.value = ""), 2500);
  } catch (err: any) {
    error.value = err?.response?.data?.message || "Impossible de supprimer le livreur.";
  } finally {
    deletingId.value = null;
  }
}

function requestBulkDelete() {
  if (!selectedDriverIds.value.length) return;
  bulkDeleteOpen.value = true;
}

async function confirmBulkDelete() {
  if (!selectedDriverIds.value.length) return;
  bulkDeleting.value = true;
  const ids = [...selectedDriverIds.value];
  try {
    const results = await Promise.allSettled(ids.map((id) => deleteDriverById(id)));
    const failed = results.filter((item) => item.status === "rejected").length;
    const successCount = ids.length - failed;

    if (successCount > 0) {
      success.value = `${successCount} livreur(s) supprime(s) avec succes.`;
      setTimeout(() => (success.value = ""), 2500);
    }
    if (failed > 0) {
      error.value = `Echec de suppression pour ${failed} livreur(s).`;
    } else {
      error.value = "";
    }

    bulkDeleteOpen.value = false;
    selectedDriverIds.value = [];
    await loadDrivers();
  } finally {
    bulkDeleting.value = false;
  }
}

function openFunding(driver: Driver) {
  fundingDriver.value = driver;
  fundingAction.value = "ADD";
  fundingAmount.value = "";
  fundingError.value = "";
  showFundModal.value = true;
}

async function confirmFunding() {
  if (!fundingDriver.value || !fundingAmount.value) return;
  const amount = Number(fundingAmount.value);
  if (Number.isNaN(amount) || amount <= 0) {
    fundingError.value = "Montant invalide.";
    return;
  }

  fundingLoading.value = true;
  fundingError.value = "";
  try {
    await axios.post(`/driver-funding/${fundingDriver.value.id}/recharge`, {
      amount,
      action: fundingAction.value,
    });
    showFundModal.value = false;
    success.value = "Compte mis a jour avec succes.";
    setTimeout(() => (success.value = ""), 2500);
    await loadDrivers(true);
  } catch (err: any) {
    fundingError.value = err?.response?.data?.message || "Erreur lors de l'approvisionnement.";
  } finally {
    fundingLoading.value = false;
  }
}

async function openFundingHistory(driver: Driver) {
  historyDriver.value = driver;
  showHistoryModal.value = true;
  historyLoading.value = true;
  historyError.value = "";
  fundingHistory.value = [];
  try {
    const response = await axios.get(`/driver-funding/${driver.id}/history`);
    fundingHistory.value = Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (err: any) {
    historyError.value = "Impossible de charger l'historique.";
  } finally {
    historyLoading.value = false;
  }
}
</script>

<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

    <div class="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div class="text-sm text-muted-foreground">
        Gestion des livreurs inscrits.
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" :disabled="!hasSelection || bulkDeleting" @click="requestBulkDelete">
          Supprimer la selection ({{ selectedDriverIds.length }})
        </Button>
        <Button class="w-fit" @click="showCreateModal = true">Nouveau livreur</Button>
      </div>
    </div>

    <Card class="mt-4 shadow-md">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div class="flex-1">
          <Input v-model="search" placeholder="Rechercher (nom, telephone, email)" class="form-control" />
        </div>
        <div class="flex gap-3 flex-wrap items-end">
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-muted-foreground">Statut compte</span>
            <Select v-model="statusFilter">
              <SelectTrigger class="w-[160px]">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-muted-foreground">Verification identite</span>
            <Select v-model="verificationFilter">
              <SelectTrigger class="w-[180px]">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="verified">Verifie</SelectItem>
                  <SelectItem value="unverified">Non verifie</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-muted-foreground">Activation compte</span>
            <Select v-model="activeFilter">
              <SelectTrigger class="w-[160px]">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-muted-foreground">Disponibilite</span>
            <Select v-model="availabilityFilter">
              <SelectTrigger class="w-[160px]">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="available">En ligne</SelectItem>
                  <SelectItem value="unavailable">Hors ligne</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-muted-foreground">Pays</span>
            <Select v-model="countryFilter">
              <SelectTrigger class="w-[160px]">
                <SelectValue placeholder="Tous" />
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
        </div>
      </div>

      <div class="mt-4">
        <p v-if="error" class="text-sm text-red-600 mb-3">{{ error }}</p>
        <p v-if="success" class="text-sm text-emerald-600 mb-3">{{ success }}</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-[42px]">
                <input type="checkbox" class="h-4 w-4 accent-[#0D47A1]" :checked="allPageSelected"
                  @change="onSelectCurrentPageChange" />
              </TableHead>
              <TableHead>#</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Identite</TableHead>
              <TableHead>Solde</TableHead>
              <TableHead>Disponibilite</TableHead>
              <TableHead>Inscription</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="loading">
              <TableCell colspan="9" class="text-center text-sm text-muted-foreground">
                Chargement...
              </TableCell>
            </TableRow>
            <TableRow v-for="(user, index) in paginatedDrivers" :key="user.id">
              <TableCell>
                <input type="checkbox" class="h-4 w-4 accent-[#0D47A1]" :checked="isDriverSelected(user.id)"
                  @change="onDriverSelectionChange(user.id, $event)" />
              </TableCell>
              <TableCell class="font-medium">{{ (currentPage - 1) * (Number(pageSize) || 10) + index + 1 }}</TableCell>
              <TableCell>
                <div class="flex items-center gap-3">
                  <img v-if="user.photoUrl" :src="user.photoUrl" :alt="`Photo de ${user.name}`"
                    class="h-10 w-10 rounded-full object-cover border border-ld/70" />
                  <div v-else
                    class="flex h-10 w-10 items-center justify-center rounded-full border border-ld/70 bg-slate-100 text-xs font-semibold text-slate-700">
                    {{ driverInitials(user.name) }}
                  </div>
                  <span>{{ user.name }}</span>
                </div>
              </TableCell>
              <TableCell>
                <div class="space-y-1">
                  <p>{{ user.phone }}</p>
                  <p class="text-xs text-muted-foreground">{{ user.email }}</p>
                  <p v-if="user.country" class="text-[10px] font-bold text-primary uppercase tracking-wider">{{ user.country.name }}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge :variant="statusVariant(user.accountStatus)">{{ statusLabel(user.accountStatus) }}</Badge>
              </TableCell>
              <TableCell>
                <Badge :variant="verificationVariant(user.identityVerified)">
                  {{ verificationLabel(user.identityVerified) }}
                </Badge>
              </TableCell>
              <TableCell>
                <div class="font-bold text-[#0D47A1]">
                  {{ user.account?.balance ?? 0 }} F CFA
                </div>
              </TableCell>
              <TableCell>
                <Badge :variant="availabilityVariant(user.isAvailable)">
                  {{ availabilityLabel(user.isAvailable) }}
                </Badge>
              </TableCell>
              <TableCell>{{ formatDate(user.createdAt) }}</TableCell>
              <TableCell>
                <div class="flex flex-wrap items-center gap-2">
                  <!-- <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <button
                          class="rounded-md border border-ld/70 px-2 py-1 text-xs font-medium text-[#0D47A1] hover:bg-lightprimary"
                          @click="openDriverLocation(user)"
                        >
                          <Icon icon="solar:map-2-linear" width="18" height="18" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Localisation</TooltipContent>
                    </Tooltip>
                  </TooltipProvider> -->
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <button
                          class="rounded-md border border-ld/70 px-2 py-1 text-xs font-medium text-[#0D47A1] hover:bg-lightprimary"
                          @click="openEdit(user)">
                          <Icon icon="solar:pen-2-linear" width="18" height="18" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Modifier</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        class="rounded-md border border-ld/70 px-2 py-1 text-xs font-medium text-[#0D47A1] hover:bg-lightprimary">
                        <Icon icon="solar:menu-dots-bold" width="18" height="18" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" class="w-56">
                      <DropdownMenuItem class="flex items-center gap-2" @click="openDriverDocuments(user)">
                        <Icon icon="solar:file-text-linear" width="16" height="16" />
                        <span>Documents</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem class="flex items-center gap-2 text-[#0D47A1] font-semibold" @click="openFunding(user)">
                        <Icon icon="solar:wallet-money-linear" width="16" height="16" />
                        <span>Approvisionner</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem class="flex items-center gap-2" @click="openFundingHistory(user)">
                        <Icon icon="solar:history-linear" width="16" height="16" />
                        <span>Historique transactions</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem class="flex items-center gap-2" @click="openVehicles(user)">
                        <Icon icon="solar:bus-linear" width="16" height="16" />
                        <span>Vehicules</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem class="flex items-center gap-2" @click="openDriverLocation(user)">
                        <Icon icon="solar:map-point-wave-linear" width="16" height="16" />
                        <span>Localisation</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem class="flex items-center gap-2" @click="toggleStatus(user)">
                        <Icon
                          :icon="user.accountStatus === 'suspended' ? 'solar:check-circle-linear' : 'solar:user-block-rounded-linear'"
                          width="16" height="16" />
                        <span>{{ user.accountStatus === "suspended" ? "Reactiver le compte" : "Suspendre le compte"
                          }}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem class="flex items-center gap-2" @click="toggleIdentity(user)">
                        <Icon :icon="user.identityVerified ? 'solar:shield-check-linear' : 'solar:shield-linear'"
                          width="16" height="16" />
                        <span>{{ user.identityVerified ? "Annuler verification" : "Verifier identite" }}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem class="flex items-center gap-2 text-red-600" @click="requestDelete(user)">
                        <Icon icon="solar:trash-bin-trash-linear" width="16" height="16" />
                        <span>Supprimer le livreur</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-if="!loading && paginatedDrivers.length === 0">
              <TableCell colspan="11" class="text-center text-muted-foreground">
                Aucun livreur trouve.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div class="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div class="text-sm text-muted-foreground">
            Page {{ currentPage }} / {{ totalPages }} • {{ filteredDrivers.length }} livreurs
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

    <Dialog v-model:open="showCreateModal">
      <DialogContent class="sm:max-w-[640px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader class="border-b border-ld/70 px-6 py-4 flex-shrink-0">
          <DialogTitle>Nouveau livreur</DialogTitle>
        </DialogHeader>
        <div class="flex-1 overflow-y-auto px-6 py-4">
          <div class="grid gap-4">
          <div>
            <Label for="create-name">Nom <span class="text-red-500">*</span></Label>
            <Input id="create-name" v-model="createForm.name" class="form-control mt-1" />
          </div>
          <div>
            <Label for="create-phone">Telephone <span class="text-red-500">*</span></Label>
            <IntlPhoneField v-model="createForm.phone" input-name="create-phone" />
          </div>
          <div>
            <Label for="create-email">Email</Label>
            <Input id="create-email" type="email" v-model="createForm.email" class="form-control mt-1" />
          </div>
          <div>
            <Label for="create-country">Pays</Label>
            <Select v-model="createForm.countryId">
              <SelectTrigger id="create-country" class="w-full mt-1">
                <SelectValue placeholder="Choisir un pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="c in countries" :key="c.id" :value="c.id">
                    {{ c.name }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <!-- <div>
            <Label for="create-city">Ville</Label>
            <Input id="create-city" v-model="createForm.city" class="form-control mt-1" placeholder="Abidjan" />
          </div>
          <div>
            <Label for="create-date-of-birth">Date de naissance</Label>
            <Input id="create-date-of-birth" type="date" v-model="createForm.dateOfBirth" class="form-control mt-1" />
          </div> -->
          <div class="rounded-lg border border-ld/70 p-4">
            <h4 class="text-sm font-semibold">Vehicule principal</h4>
            <p class="mt-1 text-xs text-muted-foreground">
              Ces informations sont necessaires pour creer un compte livreur exploitable depuis l'admin.
            </p>
            <div class="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <Label for="create-vehicle-type">Type de vehicule <span class="text-red-500">*</span></Label>
                <Select v-model="createForm.vehicleType">
                  <SelectTrigger id="create-vehicle-type" class="w-full mt-1">
                    <SelectValue placeholder="Choisir un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem v-for="vt in vehicleTypes" :key="vt.code" :value="vt.code">
                        {{ vt.name }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label for="create-plate-number">Plaque <span class="text-red-500">*</span></Label>
                <Input id="create-plate-number" v-model="createForm.plateNumber" class="form-control mt-1" />
              </div>
              <div>
                <Label for="create-vehicle-brand">Marque <span class="text-red-500">*</span></Label>
                <Input id="create-vehicle-brand" v-model="createForm.vehicleBrand" class="form-control mt-1" placeholder="Yamaha" />
              </div>
              <div>
                <Label for="create-vehicle-model">Modele</Label>
                <Input id="create-vehicle-model" v-model="createForm.vehicleModel" class="form-control mt-1" placeholder="Crypton" />
              </div>
              <div>
                <Label for="create-vehicle-year">Annee <span class="text-red-500">*</span></Label>
                <Input id="create-vehicle-year" v-model="createForm.vehicleYear" type="number" class="form-control mt-1" placeholder="2024" />
              </div>
            </div>
          </div>
          <!-- <div>
            <Label for="create-password">Mot de passe</Label>
            <Input id="create-password" type="password" v-model="createForm.password" class="form-control mt-1" />
          </div> -->
          <p v-if="createError" class="text-sm text-red-600">{{ createError }}</p>
        </div>
        </div>
        <DialogFooter class="border-t border-ld/70 px-6 py-4 flex-shrink-0">
          <Button variant="outline" @click="showCreateModal = false" :disabled="creating">Annuler</Button>
          <Button @click="createDriver" :disabled="creating">
            {{ creating ? "Creation..." : "Creer" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="showEditModal">
      <DialogContent class="sm:max-w-[640px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader class="border-b border-ld/70 px-6 py-4 flex-shrink-0">
          <DialogTitle>Modifier livreur</DialogTitle>
        </DialogHeader>
        <div v-if="editForm" class="flex-1 overflow-y-auto px-6 py-4">
          <div class="grid gap-4">
            <div>
              <Label for="edit-name">Nom</Label>
              <Input id="edit-name" v-model="editForm.name" class="form-control mt-1" />
            </div>
            <div>
              <Label for="edit-phone">Telephone</Label>
              <IntlPhoneField v-model="editForm.phone" input-name="edit-phone" />
            </div>
            <div>
              <Label for="edit-email">Email</Label>
              <Input id="edit-email" type="email" v-model="editForm.email" class="form-control mt-1" />
            </div>
            <div>
              <Label for="edit-country">Pays</Label>
              <Select v-model="editForm.countryId">
                <SelectTrigger id="edit-country" class="w-full mt-1">
                  <SelectValue placeholder="Choisir un pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem v-for="c in countries" :key="c.id" :value="c.id">
                      {{ c.name }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div class="rounded-lg border border-ld/70 p-4">
              <h4 class="text-sm font-semibold">Vehicule principal</h4>
              <p class="mt-1 text-xs text-muted-foreground">
                Informations du vehicule utilise pour les livraisons.
              </p>
              <div class="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <Label for="edit-vehicle-type">Type de vehicule <span class="text-red-500">*</span></Label>
                  <Select v-model="editForm.vehicleType">
                    <SelectTrigger id="edit-vehicle-type" class="w-full mt-1">
                      <SelectValue placeholder="Choisir un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem v-for="vt in vehicleTypes" :key="vt.code" :value="vt.code">
                          {{ vt.name }}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label for="edit-plate-number">Plaque <span class="text-red-500">*</span></Label>
                  <Input id="edit-plate-number" v-model="editForm.plateNumber" class="form-control mt-1" />
                </div>
                <div>
                  <Label for="edit-vehicle-brand">Marque <span class="text-red-500">*</span></Label>
                  <Input id="edit-vehicle-brand" v-model="editForm.vehicleBrand" class="form-control mt-1" placeholder="Yamaha" />
                </div>
                <div>
                  <Label for="edit-vehicle-model">Modele</Label>
                  <Input id="edit-vehicle-model" v-model="editForm.vehicleModel" class="form-control mt-1" placeholder="Crypton" />
                </div>
                <div>
                  <Label for="edit-vehicle-year">Annee <span class="text-red-500">*</span></Label>
                  <Input id="edit-vehicle-year" v-model="editForm.vehicleYear" type="number" class="form-control mt-1" placeholder="2024" />
                </div>
              </div>
            </div>
            <p v-if="editError" class="text-sm text-red-600">{{ editError }}</p>
          </div>
        </div>
        <DialogFooter class="border-t border-ld/70 px-6 py-4 flex-shrink-0">
          <Button variant="outline" @click="showEditModal = false" :disabled="editing">Annuler</Button>
          <Button @click="saveEdit" :disabled="editing">
            {{ editing ? "Mise a jour..." : "Enregistrer" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="showVehiclesModal">
      <DialogContent class="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Vehicules du livreur</DialogTitle>
        </DialogHeader>
        <div class="space-y-4">
          <div class="text-sm text-muted-foreground" v-if="selectedDriver">
            {{ selectedDriver.name }} • {{ selectedDriver.phone }}
          </div>
          <p v-if="vehiclesError" class="text-sm text-red-600">{{ vehiclesError }}</p>

          <div class="rounded-lg border border-ld/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Vehicule</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actif</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="vehiclesLoading">
                  <TableCell colspan="5" class="text-center text-sm text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
                <TableRow v-for="(veh, index) in driverVehicles" :key="veh.id">
                  <TableCell>{{ index + 1 }}</TableCell>
                  <TableCell>
                    <div class="space-y-1">
                      <p class="font-medium">{{ veh.type }} • {{ veh.plateNumber }}</p>
                      <p class="text-xs text-muted-foreground">
                        {{ veh.brand || "-" }} {{ veh.model || "" }} {{ veh.year || "" }}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="gray">{{ veh.status }}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="gray">{{ veh.isPrimary ? "Oui" : "Non" }}</Badge>
                  </TableCell>
                  <TableCell>
                    <div class="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger as-child>
                            <button
                              class="rounded-md border border-ld/70 px-2 py-1 text-xs font-medium text-red-600 hover:bg-lightprimary disabled:opacity-50"
                              :disabled="vehicleDeletingId === veh.id" @click="requestVehicleDelete(veh.id)">
                              <Icon icon="solar:trash-bin-trash-linear" width="18" height="18" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Retirer</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow v-if="!vehiclesLoading && driverVehicles.length === 0">
                  <TableCell colspan="5" class="text-center text-sm text-muted-foreground">
                    Aucun vehicule associe.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div class="rounded-lg border border-ld/70 p-4">
            <h4 class="text-sm font-semibold mb-3">Ajouter un vehicule</h4>
            <div class="grid gap-3 md:grid-cols-2">
              <div>
                <Label for="veh-type">Type</Label>
                <Select v-model="vehicleForm.type">
                  <SelectTrigger id="veh-type" class="w-full mt-1 h-9">
                    <SelectValue placeholder="Choisir un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem v-for="vt in vehicleTypes" :key="vt.code" :value="vt.code">
                        {{ vt.name }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label for="veh-plate">Plaque</Label>
                <Input id="veh-plate" v-model="vehicleForm.plateNumber" class="form-control mt-1" />
              </div>
              <div>
                <Label for="veh-brand">Marque</Label>
                <Input id="veh-brand" v-model="vehicleForm.brand" class="form-control mt-1" />
              </div>
              <div>
                <Label for="veh-model">Modele</Label>
                <Input id="veh-model" v-model="vehicleForm.model" class="form-control mt-1" />
              </div>
              <div>
                <Label for="veh-year">Annee</Label>
                <Input id="veh-year" v-model="vehicleForm.year" class="form-control mt-1" />
              </div>
              <div>
                <Label for="veh-status">Statut</Label>
                <Select v-model="vehicleForm.status">
                  <SelectTrigger class="w-full mt-1">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="ACTIVE">Actif</SelectItem>
                      <SelectItem value="INACTIVE">Inactif</SelectItem>
                      <SelectItem value="SUSPENDED">Suspendu</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div class="mt-3">
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" v-model="vehicleForm.isPrimary" />
                Vehicule actif
              </label>
            </div>
            <p v-if="vehicleError" class="text-sm text-red-600 mt-2">{{ vehicleError }}</p>
            <div class="mt-4 flex justify-end gap-2">
              <Button variant="outline" @click="showVehiclesModal = false">Fermer</Button>
              <Button @click="addVehicle" :disabled="vehicleSaving">
                {{ vehicleSaving ? "Ajout..." : "Ajouter" }}
              </Button>
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>

    <Dialog v-model:open="showFundModal">
      <DialogContent class="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Approvisionnement du compte</DialogTitle>
        </DialogHeader>
        <div v-if="fundingDriver" class="space-y-4 py-4">
          <div class="rounded-lg bg-slate-50 p-3 border border-ld/50">
            <p class="text-xs text-muted-foreground uppercase font-bold tracking-wider">Livreur</p>
            <p class="font-medium text-slate-900">{{ fundingDriver.name }}</p>
            <div class="mt-2 flex justify-between items-end">
              <div>
                <p class="text-[10px] text-muted-foreground uppercase font-bold">Solde actuel</p>
                <p class="text-lg font-bold text-[#0D47A1]">{{ fundingDriver.account?.balance ?? 0 }} F CFA</p>
              </div>
            </div>
          </div>
          
          <div class="space-y-4">
            <div>
              <Label class="text-xs text-muted-foreground">Type d'opération</Label>
              <div class="flex gap-2 mt-1">
                <Button 
                  :variant="fundingAction === 'ADD' ? 'default' : 'outline'" 
                  :class="fundingAction === 'ADD' ? 'bg-[#0D47A1]' : ''"
                  class="flex-1"
                  @click="fundingAction = 'ADD'"
                >
                  Ajouter des fonds
                </Button>
                <Button 
                  :variant="fundingAction === 'SUBTRACT' ? 'default' : 'outline'"
                  :class="fundingAction === 'SUBTRACT' ? 'bg-red-600 hover:bg-red-700' : ''" 
                  class="flex-1"
                  @click="fundingAction = 'SUBTRACT'"
                >
                  Retirer des fonds
                </Button>
              </div>
            </div>

            <div class="space-y-2">
              <Label for="fund-amount">{{ fundingAction === 'ADD' ? 'Montant à ajouter (F CFA)' : 'Montant à retirer (F CFA)' }}</Label>
              <Input id="fund-amount" v-model="fundingAmount" type="number" placeholder="Ex: 5000" class="form-control" />
            </div>
          </div>

          <p v-if="fundingError" class="text-sm text-red-600 font-medium">{{ fundingError }}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showFundModal = false" :disabled="fundingLoading">Annuler</Button>
          <Button @click="confirmFunding" :disabled="fundingLoading || !fundingAmount" :class="fundingAction === 'ADD' ? 'bg-[#0D47A1] hover:bg-[#0A3D8A]' : 'bg-red-600 hover:bg-red-700'">
            {{ fundingLoading ? "Traitement..." : (fundingAction === 'ADD' ? "Confirmer l'ajout" : "Confirmer le retrait") }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog v-model:open="showHistoryModal">
      <DialogContent class="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0">
        <DialogHeader class="px-6 py-4 border-b border-ld/70 flex-shrink-0">
          <DialogTitle>Historique du compte</DialogTitle>
        </DialogHeader>
        <div class="flex-1 overflow-y-auto px-6 py-4">
          <div v-if="historyDriver" class="mb-4 text-sm text-muted-foreground flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-ld/50">
            <div>
              <p class="font-medium text-slate-900">{{ historyDriver.name }}</p>
              <p>{{ historyDriver.phone }}</p>
            </div>
            <div class="text-right">
              <p class="text-[10px] uppercase font-bold tracking-wider">Solde</p>
              <p class="font-bold text-[#0D47A1]">{{ historyDriver.account?.balance ?? 0 }} F CFA</p>
            </div>
          </div>
          <p v-if="historyError" class="text-sm text-red-600 mb-3">{{ historyError }}</p>
          
          <div class="rounded-lg border border-ld/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead class="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="historyLoading">
                  <TableCell colspan="4" class="text-center text-sm text-muted-foreground py-6">
                    Chargement de l'historique...
                  </TableCell>
                </TableRow>
                <TableRow v-else-if="fundingHistory.length === 0">
                  <TableCell colspan="4" class="text-center text-sm text-muted-foreground py-6">
                    Aucune transaction trouvée pour ce livreur.
                  </TableCell>
                </TableRow>
                <TableRow v-for="tx in fundingHistory" :key="tx.id" v-else>
                  <TableCell class="text-sm whitespace-nowrap">
                    {{ new Date(tx.createdAt).toLocaleDateString('fr-FR') }} à {{ new Date(tx.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }}
                  </TableCell>
                  <TableCell>
                    <Badge :variant="tx.type === 'RECHARGE' ? 'success' : 'destructive'" class="text-[10px]">
                      {{ tx.type === 'RECHARGE' ? 'Ajout' : 'Retrait' }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-right font-medium">
                    <span :class="tx.type === 'RECHARGE' ? 'text-emerald-600' : 'text-red-600'">
                      {{ tx.type === 'RECHARGE' ? '+' : '' }}{{ tx.amount }} F CFA
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" class="text-[10px]">{{ tx.status }}</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
        <DialogFooter class="px-6 py-4 border-t border-ld/70 flex-shrink-0">
          <Button variant="outline" @click="showHistoryModal = false">Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDialog v-model:open="confirmDeleteOpen" title="Supprimer livreur"
      description="Cette action est irreversible." confirmText="Supprimer" :loading="deletingId !== null"
      @confirm="confirmDelete" />

    <ConfirmDialog v-model:open="bulkDeleteOpen" title="Supprimer plusieurs livreurs"
      :description="`Voulez-vous supprimer ${selectedDriverIds.length} livreur(s) ?`" confirmText="Supprimer"
      :loading="bulkDeleting" @confirm="confirmBulkDelete" />

    <ConfirmDialog v-model:open="confirmVehicleDeleteOpen" title="Retirer vehicule"
      description="Voulez-vous retirer ce vehicule du compte du livreur ?" confirmText="Retirer"
      :loading="vehicleDeletingId !== null" @confirm="confirmVehicleDelete" />
    <Dialog v-model:open="showDriverLocationModal">
      <DialogContent class="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Localisation du livreur</DialogTitle>
        </DialogHeader>
        <div v-if="!selectedDriverForLocation" class="text-sm text-muted-foreground">
          Chargement...
        </div>
        <div v-else>
          <p class="text-xs text-muted-foreground mb-2">Livreur</p>
          <p class="font-medium">{{ selectedDriverForLocation.name }}</p>
          <div class="mt-4">
            <DriverLocationsMap :drivers="[selectedDriverForLocation]" height="360px" />
          </div>
          <p class="text-xs text-muted-foreground mt-3">Coordonnées</p>
          <p class="text-sm">
            {{ selectedDriverForLocation.latitude ?? "-" }}, {{ selectedDriverForLocation.longitude ?? "-" }}
          </p>
        </div>
        <DialogFooter class="mt-4">
          <Button variant="outline" @click="closeDriverLocation">Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog v-model:open="showDriverDocsModal">
      <DialogContent class="sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>Documents du livreur</DialogTitle>
        </DialogHeader>
        <div v-if="selectedDriverForDocs" class="text-sm text-muted-foreground">
          {{ selectedDriverForDocs.name }} • {{ selectedDriverForDocs.phone }}
        </div>
        <p v-if="driverDocsError" class="text-sm text-red-600">{{ driverDocsError }}</p>

        <div class="rounded-lg border border-ld/70 mt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Fichier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="driverDocsLoading">
                <TableCell colspan="3" class="text-center text-sm text-muted-foreground">Chargement...</TableCell>
              </TableRow>
              <TableRow v-for="doc in driverDocs" :key="doc.id">
                <TableCell>{{ docTypeLabel(doc.type) }}</TableCell>
                <TableCell>{{ formatDate(doc.createdAt) }}</TableCell>
                <TableCell>
                  <div class="flex gap-2">
                    <button v-if="doc.url" class="text-[#0D47A1] hover:underline" @click="openDriverDocPreview(doc)">
                      Ouvrir
                    </button>
                    <span v-else class="text-muted-foreground text-xs">Indisponible</span>
                    
                    <button class="text-red-600 hover:underline text-xs ml-auto" @click="deleteDocument(doc.id)">
                      Supprimer
                    </button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-if="!driverDocsLoading && driverDocs.length === 0">
                <TableCell colspan="3" class="text-center text-sm text-muted-foreground">
                  Aucun document envoye.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div class="rounded-lg border border-ld/70 p-4 mt-4">
          <h4 class="text-sm font-semibold mb-3 font-medium text-slate-800">Ajouter un document</h4>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-1">
              <Label class="text-xs font-semibold text-slate-600">Type de document</Label>
              <Select v-model="newDocType">
                <SelectTrigger class="w-full h-9">
                  <SelectValue placeholder="Choisir le type" />
                </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="ID_CARD">Piece d'identite</SelectItem>
                      <SelectItem value="DRIVER_LICENSE">Permis de conduire</SelectItem>
                      <SelectItem value="ID_PHOTO">Photo d'identite</SelectItem>
                      <SelectItem value="VEHICLE_IMAGE">Photo du vehicule</SelectItem>
                      <SelectItem value="VEHICLE_REGISTRATION">Carte grise</SelectItem>
                      <SelectItem value="VEHICLE_INSURANCE">Assurance vehicule</SelectItem>
                    </SelectGroup>
                  </SelectContent>
              </Select>
            </div>
            <div class="space-y-1">
              <Label class="text-xs font-semibold text-slate-600">Fichier (PDF, JPG, PNG)</Label>
              <Input id="new-doc-file" type="file" @change="handleFileChange" class="h-9 text-xs py-1 cursor-pointer" accept=".pdf,.jpg,.jpeg,.png" />
            </div>
          </div>
          <div class="mt-4 flex justify-end">
            <Button size="sm" @click="uploadDocument" :disabled="uploadingDoc || !newDocType || !newDocFile">
              <Icon v-if="!uploadingDoc" icon="solar:upload-linear" width="16" height="16" class="mr-2" />
              {{ uploadingDoc ? "Envoi..." : "Ajouter le document" }}
            </Button>
          </div>
        </div>

        <DialogFooter class="mt-4">
          <Button variant="outline" @click="showDriverDocsModal = false">Fermer</Button>
          <Button :disabled="docsVerifying || !selectedDriverForDocs || selectedDriverForDocs.identityVerified"
            @click="validateDriverFromDocs">
            {{
              selectedDriverForDocs?.identityVerified
                ? "Compte deja valide"
                : docsVerifying
                  ? "Validation..."
                  : "Valider le compte"
            }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog v-model:open="showDriverDocPreviewModal">
      <DialogContent class="sm:max-w-[960px]">
        <DialogHeader>
          <DialogTitle>Apercu du document</DialogTitle>
        </DialogHeader>
        <div v-if="selectedDriverDocPreview?.url" class="space-y-3">
          <p class="text-sm text-muted-foreground">
            {{ docTypeLabel(selectedDriverDocPreview.type) }}
          </p>
          <p v-if="driverDocPreviewError" class="text-sm text-red-600">{{ driverDocPreviewError }}</p>
          <div class="max-h-[70vh] overflow-auto rounded-lg border border-ld/70 p-2">
            <div v-if="driverDocPreviewLoading" class="text-sm text-muted-foreground">Chargement du document...</div>
            <img v-else-if="driverDocPreviewMode === 'image'" :src="driverDocPreviewUrl" alt="Document livreur"
              class="mx-auto max-h-[66vh] w-auto" @error="onDriverPreviewImageError" />
            <iframe v-else :src="driverDocPreviewUrl" title="Apercu PDF" class="h-[66vh] w-full rounded-md border-0" />
          </div>
        </div>
        <DialogFooter class="mt-4">
          <a v-if="selectedDriverDocPreview?.url" :href="resolveDocumentUrl(selectedDriverDocPreview.url)"
            target="_blank" rel="noopener noreferrer"
            class="inline-flex h-10 items-center justify-center rounded-md border border-ld/70 px-4 text-sm font-medium text-[#0D47A1] hover:bg-lightprimary">
            Ouvrir dans un onglet
          </a>
          <Button variant="outline" @click="closeDriverDocPreview">Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
