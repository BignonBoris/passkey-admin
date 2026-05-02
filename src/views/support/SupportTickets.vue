<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import axios from "@/utils/axios";
import BaseBreadcrumb from "@/components/shared/BaseBreadcrumb.vue";
import Card from "@/components/ui/card/Card.vue";
import Input from "@/components/ui/input/Input.vue";
import Textarea from "@/components/ui/textarea/Textarea.vue";
import Label from "@/components/ui/label/Label.vue";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/vue";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
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

interface SupportSender {
  id: string;
  name?: string;
  phone?: string;
  role?: string;
}

interface SupportMessage {
  id: string;
  message: string;
  senderRole: string;
  createdAt: string;
  sender?: SupportSender | null;
}

interface SupportTicket {
  id: string;
  subject?: string | null;
  category?: string | null;
  status: "OPEN" | "PENDING" | "RESOLVED" | "CLOSED";
  isArchived?: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  createdAt: string;
  updatedAt: string;
  requester?: SupportSender | null;
  messages?: SupportMessage[];
}

interface SupportTicketCategory {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
}

const page = ref({ title: "Support Tickets" });
const breadcrumbs = ref([
  { text: "Support", href: "#" },
  { text: "Tickets", href: "/support/tickets" },
]);

const loading = ref(false);
const error = ref("");
const success = ref("");
const search = ref("");
const statusFilter = ref<"all" | SupportTicket["status"]>("all");
const categoryFilter = ref("all");
const tickets = ref<SupportTicket[]>([]);
const categories = ref<SupportTicketCategory[]>([]);
const selectedTicketId = ref<string>("");
const detailLoading = ref(false);
const detailError = ref("");
const sendingReply = ref(false);
const reply = ref("");
const updatingTicket = ref(false);
const updateStatus = ref<SupportTicket["status"] | "">("");
const NO_CATEGORY_VALUE = "__none__";
const updateCategory = ref<string>(NO_CATEGORY_VALUE);
const managingCategories = ref(false);
const showCategoriesModal = ref(false);
const categoryForm = ref({
  id: "",
  name: "",
  description: "",
  sortOrder: 0,
});

const selectedTicket = computed(() =>
  tickets.value.find((ticket) => ticket.id === selectedTicketId.value) || null
);

