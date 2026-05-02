<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
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
import ConfirmDialog from "@/components/shared/ConfirmDialog.vue";
import { formatAmount } from "@/utils/format";
import PricingTabs from "./components/PricingTabs.vue";
import { extractCountry, fetchCountries, mergeCountryOptions, type CountryOption } from "@/utils/countries";

type PricingRuleType = "WAITING" | "PEAK" | "NIGHT" | "EARLY_MORNING" | "CANCELLATION_BEFORE_ARRIVAL" | "CANCELLATION_AFTER_ARRIVAL";
type PricingAdjustmentType = "PERCENTAGE" | "FIXED" | "PER_MINUTE";

interface PricingRuleRow {
  id: string;
  countryId: string;
  countryName: string;
  ruleType: PricingRuleType;
  name: string;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: string;
  adjustmentType: PricingAdjustmentType;
  adjustmentValue?: number;
  freeMinutes?: number;
  fixedFee?: number;
  isActive: boolean;
  priority: number;
}

const page = ref({ title: "Regles tarifaires" });
const breadcrumbs = ref([
  { text: "Configuration", href: "#" },
  { text: "Regles tarifaires", href: "/pricing/rules" },
]);

const rules = ref<PricingRuleRow[]>([]);
const countries = ref<CountryOption[]>([]);
const countryFilter = ref("all");
const ruleErrorMessage = ref("");
const ruleSaving = ref(false);
const ruleDeletingId = ref<string | null>(null);
const ruleConfirmOpen = ref(false);
const ruleToDelete = ref<PricingRuleRow | null>(null);
const modalOpen = ref(false);

const ruleTypes: Array<{ label: string; value: PricingRuleType }> = [
  { label: "Temps d'attente", value: "WAITING" },
  { label: "Heures de pointe", value: "PEAK" },
  { label: "Nuit", value: "NIGHT" },
  { label: "Petit matin", value: "EARLY_MORNING" },
  { label: "Annulation avant arrivee", value: "CANCELLATION_BEFORE_ARRIVAL" },
  { label: "Annulation apres arrivee", value: "CANCELLATION_AFTER_ARRIVAL" },
];

const adjustmentTypes: Array<{ label: string; value: PricingAdjustmentType }> = [
  { label: "Pourcentage", value: "PERCENTAGE" },
  { label: "Montant fixe", value: "FIXED" },
  { label: "Par minute", value: "PER_MINUTE" },
];

const ruleForm = ref({
  id: "",
  countryId: "",
  ruleType: "PEAK" as PricingRuleType,
  name: "",
  startTime: "",
  endTime: "",
  daysOfWeek: "",
  adjustmentType: "PERCENTAGE" as PricingAdjustmentType,
  adjustmentValue: "",
  freeMinutes: "",
  fixedFee: "",
  isActive: true,
  priority: "0",
});

function toNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapRule(raw: Record<string, unknown>): PricingRuleRow {
  const country = extractCountry(raw);
  return {
    id: String(raw.id ?? ""),
    countryId: country.countryId,
    countryName: country.countryName,
    ruleType: (raw.ruleType ?? "PEAK") as PricingRuleType,
    name: String(raw.name ?? ""),
    startTime: raw.startTime ? String(raw.startTime) : undefined,
    endTime: raw.endTime ? String(raw.endTime) : undefined,
    daysOfWeek: raw.daysOfWeek ? String(raw.daysOfWeek) : undefined,
    adjustmentType: (raw.adjustmentType ?? "PERCENTAGE") as PricingAdjustmentType,
    adjustmentValue: Number(raw.adjustmentValue ?? 0),
    freeMinutes: Number(raw.freeMinutes ?? 0),
    fixedFee: Number(raw.fixedFee ?? 0),
    isActive: Boolean(raw.isActive ?? true),
    priority: Number(raw.priority ?? 0),
  };
}

async function loadRules() {
  ruleErrorMessage.value = "";
  try {
    const response = await axios.get("/pricing/rules");
    const payload = Array.isArray(response.data?.data) ? response.data.data : [];
    rules.value = payload.map((item: Record<string, unknown>) => mapRule(item));
    countries.value = mergeCountryOptions(countries.value, rules.value);
  } catch (err: any) {
    rules.value = [];
    ruleErrorMessage.value = err?.response?.data?.message || "Impossible de charger les regles tarifaires.";
  }
}

function resetRuleForm() {
  ruleForm.value = {
    id: "",
    countryId: countryFilter.value !== "all" ? countryFilter.value : "",
    ruleType: "PEAK",
    name: "",
    startTime: "",
    endTime: "",
    daysOfWeek: "",
    adjustmentType: "PERCENTAGE",
    adjustmentValue: "",
    freeMinutes: "",
    fixedFee: "",
    isActive: true,
    priority: "0",
  };
}

