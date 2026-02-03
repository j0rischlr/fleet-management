# Fleet Management SaaS

Application de gestion de flotte de véhicules pour entreprises.

## Fonctionnalités

- **Employés** : Visualiser et réserver des véhicules
- **Administrateurs** : Gérer les véhicules, la maintenance, les utilisateurs

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

Exécuter les scripts SQL dans `supabase/schema.sql` dans l'éditeur SQL de Supabase.
