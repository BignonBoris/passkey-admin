<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import axios from "@/utils/axios";
import BaseBreadcrumb from "@/components/shared/BaseBreadcrumb.vue";
import Card from "@/components/ui/card/Card.vue";
import Input from "@/components/ui/input/Input.vue";
import Label from "@/components/ui/label/Label.vue";
import { Button } from "@/components/ui/button";
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
import { Icon } from "@iconify/vue";
import { formatAmount } from "@/utils/format";
import { extractCountry, fetchCountries, mergeCountryOptions, type CountryOption } from "@/utils/countries";

interface RevenueConfig {
  id: string;
  vehicleType: string;
  countryId: string;
  countryName: string;
  baseFare: number;
  perKmRate: number;
  perMinuteRate: number;
  commissionPercent: number;
  serviceFeePercent: number;
  driverFixedAmount: number;
  driverPercent: number;
  createdAt?: string;
}


const page = ref({ title: "Revenus livreurs" });
const breadcrumbs = ref([
  { text: "Configuration", href: "#" },
  { text: "Revenus livreurs", href: "/revenue/drivers" },
]);

const vehicleTypes = ref<string[]>([]);
const configs = ref<RevenueConfig[]>([]);
const countries = ref<CountryOption[]>([]);
const countryFilter = ref("all");
const loading = ref(false);
const saving = ref(false);
const successMessage = ref("");
const errorMessage = ref("");

const form = ref({
  id: "",
  vehicleType: "",
  baseFare: "",
  perKmRate: "",
  perMinuteRate: "",
  commissionPercent: "25",
  serviceFeePercent: "5",
  driverFixedAmount: "0",
  driverPercent: "70",
});

const variableCards = [
  {
    key: "baseFare",
    title: "Base de remuneration",
    why: "Garantit un minimum de remuneration pour le demarrage de la course.",
  },
  {
    key: "perKmRate",
    title: "Composante distance",
    why: "Couvre l'effort operationnel lie aux kilometres parcourus.",
  },
  {
    key: "perMinuteRate",
    title: "Composante temps",
    why: "Compense l'exposition au trafic et au temps immobilise.",
  },
  {
    key: "driverFixedAmount",
    title: "Montant fixe livreur",
    why: "Montant fixe ajoute au revenu du livreur pour chaque course payee.",
  },
  {
    key: "driverPercent",
    title: "Pourcentage livreur",
    why: "Part variable du montant de course qui revient au livreur.",
  },
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
  commissionPercent: toNumber(form.value.commissionPercent),
  serviceFeePercent: toNumber(form.value.serviceFeePercent),
  driverFixedAmount: toNumber(form.value.driverFixedAmount),
  driverPercent: toNumber(form.value.driverPercent),
}));

const validationErrors = computed(() => {
  const errors: string[] = [];
  const values = numericForm.value;

  if (!form.value.vehicleType) errors.push("Le type de vehicule est obligatoire.");
  if (values.baseFare < 0) errors.push("La base ne peut pas etre negative.");
  if (values.perKmRate < 0) errors.push("Le tarif par km ne peut pas etre negatif.");
  if (values.perMinuteRate < 0) errors.push("Le tarif par minute ne peut pas etre negatif.");
  if (values.commissionPercent < 0 || values.commissionPercent > 100) {
    errors.push("La commission doit etre entre 0 et 100.");
  }
  if (values.serviceFeePercent < 0 || values.serviceFeePercent > 100) {
    errors.push("Les frais de service doivent etre entre 0 et 100.");
  }
  if (values.driverFixedAmount < 0) {
    errors.push("Le montant fixe livreur ne peut pas etre negatif.");
  }
  if (values.driverPercent < 0 || values.driverPercent > 100) {
    errors.push("Le pourcentage livreur doit etre entre 0 et 100.");
  }

  return errors;
});

const strategyWarnings = computed(() => {
  const warnings: string[] = [];
  const values = numericForm.value;
  const estimatedDriverShare = values.driverFixedAmount + values.driverPercent;
  if (estimatedDriverShare <= 0) {
    warnings.push("Aucune remuneration livreur explicite configuree.");
  }
  if (values.perMinuteRate > values.perKmRate) {
    warnings.push("La composante temps est superieure a la distance: attention aux villes congestionnees.");
  }
  return warnings;
});