function fillRuleForm(rule: PricingRuleRow) {
  ruleForm.value = {
    id: rule.id,
    countryId: rule.countryId,
    ruleType: rule.ruleType,
    name: rule.name,
    startTime: rule.startTime ?? "",
    endTime: rule.endTime ?? "",
    daysOfWeek: rule.daysOfWeek ?? "",
    adjustmentType: rule.adjustmentType,
    adjustmentValue: rule.adjustmentValue?.toString() ?? "",
    freeMinutes: rule.freeMinutes?.toString() ?? "",
    fixedFee: rule.fixedFee?.toString() ?? "",
    isActive: rule.isActive,
    priority: rule.priority.toString(),
  };
  modalOpen.value = true;
}

function openNewModal() {
  console.log("Opening modal...");
  resetRuleForm();
  modalOpen.value = true;
}

const ruleNumeric = computed(() => ({
  adjustmentValue: toNumber(ruleForm.value.adjustmentValue),
  freeMinutes: toNumber(ruleForm.value.freeMinutes),
  fixedFee: toNumber(ruleForm.value.fixedFee),
  priority: toNumber(ruleForm.value.priority),
}));

const ruleValidationErrors = computed(() => {
  const errors: string[] = [];
  if (!ruleForm.value.countryId) errors.push("Pays requis.");
  if (!ruleForm.value.name) errors.push("Nom de la regle requis.");
  if (!ruleForm.value.ruleType) errors.push("Type de regle requis.");
  if (ruleForm.value.adjustmentType === "PERCENTAGE" && ruleNumeric.value.adjustmentValue <= 0) {
    errors.push("Une majoration en pourcentage doit etre positive.");
  }
  return errors;
});
const filteredRules = computed(() =>
  rules.value.filter((rule) => countryFilter.value === "all" || rule.countryId === countryFilter.value)
);

async function saveRule() {
  if (ruleValidationErrors.value.length > 0) {
    ruleErrorMessage.value = ruleValidationErrors.value[0];
    return;
  }

  const payload = {
    countryId: ruleForm.value.countryId,
    ruleType: ruleForm.value.ruleType,
    name: ruleForm.value.name,
    startTime: ruleForm.value.startTime || undefined,
    endTime: ruleForm.value.endTime || undefined,
    daysOfWeek: ruleForm.value.daysOfWeek || undefined,
    adjustmentType: ruleForm.value.adjustmentType,
    adjustmentValue: ruleNumeric.value.adjustmentValue || undefined,
    freeMinutes: ruleNumeric.value.freeMinutes || undefined,
    fixedFee: ruleNumeric.value.fixedFee || undefined,
    isActive: ruleForm.value.isActive,
    priority: ruleNumeric.value.priority,
  };

  ruleSaving.value = true;
  ruleErrorMessage.value = "";

  try {
    if (ruleForm.value.id) {
      await axios.patch(`/pricing/rules/${ruleForm.value.id}`, payload);
    } else {
      await axios.post("/pricing/rules", payload);
    }
    await loadRules();
    resetRuleForm();
    modalOpen.value = false;
  } catch (err: any) {
    ruleErrorMessage.value = err?.response?.data?.message || "Impossible d'enregistrer la regle.";
  } finally {
    ruleSaving.value = false;
  }
}

function requestRuleDelete(rule: PricingRuleRow) {
  ruleToDelete.value = rule;
  ruleConfirmOpen.value = true;
}

async function confirmRuleDelete() {
  if (!ruleToDelete.value) return;
  ruleDeletingId.value = ruleToDelete.value.id;
  try {
    await axios.delete(`/pricing/rules/${ruleToDelete.value.id}`);
    ruleConfirmOpen.value = false;
    ruleToDelete.value = null;
    await loadRules();
  } catch (err: any) {
    ruleErrorMessage.value = err?.response?.data?.message || "Impossible de supprimer la regle.";
  } finally {
    ruleDeletingId.value = null;
  }
}

onMounted(() => {
  void (async () => {
    countries.value = mergeCountryOptions(await fetchCountries(), rules.value);
  })();
  void loadRules();
});
</script>

