---
name: Rollback git = rejet utilisateur
description: Quand du code disparaît sans mon intervention, c'est un rollback git intentionnel de l'utilisateur
type: feedback
---

Quand un system-reminder signale qu'un fichier a été modifié "intentionnellement" et que du code que j'avais ajouté a disparu, c'est l'utilisateur qui a fait un rollback git — pas un linter.

**Why:** L'utilisateur rollback avec git quand une fonctionnalité ne lui convient pas. Re-ajouter le code rejeté force des rollbacks répétés et est contre-productif.

**How to apply:** Ne jamais re-ajouter du code qui a disparu via rollback sans que l'utilisateur le demande explicitement. Considérer la disparition comme un rejet de l'approche, pas comme une erreur technique à corriger.