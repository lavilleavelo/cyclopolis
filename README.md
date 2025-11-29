# Cyclopolis

## Qu'est-ce que Cyclopolis ?

Il s'agit d'une plateforme web permettant la visualisation d'un projet de réseau cyclable structurant.

Entièrement développée par des bénévoles de l'association lyonnaise "La Ville à Vélo", cette plateforme a pour objectif principal de suivre le développement du projet des "Voies Lyonnaises".

On y retrouve en particulier :

- une carte intéractive permettant de visualiser les tracés des voies cyclables.
- une page détaillée sur chacune des voies cyclables.
- des analyses de traffic à partir des compteurs à vélo de la métropole lyonnaise.

## Est-il possible de réutiliser Cyclopolis pour un autre projet ?

Oui !

Vous êtes une association, ou un particulier ? Il y a un projet de réseau cyclable structurant dans votre ville et vous souhaitez suivre son développement ? Vous pouvez tout à fait réutiliser Cyclopolis pour votre projet.

Cyclopolis :

- est open source, le code est entièrement disponible sur Github.
- a une licence ouverte, vous avez donc le droit de réutiliser le code pour votre projet.
- est gratuit à opérer (pas de base de données, pas de serveur dédié, pas de coût de maintenance).

## Aide aux contributeurs/trices non développeurs/euses

le `status` de chaque tronçon peut prendre les valeurs définies [ici](types/index.ts#L13)

le `type` de chaque tronçon peut prendre les valeurs définies [ici](types/index.ts#L1)

## Quelques détails techniques

Look at the [nuxt 4 documentation](https://nuxt.com/docs/4.x/getting-started/introduction) to learn more.

## Setup

Make sure to install the dependencies:

```bash
npm ci
```

## Development Server

Start the development server on http://localhost:3000

```bash
npm run dev
```

## Production

Build the application for production:

```bash
npm run generate
```

Locally preview production build:

```bash
npm run preview
```

