<script setup lang="ts">
import { onMounted, ref } from "vue";
import axios from "@/utils/axios";
import BaseBreadcrumb from "@/components/shared/BaseBreadcrumb.vue";
import Card from "@/components/ui/card/Card.vue";
import Input from "@/components/ui/input/Input.vue";
import Label from "@/components/ui/label/Label.vue";
import Textarea from "@/components/ui/textarea/Textarea.vue";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface RestaurantItem { id: string; name: string; description: string; categoryId: string; categoryLabel: string; deliveryMinutes: number; deliveryFee: number; imageUrl: string; accentColor: string; icon: string; tags: string[]; isOpen: boolean; isActive: boolean; isPopular: boolean; isRecommended: boolean; isNearby: boolean; }
interface CategoryItem { id: string; restaurantId: string | null; name: string; icon: string; color: string; isActive: boolean; }
interface ProductItem { id: string; restaurantId: string; categoryId: string | null; name: string; description: string; imageUrl: string; price: number; originalPrice: number | null; isAvailable: boolean; isPopular: boolean; isActive: boolean; tags: string[]; }

const page = ref({ title: "Espace restaurant" });
const breadcrumbs = ref([{ text: "Restaurant", href: "#" }, { text: "Workspace", href: "/admin/restaurant/workspace" }]);
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const success = ref("");

const restaurant = ref<RestaurantItem | null>(null);
const categories = ref<CategoryItem[]>([]);
const products = ref<ProductItem[]>([]);
const editingCategoryId = ref("");
const editingProductId = ref("");

const restaurantForm = ref({ id: "", name: "", description: "", categoryId: "", categoryLabel: "", imageUrl: "", accentColor: "#0D47A1", icon: "restaurant_rounded", deliveryMinutes: 25, deliveryFee: 1000, tagsText: "", isOpen: true, isActive: true, isPopular: false, isRecommended: false, isNearby: false });
const categoryForm = ref({ name: "", icon: "restaurant_rounded", color: "#0D47A1" });
const productForm = ref({ name: "", description: "", imageUrl: "", categoryId: "", price: 0, originalPrice: 0, tagsText: "", isAvailable: true, isPopular: false });

function mapRestaurant(raw: Record<string, unknown>): RestaurantItem { return { id: String(raw.id ?? ""), name: String(raw.name ?? ""), description: String(raw.description ?? ""), categoryId: String(raw.categoryId ?? ""), categoryLabel: String(raw.categoryLabel ?? ""), deliveryMinutes: Number(raw.deliveryMinutes ?? 0), deliveryFee: Number(raw.deliveryFee ?? 0), imageUrl: String(raw.imageUrl ?? ""), accentColor: String(raw.accentColor ?? "#0D47A1"), icon: String(raw.icon ?? "restaurant_rounded"), tags: Array.isArray(raw.tags) ? raw.tags.map((item) => String(item)) : [], isOpen: raw.isOpen !== false, isActive: raw.isActive !== false, isPopular: raw.isPopular === true, isRecommended: raw.isRecommended === true, isNearby: raw.isNearby === true }; }
function mapCategory(raw: Record<string, unknown>): CategoryItem { return { id: String(raw.id ?? ""), restaurantId: raw.restaurantId ? String(raw.restaurantId) : null, name: String(raw.name ?? ""), icon: String(raw.icon ?? ""), color: String(raw.color ?? "#0D47A1"), isActive: raw.isActive !== false }; }
function mapProduct(raw: Record<string, unknown>): ProductItem { return { id: String(raw.id ?? ""), restaurantId: String(raw.restaurantId ?? ""), categoryId: raw.categoryId ? String(raw.categoryId) : null, name: String(raw.name ?? ""), description: String(raw.description ?? ""), imageUrl: String(raw.imageUrl ?? ""), price: Number(raw.price ?? 0), originalPrice: raw.originalPrice == null ? null : Number(raw.originalPrice), isAvailable: raw.isAvailable !== false, isPopular: raw.isPopular === true, isActive: raw.isActive !== false, tags: Array.isArray(raw.tags) ? raw.tags.map((item) => String(item)) : [] }; }
function tagsFromText(value: string) { return value.split(",").map((item) => item.trim()).filter(Boolean); }
function amount(value: number) { return new Intl.NumberFormat("fr-FR").format(value) + " F CFA"; }
function resetMessages() { error.value = ""; success.value = ""; }
function resetCategoryForm() { editingCategoryId.value = ""; categoryForm.value = { name: "", icon: "restaurant_rounded", color: "#0D47A1" }; }
function resetProductForm() { editingProductId.value = ""; productForm.value = { name: "", description: "", imageUrl: "", categoryId: "", price: 0, originalPrice: 0, tagsText: "", isAvailable: true, isPopular: false }; }
function onImageUpload(target: "restaurant" | "product") {
  return (event: Event) => {
    void uploadImage(event, target);
  };
}

