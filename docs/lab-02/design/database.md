# Database Design Schema

## Realated File 
```text
server
├── prisma
│   ├── schema.prisma
│   └── seed.ts
```

## Data Tables

### Ticket

| Column | Type | Keys & Constraints |
| :--- | :--- | :--- |
| `id` | int | `PK`, `Unique` |
| `code` | text | `Unique` (Format: e.g., `TCK-YYYY-XXXXXX`) |
| `created_date` | datetime | |
| `summary` | text | |
| `description` | text | |
| `resolution_summary` | text | |
| `category_id` | int | `FK` to `Category(id)` |
| `requested_priority_id` | int | `FK` to `Priority(id)` |
| `it_priority_id` | int | `FK` to `Priority(id)` |
| `current_status_id` | int | `FK` to `Status(id)` |
| `ticket_owner_id` | int | `FK` to `Employee(id)` |
| `last_updated_date` | datetime | |

---

### Category

| Column | Type | Keys & Constraints |
| :--- | :--- | :--- |
| `id` | int | `PK`, `Unique` |
| `name` | text | `Unique` |

---

### Priority

| Column | Type | Keys & Constraints |
| :--- | :--- | :--- |
| `id` | int | `PK`, `Unique` |
| `name` | text | `Unique` (Values: High, Medium, Low) |

---

### Status

| Column | Type | Keys & Constraints |
| :--- | :--- | :--- |
| `id` | int | `PK`, `Unique` |
| `name` | text | `Unique` (Values: Open, In Progress, Pending, Resolved) |

---

### Employee

| Column | Type | Keys & Constraints |
| :--- | :--- | :--- |
| `id` | int | `PK`, `Unique` |
| `code` | text | `Unique` |
| `name` | text | |
| `created_date` | datetime | |

**Sample Data (10 Names):**
1. Sarah Connor
2. John Doe
3. Jane Smith
4. Alice Johnson
5. Robert Chen
6. Emily Davis
7. Michael Brown
8. David Wilson
9. Sophia Martinez
10. James Taylor

---

### Public Comment

| Column | Type | Keys & Constraints |
| :--- | :--- | :--- |
| `id` | int | `PK`, `Unique` |
| `ticket_id` | int | `FK` to `Ticket(id)` |
| `created_date` | datetime | |
| `owner_id` | int | `FK` to `Employee(id)` |
| `message` | text | |

---

### Internal Comment

| Column | Type | Keys & Constraints |
| :--- | :--- | :--- |
| `id` | int | `PK`, `Unique` |
| `ticket_id` | int | `FK` to `Ticket(id)` |
| `created_date` | datetime | |
| `owner_id` | int | `FK` to `Employee(id)` |
| `message` | text | |

---

### Attachment

| Column | Type | Keys & Constraints |
| :--- | :--- | :--- |
| `id` | int | `PK`, `Unique` |
| `ticket_id` | int | `FK` to `Ticket(id)` |
| `created_date` | datetime | |
| `owner_id` | int | `FK` to `Employee(id)` |
| `file_name` | text | |
| `file_url` | text | Store file path/S3 link |
| `file_type` | text | Allowed: `.jpg`, `.png`, `.webp`, `.pdf` |
| `file_size_bytes` | int | Max 5MB (5,242,880 bytes) |

---

### Service Action

| Column | Type | Keys & Constraints |
| :--- | :--- | :--- |
| `id` | int | `PK`, `Unique` |
| `ticket_id` | int | `FK` to `Ticket(id)` |
| `created_date` | datetime | |
| `owner_id` | int | `FK` to `Employee(id)` |
| `message` | text | |

---

### Event Log

| Column | Type | Keys & Constraints |
| :--- | :--- | :--- |
| `id` | int | `PK`, `Unique` |
| `ticket_id` | int | `FK` to `Ticket(id)` |
| `created_date` | datetime | |
| `owner_id` | int | `FK` to `Employee(id)` |
| `message` | text | Details of the state change |

---