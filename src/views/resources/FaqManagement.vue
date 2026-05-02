<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import axios from "@/utils/axios";
import BaseBreadcrumb from "@/components/shared/BaseBreadcrumb.vue";
import Card from "@/components/ui/card/Card.vue";
import Input from "@/components/ui/input/Input.vue";
import Label from "@/components/ui/label/Label.vue";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/vue";
import ConfirmDialog from "@/components/shared/ConfirmDialog.vue";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type FaqStatus = "ACTIVE" | "INACTIVE";
const MAX_QUESTION_LENGTH = 140;
const ANSWER_PREVIEW_LENGTH = 120;

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  status: FaqStatus;
  createdAt: string;
}

const page = ref({ title: "FAQ" });
const breadcrumbs = ref([
  { text: "Support", href: "#" },
  { text: "FAQ", href: "/support/faqs" },
]);

const loading = ref(false);
const creating = ref(false);
const editing = ref(false);
const deleting = ref(false);
const showCreateModal = ref(false);
const error = ref("");
const success = ref("");
const search = ref("");
const faqs = ref<FaqItem[]>([]);
const form = ref({
  question: "",
  answer: "",
  status: "ACTIVE" as FaqStatus,
});
const showEditModal = ref(false);
const editForm = ref<FaqItem | null>(null);
const confirmDeleteOpen = ref(false);
const confirmDeleteId = ref<string | null>(null);
const createEditorRef = ref<HTMLDivElement | null>(null);
const editEditorRef = ref<HTMLDivElement | null>(null);
const createAnswerHtml = ref("");
const editAnswerHtml = ref("");

function mapFaq(raw: Record<string, unknown>): FaqItem {
  return {
    id: String(raw.id ?? "N/A"),
    question: String(raw.question ?? ""),
    answer: String(raw.answer ?? ""),
    status: (raw.status as FaqStatus) ?? "ACTIVE",
    createdAt: String(raw.createdAt ?? ""),
  };
}

function statusLabel(value: FaqStatus): string {
  return value === "ACTIVE" ? "Actif" : "Inactif";
}

function statusVariant(value: FaqStatus): "success" | "warning" {
  return value === "ACTIVE" ? "success" : "warning";
}

function truncateText(value: string, maxLength: number): string {
  const text = stripHtml(value).trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function normalizeEditorHtml(value: string): string {
  const trimmed = value.trim();
  return trimmed === "<br>" ? "" : trimmed;
}

function syncCreateEditor() {
  if (!createEditorRef.value) return;
  if (createEditorRef.value.innerHTML !== createAnswerHtml.value) {
    createEditorRef.value.innerHTML = createAnswerHtml.value;
  }
}

function syncEditEditor() {
  if (!editEditorRef.value) return;
  if (editEditorRef.value.innerHTML !== editAnswerHtml.value) {
    editEditorRef.value.innerHTML = editAnswerHtml.value;
  }
}

function onCreateEditorInput(event: Event) {
  createAnswerHtml.value = normalizeEditorHtml((event.target as HTMLDivElement).innerHTML);
}

function onEditEditorInput(event: Event) {
  editAnswerHtml.value = normalizeEditorHtml((event.target as HTMLDivElement).innerHTML);
}

function execEditorCommand(command: string, editor: "create" | "edit", value?: string) {
  const target = editor === "create" ? createEditorRef.value : editEditorRef.value;
  if (!target) return;
  target.focus();
  document.execCommand(command, false, value);
  if (editor === "create") {
    createAnswerHtml.value = normalizeEditorHtml(target.innerHTML);
  } else {
    editAnswerHtml.value = normalizeEditorHtml(target.innerHTML);
  }
}

const toolbarButtons = [
  { icon: "solar:text-bold-linear", label: "Gras", command: "bold" },
  { icon: "solar:text-italic-linear", label: "Italique", command: "italic" },
  { icon: "solar:text-underline-linear", label: "Souligne", command: "underline" },
  { icon: "solar:list-linear", label: "Liste", command: "insertUnorderedList" },
];

const createAnswerText = computed(() => stripHtml(createAnswerHtml.value));
const editAnswerText = computed(() => stripHtml(editAnswerHtml.value));

function formatDate(value: string): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("fr-FR");
}

