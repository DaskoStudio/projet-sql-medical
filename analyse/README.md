# Partie de données, fonction, index

*(Sections à recopier dans le `README.md` du groupe.)*

## Les données

- **Ce qu'elles font :** 200 médecins, 10 000 patients et 1 000 000 de consultations générés avec `generate_series`. Chaque médecin a 20 créneaux de 30 min par jour (8 h - 18 h), à partir du 13 octobre 2026.
- **Pourquoi elles sont là :** avec quelques lignes, PostgreSQL lit toujours toute la table. Il faut du volume pour qu'un index change quelque chose, et pour voir si le site reste rapide.
- **La preuve :** `SELECT count(*) FROM consultations;` renvoie 1 000 004.

## La fonction `calculer_rdv_mois`

- **Ce qu'elle fait :** compte les rendez-vous non annulés d'un médecin sur un mois donné. La page statistiques du site l'appelle pour chaque médecin.
- **Pourquoi elle est là :** le calcul est écrit une seule fois, dans la base, au lieu d'être réécrit dans chaque programme.
- **La preuve :** `SELECT calculer_rdv_mois(42, '2026-11-01');` renvoie 600. Après l'annulation d'un de ces rendez-vous avec `annuler_rdv`, elle renvoie 599.

## Index 1 : `consultations (date_heure)`

- **Ce qu'il fait :** accélère la page d'accueil du site, qui affiche les 100 premiers rendez-vous triés par date.
- **Pourquoi il est là :** sans index, PostgreSQL lit et trie 1 million de lignes pour n'en garder que 100. L'index est déjà trié : il lit les 100 premières entrées et s'arrête.
- **La preuve :** la requête de la page d'accueil. Avant : Seq Scan, 82 ms. Après : Index Scan, 0,13 ms.

## Index 2 : `consultations (medecin_id, date_heure)`

- **Ce qu'il fait :** accélère `calculer_rdv_mois`, donc la page statistiques du site.
- **Pourquoi il est là :**
  - `medecin_id` est une clé étrangère, et PostgreSQL ne l'indexe pas tout seul.
  - La fonction filtre sur le médecin, puis sur une période. L'index est rangé dans cet ordre : il va directement au médecin, puis lit ses rendez-vous du mois.
- **La preuve :**
  - Le calcul pour un médecin. Avant : Seq Scan, 10,9 ms. Après : Index Only Scan, 0,06 ms.
  - La page statistiques, qui fait ce calcul pour les 200 médecins. Avant : 6,0 s. Après : 27 ms.

**Le coût :** les deux index occupent 6,7 Mo et 30 Mo, et chaque nouveau rendez-vous doit les mettre à jour. On consulte un agenda bien plus souvent qu'on ne prend rendez-vous : le compromis est rentable.
