# Journal des modifications

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versions selon [SemVer](https://semver.org/lang/fr/).

## [1.0.0] — 2026-11-24

### Ajouté

- Élément `<gc-toggle-switch>` : Custom Element natif, module ES sans dépendance.
- États on/off, attribut `checked` reflété, événements `input` et `change`.
- Association aux formulaires : `name`, `value`, `disabled`, `required`, `form.reset()`, `<fieldset disabled>`.
- Orientation horizontale ou verticale, par l'attribut `orientation` ou la propriété CSS `--switch-vertical`.
- Couleurs par attributs (`off-color`, `on-color`) ou propriétés CSS, tailles en `em`, parts `track` et `thumb`.
- Accessibilité : `role="switch"`, clavier (Espace, Entrée), focus visible, mouvement réduit, thèmes clair et sombre, contraste élevé.
- Page de démonstration et documentation en français.
