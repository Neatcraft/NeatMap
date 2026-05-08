---
name: Design System NeatMap
description: Palette, typographie et principes de design du projet NeatMap à appliquer systématiquement
type: project
---

## Palette de couleurs

| Rôle | Nom | Valeur |
|---|---|---|
| Primaire | Action Orange | `#ED7D1A` |
| Secondaire | Deep Navy | `#002740` |
| Accent | High-Visibility Pink | `#EF0098` |
| Surface | Fond principal | `#F7F9FB` |
| Container Low | Fond secondaire | `#F2F4F6` |

**Why:** Couleurs définies pour le produit NeatMap. Action Orange pour tout ce qui est actionnable/actif, Deep Navy pour la structure, Pink pour alertes/dépendances externes.

**How to apply:**
- Fond de page/board → `#F7F9FB`
- Boutons et états actifs → `#ED7D1A`
- Icônes dans les boutons → `#ED7D1A`
- Bordure d'état actif/sélectionné → 4px solid `#ED7D1A`
- Ombres → `rgba(0, 39, 64, 0.05)` (Deep Navy à 5%)
- Jamais utiliser des couleurs arbitraires qui ne sont pas dans cette palette

## Typographie

- **Titres** : Barlow 700, uppercase, `tracking-tighter`
- **Corps** : Montserrat 300–500

## Principes de design

- **Arrondis** : `rounded-lg` (8px) pour boutons et cartes
- **Élévation** : `shadow-xl` avec ombre `rgba(0, 39, 64, 0.05)`
- **Hiérarchie active** : bordure 4px `#ED7D1A` sur les éléments sélectionnés