const saveDisabled = computed(() => saving.value || validationErrors.value.length > 0);
const filteredConfigs = computed(() =>
  configs.value.filter((config) => countryFilter.value === "all" || config.countryId === countryFilter.value)
);

const takeRatePercent = computed(() => {
  const value = numericForm.value.driverPercent;
  return Number(value.toFixed(2));
});

function mapRevenueConfig(raw: Record<string, unknown>): RevenueConfig {
  const country = extractCountry(raw);
  return {
    id: String(raw.id ?? ""),
    vehicleType: String(raw.vehicleType ?? ""),
    countryId: country.countryId,
    countryName: country.countryName,
    baseFare: Number(raw.baseFare ?? 0),
    perKmRate: Number(raw.perKmRate ?? 0),
    perMinuteRate: Number(raw.perMinuteRate ?? 0),
    commissionPercent: Number(raw.commissionPercent ?? 0),
    serviceFeePercent: Number(raw.serviceFeePercent ?? 0),
    driverFixedAmount: Number(raw.driverFixedAmount ?? 0),
    driverPercent: Number(raw.driverPercent ?? 0),
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
  };
}

async function loadVehicleTypes() {
  const types = new Set<string>();

  try {
    const response = await axios.get("/vehicle-types", { params: { includeInactive: "true" } });
    const items = Array.isArray(response.data?.data) ? response.data.data : [];
    items.forEach((item: Record<string, unknown>) => {
      const type = String(item.code ?? item.id ?? "").trim();
      if (type) types.add(type);
    });
  } catch {}

  configs.value.forEach((config) => {
    const type = String(config.vehicleType ?? "").trim();
    if (type) types.add(type);
  });

  vehicleTypes.value = Array.from(types).sort();
}

async function loadConfigs() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const response = await axios.get("/revenue/configs");
    configs.value = Array.isArray(response.data?.data)
      ? response.data.data.map((item: Record<string, unknown>) => mapRevenueConfig(item))
      : [];
    countries.value = mergeCountryOptions(countries.value, configs.value);
    await loadVehicleTypes();
  } catch (err: any) {
    configs.value = [];
    errorMessage.value = err?.response?.data?.message || "Impossible de charger les configurations.";
  } finally {
    loading.value = false;
  }
}

function fillFormFromConfig(config: RevenueConfig) {
  form.value = {
    id: config.id,
    vehicleType: config.vehicleType,
    baseFare: config.baseFare.toString(),
    perKmRate: config.perKmRate.toString(),
    perMinuteRate: config.perMinuteRate.toString(),
    commissionPercent: config.commissionPercent.toString(),
    serviceFeePercent: config.serviceFeePercent.toString(),
    driverFixedAmount: config.driverFixedAmount.toString(),
    driverPercent: config.driverPercent.toString(),
  };
}

function resetForm() {
  form.value = {
    id: "",
    vehicleType: "",
    baseFare: "",
    perKmRate: "",
    perMinuteRate: "",
    commissionPercent: "25",
    serviceFeePercent: "5",
    driverFixedAmount: "0",
    driverPercent: "70",
  };
}

watch(
  () => form.value.vehicleType,
  (vehicleType) => {
    if (!vehicleType) {
      form.value.id = "";
      return;
    }
    const matchingConfig = configs.value.find((config) => config.vehicleType === vehicleType);
    if (matchingConfig) fillFormFromConfig(matchingConfig);
    else form.value.id = "";
  }
);

async function saveConfig() {
  if (validationErrors.value.length > 0) {
    errorMessage.value = validationErrors.value[0];
    successMessage.value = "";
    return;
  }

  errorMessage.value = "";
  saving.value = true;
  try {
    const payload = {
      id: form.value.id || undefined,
      vehicleType: form.value.vehicleType,
      baseFare: numericForm.value.baseFare,
      perKmRate: numericForm.value.perKmRate,
      perMinuteRate: numericForm.value.perMinuteRate,
      commissionPercent: numericForm.value.commissionPercent,
      serviceFeePercent: numericForm.value.serviceFeePercent,
      driverFixedAmount: numericForm.value.driverFixedAmount,
      driverPercent: numericForm.value.driverPercent,
    };
    const response = await axios.post("/revenue/configs", payload);
    if (response.data?.data) {
      await loadConfigs();
      successMessage.value = "Configuration enregistree.";
      setTimeout(() => (successMessage.value = ""), 3000);
    }
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || "Impossible d'enregistrer les parametres.";
  } finally {
    saving.value = false;
  }
}

