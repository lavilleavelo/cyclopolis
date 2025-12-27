<template>
  <div class="relative lg:container mx-auto">
    <button
      class="hidden lg:flex absolute top-4 right-4 z-10 bg-white hover:bg-gray-100 text-gray-800 px-4 py-2 rounded-lg shadow-md transition-all items-center gap-2"
      title="Intégrer sur votre site"
      @click="showDialog = true"
    >
      <Icon name="mdi:share-variant" class="w-5 h-5" />
      <span class="text-sm font-medium">Partager</span>
    </button>

    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showDialog"
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          @click="showDialog = false"
        >
          <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" @click.stop>
            <div class="flex justify-between items-start mb-4">
              <h2 class="text-xl font-bold text-gray-900">Partager cette page</h2>
              <button class="text-gray-400 hover:text-gray-600 transition-colors" @click="showDialog = false">
                <Icon name="mdi:close" class="w-6 h-6" />
              </button>
            </div>

            Vous pouvez partager cette page en utilisant le lien suivant :
            <div class="mb-6">
              <div class="relative">
                <pre
                  class="bg-gray-50 border border-gray-300 rounded p-4 overflow-x-auto text-sm"
                ><code>{{ shareUrl }}</code></pre>
                <button
                  class="absolute top-2 right-2 bg-white hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded shadow text-sm transition-all flex items-center gap-1.5"
                  :class="{ 'bg-green-50 text-green-700': urlCopied }"
                  @click="copyUrlToClipboard"
                >
                  <Icon :name="urlCopied ? 'mdi:check' : 'mdi:content-copy'" class="w-4 h-4" />
                  {{ urlCopied ? 'Copié !' : 'Copier' }}
                </button>
              </div>
            </div>

            <h2 class="text-xl font-bold text-gray-900">Intégrer sur votre site</h2>
            <div class="mb-4">
              <p class="text-gray-700 mb-4">
                Copiez le code ci-dessous pour intégrer la comparaison entre le plan prévu et le plan réel 2026 sur
                votre site web.
              </p>

              <div class="relative">
                <pre
                  class="bg-gray-50 border border-gray-300 rounded p-4 overflow-x-auto text-sm"
                ><code>{{ iframeCode }}</code></pre>
                <button
                  class="absolute top-2 right-2 bg-white hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded shadow text-sm transition-all flex items-center gap-1.5"
                  :class="{ 'bg-green-50 text-green-700': copied }"
                  @click="copyEmbedUrlToClipboard"
                >
                  <Icon :name="copied ? 'mdi:check' : 'mdi:content-copy'" class="w-4 h-4" />
                  {{ copied ? 'Copié !' : 'Copier' }}
                </button>
              </div>
            </div>

            <iframe
              title="Carte montrant la réalisation des voies lyonnaises prévues dans le plan officiel 2026. Créé La Ville à Vélo, disponible sur cyclopolis.fr"
              :src="embedUrl"
              width="100%"
              height="400px"
              frameborder="0"
              allowfullscreen
              class="mt-6 border border-gray-300 rounded"
            ></iframe>
          </div>
        </div>
      </Transition>
    </Teleport>

    <div class="text-center my-4 text-gray-600 text-xs">
      Glisser la barre verticale pour comparer projet prévu et projet réel 2026
    </div>

    <BeforeAfterImageSlider
      before-image="https://cyclopolis.lavilleavelo.org/Carte_VL2026_prevu.png"
      after-image="https://cyclopolis.lavilleavelo.org/Carte_VL2026_reel.png"
      :before-alt="`Plan prévu des ${getRevName()}`"
      :after-alt="`Plan réel des ${getRevName()}`"
      before-label="Prévu"
      after-label="Réel"
      height="90vh"
    />
  </div>
</template>

<script setup lang="ts">
const { getRevName } = useConfig();

const showDialog = ref(false);
const copied = ref(false);
const urlCopied = ref(false);

const embedUrl = computed(() => `${window.location.origin}/plan-officiel/embed`);
const shareUrl = computed(() => `${window.location.origin}/plan-officiel`);
const iframeCode = computed(
  () =>
    `<iframe
    src="${embedUrl.value}" width="100%" height="800px" frameborder="0" allowfullscreen
    style="border-radius: 8px; border-color: #ccc; border-width: 1px"
    title="Carte montrant la réalisation des voies lyonnaises prévues dans le plan officiel 2026. Créé La Ville à Vélo, disponible sur cyclopolis.fr">
</iframe>`,
);

const copyToClipboard = async (text: string, copiedRef: Ref<boolean>) => {
  try {
    await navigator.clipboard.writeText(text);
    copiedRef.value = true;
    setTimeout(() => {
      copiedRef.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

const copyUrlToClipboard = () => copyToClipboard(shareUrl.value, urlCopied);
const copyEmbedUrlToClipboard = () => copyToClipboard(iframeCode.value, copied);

const description = `Découvrez le plan officiel des ${getRevName()}, le futur réseau vélo lyonnais de 260km. Comparez le plan prévu et le plan réel 2026.`;
const COVER_IMAGE_URL = 'https://cyclopolis.lavilleavelo.org/plan-officiel-preview.jpg';

useHead({
  title: `Plan des ${getRevName()}`,
  meta: [
    // description
    { hid: 'description', name: 'description', content: description },
    { hid: 'og:description', property: 'og:description', content: description },
    { hid: 'twitter:description', name: 'twitter:description', content: description },
    // cover image
    { hid: 'og:image', property: 'og:image', content: COVER_IMAGE_URL },
    { hid: 'twitter:image', name: 'twitter:image', content: COVER_IMAGE_URL },
  ],
});
</script>
