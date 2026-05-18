# TODO - Correction Dashboard (0 actifs)

## Étape 1 — Backend
- [ ] Ajouter endpoint `GET /api/organizations/user/{userId}` dans `backend/src/main/java/com/devbuild/gestion_charite/controller/OrganizationController.java`
  - Retourner la liste d’organisations liées au user (ex: `adminUserId == userId`).

## Étape 2 — Frontend
- [ ] Mettre à jour `frontend/src/App.tsx` : afficher l’erreur au lieu de masquer via `catch(() => [])` sur le dashboard.
  - Garder fallback `[]` mais afficher un message/alerte.

## Étape 3 — Vérification
- [ ] Relancer backend + frontend.
- [ ] Vérifier que `0 actifs` devient correct pour un user lié à une organisation.
- [ ] Vérifier que `Total donné` et `événements` remontent aussi.

