# MyPrettyGradES

Un userscript qui rend la page des notes de MyGES plus lisible, plus visuelle et surtout plus utile.

[![Installer avec Tampermonkey](https://img.shields.io/badge/Installer-Tampermonkey-2ecc71?style=for-the-badge&logo=tampermonkey)](https://github.com/Ailcope/MyPrettyGradES/raw/refs/heads/main/myges-marks.user.js)

## Fonctionnalités

- **Notes colorées** : vert au-dessus de 10, rouge en dessous et jaune à 10.
- **Moyennes pondérées** : calcul automatique à partir des notes et coefficients.
- **Statistiques utiles** : moyenne générale, min, max et écart-type.
- **Vue par matière** : ajout d'une moyenne pour chaque module.
- **Graphique récapitulatif** : comparaison visuelle des moyennes par matière, avec le repère de la moyenne pondérée.
- **Bon semestre tout de suite** : MyGES ouvre souvent sur un semestre vide. Le script redescend alors la liste, du plus récent au plus ancien, jusqu'à trouver un semestre qui a des notes, et te le signale par un petit message. Un sélecteur est aussi dispo dans le panneau — dès que tu choisis toi-même, il ne touche plus à rien.
- **Absences** : comptage des absences et retards, non justifiées surlignées, et surtout **combien il t'en reste avant la première sanction** (barème inclus!) — seules les absences non justifiées du semestre sont comptées.
- **Alerte règlement** : un bandeau prévient quand tu approches ou dépasses un seuil d'absences non justifiées sur le semestre.

## Installation

1. Installe [Tampermonkey](https://www.tampermonkey.net/) sur Chrome, Firefox, Edge ou Safari.
2. Clique sur le bouton **Installer** en haut de cette page.
3. Ouvre la page [Mes notes](https://myges.fr/student/marks) de MyGES.

Le panneau de statistiques apparaît automatiquement sur la page.

## Confidentialité

Le script s'exécute entièrement dans ton navigateur, sur la page MyGES. **Je ne collecte absolument aucune donnée** : ni tes notes, ni tes absences, ni quoi que ce soit d'autre ne part vers un serveur, tout se passe exclusivement en local.

## Avertissement

Le script n'est qu'un indicateur. **L'administration et ses documents officiels font toujours foi**, pas l'extension : en cas d'écart, c'est le règlement intérieur et le bulletin qui comptent.


## Licence

Distribué sous licence [CC BY-NC 4.0](LICENSE) — réutilisation et modification libres tant que c'est non commercial **et** que l'auteur est crédité. Usage commercial soumis à l'accord de l'auteur.

---

*Développé pour rendre MyGES moins guez.*
