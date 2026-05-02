<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const props = defineProps<{
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}>();

const emits = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "confirm"): void;
  (e: "cancel"): void;
}>();

function close() {
  emits("update:open", false);
  emits("cancel");
}

function confirm() {
  emits("confirm");
}
</script>

<template>
  <Dialog :open="props.open" @update:open="emits('update:open', $event)">
    <DialogContent class="sm:max-w-[420px]">
      <DialogHeader>
        <DialogTitle>{{ props.title || "Confirmation" }}</DialogTitle>
        <DialogDescription v-if="props.description">{{ props.description }}</DialogDescription>
      </DialogHeader>
      <DialogFooter class="mt-4">
        <Button variant="outline" @click="close" :disabled="props.loading">
          {{ props.cancelText || "Annuler" }}
        </Button>
        <Button @click="confirm" :disabled="props.loading">
          {{ props.loading ? "Suppression..." : (props.confirmText || "Confirmer") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