async function loadTickets() {
  loading.value = true;
  error.value = "";
  try {
    const params: Record<string, string> = {};
    if (search.value.trim()) params.search = search.value.trim();
    if (statusFilter.value !== "all") params.status = statusFilter.value;
    if (categoryFilter.value !== "all") params.category = categoryFilter.value;
    const response = await axios.get("/support/tickets", { params });
    const payload = Array.isArray(response.data?.data) ? response.data.data : [];
    tickets.value = payload as SupportTicket[];
    if (!selectedTicketId.value && tickets.value.length) {
      selectedTicketId.value = tickets.value[0].id;
      await loadTicketDetail(tickets.value[0].id);
    } else if (selectedTicketId.value) {
      await loadTicketDetail(selectedTicketId.value);
    }
  } catch (err: any) {
    error.value = err?.response?.data?.message || "Impossible de charger les tickets support.";
    tickets.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadCategories() {
  try {
    const response = await axios.get("/support/categories", {
      params: { includeInactive: "true" },
    });
    categories.value = Array.isArray(response.data?.data)
      ? (response.data.data as SupportTicketCategory[])
      : [];
  } catch (err: any) {
    error.value =
      err?.response?.data?.message ||
      "Impossible de charger les categories de ticket.";
  }
}

async function loadTicketDetail(ticketId: string) {
  detailLoading.value = true;
  detailError.value = "";
  try {
    const response = await axios.get(`/support/tickets/${ticketId}`);
    const ticket = response.data?.data as SupportTicket;
    const idx = tickets.value.findIndex((item) => item.id === ticketId);
    if (idx >= 0) tickets.value[idx] = ticket;
    else tickets.value.unshift(ticket);
    updateStatus.value = ticket.status;
    updateCategory.value = ticket.category || NO_CATEGORY_VALUE;
  } catch (err: any) {
    detailError.value = err?.response?.data?.message || "Impossible de charger le ticket.";
  } finally {
    detailLoading.value = false;
  }
}

async function onSelectTicket(ticketId: string) {
  selectedTicketId.value = ticketId;
  await loadTicketDetail(ticketId);
}

async function submitReply() {
  if (!selectedTicket.value || !reply.value.trim()) return;
  sendingReply.value = true;
  try {
    await axios.post(`/support/tickets/${selectedTicket.value.id}/messages`, {
      message: reply.value.trim(),
    });
    reply.value = "";
    await loadTicketDetail(selectedTicket.value.id);
    success.value = "Reponse envoyee.";
    setTimeout(() => (success.value = ""), 2200);
  } catch (err: any) {
    detailError.value = err?.response?.data?.message || "Impossible d'envoyer la reponse.";
  } finally {
    sendingReply.value = false;
  }
}

async function saveTicketStatus() {
  if (!selectedTicket.value || !updateStatus.value) return;
  updatingTicket.value = true;
  try {
    await axios.patch(`/support/tickets/${selectedTicket.value.id}`, {
      status: updateStatus.value,
      category: updateCategory.value === NO_CATEGORY_VALUE ? null : updateCategory.value,
    });
    await loadTicketDetail(selectedTicket.value.id);
    success.value = "Statut mis a jour.";
    setTimeout(() => (success.value = ""), 2200);
  } catch (err: any) {
    detailError.value = err?.response?.data?.message || "Impossible de mettre a jour le statut.";
  } finally {
    updatingTicket.value = false;
  }
}

function editCategory(category: SupportTicketCategory) {
  categoryForm.value = {
    id: category.id,
    name: category.name,
    description: category.description || "",
    sortOrder: category.sortOrder || 0,
  };
}

function openCategoriesModal() {
  showCategoriesModal.value = true;
}

function closeCategoriesModal() {
  showCategoriesModal.value = false;
  resetCategoryForm();
}

function resetCategoryForm() {
  categoryForm.value = {
    id: "",
    name: "",
    description: "",
    sortOrder: 0,
  };
}

async function saveCategory() {
  if (!categoryForm.value.name.trim()) return;
  managingCategories.value = true;
  try {
    const sortOrder = Math.max(0, Number(categoryForm.value.sortOrder || 0));
    if (categoryForm.value.id) {
      await axios.patch(`/support/categories/${categoryForm.value.id}`, {
        name: categoryForm.value.name.trim(),
        description: categoryForm.value.description.trim() || null,
        sortOrder,
      });
      success.value = "Categorie mise a jour.";
    } else {
      await axios.post("/support/categories", {
        name: categoryForm.value.name.trim(),
        description: categoryForm.value.description.trim() || null,
        sortOrder,
      });
      success.value = "Categorie creee.";
    }
    resetCategoryForm();
    await loadCategories();
    await loadTickets();
    setTimeout(() => (success.value = ""), 2200);
  } catch (err: any) {
    error.value =
      err?.response?.data?.message ||
      "Impossible d'enregistrer la categorie.";
  } finally {
    managingCategories.value = false;
  }
}

async function toggleCategoryStatus(category: SupportTicketCategory, isActive: boolean) {
  const actionLabel = isActive ? "activer" : "desactiver";
  if (!window.confirm(`${actionLabel === "activer" ? "Activer" : "Desactiver"} la categorie "${category.name}" ?`)) {
    return;
  }
  managingCategories.value = true;
  try {
    await axios.patch(`/support/categories/${category.id}`, {
      isActive,
    });
    if (!isActive && updateCategory.value === category.name) {
      updateCategory.value = NO_CATEGORY_VALUE;
    }
    if (!isActive && categoryFilter.value === category.name) {
      categoryFilter.value = "all";
    }
    success.value = isActive ? "Categorie activee." : "Categorie desactivee.";
    await loadCategories();
    await loadTickets();
    setTimeout(() => (success.value = ""), 2200);
  } catch (err: any) {
    error.value =
      err?.response?.data?.message ||
      "Impossible de supprimer la categorie.";
  } finally {
    managingCategories.value = false;
  }
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString("fr-FR");
}

function statusVariant(status: SupportTicket["status"]): "success" | "warning" | "error" | "gray" {
  if (status === "RESOLVED") return "success";
  if (status === "CLOSED") return "gray";
  if (status === "PENDING") return "warning";
  return "error";
}

function statusLabel(status: SupportTicket["status"]) {
  if (status === "OPEN") return "Ouvert";
  if (status === "PENDING") return "En attente";
  if (status === "RESOLVED") return "Resolue";
  if (status === "CLOSED") return "Fermee";
  return status;
}

watch([search, statusFilter, categoryFilter], () => {
  void loadTickets();
});

onMounted(() => {
  void loadCategories();
  void loadTickets();
});
</script>

<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

    <Card class="mt-4">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-base font-semibold">Tickets support</p>
          <p class="text-sm text-muted-foreground">
            Gere les tickets et les categories depuis une interface dediee.
          </p>
        </div>
        <Button class="w-full md:w-auto" @click="openCategoriesModal">
          Categories des tickets
        </Button>
      </div>
    </Card>

    <div class="mt-4 grid gap-4 xl:grid-cols-12">
      <Card class="xl:col-span-4">
        <div class="space-y-3">
          <Input v-model="search" placeholder="Rechercher (nom, numero, message)" />
          <Select v-model="statusFilter">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="OPEN">Ouvert</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="RESOLVED">Resolue</SelectItem>
                <SelectItem value="CLOSED">Fermee</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select v-model="categoryFilter">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Filtrer par categorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Toutes les categories</SelectItem>
                <SelectItem v-for="category in categories.filter((item) => item.isActive)" :key="category.id" :value="category.name">
                  {{ category.name }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
        <div class="mt-4 max-h-[68vh] space-y-2 overflow-auto pr-1">
          <div v-if="loading" class="text-sm text-muted-foreground">Chargement...</div>
          <button
            v-for="ticket in tickets"
            :key="ticket.id"
            class="w-full rounded-lg border p-3 text-left hover:bg-lightprimary/40"
            :class="selectedTicketId === ticket.id ? 'border-[#0D47A1]' : 'border-ld/70'"
            @click="onSelectTicket(ticket.id)"
          >
            <div class="flex items-start justify-between gap-2">
              <p class="text-sm font-semibold">{{ ticket.subject || ticket.category || "Ticket support" }}</p>
              <Badge :variant="statusVariant(ticket.status)">
                {{ ticket.isArchived ? "Archive" : statusLabel(ticket.status) }}
              </Badge>
            </div>
            <p class="mt-1 text-xs text-muted-foreground">
              {{ ticket.requester?.name || "Utilisateur" }} • {{ ticket.requester?.phone || "-" }} •
              {{ ticket.requester?.role || "-" }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">{{ formatDate(ticket.updatedAt) }}</p>
            <p v-if="ticket.messages?.length" class="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {{ ticket.messages?.[0]?.message }}
            </p>
          </button>
          <div v-if="!loading && tickets.length === 0" class="text-sm text-muted-foreground">
            Aucun ticket support.
          </div>
        </div>
      </Card>

      <Card class="xl:col-span-8">
        <div v-if="!selectedTicket" class="text-sm text-muted-foreground">Selectionnez un ticket.</div>
        <div v-else class="space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-lg font-semibold">{{ selectedTicket.subject || selectedTicket.category || "Ticket support" }}</p>
              <p class="text-sm text-muted-foreground">
                {{ selectedTicket.requester?.name || "Utilisateur" }} • {{ selectedTicket.requester?.phone || "-" }} •
                {{ selectedTicket.requester?.role || "-" }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <Select v-model="updateCategory">
                <SelectTrigger class="w-[220px]">
                  <SelectValue placeholder="Categorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem :value="NO_CATEGORY_VALUE">Sans categorie</SelectItem>
                    <SelectItem v-for="category in categories.filter((item) => item.isActive)" :key="category.id" :value="category.name">
                      {{ category.name }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select v-model="updateStatus">
                <SelectTrigger class="w-[180px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="OPEN">Ouvert</SelectItem>
                    <SelectItem value="PENDING">En attente</SelectItem>
                    <SelectItem value="RESOLVED">Resolue</SelectItem>
                    <SelectItem value="CLOSED">Fermee</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button variant="outline" :disabled="updatingTicket || !updateStatus" @click="saveTicketStatus">
                {{ updatingTicket ? "Mise a jour..." : "Mettre a jour" }}
              </Button>
            </div>
          </div>

          <p v-if="success" class="text-sm text-emerald-600">{{ success }}</p>
          <p v-if="detailError" class="text-sm text-red-600">{{ detailError }}</p>

          <div class="max-h-[48vh] space-y-3 overflow-auto rounded-lg border border-ld/70 p-3">
            <div v-if="detailLoading" class="text-sm text-muted-foreground">Chargement...</div>
            <div
              v-for="msg in selectedTicket.messages || []"
              :key="msg.id"
              class="rounded-lg border border-ld/70 p-3"
              :class="msg.senderRole === 'admin' || msg.senderRole === 'sous-admin' ? 'bg-lightprimary/30' : 'bg-white'"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="text-xs font-semibold">
                  {{ msg.sender?.name || "Support" }} • {{ msg.sender?.phone || "-" }} • {{ msg.senderRole }}
                </p>
                <p class="text-xs text-muted-foreground">{{ formatDate(msg.createdAt) }}</p>
              </div>
              <p class="mt-2 whitespace-pre-wrap text-sm">{{ msg.message }}</p>
            </div>
          </div>

          <div class="space-y-2">
            <Label for="support-reply">Reponse support</Label>
            <Textarea id="support-reply" v-model="reply" class="min-h-[110px]" placeholder="Ecrire une reponse..." />
            <div class="flex justify-end">
              <Button :disabled="sendingReply || !reply.trim()" @click="submitReply">
                {{ sendingReply ? "Envoi..." : "Envoyer la reponse" }}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>

    <Dialog v-model:open="showCategoriesModal">
      <DialogContent class="sm:max-w-[980px] max-h-[90vh] overflow-y-auto">
        <DialogHeader class="-mx-6 -mt-6 rounded-t-lg bg-[#0D47A1] px-6 py-4">
          <DialogTitle class="text-white">Categories des tickets</DialogTitle>
        </DialogHeader>

        <div class="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div class="space-y-3 rounded-lg border border-ld/70 p-4">
            <div>
              <Label>Nom categorie</Label>
              <Input v-model="categoryForm.name" placeholder="Ex: Paiement" class="mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                v-model="categoryForm.description"
                class="mt-1 min-h-[110px]"
                placeholder="Description optionnelle"
              />
            </div>
            <div>
              <Label>Ordre</Label>
              <Input v-model="categoryForm.sortOrder" type="number" min="0" class="mt-1" />
            </div>
            <div class="flex gap-2">
              <Button :disabled="managingCategories" @click="saveCategory">
                {{ managingCategories ? "Enregistrement..." : "Enregistrer" }}
              </Button>
              <Button
                v-if="categoryForm.id"
                variant="outline"
                :disabled="managingCategories"
                @click="resetCategoryForm"
              >
                Annuler
              </Button>
            </div>
          </div>

          <div class="rounded-lg border border-ld/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categorie</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Ordre</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead class="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="category in categories" :key="category.id">
                  <TableCell class="font-medium">{{ category.name }}</TableCell>
                  <TableCell class="max-w-[280px] whitespace-normal text-sm text-muted-foreground">
                    {{ category.description || "Aucune description" }}
                  </TableCell>
                  <TableCell>{{ category.sortOrder }}</TableCell>
                  <TableCell>
                    <Badge :variant="category.isActive ? 'success' : 'warning'">
                      {{ category.isActive ? "Active" : "Inactive" }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-right">
                    <div class="flex justify-end gap-2">
                      <Button variant="outline" size="sm" @click="editCategory(category)">
                        <Icon icon="solar:pen-2-linear" width="16" height="16" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        :disabled="managingCategories"
                        @click="toggleCategoryStatus(category, !category.isActive)"
                      >
                        <Icon
                          :icon="category.isActive ? 'solar:eye-closed-linear' : 'solar:eye-linear'"
                          width="16"
                          height="16"
                        />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow v-if="categories.length === 0">
                  <TableCell colspan="5" class="py-6 text-center text-sm text-muted-foreground">
                    Aucune categorie disponible.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter class="mt-4">
          <Button variant="outline" @click="closeCategoriesModal">Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
