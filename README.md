# SpotSport

Application web permettant de localiser facilement les terrains de sport dans une ville. Recherchez par ville et découvrez tous les équipements sportifs disponibles, avec leurs adresses précises, grâce à l'API des équipements sportifs du gouvernement.

## Description
SpotSport est une application web qui simplifie la recherche d'équipements sportifs. En utilisant l'API officielle des équipements sportifs (equipements.sport.gouv.fr), l'application permet aux utilisateurs de trouver rapidement tous les terrains et installations sportives disponibles dans une ville donnée. Une interface intuitive permet de filtrer par type de sport et d'accéder aux informations détaillées de chaque équipement.

## Technologies utilisées
- HTML5
- CSS3 (Flexbox, Grid)
- JavaScript (ES6+)
- API RESTful (equipements.sport.gouv.fr)
- Fetch API pour les requêtes HTTP
- LocalStorage pour la persistance des données

## Fonctionnalités principales
- Recherche d'équipements sportifs par ville
- Affichage de la liste des sports disponibles
- Filtrage des équipements par type de sport
- Affichage des adresses précises des terrains
- Interface responsive et intuitive
- Carte interactive des équipements
- Sauvegarde des recherches récentes
- Affichage des détails des équipements

## Installation
```bash
git clone https://github.com/Sebastien-Moreze/SpotSport.git
cd SpotSport
# Ouvrir index.html dans votre navigateur
```

## Structure du projet
```
SpotSport/
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── script.js
│   └── images/
├── index.html
└── README.md
```

## Utilisation de l'API
L'application utilise l'API des équipements sportifs du gouvernement français :
- Endpoint : equipements.sport.gouv.fr
- Données : Liste des équipements sportifs par ville
- Format : JSON
- Accès : Public

## Fonctionnalités techniques
- Appels API asynchrones avec Fetch
- Gestion des erreurs de requêtes
- Mise en cache des données
- Interface utilisateur réactive
- Validation des entrées utilisateur
- Gestion de la persistance des données
- Optimisation des performances

## Contribution
Les améliorations sont les bienvenues :
- Ajout de nouveaux filtres de recherche
- Amélioration de l'interface utilisateur
- Intégration de cartes interactives
- Ajout de fonctionnalités de géolocalisation
- Optimisation des performances
- Amélioration de la documentation 
