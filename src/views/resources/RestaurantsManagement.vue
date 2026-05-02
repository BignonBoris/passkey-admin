<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import axios from "@/utils/axios";
import BaseBreadcrumb from "@/components/shared/BaseBreadcrumb.vue";
import Card from "@/components/ui/card/Card.vue";
import Input from "@/components/ui/input/Input.vue";
import Label from "@/components/ui/label/Label.vue";
import Textarea from "@/components/ui/textarea/Textarea.vue";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface RestaurantManager { id: string; name: string; phone: string; email: string; role: string; isActive?: boolean; plainPassword?: string; }
interface RestaurantItem { id: string; name: string; description: string; categoryId: string; categoryLabel: string; deliveryMinutes: number; deliveryFee: number; imageUrl: string; accentColor: string; icon: string; tags: string[]; isOpen: boolean; isActive: boolean; isPopular: boolean; isRecommended: boolean; isNearby: boolean; ownerUserId: string; manager: RestaurantManager | null; }
interface CategoryItem { id: string; restaurantId: string | null; name: string; icon: string; color: string; isActive: boolean; }
interface ProductItem { id: string; restaurantId: string; categoryId: string | null; name: string; description: string; imageUrl: string; price: number; originalPrice: number | null; isAvailable: boolean; isPopular: boolean; isActive: boolean; tags: string[]; }

const page = ref({ title: "Restaurants" });
const breadcrumbs = ref([{ text: "Food", href: "#" }, { text: "Restaurants", href: "/admin/food/restaurants" }]);
const loading = ref(false);
const saving = ref(false);
const detailLoading = ref(false);
const error = ref("");
const success = ref("");

const restaurants = ref<RestaurantItem[]>([]);
const categories = ref<CategoryItem[]>([]);
const products = ref<ProductItem[]>([]);
const selectedRestaurantId = ref("");
const editingCategoryId = ref("");
const editingProductId = ref("");
const assignManagerEmail = ref("");
const generatedManagers = ref<Array<{ restaurantId: string; restaurantName: string; manager: RestaurantManager }>>([]);

const createRestaurantForm = ref({ name: "", description: "", categoryId: "restaurant", categoryLabel: "Restaurant", imageUrl: "", accentColor: "#0D47A1", icon: "restaurant_rounded", deliveryMinutes: 25, deliveryFee: 1000, managerName: "", managerEmail: "", managerPhone: "", managerPassword: "" });
const restaurantForm = ref({ id: "", name: "", description: "", categoryId: "", categoryLabel: "", imageUrl: "", accentColor: "#0D47A1", icon: "restaurant_rounded", deliveryMinutes: 25, deliveryFee: 1000, tagsText: "", isOpen: true, isActive: true, isPopular: false, isRecommended: false, isNearby: false });
const categoryForm = ref({ name: "", icon: "restaurant_rounded", color: "#0D47A1" });
const productForm = ref({ name: "", description: "", imageUrl: "", categoryId: "", price: 0, originalPrice: 0, tagsText: "", isAvailable: true, isPopular: false });

const selectedRestaurant = computed(() => restaurants.value.find((item) => item.id === selectedRestaurantId.value) ?? null);
const restaurantCategories = computed(() => categories.value.filter((item) => item.restaurantId === selectedRestaurantId.value));

function mapManager(raw: unknown): RestaurantManager | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  return {
    id: String(item.id ?? ""),
    name: String(item.name ?? ""),
    phone: String(item.phone ?? ""),
    email: String(item.email ?? ""),
    role: String(item.role ?? ""),
    isActive: item.isActive === true,
    plainPassword: item.plainPassword ? String(item.plainPassword) : undefined,
  };
}

