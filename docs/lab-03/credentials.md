# TokTickIT — Local Development Credentials (Lab 3)

This document provides credentials for seeded development accounts to be used in local testing and evaluation.

> [!NOTE]
> All accounts in this local environment use the standard development password:
> **`Password123!`**
> This password complies with the password policy: at least 8 characters, containing uppercase, lowercase, a digit, and a special character.
> Passwords are stored in the database hashed with bcrypt (`passwordHash`). Plaintext passwords are never logged, stored, or returned by any API.

---

## Seeded User Accounts Summary

| Name | Role | Email | Status | Initial Password Required (`mustChangePassword`) | Description |
|---|---|---|---|:---:|---|
| **Elrond Half-elven** | `ADMINISTRATOR` | `elrond@rivendell.example.com` | Active | No | Sole active Administrator for user management and admin protection tests |
| **Arwen Undómiel** | `IT_STAFF` | `arwen@rivendell.example.com` | Active | No | Primary IT Staff member handling ticket triage, ownership, and priority |
| **Faramir, Captain of Gondor** | `IT_STAFF` | `faramir@gondor.example.com` | Active | No | Secondary IT Staff member for reassignment and notes testing |
| **Haldir of Lórien** | `IT_STAFF` | `haldir@lothlorien.example.com` | Active | No | IT Staff member for queue operations |
| **Denethor II, Steward of Gondor** | `IT_STAFF` | `denethor@gondor.example.com` | **Inactive** | No | Inactive IT Staff for testing ownership assignment rejections (BR-14) |
| **Saruman the White** | `IT_STAFF` | `saruman@isengard.example.com` | **Inactive** | No | Inactive IT Staff |
| **Frodo Baggins** | `REQUESTER` | `frodo.b@shiremail.example.com` | Active | No | Primary Requester (owner of Ticket `TKT-2026-000001`) |
| **Samwise Gamgee** | `REQUESTER` | `sam.gamgee@shiremail.example.com` | Active | No | Requester (owner of Ticket `TKT-2026-000002`) |
| **Aragorn, Son of Arathorn** | `REQUESTER` | `a.elessar@gondor.example.com` | Active | No | Requester (Lab 2 carryover identity) |
| **Legolas Greenleaf** | `REQUESTER` | `legolasg@woodland.example.com` | Active | No | Requester (owner of Ticket `TKT-2026-000005`) |
| **Gimli, Son of Glóin** | `REQUESTER` | `gimli.o@erebor.example.com` | Active | No | Requester (owner of Ticket `TKT-2026-000006`) |
| **Boromir, Son of Denethor** | `REQUESTER` | `boromir@gondor.example.com` | Active | No | Requester (Lab 2 carryover identity) |
| **Meriadoc Brandybuck** | `REQUESTER` | `merry.b@shiremail.example.com` | Active | **Yes** | Requester with initial password forcing mandatory change flow (BR-02 / AC-02) |
| **Peregrin Took** | `REQUESTER` | `pippin.t@shiremail.example.com` | Active | No | Requester (Lab 2 carryover identity) |
| **Galadriel** | `REQUESTER` | `galadriel@lothlorien.example.com` | Active | No | Requester (Lab 2 carryover identity) |
| **Éowyn** | `REQUESTER` | `eowyn.r@rohan.example.com` | Active | No | Requester (Lab 2 carryover identity) |
| **Gandalf the Grey** | `REQUESTER` | `gandalf@istari.example.com` | **Inactive** | No | Inactive Requester account for testing inactive login rejection (BR-10 / AC-06) |
| **Gollum** | `REQUESTER` | `smeagol@goblinmail.example.com` | **Inactive** | No | Inactive Requester account |

---

## Role Counts Verification (§5.3 Handout)

- **Requesters**: 10 active (minimum 4 required), 2 inactive (minimum 1 required).
- **IT Staff**: 3 active (minimum 3 required), 2 inactive (minimum 1 required).
- **Administrator**: 1 active (minimum 1 required).

