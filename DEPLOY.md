# Déployer Froova sur Hostinger

Chaque `git push` sur `main` déclenche le workflow GitHub Actions **deploy** :

1. **Tests** — lint/format du front, TypeScript, Pint, PHPStan et la suite PHPUnit.
2. **Build** — `composer install --no-dev` + `npm run build` (le serveur n'a besoin ni de Node ni de Composer).
3. **Envoi** — l'archive de la release est copiée en SSH sur Hostinger.
4. **Activation** — `deploy/remote.sh` décompresse la release, lance les migrations, met en cache la config/routes/vues puis bascule le lien `current` de façon atomique (pas de coupure).
5. **Vérification** — l'URL `/up` doit répondre, sinon le workflow échoue et tu peux revenir en arrière en un clic.

Structure créée sur le serveur :

```
~/domains/ton-domaine.fr/
├── froova/                  ← HOSTINGER_DEPLOY_PATH
│   ├── releases/            ← les 4 dernières releases
│   ├── shared/.env          ← réglages de prod
│   ├── shared/storage/      ← photos, sessions, logs (conservés entre déploiements)
│   └── current → releases/2026…
└── public_html → froova/current/public
```

> Au premier déploiement, le contenu existant du dossier web (`HOSTINGER_PUBLIC_HTML`) est déplacé dans `froova/web-root-backup-…` (hors du web) puis remplacé par un lien vers l’application.

---

## 1. Préparer Hostinger (hPanel)

1. **PHP 8.4** : _Site web → Avancé → Configuration PHP_ → choisis **8.4** (obligatoire : Laravel 13 / Symfony 8).
2. **Base MySQL** : _Bases de données → Bases de données MySQL_ → crée une base et un utilisateur, note les noms et le mot de passe.
3. **SSL** : _Sécurité → SSL_ → installe le certificat gratuit et active **Forcer HTTPS** (indispensable pour la PWA et les passkeys).
4. **SSH** : _Avancé → Accès SSH_ → active SSH et note l'**IP**, le **port** (souvent `65002`) et l'**utilisateur** (`u123456789`).
5. **E-mail** _(facultatif mais conseillé)_ : crée une adresse (ex. `bonjour@ton-domaine.fr`) pour envoyer les invitations et les réinitialisations de mot de passe.

## 2. Créer une clé SSH de déploiement

Sur ton ordinateur :

```bash
ssh-keygen -t ed25519 -C "froova-github-deploy" -f froova_deploy -N ""
```

- Colle le contenu de `froova_deploy.pub` dans _hPanel → Accès SSH → Clés SSH → Ajouter_.
- Le contenu de `froova_deploy` (clé **privée**) ira dans le secret GitHub `HOSTINGER_SSH_KEY`. Supprime ensuite les deux fichiers de ton ordinateur.

Teste la connexion :

```bash
ssh -p 65002 -i froova_deploy u123456789@IP_DU_SERVEUR "php -v"
```

Si `php -v` n'affiche pas 8.4, trouve le bon binaire (`ls /opt/alt/php84/usr/bin/php`) et renseigne-le dans la variable `HOSTINGER_PHP_BIN`.

## 3. Générer la clé de l'application

```bash
php artisan key:generate --show
```

Copie la valeur (`base64:…`) dans `APP_KEY` du fichier de production.

## 4. Configurer GitHub

Pousse le projet sur un dépôt GitHub (privé conseillé), puis dans _Settings → Secrets and variables → Actions_ :

**Secrets**

| Nom                     | Valeur                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------- |
| `HOSTINGER_SSH_HOST`    | IP du serveur SSH                                                                       |
| `HOSTINGER_SSH_USER`    | ex. `u123456789`                                                                        |
| `HOSTINGER_SSH_KEY`     | contenu de la clé privée `froova_deploy`                                                |
| `PRODUCTION_ENV`        | contenu complet de ton `.env` de prod (modèle : `.env.production.example`)              |
| `HOSTINGER_KNOWN_HOSTS` | _(facultatif)_ sortie de `ssh-keyscan -p 65002 IP` pour épingler l'empreinte du serveur |

**Variables**

| Nom                     | Exemple                                               |
| ----------------------- | ----------------------------------------------------- |
| `HOSTINGER_SSH_PORT`    | `65002`                                               |
| `HOSTINGER_DEPLOY_PATH` | `/home/u123456789/domains/ton-domaine.fr/froova`      |
| `HOSTINGER_PUBLIC_HTML` | `/home/u123456789/domains/ton-domaine.fr/public_html` |
| `APP_URL`               | `https://ton-domaine.fr`                              |
| `HOSTINGER_PHP_BIN`     | _(facultatif)_ `/opt/alt/php84/usr/bin/php`           |

> Tu préfères ne pas mettre le `.env` dans GitHub ? Laisse `PRODUCTION_ENV` vide et crée le fichier `HOSTINGER_DEPLOY_PATH/shared/.env` à la main en SSH : le déploiement l'utilisera.

> **Dépôt public** : les logs GitHub Actions sont visibles par tous et les _variables_ y apparaissent en clair. Crée plutôt `HOSTINGER_DEPLOY_PATH` et `HOSTINGER_PUBLIC_HTML` comme **secrets** (même nom) : ils contiennent ton identifiant Hostinger et seront masqués (`***`) dans les logs. Le workflow lit le secret en priorité, puis la variable.

Astuce : crée un _environment_ GitHub nommé `production` (Settings → Environments) pour y ranger ces secrets. Sur un dépôt public, limite-le à la branche `main` (_Deployment branches → Selected branches → main_) : les pull requests venant de forks n'ont de toute façon jamais accès aux secrets.

## 5. Déployer

```bash
git push origin main
```

Suis l'avancement dans l'onglet **Actions** du dépôt. Au premier déploiement, les tables sont créées automatiquement : il suffit ensuite d'ouvrir `https://ton-domaine.fr` et de créer ton compte.

## Revenir en arrière

_Actions → deploy → Run workflow → action : `rollback`_ : le lien `current` repointe sur la release précédente en quelques secondes (les migrations ne sont pas annulées).

## Modifier un réglage de production

Mets à jour le secret `PRODUCTION_ENV` puis relance le workflow (_Run workflow → deploy_) : la configuration est remise en cache à chaque déploiement.

## Bon à savoir

- **Photos** : stockées dans `shared/storage/app/public`, compressées en WebP (1400 px max) — pense à les inclure dans tes sauvegardes.
- **Sessions longues** : `SESSION_LIFETIME=43200` (30 jours glissants) + case « Rester connecté » (cookie longue durée). Les connexions par passkey restent aussi connectées.
- **Passkeys** : liées au domaine de `APP_URL`. Si tu changes de domaine, chaque membre devra en recréer une.
- **Pas de worker** : `QUEUE_CONNECTION=sync`, les e-mails partent immédiatement.
