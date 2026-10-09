# Partie de données, fonction, index

*(Sections à recopier dans le `README.md` du groupe.)*

## Les données

- **Ce qu'elles font :** 50 médecins et 100 000 consultations générés avec `generate_series`, à raison de 20 créneaux de 30 min par jour (8 h - 18 h) sur 100 jours.
- **Pourquoi elles sont là :** avec quelques lignes, PostgreSQL lit toujours toute la table. Il faut du volume pour qu'un index change quelque chose.
- **La preuve :** `SELECT count(*) FROM consultations;` renvoie 100 004.

## La fonction `calculer_rdv_mois`

- **Ce qu'elle fait :** compte les rendez-vous non annulés d'un médecin sur un mois donné.
- **Pourquoi elle est là :** la statistique est calculée de la même façon partout (interface, secrétariat, direction), au lieu d'être réécrite dans chaque programme.
- **La preuve :** `SELECT calculer_rdv_mois(42, '2026-12-01');` renvoie 620. Après l'annulation d'un de ces rendez-vous avec `annuler_rdv`, elle renvoie 619.

## Index 1 : `consultations (date_heure)`

- **Ce qu'il fait :** accélère l'affichage du planning d'une journée.
- **Pourquoi il est là :** une journée représente 1 % des consultations. Le filtre est sélectif, donc l'index va directement aux bonnes lignes.
- **La preuve :** les consultations du 15 novembre. Avant : Seq Scan, 6,7 ms. Après : Index Scan, 0,14 ms.

## Index 2 : `consultations (medecin_id)`

- **Ce qu'il fait :** accélère l'agenda d'un médecin et la fonction `calculer_rdv_mois`.
- **Pourquoi il est là :** `medecin_id` est une clé étrangère, et PostgreSQL ne l'indexe pas tout seul. Un médecin représente 2 % des consultations.
- **La preuve :** les consultations du médecin 42. Avant : Seq Scan, 5,5 ms. Après : Bitmap Index Scan, 1,2 ms.

**Un index écarté, sur `medecins (nom)` :** la table ne compte que 50 lignes, et PostgreSQL continue de la lire en entier même avec un index.
