<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import axios from "@/utils/axios";
import BaseBreadcrumb from "@/components/shared/BaseBreadcrumb.vue";
import Card from "@/components/ui/card/Card.vue";
import Input from "@/components/ui/input/Input.vue";
import Label from "@/components/ui/label/Label.vue";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/vue";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ConfirmDialog from "@/components/shared/ConfirmDialog.vue";
import { toast } from "vue-sonner";
import { formatAmount } from "@/utils/format";
import PricingTabs from "./components/PricingTabs.vue";
import { extractCountry, fetchCountries, mergeCountryOptions, type CountryOption } from "@/utils/countries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import TooltipProvider from "@/components/ui/tooltip/TooltipProvider.vue";
import Tooltip from "@/components/ui/tooltip/Tooltip.vue";
import TooltipTrigger from "@/components/ui/tooltip/TooltipTrigger.vue";
import TooltipContent from "@/components/ui/tooltip/TooltipContent.vue";

interface PricingConfig {
  id: string;
  vehicleType: string;
  countryId: string;
  countryName: string;
  baseFare: number;
  perKmRate: number;
  perMinuteRate: number;
  bookingFee: number;
  minimumFare: number;
}

const page = ref({ title: "Tarification" });
const breadcrumbs = ref([
  { text: "Configuration", href: "#" },
  { text: "Tarification", href: "/pricing/rates" },
]);

const loading = ref(false);
const saving = ref(false);
const deletingId = ref<string | null>(null);
const confirmDeleteOpen = ref(false);
const confirmTarget = ref<PricingConfig | null>(null);
const errorMessage = ref("");
const successMessage = ref("");
const modalOpen = ref(false);

const vehicleTypes = ref<string[]>([]);
const configs = ref<PricingConfig[]>([]);
const countries = ref<CountryOption[]>([]);
const countryFilter = ref("all");

const form = ref({
  id: "",
  countryId: "",
  vehicleType: "",
  baseFare: "",
  perKmRate: "",
  perMinuteRate: "",
  bookingFee: "0",
  minimumFare: "0",
});

const variableCards = [
  {
    key: "baseFare",
    title: "Tarif de base",
    why: "Couvre le cout de declenchement de la course (prise en charge).",
  },
  {
    key: "perKmRate",
    title: "Tarif distance (par km)",
    why: "Reflete les couts variables lies au carburant et a l'usure.",
  },
  {
    key: "perMinuteRate",
    title: "Tarif temps (par min)",
    why: "Compense les ralentissements, attentes et trafic dense.",
  },
  {
    key: "bookingFee",
    title: "Frais de service",
    why: "Absorbe les couts plateforme, paiement, support et antifraude.",
  },
  // {
  //   key: "minimumFare",
  //   title: "Tarif minimum",
  //   why: "Evite les courses non rentables pour de tres petites distances.",
  // },
];

const typeOptions = computed(() =>
  vehicleTypes.value.map((type) => ({
    value: type,
    label: type,
  }))
);

function toNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const numericForm = computed(() => ({
  baseFare: toNumber(form.value.baseFare),
  perKmRate: toNumber(form.value.perKmRate),
  perMinuteRate: toNumber(form.value.perMinuteRate),
  bookingFee: toNumber(form.value.bookingFee),
  // minimumFare: toNumber(form.value.minimumFare),
}));

const validationErrors = computed(() => {
  const errors: string[] = [];
  const values = numericForm.value;
  if (!form.value.countryId) errors.push("Le pays est obligatoire.");
  if (!form.value.vehicleType) errors.push("Le type de vehicule est obligatoire.");
  if (values.baseFare < 0) errors.push("Le tarif de base ne peut pas etre negatif.");
  if (values.perKmRate < 0) errors.push("Le tarif par km ne peut pas etre negatif.");
  if (values.perMinuteRate < 0) errors.push("Le tarif par minute ne peut pas etre negatif.");
  if (values.bookingFee < 0) errors.push("Les frais fixes ne peuvent pas etre negatifs.");
  // if (values.minimumFare < 0) errors.push("Le tarif minimum ne peut pas etre negatif.");
  return errors;
});

