# Admin CI/CD

Le projet `admin` est maintenant préparé pour :

- `CI` sur chaque Pull Request vers `main`
- `CD` automatique après merge sur `main`

## Hypothèses par défaut

Si rien n'est configuré côté GitHub, le workflow essaie le mode standard suivant :

- hôte SSH : `passkey.akasigroup.com`
- port SSH : `22`
- utilisateur SSH : `root`
- dossier de déploiement : `/var/www/passkey`
- URL publique : `http://passkey.akasigroup.com/`

Le déploiement copie le contenu de `admin/dist/` sur le serveur avec `rsync --delete`.

## GitHub Actions ajoutés

- `.github/workflows/admin-ci.yml`
- `.github/workflows/admin-cd.yml`

## Secrets / Variables recommandés

### Secrets GitHub

- `LINODE_SSH_PRIVATE_KEY`
- `LINODE_SSH_HOST` : optionnel si différent de `passkey.akasigroup.com`
- `LINODE_SSH_PORT` : optionnel si différent de `22`
- `LINODE_SSH_USER` : optionnel si différent de `root`
- `ADMIN_VITE_GOOGLE_MAPS_API_KEY` : recommandé

### Variables GitHub

- `ADMIN_DEPLOY_PATH` : optionnel, défaut `/var/www/passkey`
- `ADMIN_APP_URL` : optionnel, défaut `http://passkey.akasigroup.com/`
- `ADMIN_VITE_API_BASE_URL` : optionnel
- `ADMIN_VITE_RECAPTCHA_SITE_KEY` : optionnel

## Build env

Le workflow :

1. part du fichier `admin/.env`
2. génère `admin/.env.production`
3. remplace les valeurs si des variables/secrets GitHub sont fournis

Donc :

- sans configuration GitHub, le build utilisera les valeurs déjà présentes dans `admin/.env`
- avec configuration GitHub, ces valeurs seront priorisées pour la production

## Nginx recommandé sur Linode

Pour une app Vite SPA, la config standard ressemble à ceci :

```nginx
server {
    listen 80;
    server_name passkey.akasigroup.com;

    root /var/www/passkey;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Vérification minimale

Après configuration des secrets :

1. ouvrir une PR qui touche `admin/`
2. vérifier que `Admin CI` passe
3. merger sur `main`
4. vérifier que `Admin CD` déploie sur `http://passkey.akasigroup.com/`

## Première question à confirmer

La seule information que je veux confirmer maintenant est :

- le dossier servi par Nginx est-il bien `/var/www/passkey` ?

Si ce n'est pas le cas, on changera simplement `ADMIN_DEPLOY_PATH`.
