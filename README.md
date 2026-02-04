# Fleet Management SaaS

Application de gestion de flotte de véhicules pour entreprises.

## Fonctionnalités

- **Employés** : Visualiser et réserver des véhicules
- **Administrateurs** : Gérer les véhicules, la maintenance, les utilisateurs
- **Rappels automatiques** : Alertes de maintenance basées sur le kilométrage et le temps

## Stack Technique

- **Frontend** : React + TailwindCSS + Vite
- **Backend** : Express.js
- **Base de données** : Supabase
- **Authentification** : Supabase Auth

## Installation

```bash
# Installer toutes les dépendances
npm run install-all

# Configuration Supabase
# 1. Créer un projet sur https://supabase.com
# 2. Copier .env.example vers .env dans backend/
# 3. Copier .env.example vers .env dans frontend/
# 4. Remplir les variables d'environnement Supabase
```

## Démarrage

```bash
# Démarrer le serveur backend et frontend
npm run dev
```

- Frontend : http://localhost:5173
- Backend : http://localhost:3000

## Structure du projet

```
fleet/
├── backend/          # API Express
├── frontend/         # Application React
└── supabase/         # Schéma de base de données
```

## Configuration Supabase

1. Exécuter le script principal : `supabase/schema.sql` dans l'éditeur SQL de Supabase
2. Exécuter le script des règles de maintenance : `supabase/maintenance-rules.sql`

## Règles de Maintenance Automatiques

Le système inclut des rappels automatiques pour la maintenance des véhicules :

- **Essence/Diesel** : Maintenance obligatoire tous les 15 000 km
- **Électrique** : Révision annuelle obligatoire (12 mois)
- **Hybride** : Maintenance obligatoire tous les 15 000 km
- **Pneumatiques** : Contrôle tous les 10 000 km (tous types de véhicules)

Les alertes sont classées par priorité :
- **Urgent** : Échéance dépassée
- **Élevée** : 90% de l'intervalle atteint
- **Normale** : 80% de l'intervalle atteint
- **Faible** : Moins de 80%

Les administrateurs reçoivent des notifications pour les alertes urgentes et élevées.
