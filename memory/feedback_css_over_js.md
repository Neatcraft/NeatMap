---
name: Préférer HTML/CSS au JS
description: Toujours favoriser les solutions HTML natives et CSS avant d'écrire du JS pour gérer état, interactions ou routing d'événements
type: feedback
---

Préférer HTML/CSS au JS dès que c'est possible.

**Why:** Demande explicite de l'utilisateur. Le JS ajoute de la complexité, des risques de bugs et de la dette. HTML/CSS sont déclaratifs, accessibles et gratuits en performance.

**How to apply:**

- **État toggle** → `<input type="checkbox">` + `<label>` avec `bind:checked` au lieu d'un `onclick` JS. La checkbox gère l'état nativement (clavier Space inclus).
- **Routing d'événements** → z-index CSS pour qu'un élément supérieur reçoive les clics naturellement, au lieu de `e.stopPropagation()` JS. Un élément `z-20` bloque naturellement les clics vers un élément `z-0` derrière lui — aucun JS nécessaire.
- **États visuels** → `class:cursor-grab={!isDragging}` / `class:cursor-grabbing={isDragging}` au lieu de `style="cursor: {js}"`. Utiliser les directives `class:` de Svelte et les variantes Tailwind (`hover:`, `peer-checked:`, `group-hover:`).
- **Accordéon / disclosure** → `<details>` + `<summary>` au lieu de JS.
- **Tooltip** → `group` + `group-hover:visible` CSS au lieu de JS show/hide.
- **Formulaires** → éléments natifs (`<select>`, `<input>`, `<textarea>`) au lieu de custom JS.
- Écrire du JS uniquement quand le HTML/CSS ne peut pas exprimer la logique (calculs, appels API, coordination entre composants distants).