async function loadFaqs() {
  loading.value = true;
  error.value = "";
  try {
    const params: Record<string, string> = {};
    if (search.value.trim()) params.search = search.value.trim();
    const response = await axios.get("/faqs", { params });
    const payload = Array.isArray(response.data?.data) ? response.data.data : [];
    faqs.value = payload.map((item: Record<string, unknown>) => mapFaq(item));
  } catch {
    error.value = "Impossible de charger les questions frequentes.";
    faqs.value = [];
  } finally {
    loading.value = false;
  }
}

async function createFaq() {
  error.value = "";
  success.value = "";
  if (!form.value.question.trim() || !createAnswerText.value) {
    error.value = "Question et reponse sont requises.";
    return;
  }
  if (form.value.question.trim().length > MAX_QUESTION_LENGTH) {
    error.value = `La question ne doit pas depasser ${MAX_QUESTION_LENGTH} caracteres.`;
    return;
  }

  creating.value = true;
  try {
    await axios.post("/faqs", {
      question: form.value.question.trim(),
      answer: createAnswerHtml.value.trim(),
      status: form.value.status,
    });
    form.value = { question: "", answer: "", status: "ACTIVE" };
    createAnswerHtml.value = "";
    showCreateModal.value = false;
    await loadFaqs();
    success.value = "Question ajoutee avec succes.";
    setTimeout(() => {
      success.value = "";
    }, 2500);
  } catch (err: any) {
    error.value = err?.response?.data?.message || "Impossible d'ajouter la question.";
  } finally {
    creating.value = false;
  }
}

function openCreateModal() {
  form.value = { question: "", answer: "", status: "ACTIVE" };
  createAnswerHtml.value = "";
  showCreateModal.value = true;
  void nextTick(() => {
    syncCreateEditor();
  });
}

function openEdit(faq: FaqItem) {
  editForm.value = { ...faq };
  editAnswerHtml.value = faq.answer;
  showEditModal.value = true;
  void nextTick(() => {
    syncEditEditor();
  });
}

async function saveEdit() {
  if (!editForm.value) return;
  error.value = "";
  success.value = "";
  if (!editForm.value.question.trim() || !editAnswerText.value) {
    error.value = "Question et reponse sont requises.";
    return;
  }
  if (editForm.value.question.trim().length > MAX_QUESTION_LENGTH) {
    error.value = `La question ne doit pas depasser ${MAX_QUESTION_LENGTH} caracteres.`;
    return;
  }

  editing.value = true;
  try {
    await axios.patch(`/faqs/${editForm.value.id}`, {
      question: editForm.value.question.trim(),
      answer: editAnswerHtml.value.trim(),
      status: editForm.value.status,
    });
    showEditModal.value = false;
    await loadFaqs();
    success.value = "Question modifiee avec succes.";
    setTimeout(() => {
      success.value = "";
    }, 2500);
  } catch (err: any) {
    error.value = err?.response?.data?.message || "Impossible de modifier la question.";
  } finally {
    editing.value = false;
  }
}

function requestDelete(id: string) {
  confirmDeleteId.value = id;
  confirmDeleteOpen.value = true;
}

async function confirmDelete() {
  if (!confirmDeleteId.value) return;
  deleting.value = true;
  error.value = "";
  success.value = "";
  try {
    await axios.delete(`/faqs/${confirmDeleteId.value}`);
    confirmDeleteOpen.value = false;
    confirmDeleteId.value = null;
    await loadFaqs();
    success.value = "Question supprimee avec succes.";
    setTimeout(() => {
      success.value = "";
    }, 2500);
  } catch (err: any) {
    error.value = err?.response?.data?.message || "Impossible de supprimer la question.";
  } finally {
    deleting.value = false;
  }
}

async function toggleFaqStatus(faq: FaqItem) {
  const nextStatus: FaqStatus = faq.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  error.value = "";
  success.value = "";
  try {
    await axios.patch(`/faqs/${faq.id}`, {
      status: nextStatus,
    });
    await loadFaqs();
    success.value = nextStatus === "ACTIVE"
      ? "Question activee avec succes."
      : "Question desactivee avec succes.";
    setTimeout(() => {
      success.value = "";
    }, 2500);
  } catch (err: any) {
    error.value = err?.response?.data?.message || "Impossible de mettre a jour le statut.";
  }
}