<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
    <PricingTabs />

    <div class="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
      <Card>
        <div class="flex items-start justify-between">
          <div>
            <p class="text-lg font-semibold">Regles & Ajustements</p>
            <p class="text-[11px] text-muted-foreground">Majors, nuit, pointe, annulations.</p>
          </div>
          <Button size="sm" @click="openNewModal">
            <Icon icon="solar:add-circle-linear" class="mr-2 h-4 w-4" />
            Nouvelle regle
          </Button>
        </div>

        <div class="mt-4 space-y-4">
          <p class="text-[12px] text-gray-400 italic">
            Les regles sont appliquees par ordre de priorite. Une regle "NIGHT" peut s'ajouter au tarif de base.
          </p>
          <div class="rounded-lg border border-ld p-4 bg-muted/20">
            <p class="text-gray-900 font-bold text-sm">Fonctionnement</p>
            <em class="mt-1 text-xs text-gray-400 italic">
              Les ajustements PEAK/NIGHT s'appliquent sur le total ou le tarif km selon le type. 
              Les frais d'annulation sont fixes.
            </em>
          </div>
        </div>
      </Card>
      <div class="xl:col-span-2">
        <Card>
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p class="text-lg font-semibold">Regles existantes</p>
            <Select v-model="countryFilter">
              <SelectTrigger class="w-[180px]">
                <SelectValue placeholder="Filtrer par pays" />
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
                  <TableHead>Regle</TableHead>
                  <TableHead>Pays</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Ajustement</TableHead>
                  <TableHead>Valeur</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="filteredRules.length === 0">
                  <TableCell colspan="7" class="text-center text-sm text-muted-foreground">
                    Aucune regle definie.
                  </TableCell>
                </TableRow>
                <TableRow v-for="rule in filteredRules" :key="rule.id" class="hover:bg-gray-100">
                  <TableCell class="font-medium">{{ rule.name }}</TableCell>
                  <TableCell>{{ rule.countryName }}</TableCell>
                  <TableCell>
                    <span class="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {{ rule.ruleType }}
                    </span>
                  </TableCell>
                  <TableCell>{{ rule.adjustmentType }}</TableCell>
                  <TableCell class="font-semibold">{{ formatAmount(rule.adjustmentValue ?? 0) }}</TableCell>
                  <TableCell>
                    <Icon 
                      :icon="rule.isActive ? 'solar:check-circle-bold' : 'solar:close-circle-bold'" 
                      :class="rule.isActive ? 'text-green-500' : 'text-gray-400'"
                      width="20"
                    />
                  </TableCell>
                  <TableCell>
                    <div class="flex gap-2">
                       <button
                        class="rounded-md border border-ld/70 px-2 py-1 text-xs font-medium text-[#0D47A1] hover:bg-lightprimary"
                        @click="fillRuleForm(rule)">
                        <Icon icon="solar:pen-2-linear" width="16" height="16" />
                      </button>
                      <button
                        class="rounded-md border border-ld/70 px-2 py-1 text-xs font-medium text-red-600 hover:bg-lightprimary"
                        @click="requestRuleDelete(rule)">
                        <Icon icon="solar:trash-bin-trash-linear" width="16" height="16" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>

    <!-- Modal Formulaire des Regles -->
    <Dialog v-model:open="modalOpen">
      <DialogContent class="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{{ ruleForm.id ? "Modifier la regle" : "Ajouter une regle tarifaire" }}</DialogTitle>
        </DialogHeader>

        <div class="grid gap-4 py-4 md:grid-cols-2">
          <div class="">
            <Label>Pays</Label>
            <Select v-model="ruleForm.countryId">
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
            <Label>Type de regle</Label>
            <Select v-model="ruleForm.ruleType">
              <SelectTrigger class="mt-1 w-full">
                <SelectValue placeholder="Choisir un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="option in ruleTypes" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Libellé</Label>
            <Input v-model="ruleForm.name" placeholder="Ex: Majoration Nuit" />
          </div>
          <div>
            <Label>Plages horaires (HH:MM)</Label>
            <div class="flex gap-2">
              <Input v-model="ruleForm.startTime" type="time" />
              <Input v-model="ruleForm.endTime" type="time" />
            </div>
          </div>
          <div>
            <Label>Jours (ex: mon,tue...)</Label>
            <Input v-model="ruleForm.daysOfWeek" placeholder="mon,tue,wed,thu,fri" />
          </div>
          <div>
            <Label>Type d'ajustement</Label>
            <Select v-model="ruleForm.adjustmentType">
              <SelectTrigger class="mt-1 w-full">
                <SelectValue placeholder="Choisir un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="option in adjustmentTypes" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Valeur</Label>
            <Input v-model="ruleForm.adjustmentValue" type="number" />
          </div>
          <div>
            <Label>Minutes gratuites</Label>
            <Input v-model="ruleForm.freeMinutes" type="number" />
          </div>
          <div>
            <Label>Montant fixe</Label>
            <Input v-model="ruleForm.fixedFee" type="number" />
          </div>
          <div>
            <Label>Priorite</Label>
            <Input v-model="ruleForm.priority" type="number" />
          </div>
          <div class="flex items-center gap-2">
            <input id="rule-active" v-model="ruleForm.isActive" type="checkbox" class="h-4 w-4" />
            <label for="rule-active" class="text-sm font-medium">Définir comme regle active</label>
          </div>
        </div>

        <DialogFooter class="flex-col gap-2 sm:flex-row">
          <p v-if="ruleErrorMessage" class="text-xs text-red-600 self-center mr-auto border border-red-600 bg-red-50 px-2 py-1 rounded-md">{{ ruleErrorMessage }}</p>
          <Button variant="outline" @click="modalOpen = false">Annuler</Button>
          <Button :disabled="ruleSaving" @click="saveRule">
            {{ ruleSaving ? "Enregistrement..." : "Enregistrer" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      v-model:open="ruleConfirmOpen"
      title="Supprimer la regle"
      description="Voulez-vous supprimer cette regle tarifaire ?"
      confirm-text="Supprimer"
      cancel-text="Annuler"
      :loading="ruleDeletingId !== null"
      @confirm="confirmRuleDelete"
    />
  </div>
</template>
