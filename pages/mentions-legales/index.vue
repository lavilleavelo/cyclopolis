<template>
  <div class="relative py-16 bg-white overflow-hidden">
    <div class="hidden lg:block lg:absolute lg:inset-y-0 lg:h-full lg:w-full">
      <div class="relative h-full text-lg max-w-prose mx-auto" aria-hidden="true">
        <svg
          class="absolute top-12 left-full transform translate-x-32"
          width="404"
          height="384"
          fill="none"
          viewBox="0 0 404 384"
        >
          <defs>
            <pattern
              id="74b3fd99-0a6f-4271-bef2-e80eeafdf357"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <rect x="0" y="0" width="4" height="4" class="text-gray-200" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="404" height="384" fill="url(#74b3fd99-0a6f-4271-bef2-e80eeafdf357)" />
        </svg>
        <svg
          class="absolute top-1/2 right-full transform -translate-y-1/2 -translate-x-32"
          width="404"
          height="384"
          fill="none"
          viewBox="0 0 404 384"
        >
          <defs>
            <pattern
              id="f210dbf6-a58d-4871-961e-36d5016a0f49"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <rect x="0" y="0" width="4" height="4" class="text-gray-200" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="404" height="384" fill="url(#f210dbf6-a58d-4871-961e-36d5016a0f49)" />
        </svg>
        <svg
          class="absolute bottom-12 left-full transform translate-x-32"
          width="404"
          height="384"
          fill="none"
          viewBox="0 0 404 384"
        >
          <defs>
            <pattern
              id="d3eb07ae-5182-43e6-857d-35c643af9034"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <rect x="0" y="0" width="4" height="4" class="text-gray-200" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="404" height="384" fill="url(#d3eb07ae-5182-43e6-857d-35c643af9034)" />
        </svg>
      </div>
    </div>
    <div class="relative px-4 sm:px-6 lg:px-8">
      <div class="text-lg max-w-prose mx-auto">
        <h1>
          <span
            class="mt-2 block text-3xl text-center leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl"
            >Mentions légales</span
          >
        </h1>
      </div>
      <div class="mt-6 prose prose-lg text-gray-500 mx-auto">
        <h2>Hébergement</h2>
        <p>
          Ce site web est hébergé par
          <a href="https://www.netlify.com/" target="_blank" rel="noopener noreferrer">Netlify</a>
        </p>
        <h2>Protection des données à caractère personnel</h2>
        <p>Le présent site web respecte les règles suivantes :</p>
        <ul>
          <li>Pas de collecte de données à l'insu de l'internaute.</li>
          <li>Limitation au minimum de la collecte des données.</li>
          <li>Pas d’usage des informations collectées au-delà du traitement de la demande.</li>
        </ul>

        <h2>Réutilisation du contenu du site</h2>
        <p>
          Toute réutilisation brute des cartographies interactives du site, des chiffres du tableau de bord et des
          détails écrits des tronçons de chaque ligne doivent faire systématiquement mention du nom de la plateforme «
          Cyclopolis » (avec lien vers <a href="https://cyclopolis.fr" target="_blank">https://cyclopolis.fr</a>) et du
          nom de l’association contributrice « {{ getAssoName() }} » (avec lien vers
          <a :href="`${getAssoLink()}`" target="_blank">{{ getAssoLink() }}</a
          >).
        </p>

        <h2>Limitation de responsabilité</h2>
        <p>
          Nous nous efforçons de fournir sur notre site web des informations exactes, complètes et à jour. Cependant, le
          site et toute information, textes, noms, images, photos, logos, liens, etc. sont fournis « en l’état » et sans
          garantie expresse ou implicite. En particulier, nous ne garantissons pas l'exactitude ou l'état complet des
          informations présentées sur ce site web ni ne garantissons que l'accès à ce site web sera ininterrompue et
          sans erreur. En aucun cas CYCLOPOLIS ne pourra être tenu responsable pour tout dommage ou perte résultant de
          l'utilisation de toute information contenue sur le site web, y compris, sans limitation, les dommages
          indirects ou tout autre dommage suite ou en rapport avec l'utilisation du site web.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getAssoName, getAssoLink } = useConfig();
</script>