const strategyWarnings = computed(() => {
  const warnings: string[] = [];
  const values = numericForm.value;

  // if (values.minimumFare < fixedFloor) {
  //   warnings.push("Le tarif minimum est inferieur a base + frais fixes: il sera rarement utile.");
  // }
  if (values.perMinuteRate > values.perKmRate) {
    warnings.push("Le tarif minute depasse le tarif km: risque de prix eleves en trafic dense.");
  }
  if (values.perKmRate === 0 && values.perMinuteRate === 0) {
    warnings.push("Les composantes distance et temps sont nulles: la course dependra surtout des frais fixes.");
  }

  return warnings;
});

const saveDisabled = computed(() => saving.value || validationErrors.value.length > 0);
const filteredConfigs = computed(() =>
  configs.value.filter((config) => countryFilter.value === "all" || config.countryId === countryFilter.value)
);

function mapConfig(raw: Record<string, unknown>): PricingConfig {
  const country = extractCountry(raw);
  return {
    id: String(raw.id ?? ""),
    vehicleType: String(raw.vehicleType ?? ""),
    countryId: country.countryId,
    countryName: country.countryName,
    baseFare: Number(raw.baseFare ?? 0),
    perKmRate: Number(raw.perKmRate ?? 0),
    perMinuteRate: Number(raw.perMinuteRate ?? 0),
    bookingFee: Number(raw.bookingFee ?? 0),
    // minimumFare: 0,
    minimumFare: Number(raw.minimumFare ?? 0),
  };
}

async function loadVehicleTypes() {
  const set = new Set<string>();

  try {
    const response = await axios.get("/vehicle-types", { params: { includeInactive: "true" } });
    const payload = Array.isArray(response.data?.data) ? response.data.data : [];
    payload.forEach((item: Record<string, unknown>) => {
      const type = String(item.code ?? item.id ?? "").trim();
      if (type) set.add(type);
    });
  } catch { }

  configs.value.forEach((item) => {
    const type = String(item.vehicleType ?? "").trim();
    if (type) set.add(type);
  });

  vehicleTypes.value = Array.from(set).sort();
}

async function loadConfigs() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const response = await axios.get("/pricing/configs");
    const payload = Array.isArray(response.data?.data) ? response.data.data : [];
    configs.value = payload.map((item: Record<string, unknown>) => mapConfig(item));
    countries.value = mergeCountryOptions(countries.value, configs.value);
    await loadVehicleTypes();
  } catch (err: any) {
    configs.value = [];
    errorMessage.value = err?.response?.data?.message || "Impossible de charger les tarifs.";
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.value = {
    id: "",
    countryId: countryFilter.value !== "all" ? countryFilter.value : "",
    vehicleType: "",
    baseFare: "",
    perKmRate: "",
    perMinuteRate: "",
    bookingFee: "0",
    minimumFare: "0",
  };
}

function fillForm(config: PricingConfig) {
  form.value = {
    id: config.id,
    countryId: config.countryId,
    vehicleType: config.vehicleType,
    baseFare: config.baseFare.toString(),
    perKmRate: config.perKmRate.toString(),
    perMinuteRate: config.perMinuteRate.toString(),
    bookingFee: config.bookingFee.toString(),
    minimumFare: config.minimumFare.toString(),
  };
  modalOpen.value = true;
}

function openNewModal() {
  resetForm();
  modalOpen.value = true;
}

watch(
  [() => form.value.vehicleType, () => form.value.countryId],
  ([vehicleType, countryId]) => {
    if (!vehicleType || !countryId) return;
    const existing = configs.value.find(
      (item) => item.vehicleType === vehicleType && item.countryId === countryId
    );
    if (existing) fillForm(existing);
    else form.value.id = "";
  }
);

