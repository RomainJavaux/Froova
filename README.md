# ❄️ Froova

**Ton congélo, enfin rangé.** Froova est une application web open source (installable sur mobile) pour gérer tes congélateurs en famille, pensée pour le batch cooking : tu dessines tes congélateurs et leurs tiroirs, tu ranges tes plats avec photo, quantité et dates, et tu retrouves en un geste où se cache la dernière part de lasagnes.

## Fonctionnalités

- **Comptes & connexion rapide** — inscription, « Rester connecté » activé par défaut, sessions de 30 jours, **passkeys** (Face ID / empreinte / code du téléphone).
- **Lieux & familles** — plusieurs lieux (maison, chalet, parents…), invitations par lien, **QR code** ou e-mail, rôles propriétaire / admin / membre.
- **Congélateurs visuels** — armoire, coffre (bahut), combiné ou compact ; configurateur avec aperçu en direct, tiroirs renommables et réordonnables par glisser-déposer.
- **Batchs** — photo (prise directement avec l'appareil photo, compressée), emoji, catégorie, quantité et unité, nombre de parts, dates de préparation / congélation, date limite calculée automatiquement selon la catégorie, description, étiquettes, poids.
- **Prendre un plat** — depuis un tiroir ouvert ou depuis l'inventaire, avec choix de la quantité ; « Où est-ce ? » ouvre le bon congélateur sur le bon tiroir et met le plat en évidence.
- **Anti-gaspi** — anneau de fraîcheur, liste « à manger en priorité », plats « dépassés », jeter avec motif, onglet « Terminés » avec **Refaire ce batch**.
- **Idée repas** — la roulette « Ce soir, on mange quoi ? » privilégie ce qu'il faut finir vite.
- **Étiquettes QR** imprimables à coller sur les boîtes : le QR ouvre directement le batch.
- **Historique** — qui a rangé, pris, déplacé ou jeté quoi, et quand.
- **PWA** — installable, raccourcis (« Ranger un batch », « Prendre quelque chose »), mode hors ligne (dernières pages consultées), thème clair / sombre.

## Stack

Laravel 13 · Inertia 3 · React 19 · TypeScript · Tailwind CSS 4 · Motion · Fortify (+ passkeys) · Wayfinder · MySQL (prod) / SQLite (dev).

## Démarrer en local

Prérequis : PHP 8.4+, Composer, Node 22+.

```bash
composer setup
```

```bash
php artisan migrate:fresh --seed
```

```bash
composer run dev
```

L'application tourne sur http://localhost:8000. Le seeder crée un foyer de démo avec deux congélateurs et une vingtaine de batchs : connecte-toi avec `test@example.com` / `password`.

Régénérer les icônes PWA après une modification de `resources/icons/logo.svg` :

```bash
node scripts/generate-icons.mjs
```

## Qualité

```bash
composer ci:check
```

Lance le lint et le format du front, la vérification TypeScript, Pint, PHPStan et la suite de tests PHPUnit (la même chose que la CI).

## Déploiement

Push sur `main` → tests → build → mise en ligne atomique sur Hostinger via SSH, avec retour arrière en un clic. Toute la procédure est dans [DEPLOY.md](DEPLOY.md).

## Organisation du code

| Dossier                                       | Contenu                                                                     |
| --------------------------------------------- | --------------------------------------------------------------------------- |
| `app/Services/Inventory.php`                  | toutes les entrées / sorties de stock (et l'historique associé)             |
| `app/Actions/`                                | création d'un lieu, enregistrement d'un congélateur et de ses compartiments |
| `app/Enums/`                                  | catégories (durées de conservation), unités, types de congélateurs, rôles   |
| `resources/js/components/freezer/`            | l'illustration interactive des congélateurs et le configurateur             |
| `resources/js/pages/`                         | les écrans Inertia                                                          |
| `public/sw.js`, `public/manifest.webmanifest` | la PWA                                                                      |
| `deploy/remote.sh`, `.github/workflows/`      | le pipeline de déploiement                                                  |

## Contribuer

Les issues et pull requests sont les bienvenues. Avant d'ouvrir une PR, lance `composer ci:check` : c'est ce que la CI vérifie sur chaque pull request.

## Licence

Froova est un logiciel libre distribué sous [licence MIT](LICENSE).