async function uploadImage(event: Event, target: "restaurant" | "product") {
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
    if (target === "restaurant") restaurantForm.value.imageUrl = url;
    if (target === "product") productForm.value.imageUrl = url;
  } catch (err: any) {
    error.value = err?.message || "Impossible d'envoyer l'image.";
  } finally {
    if (input) input.value = "";
  }
}

async function loadWorkspace() {
  loading.value = true;
  resetMessages();
  try {
    const response = await axios.get("/food-home/restaurant/workspace");
    const data = response.data?.data ?? {};
    restaurant.value = data.restaurant ? mapRestaurant(data.restaurant as Record<string, unknown>) : null;
    categories.value = Array.isArray(data.categories) ? data.categories.map((item: Record<string, unknown>) => mapCategory(item)) : [];
    products.value = Array.isArray(data.products) ? data.products.map((item: Record<string, unknown>) => mapProduct(item)) : [];
    if (restaurant.value) {
      restaurantForm.value = { id: restaurant.value.id, name: restaurant.value.name, description: restaurant.value.description, categoryId: restaurant.value.categoryId, categoryLabel: restaurant.value.categoryLabel, imageUrl: restaurant.value.imageUrl, accentColor: restaurant.value.accentColor, icon: restaurant.value.icon, deliveryMinutes: restaurant.value.deliveryMinutes, deliveryFee: restaurant.value.deliveryFee, tagsText: restaurant.value.tags.join(", "), isOpen: restaurant.value.isOpen, isActive: restaurant.value.isActive, isPopular: restaurant.value.isPopular, isRecommended: restaurant.value.isRecommended, isNearby: restaurant.value.isNearby };
    }
  } catch (err: any) {
    error.value = err?.message || "Impossible de charger l'espace restaurant.";
  } finally {
    loading.value = false;
  }
}

async function saveRestaurant() {
  if (!restaurantForm.value.id) return;
  saving.value = true;
  resetMessages();
  try {
    await axios.patch(`/food-home/admin/restaurants/${restaurantForm.value.id}`, { ...restaurantForm.value, tags: tagsFromText(restaurantForm.value.tagsText) });
    success.value = "Profil restaurant mis a jour.";
    await loadWorkspace();
  } catch (err: any) {
    error.value = err?.message || "Impossible de mettre a jour le profil.";
  } finally {
    saving.value = false;
  }
}

function editCategory(item: CategoryItem) {
  editingCategoryId.value = item.id;
  categoryForm.value = { name: item.name, icon: item.icon, color: item.color };
}

async function saveCategory() {
  if (!restaurant.value) return;
  saving.value = true;
  resetMessages();
  try {
    if (editingCategoryId.value) {
      await axios.patch(`/food-home/admin/restaurants/${restaurant.value.id}/categories/${editingCategoryId.value}`, categoryForm.value);
      success.value = "Categorie mise a jour.";
    } else {
      await axios.post(`/food-home/admin/restaurants/${restaurant.value.id}/categories`, categoryForm.value);
      success.value = "Categorie creee.";
    }
    resetCategoryForm();
    await loadWorkspace();
  } catch (err: any) {
    error.value = err?.message || "Impossible d'enregistrer la categorie.";
  } finally {
    saving.value = false;
  }
}

async function removeCategory(item: CategoryItem) {
  if (!restaurant.value || !window.confirm(`Archiver la categorie "${item.name}" ?`)) return;
  resetMessages();
  try {
    await axios.delete(`/food-home/admin/restaurants/${restaurant.value.id}/categories/${item.id}`);
    success.value = "Categorie archivee.";
    await loadWorkspace();
  } catch (err: any) {
    error.value = err?.message || "Impossible de supprimer la categorie.";
  }
}

