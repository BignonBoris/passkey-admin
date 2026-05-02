<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import axios from "@/utils/axios";
import BaseBreadcrumb from "@/components/shared/BaseBreadcrumb.vue";
import Card from "@/components/ui/card/Card.vue";
import Input from "@/components/ui/input/Input.vue";
import Textarea from "@/components/ui/textarea/Textarea.vue";
import Label from "@/components/ui/label/Label.vue";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface IncidentOrder {
  id: string;
  publicCode?: string;
  status?: string;
}

interface IncidentDriver {
  id: string;
  name?: string;
  phone?: string;
}

interface IncidentItem {
  id: string;
  orderId?: string | null;
  driverId?: string | null;
  reporterRole?: string;
  type: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  description?: string | null;
  resolutionNotes?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  order?: IncidentOrder | null;
  driver?: IncidentDriver | null;
}

const page = ref({ title: "Incidents" });
const breadcrumbs = ref([
  { text: "Operations", href: "#" },
  { text: "Incidents", href: "/admin/incidents" },
]);

const loading = ref(false);
const error = ref("");
const success = ref("");
const incidents = ref<IncidentItem[]>([]);
const search = ref("");
const statusFilter = ref<"all" | IncidentItem["status"]>("all");
const priorityFilter = ref<"all" | IncidentItem["priority"]>("all");
const selectedIncident = ref<IncidentItem | null>(null);
const showResolveModal = ref(false);
const updateStatus = ref<IncidentItem["status"]>("IN_PROGRESS");
const resolutionNotes = ref("");
const saving = ref(false);

