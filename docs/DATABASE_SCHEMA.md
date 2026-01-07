# Schéma de base de données - Family Budget

## Vue d'ensemble

Base de données PostgreSQL hébergée sur Supabase.

## Tables

### accounts

Comptes bancaires (courants, épargne)

```sql
- id: text (PK)
- name: text
- owner_id: text (FK → people.id)
- current_balance: numeric (default: 0)
- bank_name: text
- target_ratio: numeric (0-100, nullable)
- target_cap: numeric (nullable)
- is_joint: boolean (default: false)
- type: enum (COURANT, EPARGNE, VIREMENT)
```

### app_settings

Paramètres globaux de l'application

```sql
- id: text (PK)
- monthly_envelope: numeric (default: 2000)
- period_value: integer (default: 4, check: > 0)
- period_type: enum (FIXED_DAYS, CALENDAR_WEEKS, CUSTOM_SPLIT)
```

### authorized_users

Whitelist des utilisateurs autorisés

```sql
- email: text (PK)
- name: text
- added_at: timestamptz (default: now())
- added_by: text
- notes: text
- avatar_url: text
- last_login_at: timestamptz
- is_allowed: boolean (default: false)
```

### categories

Catégories de dépenses/revenus

```sql
- id: text (PK)
- name: text
- sub_categories: text[] (ARRAY)
- type: enum (EXPENSE, INCOME)
```

### expense_configs

Modèles de dépenses récurrentes

```sql
- id: text (PK)
- label: text
- amount: numeric (check: > 0)
- category: text
- sub_category: text
- beneficiary_id: text (FK → people.id)
- account_id: text (FK → accounts.id)
- day_of_month: integer (1-31)
- start_month: text (format: YYYY-MM, nullable)
- end_month: text (format: YYYY-MM, nullable)
- is_extra: boolean (default: false)
- tag_ids: text[] (default: '{}')
```

### income_configs

Modèles de revenus récurrents

```sql
- id: text (PK)
- label: text
- amount: numeric (check: > 0)
- account_id: text (FK → accounts.id)
- day_of_month: integer (1-31)
- category: text
- beneficiary_id: text
- sub_category: text
- is_extra: boolean (default: false)
- is_salary: boolean (default: false)
- tag_ids: text[] (default: '{}')
- start_month: text (format: YYYY-MM, nullable)
- end_month: text (format: YYYY-MM, nullable)
```

### paid_items

Opérations pointées (récurrentes + variables)

```sql
- instance_id: text (PK)
- amount: numeric
- payment_date: date
- account_id: text (FK → accounts.id)
- beneficiary_id: text (FK → people.id, nullable)
- label: text
- category: text
- sub_category: text
- is_variable: boolean (default: false)
- is_extra: boolean (default: false)
- is_waiting: boolean (default: false)
- comments: text
- is_salary: boolean (default: false)
- tag_ids: text[] (default: '{}')
- position: bigint (default: 0)
- type: enum (EXPENSE, INCOME)
```

### people

Membres du foyer

```sql
- id: text (PK)
- name: text
- is_child: boolean (default: false)
```

### saved_labels

Libellés suggérés pour la saisie rapide

```sql
- id: text (PK, default: gen_random_uuid())
- name: text (UNIQUE)
- type: text
- is_expense: boolean (default: true)
```

### tags

Tags pour catégorisation avancée

```sql
- id: text (PK)
- name: text
- color: text
```

### transfers

Virements internes entre comptes

```sql
- id: text (PK)
- date: date
- label: text
- amount: numeric (check: > 0)
- source_account_id: text (FK → accounts.id)
- destination_account_id: text (FK → accounts.id)
- created_at: timestamptz (default: now())
- position: bigint (default: 0)
```

## Types ENUM personnalisés

### account_type

- COURANT
- EPARGNE
- VIREMENT

### period_type

- FIXED_DAYS
- CALENDAR_WEEKS
- CUSTOM_SPLIT

### transaction_type

- EXPENSE
- INCOME

## Conventions

- **IDs** : `text` (format: préfixe + timestamp ou UUID)
- **Montants** : `numeric` (précision décimale)
- **Dates** : `date` pour les opérations, `timestamptz` pour les timestamps
- **Arrays** : Syntaxe PostgreSQL `text[]`
- **Cascades** : Les FK utilisent généralement `ON DELETE CASCADE` (implicite dans Supabase)