function mapRestaurant(raw: Record<string, unknown>): RestaurantItem { return { id: String(raw.id ?? ""), name: String(raw.name ?? ""), description: String(raw.description ?? ""), categoryId: String(raw.categoryId ?? ""), categoryLabel: String(raw.categoryLabel ?? ""), deliveryMinutes: Number(raw.deliveryMinutes ?? 0), deliveryFee: Number(raw.deliveryFee ?? 0), imageUrl: String(raw.imageUrl ?? ""), accentColor: String(raw.accentColor ?? "#0D47A1"), icon: String(raw.icon ?? "restaurant_rounded"), tags: Array.isArray(raw.tags) ? raw.tags.map((item) => String(item)) : [], isOpen: raw.isOpen !== false, isActive: raw.isActive !== false, isPopular: raw.isPopular === true, isRecommended: raw.isRecommended === true, isNearby: raw.isNearby === true, ownerUserId: String(raw.ownerUserId ?? ""), manager: mapManager(raw.manager) }; }
function mapCategory(raw: Record<string, unknown>): CategoryItem { return { id: String(raw.id ?? ""), restaurantId: raw.restaurantId ? String(raw.restaurantId) : null, name: String(raw.name ?? ""), icon: String(raw.icon ?? ""), color: String(raw.color ?? "#0D47A1"), isActive: raw.isActive !== false }; }
function mapProduct(raw: Record<string, unknown>): ProductItem { return { id: String(raw.id ?? ""), restaurantId: String(raw.restaurantId ?? ""), categoryId: raw.categoryId ? String(raw.categoryId) : null, name: String(raw.name ?? ""), description: String(raw.description ?? ""), imageUrl: String(raw.imageUrl ?? ""), price: Number(raw.price ?? 0), originalPrice: raw.originalPrice == null ? null : Number(raw.originalPrice), isAvailable: raw.isAvailable !== false, isPopular: raw.isPopular === true, isActive: raw.isActive !== false, tags: Array.isArray(raw.tags) ? raw.tags.map((item) => String(item)) : [] }; }
function resetMessages() { error.value = ""; success.value = ""; }
function tagsFromText(value: string) { return value.split(",").map((item) => item.trim()).filter(Boolean); }
function amount(value: number) { return new Intl.NumberFormat("fr-FR").format(value) + " F CFA"; }
function resetCategoryForm() { editingCategoryId.value = ""; categoryForm.value = { name: "", icon: "restaurant_rounded", color: "#0D47A1" }; }
function resetProductForm() { editingProductId.value = ""; productForm.value = { name: "", description: "", imageUrl: "", categoryId: "", price: 0, originalPrice: 0, tagsText: "", isAvailable: true, isPopular: false }; }
function onImageUpload(target: "createRestaurant" | "restaurant" | "product") {
  return (event: Event) => {
    void uploadImage(event, target);
  };
}

