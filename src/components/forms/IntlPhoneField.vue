<script setup lang="ts">
import VueTelInput from "vue-tel-input";

const model = defineModel<string>({ default: "" });

withDefaults(
  defineProps<{
    inputName?: string;
    placeholder?: string;
  }>(),
  {
    inputName: "phone",
    placeholder: "+229 61 23 45 67",
  }
);
</script>

<template>
  <VueTelInput
    v-model="model"
    class="mt-1"
    :input-options="{
      placeholder,
      autocomplete: 'tel',
      name: inputName
    }"
    :dropdown-options="{ showFlags: true, showSearchBox: true }"
  />
</template>
