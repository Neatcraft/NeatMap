---
name: Accessibility & HTML semantics
description: Toujours favoriser l'accessibilité et respecter la sémantique HTML (balises correctes, ARIA, tabindex, rôles interactifs)
type: feedback
---

Toujours favoriser l'accessibilité et respecter au maximum la sémantique HTML native.

**Why:** Demande explicite de l'utilisateur. Les éléments interactifs doivent utiliser les bonnes balises HTML (`<button>`, `<nav>`, `<aside>`…) plutôt que des `<div>` avec des rôles ARIA quand une balise native existe. Quand un rôle ARIA est nécessaire (ex: `role="application"`, `role="toolbar"`), ajouter `tabindex` et les attributs ARIA attendus.

**How to apply:**
- Toujours utiliser un élément HTML natif interactif ou sémantique à la place d'un `<div>` : `<button>`, `<aside>`, `<nav>`, `<menu>`, `<section>`, etc.
- Ne jamais ajouter d'event listeners sur un `<div>` brut — si un élément doit recevoir des événements, lui donner `tabindex="0"` ET préférer une balise native
- Pour éviter la propagation d'un événement vers un parent, gérer le filtrage dans le handler parent (ex: `if (el?.contains(e.target)) return`) plutôt que de poser un listener sur l'enfant
- Tout élément focusable doit avoir `tabindex="0"` et un `aria-label` si sans texte visible
- Ne jamais utiliser les modificateurs d'événements Svelte 4 (`|stopPropagation`) — en Svelte 5, gérer inline ou via containment check
- Ne jamais utiliser `<!-- svelte-ignore a11y_* -->` : résoudre le problème à la source en utilisant les bons éléments