async function saveConfig() {
  if (validationErrors.value.length > 0) {
    errorMessage.value = validationErrors.value[0];
    return;
  }

  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";
  const savingToastId = toast.loading("Enregistrement en cours...");

  try {
    await axios.post("/pricing/configs", {
      id: form.value.id || undefined,
      countryId: form.value.countryId,
      vehicleType: form.value.vehicleType,
      baseFare: numericForm.value.baseFare,
      perKmRate: numericForm.value.perKmRate,
      perMinuteRate: numericForm.value.perMinuteRate,
      bookingFee: numericForm.value.bookingFee,
      minimumFare: 0,
      // minimumFare: numericForm.value.minimumFare,
    });

    await loadConfigs();
    resetForm();
    modalOpen.value = false;
    toast.success("Tarification enregistree avec succes.", { id: savingToastId });
    successMessage.value = "Tarification enregistree.";
    setTimeout(() => (successMessage.value = ""), 2500);
  } catch (err: any) {
    toast.error("Echec de l'enregistrement.", { id: savingToastId });
    errorMessage.value = err?.response?.data?.message || "Impossible d'enregistrer la tarification.";
  } finally {
    saving.value = false;
  }
}

function requestDelete(config: PricingConfig) {
  confirmTarget.value = config;
  confirmDeleteOpen.value = true;
}

async function confirmDelete() {
  if (!confirmTarget.value) return;
  deletingId.value = confirmTarget.value.id;
  try {
    await axios.delete(`/pricing/configs/${confirmTarget.value.id}`);
    confirmDeleteOpen.value = false;
    confirmTarget.value = null;
    await loadConfigs();
  } catch (err: any) {
    errorMessage.value = err?.response?.data?.message || "Impossible de supprimer la tarification.";
  } finally {
    deletingId.value = null;
  }
}

onMounted(() => {
  void (async () => {
    countries.value = mergeCountryOptions(await fetchCountries(), configs.value);
  })();
  void loadConfigs();
});
</script>

