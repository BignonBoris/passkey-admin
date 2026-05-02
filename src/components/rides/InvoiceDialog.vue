<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { Icon } from "@iconify/vue";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatAmount } from "@/utils/format";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logoUrl from "@/assets/images/logos/logo1.png";

interface Props {
  open: boolean;
  ride: any;
  client: any;
  driver: any;
}

const props = defineProps<Props>();
const emit = defineEmits(["update:open"]);

const invoiceRef = ref<HTMLElement | null>(null);
const downloading = ref(false);

const invoiceNumber = computed(() => {
  if (props.ride?.publicCode) return String(props.ride.publicCode);
  if (!props.ride?.id) return "INV-0000";
  const year = new Date(props.ride.createdAt).getFullYear();
  return `INV-${year}-${props.ride.id.substring(0, 8).toUpperCase()}`;
});

const formatDate = (date: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
};

const resolvePaymentLabel = (method?: string) => {
  const normalized = String(method || "CASH").toUpperCase();
  if (normalized === "MOBILE_MONEY") return "Mobile money";
  if (normalized === "CARD" || normalized === "STRIPE") return "Stripe";
  return "Espèces";
};

const downloadPDF = async () => {
  if (downloading.value) return;
  
  const element = invoiceRef.value;
  if (!element) {
    alert("Erreur: L'élément de la facture est introuvable.");
    return;
  }

  downloading.value = true;
  
  try {
    // Wait for everything to be truly ready
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Capture the element using html2canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: true,
      onclone: (clonedDoc) => {
        // RADICAL FIX for Tailwind 4 & html2canvas: 
        // Iterate through ALL elements and replace any 'oklch' color with safe fallbacks
        const els = clonedDoc.getElementsByTagName("*");
        for (let i = 0; i < els.length; i++) {
          const el = els[i] as HTMLElement;
          const styles = window.getComputedStyle(el);
          
          ['color', 'background-color', 'border-color', 'fill', 'stroke'].forEach(prop => {
            const val = styles.getPropertyValue(prop);
            if (val && val.includes('oklch')) {
              // Extract values if it's oklch(...) - but simplest is to just force plain colors
              // for safe rendering in html2canvas
              if (prop === 'color') el.style.setProperty(prop, '#1e293b', 'important');
              else if (prop === 'background-color') {
                if (val.includes('0 0 0 / 0') || val.includes('transparent')) {
                  el.style.setProperty(prop, 'transparent', 'important');
                } else {
                  el.style.setProperty(prop, '#ffffff', 'important');
                }
              }
              else el.style.setProperty(prop, 'transparent', 'important');
            }
          });
        }
      }
    });

    if (!canvas || canvas.width === 0) {
      throw new Error("La capture de la facture a produit une image vide.");
    }

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Convert canvas pixels to mm (roughly 96 dpi -> 1px = 0.264583 mm)
    const imgWidthMm = (canvas.width / 2) * 0.264583;
    const imgHeightMm = (canvas.height / 2) * 0.264583;
    
    const ratio = Math.min(pdfWidth / imgWidthMm, pdfHeight / imgHeightMm);
    const finalWidth = imgWidthMm * ratio;
    const finalHeight = imgHeightMm * ratio;
    
    const x = (pdfWidth - finalWidth) / 2;
    const y = 5; // Top margin

    pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);
    pdf.save(`${invoiceNumber.value}.pdf`);
  } catch (error) {
    console.error("PDF generation failed:", error);
    alert("Erreur lors de la génération du PDF: " + (error instanceof Error ? error.message : "Erreur inconnue. Vérifiez la console."));
  } finally {
    downloading.value = false;
  }
};
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[650px] max-h-[90vh] overflow-y-auto custom-scrollbar p-0 bg-[#F9FAFB] border-none shadow-2xl">
      <DialogHeader class="p-6 pb-2 border-b bg-white">
        <DialogTitle class="text-xl font-bold text-slate-800 flex items-center justify-between">
          <span class="flex items-center gap-2">
            <Icon icon="solar:bill-list-bold-duotone" class="text-[#0D47A1]" width="24" height="24" />
            Aperçu de la facture
          </span>
          <Button variant="ghost" size="icon" @click="emit('update:open', false)" class="h-8 w-8">
            <Icon icon="solar:close-circle-bold" width="20" height="20" />
          </Button>
        </DialogTitle>
      </DialogHeader>

      <div class="px-6 py-6 md:px-12 md:py-8 bg-[#F9FAFB]">
        <!-- Invoice Container for PDF Export -->
        <div id="invoice-capture-area" ref="invoiceRef" class="bg-white p-8 rounded-[20px] border border-[#e2e8f0] shadow-sm invoice-card" style="font-family: 'Inter', sans-serif; width: 100%; max-width: 550px; margin: 0 auto; color: #1e293b;">
          <!-- Header -->
          <div class="flex justify-between items-start mb-6">
            <div class="flex flex-col gap-1">
              <img :src="logoUrl" alt="PassKey" class="h-10 w-auto object-contain object-left mb-2" />
              <p class="text-xs font-medium tracking-tight" style="color: #64748b;">Document de livraison</p>
            </div>
            <div class="px-3 py-1.5 rounded-full border border-[#0d47a122]" style="background-color: #e7eefc;">
              <span class="text-[11px] font-bold uppercase tracking-wider" style="color: #0d47a1;">Facture</span>
            </div>
          </div>

          <!-- Metadata Section -->
          <div class="space-y-2 mb-8">
            <div class="flex items-start">
              <span class="w-24 text-xs font-bold" style="color: #64748b;">Numéro</span>
              <span class="text-xs font-medium" style="color: #1e293b;">{{ invoiceNumber }}</span>
            </div>
            <div class="flex items-start">
              <span class="w-24 text-xs font-bold" style="color: #64748b;">Date</span>
              <span class="text-xs font-medium" style="color: #1e293b;">{{ formatDate(ride?.createdAt) }}</span>
            </div>
            <div class="flex items-start">
              <span class="w-24 text-xs font-bold" style="color: #64748b;">Référence</span>
              <span class="text-xs font-medium" style="color: #1e293b;">{{ ride?.vehicleType || 'Livraison' }}</span>
            </div>
            <div class="flex items-center mt-3">
              <span class="w-24 text-xs font-bold" style="color: #64748b;">Statut</span>
              <div :style="{
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.025em',
                backgroundColor: ride?.status === 'COMPLETED' ? '#ecfdf5' : ride?.status === 'CANCELLED' ? '#fef2f2' : '#fff7ed',
                color: ride?.status === 'COMPLETED' ? '#059669' : ride?.status === 'CANCELLED' ? '#dc2626' : '#ea580c',
                border: `1px solid ${ride?.status === 'COMPLETED' ? '#d1fae5' : ride?.status === 'CANCELLED' ? '#fee2e2' : '#ffedd5'}`
              }">
                {{ ride?.status === 'COMPLETED' ? 'Terminée' : ride?.status === 'CANCELLED' ? 'Annulée' : 'En cours' }}
              </div>
            </div>
          </div>

          <hr style="border: none; border-top: 1px solid #f1f5f9; margin-bottom: 24px;" />

          <!-- Details Section 1 -->
          <div class="space-y-4 mb-8">
            <h4 class="text-xs font-bold" style="color: #1e293b;">Détails de prestation</h4>
            <div class="space-y-2.5 pl-1">
              <div class="flex items-start">
                <span class="w-24 text-[11px] font-bold" style="color: #64748b;">Type</span>
                <span class="text-[11px]" style="color: #334155;">{{ ride?.vehicleType || 'Livraison' }}</span>
              </div>
              <div class="flex items-start">
                <span class="w-24 text-[11px] font-bold" style="color: #64748b;">Paiement</span>
                <span class="text-[11px]" style="color: #334155;">{{ resolvePaymentLabel(ride?.paymentMethod) }}</span>
              </div>
              <div class="flex items-start">
                <span class="w-24 text-[11px] font-bold" style="color: #64748b;">Colis</span>
                <span class="text-[11px]" style="color: #334155;">{{ ride?.parcelNature || 'Non renseigné' }}</span>
              </div>
            </div>
          </div>

          <!-- Details Section 2 -->
          <div class="space-y-4 mb-8">
            <h4 class="text-xs font-bold" style="color: #1e293b;">Trajet et livreur</h4>
            <div class="space-y-3 pl-1">
              <div class="flex items-start">
                <span class="w-24 text-[11px] font-bold shrink-0" style="color: #64748b;">Départ</span>
                <span class="text-[11px] leading-relaxed" style="color: #334155;">{{ ride?.pickupAddress || 'Non renseigné' }}</span>
              </div>
              <div class="flex items-start">
                <span class="w-24 text-[11px] font-bold shrink-0" style="color: #64748b;">Arrivée</span>
                <span class="text-[11px] leading-relaxed" style="color: #334155;">{{ ride?.destinationAddress || 'Non renseigné' }}</span>
              </div>
              <div class="flex items-start">
                <span class="w-24 text-[11px] font-bold" style="color: #64748b;">Livreur</span>
                <span class="text-[11px] font-semibold" style="color: #1e293b;">{{ driver?.name || 'Non renseigné' }}</span>
              </div>
            </div>
          </div>

          <!-- Total Block -->
          <div class="p-4 rounded-2xl border border-[#d7e4f7] mb-6" style="background-color: #f7faff;">
            <div class="flex items-center justify-between">
              <span class="text-[12px] font-bold uppercase tracking-tight" style="color: #475569;">Total TTC</span>
              <span class="text-xl font-black" style="color: #0d47a1;">{{ formatAmount(ride?.price) }}</span>
            </div>
          </div>

          <!-- Payment Confirmed Info -->
          <div class="flex items-center gap-2 px-1">
            <span class="text-[11px] font-bold" style="color: #1e293b;">Paiement confirmé :</span>
            <span class="text-[11px] font-bold" style="color: #0d47a1;">Oui</span>
          </div>

          <!-- Divider & Footer -->
          <div class="mt-12 pt-6" style="border-top: 1px solid #f1f5f9;">
             <p class="text-[11px] font-medium" style="color: #64748b;">Merci pour votre confiance.</p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="p-6 bg-white border-t flex flex-col sm:flex-row gap-3">
        <Button variant="outline" class="flex-1 font-bold h-11 border-slate-200" @click="emit('update:open', false)">
          Fermer
        </Button>
        <Button :disabled="downloading" class="flex-1 h-11 bg-[#0D47A1] hover:bg-[#08306d] text-white font-bold gap-2 shadow-lg shadow-blue-900/10" @click="downloadPDF">
          <Icon v-if="downloading" icon="solar:restart-bold-duotone" class="animate-spin" />
          <Icon v-else icon="solar:download-square-bold-duotone" width="18" height="18" />
          {{ downloading ? 'Génération...' : 'Télécharger la facture' }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

/* We avoid modern CSS features like oklch() here because html2canvas doesn't support them */
.invoice-card {
  background-color: #ffffff !important;
  color: #1e293b !important; /* slate-800 */
}

.text-primary-invoice {
  color: #0d47a1 !important;
}

.bg-primary-light {
  background-color: #e7eefc !important;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #E2E8F0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #CBD5E1;
}
</style>
