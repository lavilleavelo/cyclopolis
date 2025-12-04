---
title: Les Voies Lyonnaises sur OpenStreetMap
description: Cet article explique comment les Voies Lyonnaises sont représentées sur OpenStreetMap (OSM) et comment interroger les données d'OSM avec Overpass Turbo.
---

## OpenStreetMap 

OpenStreetMap (https://osm.org) est une base de données géographiques collaborative, libre et ouverte, maintenue par une communauté mondiale de contributeurs. C'est une alternative aux services de cartographie propriétaires comme Google Maps, sur le principe de Wikipédia.

Les données sont accessibles à tous et peuvent être utilisées pour diverses applications, comme la planification d'itinéraires cyclables (par exemple, avec [cartes.app](https://cartes.app), [geovelo](https://www.geovelo.fr/), [comaps](https://www.comaps.app/), ou [OSMAnd](https://osmand.net/)).

::Content-image
---
imageUrl: https://cyclopolis.lavilleavelo.org/blog/voies-lyonnaises-open-street-map/cartes_app_lyon.jpg
link: https://cartes.app/#12/45.76472/4.87267
caption: cartes.app est une alternative open-source à Google Maps, développée en France. Cette application a fait le choix de mettre en évidence les réseaux cyclables structurants comme les Voies Lyonnaises.
---
::

La précision des données est importante, en particulier si l'on veut obtenir un guidage détaillé qui prend en compte [les différents types d'aménagements cyclables](https://wiki.openstreetmap.org/wiki/FR:Bicycle) (pistes, bandes, zones partagées, etc.).

Un exemple de guidage open-source optimisé pour le vélo est [brouter](https://docs.bikerouter.de/en/getting-started/) ([exemple d'itinéraire](https://bikerouter.de/#map=14/45.7790/4.8513/standard,Waymarked_Trails-Cycling&lonlats=4.833212%2C45.758838%7C4.887199%2C45.782652&profile=safety)), qui utilise les données OSM pour calculer des itinéraires cyclables optimisés ou sécurisés.

### Différences entre OpenStreetMap et Cyclopolis

Si vous consultez OpenStreetMap, vous remarquerez que les tracés des Voies Lyonnaises peuvent différer de ceux affichés sur Cyclopolis. Cette [carte umap](https://umap.openstreetmap.fr/en/map/voies-lyonnaises-diff-osm_1299049#13/45.8718/4.8216) permet de visualiser les Voies Lyonnaises telles qu'elles sont représentées sur OpenStreetMap (OSM).

<iframe style="width: 100%; height: 600px; border: 0;" allowfullscreen allow="geolocation" src="//umap.openstreetmap.fr/en/map/voies-lyonnaises-diff-osm_1299049?scaleControl=false&miniMap=false&scrollWheelZoom=false&zoomControl=true&editMode=disabled&moreControl=false&searchControl=null&tilelayersControl=null&embedControl=null&datalayersControl=true&onLoadPanel=none&captionBar=false&captionMenus=true"></iframe>

<center>
<small>
<i>
Les tracés des Voies Lyonnaises sur OpenStreetMap (en rouge) et ceux de Cyclopolis (en bleu). Les tronçons en travaux ou reportés sont affichés en pointillés.
</i>
</small>
</center>

Cyclopolis indique les tracés officiels des Voies Lyonnaises tels que définis par la Métropole de Lyon. On peut voir les tronçons en travaux ou reportés qui ne sont pas encore présents dans OpenStreetMap.

Le fond de carte de Cyclopolis utilise les données OSM, mais les tracés des Voies Lyonnaises sont basés sur des tracés créés par des bénévoles de la Ville à Vélo, en se basant sur les plans officiels de la Métropole de Lyon. Il est possible de les retrouver ici : [github.com/lavilleavelo/cyclopolis](https://github.com/lavilleavelo/cyclopolis/tree/main/content/voies-cyclables)

## Interroger les données OpenStreetMap des Voies Lyonnaises

Comme vous pouvez le constater, grâce aux contributions de la communauté OpenStreetMap (en particulier [Gonéo](https://www.openstreetmap.org/user/Gon%C3%A9o) et [le groupe local de Lyon](https://forum.openstreetmap.fr/c/groupes-locaux/lyon)), les Voies Lyonnaises sont déjà bien représentées dans la base de données OSM. 

### Overpass Turbo

Pour visualiser ou extraire les données OSM des Voies Lyonnaises, plusieurs outils sont disponibles. On peut, par exemple, [télécharger un extrait de la base de données OSM](https://planet.openstreetmap.org/) ou utiliser un service comme [Overpass Turbo](https://wiki.openstreetmap.org/wiki/FR:Overpass_turbo).

Overpass Turbo est une application web qui permet d'interroger la base de données OpenStreetMap. Le service est un outil puissant (mais technique) qui utilise un langage de requête appelé [Overpass QL](https://wiki.openstreetmap.org/wiki/FR:Overpass_API/Language_Guide). Un tutoriel interactif est disponible [ici](https://osm-queries.ldodds.com/tutorial/00-node-1.osm.html) (en anglais).

::Content-image
---
imageUrl: https://cyclopolis.lavilleavelo.org/blog/voies-lyonnaises-open-street-map/overpass_turbo.jpg
link: https://overpass-turbo.eu/s/2gsS
caption: Capture d'écran de l'interface Overpass Turbo avec la requête pour obtenir les Voies Lyonnaises.
---
::

La requête suivante permet d'obtenir tous les nœuds, chemins et relations OSM associés aux Voies Lyonnaises. Cette requête utilise le fait que les relations des VL ont le `tag` [cycle_network=Les Voies Lyonnaises](https://wiki.openstreetmap.org/wiki/FR:Key:cycle_network).

```txt
[out:json];
nwr["cycle_network" = "Les Voies Lyonnaises"]({{bbox}});
out geom;
```
<center style="margin-top: -25px"><small>

https://overpass-turbo.eu/s/2gsS
</small></center>


<details>
<summary style="cursor: pointer;">Explications</summary>


`nwr["cycle_network" = "Les Voies Lyonnaises"]({{bbox}});`

- nwr (Node, Way, Relation) : Cela signifie "Cherche n'importe quel objet". Cela inclut les Nœuds (points), les Ways (lignes/chemins) et les Relations (groupes d'éléments). Cela garantit qu'on ne rate aucune partie du réseau. Ici, on va principalement obtenir des relations.
- `["cycle_network" = "Les Voies Lyonnaises"]` : C'est le filtre. On ne veut pas n'importe quelle route, on veut uniquement celles qui portent l'étiquette (le `tag`) `cycle_network` avec la valeur `Les Voies Lyonnaises`.
- `({{bbox}})` : (bbox pour Bounding Box, "boîte englobante"). C'est une fonction spéciale dans Overpass Turbo qui permet de limiter la recherche à la zone visible sur la carte. Cela évite de surcharger la requête en cherchant dans le monde entier. On peut aussi mettre les coordonnées géographiques manuellement comme `(45.60971454042112,4.717941284179688,45.92082617831274,5.058517456054688)`.

</details>

#### Requête Overpass avec Umap

[umap](https://umap.openstreetmap.fr/fr/) est un service qui permet de créer des cartes personnalisées. On peut ajouter des points ou des lignes manuellement, ou importer des données géographiques depuis des fichiers ou des services web. On peut également faire des requêtes Overpass. Un tutoriel en français est disponible [ici](https://discover.umap-project.org/fr/tutorials/11-openstreetmap-overpass-and-umap/).

<iframe style="width: 100%; height: 300px; border: 0;" allowfullscreen allow="geolocation" src="//umap.openstreetmap.fr/en/map/voies-lyonnaises-osm_1325063?scaleControl=false&miniMap=false&scrollWheelZoom=false&zoomControl=true&editMode=disabled&moreControl=false&searchControl=null&tilelayersControl=null&embedControl=null&datalayersControl=true&onLoadPanel=none&captionBar=false&captionMenus=true"></iframe>


#### Liste des relations OSM des Voies Lyonnaises

On peut aussi obtenir une liste au format CSV des relations OSM associées aux Voies Lyonnaises avec la requête suivante :

```txt
[out:csv(::id, name)];
relation["cycle_network"="Les Voies Lyonnaises"];
out;
```
<center style="margin-top: -25px"><small>

https://overpass-turbo.eu/s/2gsQ
</small></center>

Voici la liste des relations OSM des Voies Lyonnaises avec le lien pour les voir directement sur OpenStreetMap :

| @id      | Lien OSM                                                                         | 
|----------|----------------------------------------------------------------------------------|
| 15396528 | [Voie Lyonnaise numéro 1](https://openstreetmap.org/relation/15396528#layers=Y)  | 
| 15536956 | [Voie Lyonnaise numéro 2](https://openstreetmap.org/relation/15536956#layers=Y)  |
| 15397170 | [Voie Lyonnaise numéro 3](https://openstreetmap.org/relation/15397170#layers=Y)  |
| 17369670 | [Voie Lyonnaise numéro 4](https://openstreetmap.org/relation/17369670#layers=Y)  |
| 16337778 | [Voie Lyonnaise numéro 5](https://openstreetmap.org/relation/16337778#layers=Y)  |
| 17369721 | [Voie Lyonnaise numéro 6](https://openstreetmap.org/relation/17369721#layers=Y)  |
| 17366876 | [Voie Lyonnaise numéro 7](https://openstreetmap.org/relation/17366876#layers=Y)  |
| 17369787 | [Voie Lyonnaise numéro 8](https://openstreetmap.org/relation/17369787#layers=Y)  |
| 17369654 | [Voie Lyonnaise numéro 9](https://openstreetmap.org/relation/17369654#layers=Y)  |
| 17369290 | [Voie Lyonnaise numéro 10](https://openstreetmap.org/relation/17369290#layers=Y) |
| 16337795 | [Voie Lyonnaise numéro 11](https://openstreetmap.org/relation/16337795#layers=Y) |
| 16337796 | [Voie Lyonnaise numéro 12](https://openstreetmap.org/relation/16337796#layers=Y) |


#### Visualiser les segments

Il est aussi possible de sélectionner chaque segment avec la requête suivante :

```txt
[out:json];
relation["cycle_network"="Les Voies Lyonnaises"];
way(r);
out geom;
```
<center style="margin-top: -25px"><small>

https://overpass-turbo.eu/s/2gtG
</small></center>

Chaque segment comporte de nombreuses informations, comme le type d'aménagement cyclable (piste cyclable, bande cyclable, voie partagée, etc.) ou l'état de surface (bitume, stabilisé, etc.).


#### Exemple : Tunnel bus-piétons-vélos de la Croix-Rousse

::content-image
---
panoramax: seq=8820cc16-a130-43b2-8797-87a0fd2cd39a;pic=14f96d98-cb95-4366-9901-86dd260a48ba;open=true
---
::

Exemple de segment avec le tunnel mode doux de la Croix-Rousse : [https://www.openstreetmap.org/way/250224690]. Voici quelques-uns des tags que l'on peut trouver pour ce segment :

| Tag                                                                 | Valeur                                                                      |
|---------------------------------------------------------------------|-----------------------------------------------------------------------------|
| [name](https://wiki.openstreetmap.org/wiki/FR:Key:name)             | Tunnel bus-piétons-vélos de la Croix-Rousse                                 |
| [bicycle](https://wiki.openstreetmap.org/wiki/FR:Key:bicycle)       | [designated](https://wiki.openstreetmap.org/wiki/FR:Tag:bicycle=designated) |
| [foot](https://wiki.openstreetmap.org/wiki/FR:Key:foot)             | [designated](https://wiki.openstreetmap.org/wiki/Tag:foot=designated)       |
| [highway](https://wiki.openstreetmap.org/wiki/FR:Key:highway)       | [path](https://wiki.openstreetmap.org/wiki/FR:Tag:highway=path)             |
| [incline](https://wiki.openstreetmap.org/wiki/FR:Key:incline)       | 0%                                                                          |
| [lit](https://wiki.openstreetmap.org/wiki/FR:Key:lit)               | 24/7                                                                        |
| [oneway](https://wiki.openstreetmap.org/wiki/FR:Key:oneway)         | no                                                                          |
| [segregated](https://wiki.openstreetmap.org/wiki/FR:Key:segregated) | [yes](https://wiki.openstreetmap.org/wiki/FR:Tag:segregated=yes)            |
| [sidewalk](https://wiki.openstreetmap.org/wiki/FR:Key:sidewalk)     | right                                                                       |
| [smoothness](https://wiki.openstreetmap.org/wiki/FR:Key:smoothness) | good                                                                        |
| [surface](https://wiki.openstreetmap.org/wiki/FR:Key:surface)       | [asphalt](https://wiki.openstreetmap.org/wiki/FR:Tag:surface=asphalt)       |
| [tunnel](https://wiki.openstreetmap.org/wiki/FR:Key:tunnel)         | yes                                                                         |


<details>
<summary style="cursor: pointer;">Explication détaillée des tags OSM</summary>

##### Type de voie / accès

| Tag (Clé=Valeur)         | Explication                                                                                                                                           | Lien Wiki                                                                  |
|:-------------------------|:------------------------------------------------------------------------------------------------------------------------------------------------------|:---------------------------------------------------------------------------|
| **highway**=`path`       | Définit l'objet comme une **voie générique** polyvalente, ouverte aux transports non motorisés (sauf exception précisée).                             | [ highway=path](https://wiki.openstreetmap.org/wiki/FR:Tag:highway%3Dpath) |
| **bicycle**=`designated` | L'accès aux **vélos** est autorisé et la voie est officiellement désignée pour eux (Il y le panneau circulaire bleu)                                  | [ bicycle](https://wiki.openstreetmap.org/wiki/FR:Key:bicycle)             |
| **foot**=`designated`    | L'accès aux **piétons** est autorisé et la voie est officiellement désignée pour eux.                                                                 | [ foot](https://wiki.openstreetmap.org/wiki/FR:Key:foot)                   |
| **segregated**=`yes`     | Indique que les piétons et les cyclistes partagent le tunnel mais sont **physiquement séparés** (par une ligne, une bordure ou des voies distinctes). | [ segregated](https://wiki.openstreetmap.org/wiki/FR:Key:segregated)       |
| **oneway**=`no`          | La voie n'est **pas à sens unique**. On peut circuler dans les deux sens.                                                                             | [ oneway](https://wiki.openstreetmap.org/wiki/FR:Key:oneway)               |
| **sidewalk**=`right`     | Indique la présence d'un **trottoir** situé sur le côté **droit** de la voie (dans le sens du tracé de la ligne sur la carte).                        | [ sidewalk](https://wiki.openstreetmap.org/wiki/FR:Key:sidewalk)           |


##### Caractéristiques physiques

| Tag (Clé=Valeur)      | Explication                                                                                                                                                  | Lien Wiki                                                                |
|:----------------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------|:-------------------------------------------------------------------------|
| **surface**=`asphalt` | Le revêtement du sol est en **asphalte** (bitume).                                                                                                           | [Voir surface](https://wiki.openstreetmap.org/wiki/FR:Key:surface)       |
| **smoothness**=`good` | La qualité du revêtement est **bonne**. Cela signifie qu'il est confortable pour un vélo de route, mais pas parfait comme une piste de course (`excellent`). | [Voir smoothness](https://wiki.openstreetmap.org/wiki/FR:Key:smoothness) |
| **incline**=`0%`      | La pente est de **0%**, c'est donc un trajet parfaitement plat.                                                                                              | [Voir incline](https://wiki.openstreetmap.org/wiki/FR:Key:incline)       |
| **lit**=`24/7`        | La voie est **éclairée** artificiellement 24 heures sur 24 et 7 jours sur 7 (typique des tunnels longs).                                                     | [Voir lit](https://wiki.openstreetmap.org/wiki/FR:Key:lit)               |


##### Structure / position

| Tag (Clé=Valeur) | Explication                                                                                                                                                                                             | Lien Wiki                                                        |
|:-----------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:-----------------------------------------------------------------|
| **tunnel**=`yes` | Confirme que cette voie passe dans un **tunnel**.                                                                                                                                                       | [Voir tunnel](https://wiki.openstreetmap.org/wiki/FR:Key:tunnel) |
| **layer**=`-2`   | Indique la **couche verticale**. `-2` signifie que l'objet est profondément sous terre, en dessous des objets situés au niveau `-1` (qui pourraient être d'autres tunnels ou le métro) et `0` (le sol). | [Voir layer](https://wiki.openstreetmap.org/wiki/FR:Key:layer)   |

</details>

#### Obtenir des statistiques avec Overpass Turbo

On peut aussi utiliser Overpass Turbo pour obtenir des statistiques sur les Voies Lyonnaises, comme le nombre de segments et la longueur totale des aménagements cyclables. Voici un exemple de requête :

```txt
[out:csv(number,length)];
relation["cycle_network"="Les Voies Lyonnaises"](45.11326925230233,4.263418981886696,46.3583020562222,5.452689001417946);
way(r);
make stat number=count(ways),length=sum(length());
out;
```
<center style="margin-top: -25px"><small>

https://overpass-turbo.eu/s/2gtQ
</small></center>


Au 30 novembre 2025, on obtient **113,15 km** sur **543 segments**. (Cyclopolis indique *126 km* à la même date).

#### Représentation des types d'aménagements cyclables

Un autre exemple de requête permet de visualiser les différents types d'aménagements cyclables le long de la Voie Lyonnaise numéro 1, en utilisant des couleurs différentes selon qu'il s'agit de voies partagées ou réservées aux vélos (potentiellement zones de conflits avec les autres usagers) : https://overpass-turbo.eu/s/2gtR

::Content-image
---
imageUrl: https://cyclopolis.lavilleavelo.org/blog/voies-lyonnaises-open-street-map/vl1_conflits.jpg
link: https://overpass-turbo.eu/s/2gtR
caption: Segments de la Voie Lyonnaise numéro 1, colorés selon le type d'aménagement cyclable (en rouge les voies partagées, qui peuvent générer des conflits entre usagers, en bleu les voies réservées aux vélos).
---
::

## Pour aller plus loin

On espère que cet article vous a donné un aperçu de ce qu'il est possible de faire avec les données OpenStreetMap et vous a peut-être donné envie d'explorer davantage. 

Si vous voulez contribuer, l'un des moyens les plus simples est d'utiliser l'application [StreetComplete](https://streetcomplete.app/?lang=fr), qui permet de corriger ou d'ajouter des informations sur les aménagements cyclables directement depuis votre téléphone.

Autres ressources :
- [Wiki OpenStreetMap](https://wiki.openstreetmap.org/wiki/FR:Page_principale) - La documentation officielle d'OpenStreetMap en français. 
- [Tuto LearnOSM](https://learnosm.org/fr/) - Un tutoriel complet pour apprendre à utiliser et contribuer à OpenStreetMap.
- [Documentation Umap)](https://discover.umap-project.org/fr/videos) - Des tutoriels vidéo sur Umap.
- [Groupe Local OSM Lyon](https://wiki.openstreetmap.org/wiki/FR:Lyon) - Le wiki du groupe local OpenStreetMap de Lyon.