<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
    <PricingTabs />

    <div class="mt-6 grid gap-6 xl:grid-cols-3">
      <Card class="xl:col-span-1">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-lg font-semibold">Moteur tarifaire</p>
            <p class="text-[11px] text-muted-foreground">Structure type "base + variable + garde-fous".</p>
          </div>
          <Button size="sm" @click="openNewModal">
            <Icon icon="solar:add-circle-linear" class="mr-2 h-4 w-4" />
            Nouveau tarif
          </Button>
        </div>

        <div class="mt-2 space-y-4">
          <p class="text-[12px] text-gray-400 italic">
            Cliquez sur "Nouveau tarif" ou sur l'icone d'edition pour configurer les prix par type de vehicule.
          </p>
          <div class="rounded-md border border-dashed border-ld p-3">
            <p class="text-xs uppercase tracking-wide text-gray-900 font-bold">Formule</p>
            <em class="mt-1 text-sm italic text-gray-400">
              Total = max((base + fixe + km × distance + min × duree + extras), minimum)
            </em>
          </div>
          <div class="mt-4 grid gap-3 md:grid-cols-1">
            <div v-for="item in variableCards" :key="item.key" class="rounded-lg border border-ld p-4 bg-gray-100">
              <p class="text-gray-900 font-bold">{{ item.title }}</p>
              <em class="mt-1 text-sm text-gray-400 italic">{{ item.why }}</em>
            </div>
          </div>
        </div>
      </Card>

      <div class="space-y-6 xl:col-span-2">
        <Card>
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p class="text-lg font-semibold">Tarifications enregistrees</p>
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
          <div class="mt-4 overflow-x-auto">
            <Table class="border border-2">
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Pays</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>Km</TableHead>
                  <TableHead>Min</TableHead>
                  <TableHead>Fixe</TableHead>
                  <!-- <TableHead>Minimum</TableHead> -->
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="loading">
                  <TableCell colspan="8" class="text-center text-sm text-muted-foreground">Chargement...</TableCell>
                </TableRow>
                <TableRow v-for="config in filteredConfigs" :key="config.id" class="hover:bg-gray-200">
                  <TableCell>{{ config.vehicleType }}</TableCell>
                  <TableCell>{{ config.countryName }}</TableCell>
                  <TableCell>{{ formatAmount(config.baseFare) }}</TableCell>
                  <TableCell>{{ formatAmount(config.perKmRate) }}</TableCell>
                  <TableCell>{{ formatAmount(config.perMinuteRate) }}</TableCell>
                  <TableCell>{{ formatAmount(config.bookingFee) }}</TableCell>
                  <!-- <TableCell>{{ formatAmount(config.minimumFare) }}</TableCell> -->
                  <TableCell>
                    <div class="flex gap-2">
                      <button
                        class="rounded-md border border-ld/70 px-2 py-1 text-xs font-medium text-[#0D47A1] hover:bg-lightprimary"
                        @click="fillForm(config)">
                        <Icon icon="solar:pen-2-linear" width="16" height="16" />
                      </button>
                      <button
                        class="rounded-md border border-ld/70 px-2 py-1 text-xs font-medium text-red-600 hover:bg-lightprimary"
                        @click="requestDelete(config)">
                        <Icon icon="solar:trash-bin-trash-linear" width="16" height="16" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow v-if="!loading && filteredConfigs.length === 0">
                  <TableCell colspan="8" class="text-center text-sm text-muted-foreground">
                    Aucune tarification disponible.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>

        <!-- <Card>
          <p class="text-lg font-semibold">Variables retenues</p>
          <div class="mt-4 grid gap-3 md:grid-cols-2">
            <div v-for="item in variableCards" :key="item.key" class="rounded-lg border border-ld p-4">
              <p class="font-medium">{{ item.title }}</p>
              <p class="mt-1 text-sm text-muted-foreground">{{ item.why }}</p>
            </div>
          </div>
        </Card> -->
      </div>
    </div>

    <Dialog v-model:open="modalOpen">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{{ form.id ? "Modifier la tarification" : "Ajouter une tarification" }}</DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div>
            <Label>Pays</Label>
            <Select v-model="form.countryId">
              <SelectTrigger class="mt-1 w-full">
                <SelectValue placeholder="Choisir un pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="country in countries" :key="country.id" :value="country.id">
                    {{ country.name }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Type de vehicule</Label>
            <Select v-model="form.vehicleType">
              <SelectTrigger class="mt-1 w-full">
                <SelectValue placeholder="Choisir un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="option in typeOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label class="flex items-center gap-2">
              Tarif de base (FCFA)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button variant="ghost" size="icon" class="h-4 w-4 p-0">
                      <Icon icon="mdi:information-outline" class="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p class="text-xs text-muted-foreground">
                      Montant de prise en charge.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input v-model="form.baseFare" type="number" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <Label class="flex items-center gap-2">
                Tarif km (FCFA)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Button variant="ghost" size="icon" class="h-4 w-4 p-0">
                        <Icon icon="mdi:information-outline" class="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p class="text-xs text-muted-foreground">Cout par km parcouru.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input v-model="form.perKmRate" type="number" />
            </div>
            <div>
              <Label class="flex items-center gap-2">
                Tarif min (FCFA)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Button variant="ghost" size="icon" class="h-4 w-4 p-0">
                        <Icon icon="mdi:information-outline" class="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p class="text-xs text-muted-foreground">Cout par minute de course.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input v-model="form.perMinuteRate" type="number" />
            </div>
          </div>

          <div>
            <Label class="flex items-center gap-2">
              Frais fixe (FCFA)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button variant="ghost" size="icon" class="h-4 w-4 p-0">
                      <Icon icon="mdi:information-outline" class="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p class="text-xs text-muted-foreground">Frais plateforme fixes.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input v-model="form.bookingFee" type="number" />
          </div>

          <div v-if="strategyWarnings.length" class="space-y-1 rounded-md border border-amber-300 bg-amber-50 p-2">
            <p v-for="warning in strategyWarnings" :key="warning" class="text-xs text-amber-800">{{ warning }}</p>
          </div>

          <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
        </div>

        <DialogFooter>
          <Button variant="ghost" @click="modalOpen = false">Annuler</Button>
          <Button :disabled="saveDisabled" @click="saveConfig">
            {{ saving ? "Enregistrement..." : "Enregistrer" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDialog v-model:open="confirmDeleteOpen" title="Supprimer la tarification"
      description="Voulez-vous supprimer cette configuration de tarification ?" confirm-text="Supprimer"
      cancel-text="Annuler" :loading="deletingId !== null" @confirm="confirmDelete" />
  </div>
</template>
