<template>
  <Dialog :open="open" class="relative z-50" @close="emit('close')">
    <div class="fixed inset-0 bg-black/40" aria-hidden="true" />
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel class="relative w-full max-w-2xl rounded-lg bg-white p-6 max-h-[85vh] overflow-y-auto">
        <button
          type="button"
          class="absolute top-2 right-2 rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          @click="emit('close')"
        >
          <Icon name="mdi:close" class="h-5 w-5" />
        </button>
        <DialogTitle class="text-xl font-bold text-gray-900 pr-8"> Méthodologie de l'indice </DialogTitle>
        <div class="mt-4 space-y-3 text-sm text-gray-700 leading-6">
          <p>
            L'indice est construit sur l'année 2019 (base 100) à partir des compteurs {{ kindLabel }}
            de l'agglomération.
          </p>
          <p>
            <strong>Filtre de disponibilité&nbsp;:</strong> pour chaque année comparée à 2019, on ne retient que les
            compteurs ayant fonctionné au moins 6 mois en commun avec l'année de référence ({{ counterCountText }}).
          </p>
          <p>
            <strong>Redressement des mois en panne&nbsp;:</strong> pour comparer une année <em>Y</em> à 2019, on
            n'additionne que les mois où le compteur a tourné <em>à la fois</em> en 2019 et à <em>l'année Y</em>.
          </p>

          <details class="group">
            <summary class="cursor-pointer text-gray-900 select-none flex items-center gap-1">
              <Icon
                name="mdi:chevron-right"
                class="text-xl text-gray-500 group-open:rotate-90 transition-transform -ml-1"
              />
              Exemple d'un compteur en panne
            </summary>
            <div class="mt-2 text-sm text-gray-600 pl-6 border-l-2 border-gray-100 ml-1">
              <p class="mb-2 text-gray-700">
                Imaginons un compteur qui enregistre 1 000 passages par mois de façon parfaitement stable.
              </p>
              <ul class="list-disc pl-5 space-y-1 mb-3 text-gray-700">
                <li><strong>En 2019&nbsp;:</strong> 12 000 passages sur l'année.</li>
                <li>
                  <strong>En 2023&nbsp;:</strong> Il tombe en panne en novembre et décembre. Il n'enregistre que 10 000
                  passages sur 10 mois.
                </li>
              </ul>
              <p class="mb-2">
                <strong>Sans redressement :</strong> On comparerait 10 000 à 12 000, ce qui donnerait une fausse baisse
                de trafic de <strong>-16,6&nbsp;%</strong>.
              </p>
              <p>
                <strong>Avec redressement :</strong> On exclut novembre et décembre de l'année 2019. On compare donc les
                10 mois de 2023 (10 000) aux 10 <em>mêmes</em> mois de 2019 (10 000). L'évolution est de
                <strong>0&nbsp;%</strong>, ce qui reflète la réalité.
              </p>
            </div>
          </details>

          <p>
            <strong>Agrégation&nbsp;:</strong> on additionne les sommes redressées de tous les compteurs retenus, puis
            on indexe sur 2019.
          </p>

          <p>
            Cet indice est inspiré d'une présentation sur l'évolution des transports dans la métropole de Lyon. Vous
            pouvez retrouver une analyse plus complète dans ce
            <a
              class="hover:underline text-lvv-blue-600"
              href="https://web.archive.org/web/20260114073430/https://www.cerema.fr/fr/system/files?file=documents/2024/12/1-hazanmarchal_vf.pdf"
              target="_blank"
              rel="noopener noreferrer"
              >document sur le site du CEREMA</a
            >.
          </p>

          <details class="mt-6 pt-4 border-t border-gray-200 group">
            <summary class="cursor-pointer font-semibold text-gray-900 select-none flex items-center gap-1">
              <Icon
                name="mdi:chevron-right"
                class="text-xl text-gray-500 group-open:rotate-90 transition-transform -ml-1"
              />
              Détails du calcul
            </summary>
            <div class="mt-2 text-sm text-gray-600 pl-6 border-l-2 border-gray-100 ml-1">
              <p class="mb-4">L'indice de chaque année est calculé selon la formule suivante :</p>
              <div class="bg-gray-50 p-4 rounded-md font-mono text-xs overflow-x-auto flex justify-center">
                <div class="flex items-center gap-3">
                  <span class="text-gray-800 text-sm font-semibold">Indice<sub>Y</sub> =</span>
                  <div class="flex flex-col items-center">
                    <span class="border-b border-gray-400 pb-1 mb-1 px-2"
                      >∑<sub>compteurs</sub> ( ∑<sub>mois communs</sub> Passages<sub>année Y</sub> )</span
                    >
                    <span class="px-2"
                      >∑<sub>compteurs</sub> ( ∑<sub>mois communs</sub> Passages<sub>année 2019</sub> )</span
                    >
                  </div>
                  <span class="text-gray-800 text-sm font-semibold">× 100</span>
                </div>
              </div>
              <p class="mt-4 italic text-xs text-gray-500">
                où les "mois communs" sont les mois où le compteur a fonctionné à la fois durant l'année Y et l'année de
                référence 2019.
              </p>
            </div>
          </details>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue';

defineProps<{
  open: boolean;
  kindLabel: string;
  lastYear: number;
  counterCountText: string;
}>();

const emit = defineEmits<{
  close: [];
}>();
</script>