const filteredIncidents = computed(() => {
  const term = search.value.trim().toLowerCase();
  return incidents.value.filter((incident) => {
    if (statusFilter.value !== "all" && incident.status !== statusFilter.value) return false;
    if (priorityFilter.value !== "all" && incident.priority !== priorityFilter.value) return false;
    if (!term) return true;
    const haystack = [
      incident.type,
      incident.description,
      incident.order?.publicCode,
      incident.driver?.name,
      incident.driver?.phone,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });
});

function badgeVariant(status: IncidentItem["status"]) {
  switch (status) {
    case "RESOLVED":
      return "default";
    case "CLOSED":
      return "secondary";
    case "IN_PROGRESS":
      return "outline";
    default:
      return "destructive";
  }
}

function priorityClass(priority: IncidentItem["priority"]) {
  switch (priority) {
    case "CRITICAL":
      return "text-red-600";
    case "HIGH":
      return "text-orange-600";
    case "MEDIUM":
      return "text-blue-600";
    default:
      return "text-slate-500";
  }
}

function formatType(type: string) {
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("fr-FR");
}

async function loadIncidents() {
  loading.value = true;
  error.value = "";
  try {
    const response = await axios.get("/incidents");
    incidents.value = Array.isArray(response.data?.data)
      ? (response.data.data as IncidentItem[])
      : [];
  } catch (err: any) {
    error.value = err?.response?.data?.message || "Impossible de charger les incidents.";
    incidents.value = [];
  } finally {
    loading.value = false;
  }
}

function openResolveModal(incident: IncidentItem) {
  selectedIncident.value = incident;
  updateStatus.value =
    incident.status === "OPEN" ? "IN_PROGRESS" : incident.status;
  resolutionNotes.value = incident.resolutionNotes || "";
  showResolveModal.value = true;
}

async function saveIncident() {
  if (!selectedIncident.value) return;
  saving.value = true;
  try {
    await axios.patch(`/incidents/${selectedIncident.value.id}`, {
      status: updateStatus.value,
      resolutionNotes: resolutionNotes.value.trim(),
    });
    success.value = "Incident mis a jour.";
    showResolveModal.value = false;
    await loadIncidents();
    setTimeout(() => (success.value = ""), 2200);
  } catch (err: any) {
    error.value = err?.response?.data?.message || "Impossible de mettre a jour l'incident.";
  } finally {
    saving.value = false;
  }
}

onMounted(loadIncidents);
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <div class="space-y-6">
    <Card class="rounded-2xl border-0 shadow-sm">
      <div class="flex flex-col gap-4 p-5 md:flex-row md:items-end">
        <div class="flex-1">
          <Label for="incident-search">Recherche</Label>
          <Input id="incident-search" v-model="search" placeholder="Reference, livreur, type..." />
        </div>
        <div class="w-full md:w-52">
          <Label for="incident-status">Statut</Label>
          <Select v-model="statusFilter">
            <SelectTrigger id="incident-status"><SelectValue placeholder="Tous" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="OPEN">Ouvert</SelectItem>
              <SelectItem value="IN_PROGRESS">En cours</SelectItem>
              <SelectItem value="RESOLVED">Resolus</SelectItem>
              <SelectItem value="CLOSED">Clos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="w-full md:w-52">
          <Label for="incident-priority">Priorite</Label>
          <Select v-model="priorityFilter">
            <SelectTrigger id="incident-priority"><SelectValue placeholder="Toutes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="LOW">Faible</SelectItem>
              <SelectItem value="MEDIUM">Moyenne</SelectItem>
              <SelectItem value="HIGH">Haute</SelectItem>
              <SelectItem value="CRITICAL">Critique</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" @click="loadIncidents">Actualiser</Button>
      </div>
    </Card>

    <Card class="rounded-2xl border-0 shadow-sm">
      <div class="flex items-center justify-between p-5 pb-0">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Signalements terrain</h3>
          <p class="text-sm text-slate-500">Incidents declares par les livreurs et cas d'impayes cash.</p>
        </div>
      </div>

      <div v-if="error" class="px-5 pt-4 text-sm text-red-600">{{ error }}</div>
      <div v-if="success" class="px-5 pt-4 text-sm text-green-600">{{ success }}</div>

      <div class="p-5">
        <div v-if="loading" class="py-10 text-center text-sm text-slate-500">Chargement...</div>
        <div v-else-if="filteredIncidents.length === 0" class="py-10 text-center text-sm text-slate-500">
          Aucun incident.
        </div>
        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Livreur</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Priorite</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              <TableHead class="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="incident in filteredIncidents" :key="incident.id">
              <TableCell>{{ incident.order?.publicCode || incident.orderId || "-" }}</TableCell>
              <TableCell>
                <div class="font-medium">{{ incident.driver?.name || "-" }}</div>
                <div class="text-xs text-slate-500">{{ incident.driver?.phone || incident.driverId || "" }}</div>
              </TableCell>
              <TableCell>
                <div class="font-medium">{{ formatType(incident.type) }}</div>
                <div class="line-clamp-2 text-xs text-slate-500">{{ incident.description || "-" }}</div>
              </TableCell>
              <TableCell>
                <span :class="['text-sm font-semibold', priorityClass(incident.priority)]">{{ incident.priority }}</span>
              </TableCell>
              <TableCell><Badge :variant="badgeVariant(incident.status)">{{ incident.status }}</Badge></TableCell>
              <TableCell>{{ formatDate(incident.createdAt) }}</TableCell>
              <TableCell class="text-right">
                <Button variant="outline" size="sm" @click="openResolveModal(incident)">Traiter</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Card>
  </div>

  <Dialog v-model:open="showResolveModal">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Traiter l'incident</DialogTitle>
      </DialogHeader>

      <div v-if="selectedIncident" class="space-y-4">
        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <div><span class="font-semibold">Course :</span> {{ selectedIncident.order?.publicCode || selectedIncident.orderId || "-" }}</div>
          <div><span class="font-semibold">Livreur :</span> {{ selectedIncident.driver?.name || selectedIncident.driverId || "-" }}</div>
          <div><span class="font-semibold">Type :</span> {{ formatType(selectedIncident.type) }}</div>
          <div><span class="font-semibold">Description :</span> {{ selectedIncident.description || "-" }}</div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <Label for="incident-update-status">Nouveau statut</Label>
            <Select v-model="updateStatus">
              <SelectTrigger id="incident-update-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">OPEN</SelectItem>
                <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
                <SelectItem value="RESOLVED">RESOLVED</SelectItem>
                <SelectItem value="CLOSED">CLOSED</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Resolution</Label>
            <Textarea v-model="resolutionNotes" class="min-h-[110px]" placeholder="Notes de traitement, decision prise, suivi..." />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="showResolveModal = false">Fermer</Button>
        <Button :disabled="saving" @click="saveIncident">{{ saving ? "Enregistrement..." : "Enregistrer" }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
