# Database Migration Runner Skill

## Purpose

Create and manage Prisma migrations for Echoes MVP #1.

Database:

```text
PostgreSQL
```

ORM:

```text
Prisma
```

---

# Current MVP Schema

```prisma
model VoiceNote {
  id        String   @id @default(uuid())
  audioUrl  String
  format    String
  duration  Int
  createdAt DateTime @default(now())

  @@index([createdAt])
}
```

Duration unit: seconds.
Format: `webm` or `mp4`.

---

# Responsibilities

When asked to create a migration:

1. Backup current state
2. Inspect current schema
3. Compare proposed changes
4. Generate migration
5. Validate migration safety
6. Preserve existing data
7. Apply migration
8. Verify migration success

---

# Migration Workflow

## Step 1 — Backup

Before any migration:

```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

Or use Supabase dashboard to create backup.

---

## Step 2 — Update Schema

Update:

```prisma
schema.prisma
```

Example change:

```prisma
model VoiceNote {
  id        String   @id @default(uuid())
  audioUrl  String
  format    String
  duration  Int
  createdAt DateTime @default(now())

  @@index([createdAt])
}
```

---

## Step 3 — Generate Migration

```bash
npx prisma migrate dev --name descriptive_name
```

---

## Step 4 — Review SQL

Open generated SQL file. Verify:

* Constraints are correct
* Indexes are created
* Defaults are set
* No data loss possible
* Nullability is correct

---

## Step 5 — Test Locally

```bash
npx prisma migrate dev
```

Verify:

* Migration applies without errors
* Existing data preserved
* New fields have correct defaults
* Queries work as expected

---

## Step 6 — Apply to Production

```bash
npx prisma migrate deploy
```

NEVER use `prisma db push` in production.

---

## Step 7 — Verify

After migration:

```bash
npx prisma studio
```

Check:

* Table structure correct
* Indexes exist
* Data intact
* New fields populated

---

# Naming Convention

Use descriptive snake_case names.

Examples:

```text
create_voice_note_table
add_format_field
add_created_at_index
make_duration_required
```

Avoid:

```text
update1
test
new_migration
fix
temp
```

---

# Safety Rules

Before applying migrations:

### Data Preservation

* Never delete columns without backup
* Never change types without migration path
* Always provide defaults for new required fields

### Nullability

* New required fields need default value
* Converting nullable to required needs data backfill

### Defaults

* Provide sensible defaults
* Document default behavior

---

# Rollback Strategy

If migration fails:

### Development

```bash
npx prisma migrate reset
```

Then re-apply all migrations.

### Production

1. Restore from backup
2. Fix migration file
3. Re-deploy

Never attempt to manually revert production migrations.

---

# Conflict Resolution

If migration conflicts occur:

1. Pull latest schema from database
2. Compare with local schema
3. Resolve differences
4. Generate new migration

```bash
npx prisma db pull
npx prisma migrate dev --name resolve_conflict
```

---

# Index Management

When adding indexes:

```prisma
@@index([fieldName])
```

For compound indexes:

```prisma
@@index([field1, field2])
```

Name convention:

```text
add_{table}_{field}_index
```

---

# Foreign Key Management

When adding relations:

```prisma
model VoiceNote {
  id       String @id @default(uuid())
  authorId String
  author   Author @relation(fields: [authorId], references: [id])
}
```

Always:

* Add index on foreign key
* Handle existing data
* Consider cascade rules

---

# Production Rule

Never run:

```bash
prisma db push
```

against production.

Use:

```bash
npx prisma migrate deploy
```

---

# MVP Guardrail

Do not add tables for:

* users
* profiles
* reactions
* comments
* notifications
* messages

unless the PRD is updated.

The VoiceNote model is the only required model for MVP #1.

---

# Post-Migration Checklist

After every migration:

* [ ] Backup created
* [ ] Migration SQL reviewed
* [ ] Tested locally
* [ ] Applied to production
* [ ] Verified in Prisma Studio
* [ ] Data integrity confirmed
* [ ] Indexes exist
* [ ] Application works correctly