function onSearch() {
  void loadFaqs();
}

onMounted(() => {
  void loadFaqs();
});

watch(showCreateModal, (open) => {
  if (open) {
    void nextTick(() => {
      syncCreateEditor();
    });
  }
});

watch(showEditModal, (open) => {
  if (open) {
    void nextTick(() => {
      syncEditEditor();
    });
  }
});
</script>

<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

    <Card class="mt-4 shadow-md">
      <div class="flex flex-col gap-1">
        <h2 class="text-lg font-semibold">Gestion des questions frequentes</h2>
        <p class="text-sm text-muted-foreground">Ajout, modification et suppression des FAQ.</p>
      </div>
    </Card>

    <div class="mt-4 mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <h3 class="font-semibold">Liste des FAQ</h3>
      <div class="flex gap-2 flex-wrap">
        <Button @click="openCreateModal">Nouveau</Button>
        <Input v-model="search" placeholder="Rechercher une question..." class="w-[260px]" />
        <Button variant="outline" :disabled="loading" @click="onSearch">
          {{ loading ? "Chargement..." : "Rechercher" }}
        </Button>
      </div>
    </div>

    <Card class="shadow-md">
      <p v-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>
      <p v-if="success" class="mb-3 text-sm text-emerald-600">{{ success }}</p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Question</TableHead>
            <TableHead>Reponse</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading">
            <TableCell colspan="5" class="text-center text-muted-foreground">Chargement...</TableCell>
          </TableRow>
          <TableRow v-for="faq in faqs" :key="faq.id">
            <TableCell class="max-w-[320px] break-words font-medium">
              {{ truncateText(faq.question, MAX_QUESTION_LENGTH) }}
            </TableCell>
            <TableCell class="max-w-[560px] whitespace-pre-wrap break-words">
              {{ truncateText(faq.answer, ANSWER_PREVIEW_LENGTH) }}
            </TableCell>
            <TableCell>
              <Badge :variant="statusVariant(faq.status)">{{ statusLabel(faq.status) }}</Badge>
            </TableCell>
            <TableCell>{{ formatDate(faq.createdAt) }}</TableCell>
            <TableCell>
              <div class="flex items-center gap-2">
                <button
                  class="rounded-md border border-ld/70 px-2 py-1 text-xs font-medium text-[#0D47A1] hover:bg-lightprimary"
                  @click="openEdit(faq)"
                >
                  <Icon icon="solar:pen-2-linear" width="18" height="18" />
                </button>
                <button
                  class="rounded-md border border-ld/70 px-2 py-1 text-xs font-medium text-amber-600 hover:bg-lightprimary"
                  @click="toggleFaqStatus(faq)"
                >
                  <Icon
                    :icon="faq.status === 'ACTIVE' ? 'solar:eye-closed-linear' : 'solar:eye-linear'"
                    width="18"
                    height="18"
                  />
                </button>
                <button
                  class="rounded-md border border-ld/70 px-2 py-1 text-xs font-medium text-red-600 hover:bg-lightprimary"
                  @click="requestDelete(faq.id)"
                >
                  <Icon icon="solar:trash-bin-trash-linear" width="18" height="18" />
                </button>
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-if="!loading && faqs.length === 0">
            <TableCell colspan="5" class="text-center text-muted-foreground">
              Aucune question frequente disponible.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>

    <Dialog v-model:open="showCreateModal">
      <DialogContent class="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Nouvelle question frequente</DialogTitle>
        </DialogHeader>
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12 md:col-span-8">
            <Label for="create-faq-question">Question</Label>
            <Input
              id="create-faq-question"
              v-model="form.question"
              class="mt-1"
              :maxlength="MAX_QUESTION_LENGTH"
              placeholder="Ex: Comment suivre ma course ?"
            />
            <p class="mt-1 text-xs text-muted-foreground">
              {{ form.question.length }}/{{ MAX_QUESTION_LENGTH }} caracteres
            </p>
          </div>
          <div class="col-span-12 md:col-span-4">
            <Label for="create-faq-status">Statut</Label>
            <select
              id="create-faq-status"
              v-model="form.status"
              class="mt-1 h-10 w-full rounded-lg border border-ld bg-transparent px-3 text-sm outline-none focus:border-primary"
            >
              <option value="ACTIVE">Actif</option>
              <option value="INACTIVE">Inactif</option>
            </select>
          </div>
          <div class="col-span-12">
            <Label for="create-faq-answer">Reponse</Label>
            <div class="mt-1 rounded-xl border border-ld">
              <div class="flex flex-wrap items-center gap-2 border-b border-ld px-3 py-2">
                <button
                  v-for="button in toolbarButtons"
                  :key="`create-${button.command}`"
                  type="button"
                  class="rounded-md border border-ld/70 px-2 py-1 text-xs text-[#0D47A1] hover:bg-lightprimary"
                  :title="button.label"
                  @click="execEditorCommand(button.command, 'create')"
                >
                  <Icon :icon="button.icon" width="16" height="16" />
                </button>
              </div>
              <div
                id="create-faq-answer"
                ref="createEditorRef"
                class="min-h-[160px] px-3 py-3 text-sm outline-none"
                contenteditable="true"
                @input="onCreateEditorInput"
              />
            </div>
          </div>
        </div>
        <DialogFooter class="mt-4">
          <Button variant="outline" @click="showCreateModal = false">Annuler</Button>
          <Button :disabled="creating" @click="createFaq">
            {{ creating ? "Ajout..." : "Ajouter" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="showEditModal">
      <DialogContent class="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Modifier la question frequente</DialogTitle>
        </DialogHeader>
        <div v-if="editForm" class="grid grid-cols-12 gap-4">
          <div class="col-span-12 md:col-span-8">
            <Label for="edit-faq-question">Question</Label>
            <Input
              id="edit-faq-question"
              v-model="editForm.question"
              class="mt-1"
              :maxlength="MAX_QUESTION_LENGTH"
            />
            <p class="mt-1 text-xs text-muted-foreground">
              {{ editForm.question.length }}/{{ MAX_QUESTION_LENGTH }} caracteres
            </p>
          </div>
          <div class="col-span-12 md:col-span-4">
            <Label for="edit-faq-status">Statut</Label>
            <select
              id="edit-faq-status"
              v-model="editForm.status"
              class="mt-1 h-10 w-full rounded-lg border border-ld bg-transparent px-3 text-sm outline-none focus:border-primary"
            >
              <option value="ACTIVE">Actif</option>
              <option value="INACTIVE">Inactif</option>
            </select>
          </div>
          <div class="col-span-12">
            <Label for="edit-faq-answer">Reponse</Label>
            <div class="mt-1 rounded-xl border border-ld">
              <div class="flex flex-wrap items-center gap-2 border-b border-ld px-3 py-2">
                <button
                  v-for="button in toolbarButtons"
                  :key="`edit-${button.command}`"
                  type="button"
                  class="rounded-md border border-ld/70 px-2 py-1 text-xs text-[#0D47A1] hover:bg-lightprimary"
                  :title="button.label"
                  @click="execEditorCommand(button.command, 'edit')"
                >
                  <Icon :icon="button.icon" width="16" height="16" />
                </button>
              </div>
              <div
                id="edit-faq-answer"
                ref="editEditorRef"
                class="min-h-[160px] px-3 py-3 text-sm outline-none"
                contenteditable="true"
                @input="onEditEditorInput"
              />
            </div>
          </div>
        </div>
        <DialogFooter class="mt-4">
          <Button variant="outline" @click="showEditModal = false">Annuler</Button>
          <Button :disabled="editing" @click="saveEdit">
            {{ editing ? "Enregistrement..." : "Enregistrer" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      v-model:open="confirmDeleteOpen"
      title="Supprimer la question"
      description="Voulez-vous supprimer cette question frequente ?"
      confirm-text="Supprimer"
      cancel-text="Annuler"
      :loading="deleting"
      @confirm="confirmDelete"
    />
  </div>
</template>