async function uploadImage(event: Event, target: "createRestaurant" | "restaurant" | "product") {
  const input = event.target as HTMLInputElement | null;
  const file = input?.files?.[0];
  if (!file) return;
  const formData = new FormData();
  formData.append("image", file);
  try {
    const response = await axios.post("/food-home/admin/uploads/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const url = String(response.data?.data?.url ?? "");
    if (!url) return;
    if (target === "createRestaurant") createRestaurantForm.value.imageUrl = url;
    if (target === "restaurant") restaurantForm.value.imageUrl = url;
    if (target === "product") productForm.value.imageUrl = url;
  } catch (err: any) {
    error.value = err?.message || "Impossible d'envoyer l'image.";
  } finally {
    if (input) input.value = "";
  }
}

async function loadRestaurants() {
  loading.value = true;
  resetMessages();
  try {
    const response = await axios.get("/food-home/admin/restaurants");
    restaurants.value = Array.isArray(response.data?.data) ? response.data.data.map((item: Record<string, unknown>) => mapRestaurant(item)) : [];
    if (!selectedRestaurantId.value && restaurants.value.length) selectedRestaurantId.value = restaurants.value[0].id;
  } catch (err: any) {
    error.value = err?.message || "Impossible de charger les restaurants.";
  } finally {
    loading.value = false;
  }
}

async function loadRestaurantContent() {
  if (!selectedRestaurantId.value) return;
  detailLoading.value = true;
  try {
    const [categoriesResponse, productsResponse] = await Promise.all([
      axios.get(`/food-home/admin/restaurants/${selectedRestaurantId.value}/categories`),
      axios.get(`/food-home/admin/restaurants/${selectedRestaurantId.value}/products`),
    ]);
    categories.value = Array.isArray(categoriesResponse.data?.data) ? categoriesResponse.data.data.map((item: Record<string, unknown>) => mapCategory(item)) : [];
    products.value = Array.isArray(productsResponse.data?.data) ? productsResponse.data.data.map((item: Record<string, unknown>) => mapProduct(item)) : [];
    if (selectedRestaurant.value) {
      restaurantForm.value = {
        id: selectedRestaurant.value.id,
        name: selectedRestaurant.value.name,
        description: selectedRestaurant.value.description,
        categoryId: selectedRestaurant.value.categoryId,
        categoryLabel: selectedRestaurant.value.categoryLabel,
        imageUrl: selectedRestaurant.value.imageUrl,
        accentColor: selectedRestaurant.value.accentColor,
        icon: selectedRestaurant.value.icon,
        deliveryMinutes: selectedRestaurant.value.deliveryMinutes,
        deliveryFee: selectedRestaurant.value.deliveryFee,
        tagsText: selectedRestaurant.value.tags.join(", "),
        isOpen: selectedRestaurant.value.isOpen,
        isActive: selectedRestaurant.value.isActive,
        isPopular: selectedRestaurant.value.isPopular,
        isRecommended: selectedRestaurant.value.isRecommended,
        isNearby: selectedRestaurant.value.isNearby,
      };
    }
  } catch (err: any) {
    error.value = err?.message || "Impossible de charger les donnees du restaurant.";
  } finally {
    detailLoading.value = false;
  }
}

watch(selectedRestaurantId, () => { void loadRestaurantContent(); assignManagerEmail.value = ""; });

async function createRestaurant() {
  saving.value = true;
  resetMessages();
  try {
    await axios.post("/food-home/admin/restaurants", createRestaurantForm.value);
    success.value = "Restaurant cree.";
    createRestaurantForm.value = { name: "", description: "", categoryId: "restaurant", categoryLabel: "Restaurant", imageUrl: "", accentColor: "#0D47A1", icon: "restaurant_rounded", deliveryMinutes: 25, deliveryFee: 1000, managerName: "", managerEmail: "", managerPhone: "", managerPassword: "" };
    generatedManagers.value = [];
    await loadRestaurants();
  } catch (err: any) {
    error.value = err?.response?.data?.message || err?.message || "Impossible de creer le restaurant.";
  } finally {
    saving.value = false;
  }
}

async function createMissingManagers() {
  saving.value = true;
  resetMessages();
  try {
    const response = await axios.post("/food-home/admin/restaurants/ensure-managers");
    generatedManagers.value = Array.isArray(response.data?.data)
      ? response.data.data.map((item: Record<string, unknown>) => ({
          restaurantId: String(item.restaurantId ?? ""),
          restaurantName: String(item.restaurantName ?? ""),
          manager: mapManager(item.manager)!,
        }))
      : [];
    success.value = generatedManagers.value.length
      ? "Managers generes pour les restaurants sans proprietaire."
      : "Tous les restaurants ont deja un manager.";
    await loadRestaurants();
    await loadRestaurantContent();
  } catch (err: any) {
    error.value = err?.response?.data?.message || err?.message || "Impossible de generer les managers.";
  } finally {
    saving.value = false;
  }
}

async function assignManager() {
  if (!selectedRestaurantId.value || !assignManagerEmail.value.trim()) return;
  saving.value = true;
  resetMessages();
  try {
    await axios.post(`/food-home/admin/restaurants/${selectedRestaurantId.value}/assign-manager`, {
      managerEmail: assignManagerEmail.value.trim(),
    });
    success.value = "Manager assigne au restaurant.";
    assignManagerEmail.value = "";
    generatedManagers.value = [];
    await loadRestaurants();
    await loadRestaurantContent();
  } catch (err: any) {
    error.value = err?.response?.data?.message || err?.message || "Impossible d'assigner le manager.";
  } finally {
    saving.value = false;
  }
}

async function saveRestaurant() {
  if (!restaurantForm.value.id) return;
  saving.value = true;
  resetMessages();
  try {
    await axios.patch(`/food-home/admin/restaurants/${restaurantForm.value.id}`, {
      ...restaurantForm.value,
      tags: tagsFromText(restaurantForm.value.tagsText),
    });
    success.value = "Profil restaurant mis a jour.";
    await loadRestaurants();
    await loadRestaurantContent();
  } catch (err: any) {
    error.value = err?.message || "Impossible de mettre a jour le restaurant.";
  } finally {
    saving.value = false;
  }
}

function editCategory(item: CategoryItem) {
  editingCategoryId.value = item.id;
  categoryForm.value = { name: item.name, icon: item.icon, color: item.color };
}

async function saveCategory() {
  if (!selectedRestaurantId.value) return;
  saving.value = true;
  resetMessages();
  try {
    if (editingCategoryId.value) {
      await axios.patch(`/food-home/admin/restaurants/${selectedRestaurantId.value}/categories/${editingCategoryId.value}`, categoryForm.value);
      success.value = "Categorie mise a jour.";
    } else {
      await axios.post(`/food-home/admin/restaurants/${selectedRestaurantId.value}/categories`, categoryForm.value);
      success.value = "Categorie creee.";
    }
    resetCategoryForm();
    await loadRestaurantContent();
  } catch (err: any) {
    error.value = err?.message || "Impossible d'enregistrer la categorie.";
  } finally {
    saving.value = false;
  }
}

async function removeCategory(item: CategoryItem) {
  if (!window.confirm(`Archiver la categorie "${item.name}" ?`)) return;
  resetMessages();
  try {
    await axios.delete(`/food-home/admin/restaurants/${selectedRestaurantId.value}/categories/${item.id}`);
    success.value = "Categorie archivee.";
    await loadRestaurantContent();
  } catch (err: any) {
    error.value = err?.message || "Impossible de supprimer la categorie.";
  }
}

async function restoreCategory(item: CategoryItem) {
  resetMessages();
  try {
    await axios.patch(`/food-home/admin/restaurants/${selectedRestaurantId.value}/categories/${item.id}`, {
      isActive: true,
    });
    success.value = "Categorie restauree.";
    await loadRestaurantContent();
  } catch (err: any) {
    error.value = err?.message || "Impossible de restaurer la categorie.";
  }
}

function editProduct(item: ProductItem) {
  editingProductId.value = item.id;
  productForm.value = { name: item.name, description: item.description, imageUrl: item.imageUrl, categoryId: item.categoryId ?? "", price: item.price, originalPrice: item.originalPrice ?? 0, tagsText: item.tags.join(", "), isAvailable: item.isAvailable, isPopular: item.isPopular };
}

async function saveProduct() {
  if (!selectedRestaurantId.value) return;
  saving.value = true;
  resetMessages();
  try {
    const payload = { ...productForm.value, categoryId: productForm.value.categoryId || null, originalPrice: productForm.value.originalPrice > 0 ? productForm.value.originalPrice : null, tags: tagsFromText(productForm.value.tagsText) };
    if (editingProductId.value) {
      await axios.patch(`/food-home/admin/restaurants/${selectedRestaurantId.value}/products/${editingProductId.value}`, payload);
      success.value = "Menu mis a jour.";
    } else {
      await axios.post(`/food-home/admin/restaurants/${selectedRestaurantId.value}/products`, payload);
      success.value = "Menu cree.";
    }
    resetProductForm();
    await loadRestaurantContent();
  } catch (err: any) {
    error.value = err?.message || "Impossible d'enregistrer le menu.";
  } finally {
    saving.value = false;
  }
}

async function removeProduct(item: ProductItem) {
  if (!window.confirm(`Archiver le menu "${item.name}" ?`)) return;
  resetMessages();
  try {
    await axios.delete(`/food-home/admin/restaurants/${selectedRestaurantId.value}/products/${item.id}`);
    success.value = "Menu archive.";
    await loadRestaurantContent();
  } catch (err: any) {
    error.value = err?.message || "Impossible de supprimer le menu.";
  }
}

async function restoreProduct(item: ProductItem) {
  resetMessages();
  try {
    await axios.patch(`/food-home/admin/restaurants/${selectedRestaurantId.value}/products/${item.id}`, {
      isActive: true,
    });
    success.value = "Menu restaure.";
    await loadRestaurantContent();
  } catch (err: any) {
    error.value = err?.message || "Impossible de restaurer le menu.";
  }
}

onMounted(async () => {
  await loadRestaurants();
  await loadRestaurantContent();
});
</script>

<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
    <p v-if="error" class="mt-4 text-sm text-red-600">{{ error }}</p>
    <p v-if="success" class="mt-4 text-sm text-emerald-600">{{ success }}</p>

    <Card class="mt-4 shadow-md">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-lg font-semibold">Creer un restaurant</h2>
        <Button :disabled="saving" variant="outline" @click="createMissingManagers">Generer les managers manquants</Button>
      </div>
      <div class="mt-4 grid grid-cols-12 gap-4">
        <div class="col-span-12 md:col-span-4"><Label>Nom</Label><Input v-model="createRestaurantForm.name" class="mt-1" /></div>
        <div class="col-span-12 md:col-span-4"><Label>Email manager</Label><Input v-model="createRestaurantForm.managerEmail" class="mt-1" /></div>
        <div class="col-span-12 md:col-span-2"><Label>Telephone</Label><Input v-model="createRestaurantForm.managerPhone" class="mt-1" /></div>
        <div class="col-span-12 md:col-span-2"><Label>Mot de passe</Label><Input v-model="createRestaurantForm.managerPassword" type="password" class="mt-1" /></div>
        <div class="col-span-12 md:col-span-6"><Label>Description</Label><Textarea v-model="createRestaurantForm.description" class="mt-1 min-h-[96px]" /></div>
        <div class="col-span-12 md:col-span-3"><Label>Image URL</Label><Input v-model="createRestaurantForm.imageUrl" class="mt-1" /><Input class="mt-2" type="file" accept="image/*" @change="onImageUpload('createRestaurant')" /></div>
        <div class="col-span-6 md:col-span-1"><Label>Min</Label><Input v-model="createRestaurantForm.deliveryMinutes" type="number" class="mt-1" /></div>
        <div class="col-span-6 md:col-span-2"><Label>Frais</Label><Input v-model="createRestaurantForm.deliveryFee" type="number" class="mt-1" /></div>
      </div>
      <div class="mt-4"><Button :disabled="saving" @click="createRestaurant">{{ saving ? "Enregistrement..." : "Creer le restaurant" }}</Button></div>
      <div v-if="generatedManagers.length" class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div class="text-sm font-semibold text-emerald-700">Identifiants generes</div>
        <div class="mt-3 space-y-3">
          <div v-for="item in generatedManagers" :key="item.restaurantId" class="rounded-lg bg-white p-3 text-sm">
            <div class="font-semibold">{{ item.restaurantName }}</div>
            <div>Email: {{ item.manager.email }}</div>
            <div>Telephone: {{ item.manager.phone }}</div>
            <div>Mot de passe: {{ item.manager.plainPassword }}</div>
          </div>
        </div>
      </div>
    </Card>

    <div class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card class="shadow-md">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold">Liste</h2>
          <Badge variant="secondary">{{ restaurants.length }}</Badge>
        </div>
        <div v-if="loading" class="text-sm text-muted-foreground">Chargement...</div>
        <div v-else class="space-y-3">
          <button v-for="restaurant in restaurants" :key="restaurant.id" class="w-full rounded-xl border p-4 text-left" :class="selectedRestaurantId === restaurant.id ? 'border-primary bg-lightprimary/20' : 'border-ld/70'" @click="selectedRestaurantId = restaurant.id">
            <div class="font-semibold">{{ restaurant.name }}</div>
            <div class="mt-1 text-sm text-muted-foreground">{{ restaurant.categoryLabel }}</div>
            <div class="mt-2 text-xs text-muted-foreground">{{ restaurant.deliveryMinutes }} min | {{ amount(restaurant.deliveryFee) }}</div>
            <div class="mt-2 text-xs" :class="restaurant.manager ? 'text-emerald-600' : 'text-amber-600'">
              {{ restaurant.manager ? `Manager: ${restaurant.manager.email}` : 'Aucun manager assigne' }}
            </div>
          </button>
        </div>
      </Card>

      <div class="space-y-4" v-if="selectedRestaurant">
        <Card class="shadow-md">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold">Profil restaurant</h2>
            <Badge :variant="selectedRestaurant.isActive ? 'success' : 'warning'">{{ selectedRestaurant.isActive ? "Actif" : "Inactif" }}</Badge>
          </div>
          <div class="mb-4 rounded-xl border border-ld/70 bg-slate-50 p-4">
            <div class="text-sm font-semibold">Manager du restaurant</div>
            <div class="mt-1 text-sm text-muted-foreground" v-if="selectedRestaurant.manager">
              {{ selectedRestaurant.manager.name || 'Manager' }} | {{ selectedRestaurant.manager.email }} | {{ selectedRestaurant.manager.phone }}
            </div>
            <div class="mt-1 text-sm text-amber-600" v-else>
              Aucun manager n'est lie a ce restaurant.
            </div>
            <div class="mt-4 flex flex-col gap-3 md:flex-row">
              <Input v-model="assignManagerEmail" class="md:max-w-sm" placeholder="Email d'un compte existant" />
              <Button :disabled="saving || !assignManagerEmail.trim()" variant="outline" @click="assignManager">Assigner ce manager</Button>
            </div>
          </div>
          <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12 md:col-span-6"><Label>Nom</Label><Input v-model="restaurantForm.name" class="mt-1" /></div>
            <div class="col-span-12 md:col-span-3"><Label>Famille</Label><Input v-model="restaurantForm.categoryLabel" class="mt-1" /></div>
            <div class="col-span-12 md:col-span-3"><Label>Category ID</Label><Input v-model="restaurantForm.categoryId" class="mt-1" /></div>
            <div class="col-span-12"><Label>Description</Label><Textarea v-model="restaurantForm.description" class="mt-1 min-h-[96px]" /></div>
            <div class="col-span-12 md:col-span-4"><Label>Image URL</Label><Input v-model="restaurantForm.imageUrl" class="mt-1" /><Input class="mt-2" type="file" accept="image/*" @change="onImageUpload('restaurant')" /></div>
            <div class="col-span-12 md:col-span-2"><Label>Couleur</Label><Input v-model="restaurantForm.accentColor" class="mt-1" /></div>
            <div class="col-span-12 md:col-span-2"><Label>Icone</Label><Input v-model="restaurantForm.icon" class="mt-1" /></div>
            <div class="col-span-6 md:col-span-2"><Label>Min</Label><Input v-model="restaurantForm.deliveryMinutes" type="number" class="mt-1" /></div>
            <div class="col-span-6 md:col-span-2"><Label>Frais</Label><Input v-model="restaurantForm.deliveryFee" type="number" class="mt-1" /></div>
            <div class="col-span-12"><Label>Tags</Label><Input v-model="restaurantForm.tagsText" class="mt-1" /></div>
            <div class="col-span-12 flex flex-wrap gap-4 text-sm">
              <label class="flex items-center gap-2"><input v-model="restaurantForm.isOpen" type="checkbox">Ouvert</label>
              <label class="flex items-center gap-2"><input v-model="restaurantForm.isActive" type="checkbox">Actif</label>
              <label class="flex items-center gap-2"><input v-model="restaurantForm.isPopular" type="checkbox">Populaire</label>
              <label class="flex items-center gap-2"><input v-model="restaurantForm.isRecommended" type="checkbox">Recommande</label>
              <label class="flex items-center gap-2"><input v-model="restaurantForm.isNearby" type="checkbox">Proche</label>
            </div>
          </div>
          <div class="mt-4"><Button :disabled="saving" @click="saveRestaurant">Enregistrer le profil</Button></div>
        </Card>

        <div class="grid grid-cols-1 gap-4 2xl:grid-cols-2">
          <Card class="shadow-md">
            <h3 class="text-lg font-semibold">Categories</h3>
            <div class="mt-4 grid grid-cols-12 gap-4">
              <div class="col-span-12 md:col-span-5"><Label>Nom</Label><Input v-model="categoryForm.name" class="mt-1" /></div>
              <div class="col-span-12 md:col-span-4"><Label>Icone</Label><Input v-model="categoryForm.icon" class="mt-1" /></div>
              <div class="col-span-12 md:col-span-3"><Label>Couleur</Label><Input v-model="categoryForm.color" class="mt-1" /></div>
            </div>
            <div class="mt-4 flex gap-2">
              <Button :disabled="saving" @click="saveCategory">{{ editingCategoryId ? "Mettre a jour" : "Ajouter" }}</Button>
              <Button v-if="editingCategoryId" variant="outline" @click="resetCategoryForm">Annuler</Button>
            </div>
            <Table class="mt-4">
              <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Couleur</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                <TableRow v-if="detailLoading"><TableCell colspan="3" class="text-center text-muted-foreground">Chargement...</TableCell></TableRow>
                <TableRow v-for="item in restaurantCategories" :key="item.id">
                  <TableCell>{{ item.name }}</TableCell>
                  <TableCell><span class="inline-flex items-center gap-2"><span class="h-3 w-3 rounded-full" :style="{ backgroundColor: item.color }"></span>{{ item.color }}</span></TableCell>
                  <TableCell><div class="flex gap-2"><Button variant="outline" size="sm" @click="editCategory(item)">Modifier</Button><Button v-if="item.isActive" variant="outline" size="sm" @click="removeCategory(item)">Archiver</Button><Button v-else variant="outline" size="sm" @click="restoreCategory(item)">Restaurer</Button></div></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>

          <Card class="shadow-md">
            <h3 class="text-lg font-semibold">Menus</h3>
            <div class="mt-4 grid grid-cols-12 gap-4">
              <div class="col-span-12 md:col-span-7"><Label>Nom</Label><Input v-model="productForm.name" class="mt-1" /></div>
              <div class="col-span-12 md:col-span-5"><Label>Categorie</Label><select v-model="productForm.categoryId" class="mt-1 h-10 w-full rounded-lg border border-ld bg-transparent px-3 text-sm"><option value="">Sans categorie</option><option v-for="item in categories" :key="item.id" :value="item.id">{{ item.name }}</option></select></div>
              <div class="col-span-12"><Label>Description</Label><Textarea v-model="productForm.description" class="mt-1 min-h-[96px]" /></div>
              <div class="col-span-12"><Label>Image URL</Label><Input v-model="productForm.imageUrl" class="mt-1" /><Input class="mt-2" type="file" accept="image/*" @change="onImageUpload('product')" /></div>
              <div class="col-span-6 md:col-span-3"><Label>Prix</Label><Input v-model="productForm.price" type="number" class="mt-1" /></div>
              <div class="col-span-6 md:col-span-3"><Label>Ancien prix</Label><Input v-model="productForm.originalPrice" type="number" class="mt-1" /></div>
              <div class="col-span-12 md:col-span-6"><Label>Tags</Label><Input v-model="productForm.tagsText" class="mt-1" /></div>
              <div class="col-span-12 flex gap-4 text-sm">
                <label class="flex items-center gap-2"><input v-model="productForm.isAvailable" type="checkbox">Disponible</label>
                <label class="flex items-center gap-2"><input v-model="productForm.isPopular" type="checkbox">Populaire</label>
              </div>
            </div>
            <div class="mt-4 flex gap-2">
              <Button :disabled="saving" @click="saveProduct">{{ editingProductId ? "Mettre a jour" : "Ajouter" }}</Button>
              <Button v-if="editingProductId" variant="outline" @click="resetProductForm">Annuler</Button>
            </div>
            <Table class="mt-4">
              <TableHeader><TableRow><TableHead>Menu</TableHead><TableHead>Prix</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                <TableRow v-if="detailLoading"><TableCell colspan="3" class="text-center text-muted-foreground">Chargement...</TableCell></TableRow>
                <TableRow v-for="item in products" :key="item.id">
                  <TableCell><div class="font-medium">{{ item.name }}</div><div class="text-xs text-muted-foreground">{{ item.description }}</div></TableCell>
                  <TableCell><div>{{ amount(item.price) }}</div><div class="text-xs text-muted-foreground">{{ item.isActive ? "Actif" : "Archive" }}</div></TableCell>
                  <TableCell><div class="flex gap-2"><Button variant="outline" size="sm" @click="editProduct(item)">Modifier</Button><Button v-if="item.isActive" variant="outline" size="sm" @click="removeProduct(item)">Archiver</Button><Button v-else variant="outline" size="sm" @click="restoreProduct(item)">Restaurer</Button></div></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