async function restoreCategory(item: CategoryItem) {
  if (!restaurant.value) return;
  resetMessages();
  try {
    await axios.patch(`/food-home/admin/restaurants/${restaurant.value.id}/categories/${item.id}`, {
      isActive: true,
    });
    success.value = "Categorie restauree.";
    await loadWorkspace();
  } catch (err: any) {
    error.value = err?.message || "Impossible de restaurer la categorie.";
  }
}

function editProduct(item: ProductItem) {
  editingProductId.value = item.id;
  productForm.value = { name: item.name, description: item.description, imageUrl: item.imageUrl, categoryId: item.categoryId ?? "", price: item.price, originalPrice: item.originalPrice ?? 0, tagsText: item.tags.join(", "), isAvailable: item.isAvailable, isPopular: item.isPopular };
}

async function saveProduct() {
  if (!restaurant.value) return;
  saving.value = true;
  resetMessages();
  try {
    const payload = { ...productForm.value, categoryId: productForm.value.categoryId || null, originalPrice: productForm.value.originalPrice > 0 ? productForm.value.originalPrice : null, tags: tagsFromText(productForm.value.tagsText) };
    if (editingProductId.value) {
      await axios.patch(`/food-home/admin/restaurants/${restaurant.value.id}/products/${editingProductId.value}`, payload);
      success.value = "Menu mis a jour.";
    } else {
      await axios.post(`/food-home/admin/restaurants/${restaurant.value.id}/products`, payload);
      success.value = "Menu cree.";
    }
    resetProductForm();
    await loadWorkspace();
  } catch (err: any) {
    error.value = err?.message || "Impossible d'enregistrer le menu.";
  } finally {
    saving.value = false;
  }
}

async function removeProduct(item: ProductItem) {
  if (!restaurant.value || !window.confirm(`Archiver le menu "${item.name}" ?`)) return;
  resetMessages();
  try {
    await axios.delete(`/food-home/admin/restaurants/${restaurant.value.id}/products/${item.id}`);
    success.value = "Menu archive.";
    await loadWorkspace();
  } catch (err: any) {
    error.value = err?.message || "Impossible de supprimer le menu.";
  }
}

async function restoreProduct(item: ProductItem) {
  if (!restaurant.value) return;
  resetMessages();
  try {
    await axios.patch(`/food-home/admin/restaurants/${restaurant.value.id}/products/${item.id}`, {
      isActive: true,
    });
    success.value = "Menu restaure.";
    await loadWorkspace();
  } catch (err: any) {
    error.value = err?.message || "Impossible de restaurer le menu.";
  }
}

onMounted(() => { void loadWorkspace(); });
</script>

<template>
  <div>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
    <p v-if="error" class="mt-4 text-sm text-red-600">{{ error }}</p>
    <p v-if="success" class="mt-4 text-sm text-emerald-600">{{ success }}</p>

    <Card v-if="restaurant" class="mt-4 shadow-md">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold">{{ restaurant.name }}</h2>
          <p class="text-sm text-muted-foreground">{{ restaurant.categoryLabel }}</p>
        </div>
        <Badge :variant="restaurant.isOpen ? 'success' : 'warning'">{{ restaurant.isOpen ? "Ouvert" : "Ferme" }}</Badge>
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
      <div class="mt-4"><Button :disabled="saving" @click="saveRestaurant">{{ saving ? "Enregistrement..." : "Enregistrer le profil" }}</Button></div>
    </Card>

    <div class="mt-4 grid grid-cols-1 gap-4 2xl:grid-cols-2" v-if="restaurant">
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
            <TableRow v-if="loading"><TableCell colspan="3" class="text-center text-muted-foreground">Chargement...</TableCell></TableRow>
            <TableRow v-for="item in categories.filter((entry) => entry.restaurantId === restaurant?.id)" :key="item.id">
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
            <TableRow v-if="loading"><TableCell colspan="3" class="text-center text-muted-foreground">Chargement...</TableCell></TableRow>
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
</template>