function editConfig(config: RevenueConfig) {
  fillFormFromConfig(config);
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

    <div class="mt-6 grid gap-6 xl:grid-cols-3">
      <Card class="xl:col-span-1">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-lg font-semibold">Moteur de revenu livreur</p>
            <p class="text-sm text-muted-foreground">Remuneration brute - prelevements + complements.</p>
          </div>
        </div>

        <div class="mt-4 space-y-4">
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
            <Label>Base de remuneration (FCFA)</Label>
            <Input v-model="form.baseFare" type="number" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <Label>Par km (FCFA)</Label>
              <Input v-model="form.perKmRate" type="number" />
            </div>
            <div>
              <Label>Par min (FCFA)</Label>
              <Input v-model="form.perMinuteRate" type="number" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <Label>Montant fixe livreur (FCFA)</Label>
              <Input v-model="form.driverFixedAmount" type="number" />
            </div>
            <div>
              <Label>Pourcentage livreur (%)</Label>
              <Input v-model="form.driverPercent" type="number" />
            </div>
          </div>

          <div class="rounded-md border border-dashed border-ld p-3">
            <p class="text-xs uppercase tracking-wide text-muted-foreground">Part variable livreur</p>
            <p class="mt-1 text-sm font-medium">{{ takeRatePercent }}%</p>
          </div>

          <div class="flex gap-3">
            <Button class="flex-1" @click="saveConfig" :disabled="saveDisabled">
              {{ saving ? "Enregistrement..." : "Enregistrer" }}
            </Button>
            <Button variant="outline" class="flex-1" @click="resetForm" :disabled="saving">
              Reinitialiser
            </Button>
          </div>

          <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
          <p v-if="successMessage" class="text-sm text-emerald-600">{{ successMessage }}</p>

          <div v-if="strategyWarnings.length" class="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-amber-700">Alertes de coherence</p>
            <p v-for="warning in strategyWarnings" :key="warning" class="text-sm text-amber-800">{{ warning }}</p>
          </div>
        </div>
      </Card>

      <div class="space-y-6 xl:col-span-2">
        <Card>
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p class="text-lg font-semibold">Configurations sauvegardees</p>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Pays</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>Km</TableHead>
                  <TableHead>Min</TableHead>
                  <TableHead>Fixe livreur</TableHead>
                  <TableHead>% livreur</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="loading">
                  <TableCell colspan="8" class="text-center text-sm text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
                <TableRow v-for="config in filteredConfigs" :key="config.id">
                  <TableCell>{{ config.vehicleType }}</TableCell>
                  <TableCell>{{ config.countryName }}</TableCell>
                  <TableCell>{{ formatAmount(config.baseFare) }}</TableCell>
                  <TableCell>{{ formatAmount(config.perKmRate) }}</TableCell>
                  <TableCell>{{ formatAmount(config.perMinuteRate) }}</TableCell>
                  <TableCell>{{ formatAmount(config.driverFixedAmount) }}</TableCell>
                  <TableCell>{{ config.driverPercent }} %</TableCell>
                  <TableCell>
                    <button
                      class="rounded-md border border-ld/70 px-2 py-1 text-xs font-medium text-[#0D47A1] hover:bg-lightprimary"
                      @click="editConfig(config)"
                    >
                      <Icon icon="solar:pen-2-linear" width="16" height="16" />
                    </button>
                  </TableCell>
                </TableRow>
                <TableRow v-if="!loading && filteredConfigs.length === 0">
                  <TableCell colspan="8" class="text-center text-sm text-muted-foreground">
                    Aucune configuration disponible pour le moment.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card>
          <p class="text-lg font-semibold">Variables retenues</p>
          <div class="mt-4 grid gap-3 md:grid-cols-2">
            <div v-for="item in variableCards" :key="item.key" class="rounded-lg border border-ld p-4">
              <p class="font-medium">{{ item.title }}</p>
              <p class="mt-1 text-sm text-muted-foreground">{{ item.why }}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>
