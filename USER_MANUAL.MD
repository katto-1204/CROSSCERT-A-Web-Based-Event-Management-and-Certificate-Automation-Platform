<div align="center">

<img src="https://hcdc.edu.ph/wp-content/uploads/2021/04/hcdc-logo.png" width="80" alt="HCDC Logo" />

# CROSSCERT
## User Manual
### Web-Based Event Management & Certificate Automation Platform

**Holy Cross of Davao College — Office of the Vice President for Academic Affairs**

---

*Version 1.0 — March 2026*

</div>

---

## 📋 Table of Contents

1. [About This Manual](#about-this-manual)
2. [System Overview](#system-overview)
3. [Interaction Framework](#interaction-framework)
   - [Norman's Model of Interaction](#normans-model-of-interaction)
   - [ACM Framework (User–Input–System–Output)](#acm-framework)
4. [User Roles](#user-roles)
5. [Getting Started](#getting-started)
   - [Accessing the Platform](#accessing-the-platform)
   - [Creating an Account](#creating-an-account)
   - [Signing In](#signing-in)
6. [Admin Guide](#admin-guide)
   - [Dashboard](#admin-dashboard)
   - [Managing Events](#managing-events)
   - [Managing Participants](#managing-participants)
   - [QR Attendance Check-In](#qr-attendance-check-in)
   - [Evaluations](#evaluations)
   - [Certificates](#certificates)
   - [Insights & Analytics](#insights--analytics)
   - [Settings](#admin-settings)
7. [Participant Guide](#participant-guide)
   - [Dashboard](#participant-dashboard)
   - [Discover Events](#discover-events)
   - [Registering for an Event](#registering-for-an-event)
   - [Your Digital Ticket (QR Pass)](#your-digital-ticket-qr-pass)
   - [My Events](#my-events)
   - [Bookmarks](#bookmarks)
   - [Certificates](#participant-certificates)
   - [Settings](#participant-settings)
8. [Core Interaction Flows](#core-interaction-flows)
   - [Flow A — Event Creation Lifecycle](#flow-a--event-creation-lifecycle)
   - [Flow B — Participant Registration & Check-In](#flow-b--participant-registration--check-in)
   - [Flow C — Evaluation & Certificate Issuance](#flow-c--evaluation--certificate-issuance)
9. [System Status Messages](#system-status-messages)
10. [Troubleshooting](#troubleshooting)
11. [Glossary](#glossary)

---

## About This Manual

This manual is designed using **Norman's Model of Interaction** and the **ACM (User–Computer Interaction) Framework** to give you a clear, intuitive understanding of how to use **CROSSCERT**.

> **Goal:** Every interaction in this guide is described as a simple loop:
> **User Intent → User Action → System Response → User Interpretation**

Whether you are an **Admin** managing events or a **Participant** attending one, this guide walks you through every step in plain language.

---

## System Overview

**CROSSCERT** is a next-generation, web-based platform that digitizes the full lifecycle of institutional events — from creation and registration to attendance tracking and automated certificate delivery.

### Key Features at a Glance

| Feature | Who Uses It | What It Does |
|---|---|---|
| 🗂️ Event Management | Admin | Create, manage, publish events with status control |
| 🎫 Digital Tickets | Participant | Receive encrypted QR access passes upon registration |
| 📡 QR Attendance | Admin | Scan participant QR codes for real-time check-in/out |
| ⭐ Evaluations | Participant | Submit post-event feedback to trigger certificate release |
| 📄 Certificates | Both | Auto-generate and deliver hi-res PDF certificates via email |
| 📊 Insights | Admin | View attendance, engagement, and participation analytics |
| 🌙 Dark/Light Mode | Both | Toggle theme for your preferred display environment |

### Technology Stack

```
Frontend  →  Next.js 15  |  TypeScript  |  Tailwind CSS  |  Radix UI
Backend   →  Django 5.1  |  Python      |  ReportLab PDF
Database  →  PostgreSQL / SQLite
Messaging →  Automated SMTP (Email Delivery)
```

---

## Interaction Framework

This manual aligns with **two internationally recognized frameworks** for human-computer interaction.

---

### Norman's Model of Interaction

Donald Norman's model defines a **seven-stage cycle** of interaction. Every feature in CROSSCERT is mapped to these stages so users always know what to do, what is happening, and what to expect.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NORMAN'S 7-STAGE CYCLE                           │
│                                                                     │
│   1. GOAL          →  What do I want to accomplish?                 │
│   2. PLAN          →  What are my options?                          │
│   3. SPECIFY       →  What action do I take?                        │
│   4. PERFORM       →  I click / type / scan                         │
│   5. PERCEIVE      →  What does the system show me?                 │
│   6. INTERPRET     →  What does the feedback mean?                  │
│   7. COMPARE       →  Did the system do what I intended?            │
└─────────────────────────────────────────────────────────────────────┘
```

**Example — Registering for an Event:**

| Stage | User Experience in CROSSCERT |
|---|---|
| **1. Goal** | "I want to attend the upcoming seminar." |
| **2. Plan** | Navigate to Events list, find the seminar |
| **3. Specify** | Click the event card to open its landing page |
| **4. Perform** | Click **"Register Now"** button |
| **5. Perceive** | A success modal appears; QR ticket delivered to email |
| **6. Interpret** | "My registration is confirmed." |
| **7. Compare** | QR ticket is visible in **My Events** — goal achieved ✅ |

---

### ACM Framework

The **ACM (Association for Computing Machinery) HCI Framework** models interaction as a continuous loop between the user and the system. CROSSCERT is built around this simple loop:

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   👤 USER                                                        ║
║     │  (Has a goal, sees the interface)                          ║
║     ▼                                                            ║
║   ⌨️ INPUT                                                       ║
║     │  (Clicks button, fills form, scans QR, submits evaluation) ║
║     ▼                                                            ║
║   ⚙️ SYSTEM PROCESS                                              ║
║     │  (Validates, stores, computes, generates, sends)           ║
║     ▼                                                            ║
║   📤 OUTPUT                                                      ║
║     │  (Confirmation, ticket, certificate, analytics report)     ║
║     ▼                                                            ║
║   👤 USER (interprets output, achieves goal or repeats)         ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

This cycle repeats for every interaction in the platform.

---

## User Roles

CROSSCERT has two primary user roles:

```
┌──────────────────────────────────────────────────────────────┐
│ 🔴 ADMIN                    │ 🔵 PARTICIPANT                  │
│─────────────────────────────│───────────────────────────────│
│ • Create & manage events    │ • Discover & browse events     │
│ • Control event lifecycle   │ • Register for events          │
│ • Scan QR for attendance    │ • Receive digital QR ticket    │
│ • Review evaluations        │ • Submit post-event evaluation │
│ • Generate certificates     │ • Download PDF certificate     │
│ • View analytics/insights   │ • Manage bookmarks             │
│ • Manage system settings    │ • View personal settings       │
└──────────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Accessing the Platform

Open your web browser and navigate to the CROSSCERT platform URL provided by your institution. You will see the **CROSSCERT landing page** with an animated splash screen and the institutional branding.

The landing page shows a scrolling marquee of HCDC departments:
`STE · CET · SBME · CHATME · HUSOCOM · COME · CCJE`

---

### Creating an Account

> 📌 **Norman's Stage:** Goal → Plan → Specify → Perform

**Step 1.** From the landing page, click **"Sign Up"** in the top navigation bar.

**Step 2.** Fill in the registration form:

| Field | Description |
|---|---|
| Full Name | Your complete name (must match institutional records) |
| Email Address | Your institutional or personal email |
| Department | Select your department from the dropdown |
| Password | Minimum 8 characters, mix of letters and numbers |
| Confirm Password | Re-enter your password |

**Step 3.** Click **"Create Account"**.

**System Output:** A confirmation email is sent to your address. Your account is now active.

> ⚠️ **Note:** Registration validation ensures participant eligibility — only accounts associated with the institution can access non-public event features.

---

### Signing In

**Step 1.** Click **"Sign In"** from the navigation bar.

**Step 2.** Enter your **Email** and **Password**.

**Step 3.** Click **"Sign In"**.

**System Output:** You are redirected to your role-specific **Dashboard** automatically.

| If you are... | You land on... |
|---|---|
| Admin | `/admin/dashboard` |
| Participant | `/participant/dashboard` |

**Forgot Password?** Click the "Forgot Password" link on the Sign In page. Enter your email and follow the reset instructions sent to your inbox.

---

## Admin Guide

### Admin Dashboard

`📍 Path: /admin/dashboard`

The Admin Dashboard is your **command center**. It gives you a snapshot of all active operations.

```
USER GOAL:       Get an overview of platform activity
USER INPUT:      Navigate to Dashboard
SYSTEM PROCESS:  Queries active events, registration counts, attendance stats
SYSTEM OUTPUT:   Summary cards with real-time data
```

**What you see on the Dashboard:**
- 📅 Upcoming events and their current status
- 👥 Total registered participants
- ✅ Recent check-in activity
- 📊 Quick statistics (events created, certificates issued)

**Admin Navigation Sidebar:**

| Icon | Section | Purpose |
|---|---|---|
| 🟥 Dashboard | `/admin/dashboard` | Overview & stats |
| 🟧 Events | `/admin/events` | Create & manage events |
| 🟦 Participants | `/admin/participants` | View all participants |
| 🟩 Attendance | `/admin/checkin` | QR scanning for check-in |
| 🟨 Evaluations | `/admin/evaluations` | Review feedback submissions |
| 🟪 Certificates | `/admin/certificates` | Manage certificate generation |
| 🩷 Insights | `/admin/insights` | Analytics & reporting |
| ⬜ Settings | `/admin/settings` | Platform configuration |

---

### Managing Events

`📍 Path: /admin/events`

#### Creating a New Event

```
USER INPUT   →  Click "Create Event" button
SYSTEM PROCESS →  Opens event creation form
USER INPUT   →  Fill in event details & submit
SYSTEM PROCESS →  Validates data, creates event in Draft state
SYSTEM OUTPUT →  Event appears in events list with "Draft" status
```

**Event Creation Form Fields:**

| Field | Description |
|---|---|
| Event Name | Title of the event |
| Description | Detailed description for participants |
| Department | Organizing department (e.g., STE, CET) |
| Date & Time | Start and end datetime |
| Location | Venue or online meeting link |
| Cover Image | Upload a banner image for the event page |
| Theme Color | Select departmental color for branding |
| Slots | Maximum number of registrations allowed |

#### Event Lifecycle / Status Control

CROSSCERT uses a **state-driven management** system. Every event passes through defined statuses:

```
  ┌─────────┐     ┌───────────┐     ┌──────┐     ┌────────┐     ┌───────────┐
  │  DRAFT  │ ──► │ SCHEDULED │ ──► │ LIVE │ ──► │ PAUSED │ ──► │ CONCLUDED │
  └─────────┘     └───────────┘     └──────┘     └────────┘     └───────────┘
```

| Status | Meaning | Participant Can Register? |
|---|---|---|
| **Draft** | Event is being set up | No |
| **Scheduled** | Event is published and upcoming | ✅ Yes |
| **Live** | Event is currently happening | QR check-in active |
| **Paused** | Temporarily suspended | No new check-ins |
| **Concluded** | Event has ended | Evaluations open |

**To change event status:**
1. Go to `/admin/events`
2. Click the event you want to manage
3. Use the **Status** control button to advance or revert the state

#### Editing an Event

1. From the Events list, click the **Edit (pencil)** icon on any event card
2. Modify the necessary fields
3. Click **"Save Changes"**

> ✅ **System feedback:** A success toast message confirms the update.

#### Deleting an Event

1. From the Events list, click the **Delete** icon
2. Confirm the action in the confirmation dialog
3. The event and all associated data are removed

---

### Managing Participants

`📍 Path: /admin/participants`

```
USER GOAL:       See who has registered for events
USER INPUT:      Navigate to Participants section
SYSTEM PROCESS:  Fetches all registered user records
SYSTEM OUTPUT:   Searchable, filterable participant table
```

**What you can do:**
- 🔍 **Search** participants by name or email
- 🏷️ **Filter** by department or event
- 👤 **View** individual participant profiles and their event history
- ❌ **Remove** a participant from a specific event (if needed)

---

### QR Attendance Check-In

`📍 Path: /admin/checkin`

This is the **attendance management** hub. When an event goes **Live**, admins use this module to scan participant QR passes.

```
USER GOAL:       Record who attended the event
USER INPUT:      Open camera scanner, point at participant's QR code
SYSTEM PROCESS:  Decodes QR → Validates participant eligibility →
                 Records timestamp → Updates attendance log
SYSTEM OUTPUT:   ✅ "Check-In Successful" or ⚠️ "Already Checked In"
```

#### Check-In Flow

```
  ADMIN opens /admin/checkin
       │
       ▼
  Select active Event from dropdown
       │
       ▼
  Click "Start Scanner" (camera activates)
       │
       ▼
  Point camera at Participant's QR ticket
       │
       ▼
  ┌─────────────────────────────────┐
  │  Is QR valid & not yet scanned? │
  └────────────┬────────────────────┘
               │
         ┌─────┴──────┐
         ▼            ▼
     ✅ SUCCESS    ⚠️ ERROR
   Attendance     (Already checked in /
   Recorded       Invalid / Wrong event)
```

#### Check-Out Flow

After an event concludes, the same scanner can be used for **check-out** to capture the full attendance duration.

> 💡 **Intelligent Validation:** The system prevents sequence errors — a participant cannot check out before checking in.

---

### Evaluations

`📍 Path: /admin/evaluations`

After an event is **Concluded**, participants are prompted to submit evaluations. Admins review these submissions here.

```
USER GOAL:       Review participant feedback for a concluded event
USER INPUT:      Navigate to Evaluations, select event
SYSTEM PROCESS:  Fetches all submitted evaluation forms for the event
SYSTEM OUTPUT:   List of evaluation responses with ratings & comments
```

**Evaluation data includes:**
- ⭐ Rating (star-based score)
- 💬 Written comments/feedback
- 👤 Participant name and department
- 📅 Submission timestamp

> 📌 **Important:** Participant certificates are **NOT generated** until they have submitted an evaluation. This is by design — integrity-first certification.

---

### Certificates

`📍 Path: /admin/certificates`

```
USER GOAL:       Issue certificates to participants who completed evaluations
USER INPUT:      Navigate to Certificates, select event, click "Generate"
SYSTEM PROCESS:  → Checks evaluation submission status per participant
                 → Runs PDF generation engine (ReportLab)
                 → Applies event branding, participant name, date
                 → Sends PDF via SMTP to participant email
                 → Saves to participant's digital portfolio
SYSTEM OUTPUT:   "Certificates issued to X participants"
```

**Certificate Generation Steps:**

| Step | Action |
|---|---|
| 1️⃣ | Select the **Concluded** event |
| 2️⃣ | Review the list of evaluation-eligible participants |
| 3️⃣ | Click **"Generate Certificates"** |
| 4️⃣ | System generates high-resolution PDF per participant |
| 5️⃣ | Each PDF is emailed automatically and stored in portfolio |

---

### Insights & Analytics

`📍 Path: /admin/insights`

```
USER GOAL:       Understand participation trends and event performance
USER INPUT:      Navigate to Insights
SYSTEM PROCESS:  Aggregates attendance, registration, evaluation data
SYSTEM OUTPUT:   Visual charts, graphs, and summary statistics
```

**Insights include:**
- 📈 Registration rates per event
- 📊 Attendance vs. registered ratio
- ⭐ Average evaluation scores per event
- 🏬 Department-wise participation breakdown
- 📄 Certificate issuance completion rate

---

### Admin Settings

`📍 Path: /admin/settings`

Configure platform-wide preferences:
- 🌙 **Theme** — Switch between Light and Dark mode
- 🔒 **Account Security** — Change password
- 📧 **Email Configuration** — SMTP settings for certificate delivery
- 🏫 **Institutional Branding** — Upload logos and color schemes

---

## Participant Guide

### Participant Dashboard

`📍 Path: /participant/dashboard`

Your personal hub showing:
- 🎟️ Upcoming events you're registered for
- 📬 Recent notifications (new events, certificate ready)
- 📄 Quick access to your certificates
- 🔔 System announcements from admins

---

### Discover Events

`📍 Path: /participant/events` and `/discover`

```
USER GOAL:       Find events I want to attend
USER INPUT:      Browse events list, use search or filter
SYSTEM PROCESS:  Fetches all Scheduled/Live events
SYSTEM OUTPUT:   Grid of event cards with name, date, department, slots
```

**Event cards display:**
- 📌 Event Name
- 📅 Date & Time
- 🏫 Organizing Department (with color coding)
- 🎯 Available slots remaining
- 🔖 Bookmark button

---

### Registering for an Event

This is the **core participant interaction** flow.

```
  ╔════════════════════════════════════════════════════════╗
  ║  INTERACTION FLOW — EVENT REGISTRATION                 ║
  ╠════════════════════════════════════════════════════════╣
  ║  👤 USER GOAL:     I want to attend this event         ║
  ║                                                        ║
  ║  ⌨️ INPUT:                                             ║
  ║     1. Click event card from Events list               ║
  ║     2. Review event details on the landing page        ║
  ║     3. Click "Register Now" button                     ║
  ║                                                        ║
  ║  ⚙️ SYSTEM PROCESS:                                    ║
  ║     • Verifies user is authenticated                   ║
  ║     • Checks institutional eligibility                 ║
  ║     • Checks available slots                           ║
  ║     • Creates registration record                      ║
  ║     • Generates encrypted QR Digital Access Pass       ║
  ║     • Sends QR ticket to participant email             ║
  ║                                                        ║
  ║  📤 OUTPUT:                                            ║
  ║     • Success modal: "You're registered! Check email." ║
  ║     • Ticket visible in My Events section              ║
  ║     • QR pass delivered to inbox                       ║
  ╚════════════════════════════════════════════════════════╝
```

**Registration validation rules:**
- ✅ Account must be signed in
- ✅ Event must be in **Scheduled** status
- ✅ Slots must still be available
- ✅ Must not already be registered for the same event

---

### Your Digital Ticket (QR Pass)

After registering, you receive a **Digital Access Pass** — an encrypted QR code that acts as your event ID.

```
  ┌──────────────────────────────────┐
  │   🎫 CROSSCERT DIGITAL PASS      │
  │                                  │
  │   ██████████████████             │
  │   ██░░░░░░░░░░░░░██             │
  │   ██░░██████████░██  ← QR Code  │
  │   ██░░██████████░██             │
  │   ██░░░░░░░░░░░░░██             │
  │   ██████████████████             │
  │                                  │
  │   [Your Name]                    │
  │   [Event Name]                   │
  │   [Date]  |  [Department]        │
  └──────────────────────────────────┘
```

**Your QR ticket:**
- Updates **in real-time** as the event status changes
- Is **unique** — cannot be shared or duplicated
- Is **encrypted** for security

**Presenting your QR at the event:**
1. Open the email with your ticket **or** go to **My Events** in the app
2. Show the QR code to the admin scanner
3. Wait for the ✅ green confirmation sound/flash

---

### My Events

`📍 Path: /participant/my-events`

View all events you are currently registered for:

| Column | Information |
|---|---|
| Event Name | Name of the event |
| Status | Scheduled / Live / Concluded |
| Date | Event date and time |
| Attendance | Checked-In ✅ / Not Yet ⏳ |
| Evaluation | Submitted ✅ / Pending ⏳ |
| Certificate | Ready to Download 📄 / Not Yet ⏳ |

---

### Bookmarks

`📍 Path: /participant/bookmarks`

```
USER GOAL:       Save events I'm interested in for later
USER INPUT:      Click the bookmark 🔖 icon on any event card
SYSTEM PROCESS:  Associates the event with your account
SYSTEM OUTPUT:   Event appears in /participant/bookmarks list
```

Bookmarks help you track events you plan to register for. **Bookmarking ≠ Registration** — you must still click "Register Now" to secure your slot.

---

### Participant Certificates

`📍 Path: /participant/certificates`

```
USER GOAL:       Download my certificate of participation
USER INPUT:      Navigate to Certificates section
SYSTEM PROCESS:  Fetches all granted certificates from your portfolio
SYSTEM OUTPUT:   List of downloadable PDF certificates
```

**How certificates work:**

```
You Attend Event
     │
     ▼
Event is Concluded
     │
     ▼
You Submit Evaluation ← (Required step)
     │
     ▼
Admin Generates Certificates
     │
     ▼
📧 Certificate emailed to you
+
📄 Certificate appears in /participant/certificates
     │
     ▼
Click "Download" → PDF opens/saves
```

**Certificate PDF contains:**
- 🏫 HCDC Institutional Header & Seal
- 📛 Your Full Name
- 🎓 Event Title
- 📅 Date of Participation
- 🖊️ Authorized Signatories
- 🔒 Unique Certificate ID

> ✅ **System output:** High-fidelity, print-ready PDF with proportional scaling for any paper size.

---

### Participant Settings

`📍 Path: /participant/settings`

Manage your personal preferences:
- **Profile** — Update your name, department, profile photo
- **Password** — Change your account password
- **Notifications** — Control email notification preferences
- **Theme** — Toggle between Light 🌤️ and Dark 🌙 mode

---

## Core Interaction Flows

This section maps the three main system flows using the **User → Input → System → Output** model.

---

### Flow A — Event Creation Lifecycle

*For: Admin*

```
USER (Admin)              INPUT                  SYSTEM                    OUTPUT
─────────────────────────────────────────────────────────────────────────────────

Has event to organize  →  Clicks "Create Event" →  Opens creation form  →  Blank form displayed

Fills in all details   →  Submits form          →  Validates fields      →  Event saved as DRAFT
                                                    Stores in database

Ready to publish       →  Changes status to     →  Updates state         →  Event visible to
                          SCHEDULED                 Sends notifications      participants

Event day arrives      →  Changes status to     →  Enables QR scanner    →  Check-in module
                          LIVE                                               goes active

Event ends             →  Changes status to     →  Closes registration   →  Evaluations form
                          CONCLUDED                 Opens evaluation form    sent to participants
```

---

### Flow B — Participant Registration & Check-In

*For: Participant*

```
USER (Participant)        INPUT                  SYSTEM                    OUTPUT
─────────────────────────────────────────────────────────────────────────────────

Discovers event        →  Clicks event card    →  Loads event details   →  Event landing page

Wants to attend        →  Clicks "Register"    →  Validates eligibility →  ✅ Success modal
                                                   Creates ticket            QR sent to email
                                                   Generates QR

Arrives at event       →  Shows QR to scanner  →  Decodes, validates    →  ✅ "Checked In"
                                                   Logs timestamp            Attendance recorded

Event ends             →  Attends until end    →  Admin flags CONCLUDED →  Evaluation prompt
                                                                             appears
```

---

### Flow C — Evaluation & Certificate Issuance

*For: Participant then Admin*

```
USER (Participant)        INPUT                  SYSTEM                    OUTPUT
─────────────────────────────────────────────────────────────────────────────────

Sees evaluation prompt →  Opens evaluation     →  Loads feedback form   →  Star rating form
                          form                                              + comment field

Provides feedback      →  Submits evaluation   →  Stores response       →  ✅ "Thank you!"
                                                   Marks as evaluated        submission confirmed

──────────────────────────────────────────────────────────────────────────────────
USER (Admin)              INPUT                  SYSTEM                    OUTPUT
──────────────────────────────────────────────────────────────────────────────────

All evaluations in     →  Clicks "Generate     →  Checks all evaluated  →  PDF engine runs
                          Certificates"            participants              per participant

                                                →  ReportLab builds     →  📧 Email sent to
                                                   hi-res PDFs              each participant

                                                →  Stores in portfolio  →  📄 Certificate
                                                                            available for
                                                                            download
```

---

## System Status Messages

| Message | Meaning | What to Do |
|---|---|---|
| ✅ "Registration Successful!" | You are registered | Check your email for the QR ticket |
| ✅ "Check-In Recorded" | Attendance captured | You may now enter the event |
| ✅ "Evaluation Submitted" | Feedback saved | Wait for certificate generation |
| ✅ "Certificate Ready" | PDF generated | Go to /participant/certificates to download |
| ⚠️ "Already Registered" | Duplicate registration detected | Check My Events for your ticket |
| ⚠️ "Event Full" | No slots remaining | Bookmark for future announcements |
| ⚠️ "Already Checked In" | QR was already scanned | Contact admin if this is an error |
| ❌ "Invalid QR Code" | Code unrecognized | Ensure you are showing the correct event ticket |
| ❌ "Evaluation Required" | Certificate blocked | Submit your evaluation first |

---

## Troubleshooting

### I did not receive my QR ticket via email

1. Check your **spam or junk folder**
2. Ensure the email address on your account is correct (Settings > Profile)
3. Go to **My Events** — the ticket is also viewable directly in the app
4. Contact your admin if the issue persists

### My QR code is not scanning

1. Ensure your screen brightness is at maximum
2. Keep the QR code flat and steady — avoid glare
3. Ask the admin to use the manual search option in the scanner

### I cannot register for an event

- Confirm the event status is **Scheduled** (not Draft/Live/Concluded)
- Confirm there are available slots (check the event card)
- Confirm you are **signed in** to your account
- Confirm you are not already registered (check My Events)

### My certificate is not appearing

- Confirm you **submitted the evaluation** for this event
- Allow a few minutes after the admin has triggered certificate generation
- Check your email (including spam) for the certificate attachment
- Refresh the `/participant/certificates` page

---

## Glossary

| Term | Definition |
|---|---|
| **Digital Access Pass** | Encrypted QR code issued upon event registration; used for check-in/out |
| **Event Lifecycle** | The sequence of statuses an event moves through: Draft → Scheduled → Live → Paused → Concluded |
| **QR Scan** | The act of capturing a participant's Digital Access Pass using the admin scanner to record attendance |
| **Evaluation** | A post-event feedback form submitted by participants; required before certificate issuance |
| **Certificate Portfolio** | A participant's personal collection of earned PDF certificates stored in the platform |
| **Check-In** | Recording that a participant has arrived at and entered the event venue |
| **Check-Out** | Recording that a participant has left the event, for attendance duration calculation |
| **SMTP** | Email delivery protocol used to send QR tickets and certificates to participant inboxes |
| **Norman's Model** | A 7-stage interaction model by Donald Norman describing how users form goals and interpret system feedback |
| **ACM Framework** | Human-Computer Interaction model defining User → Input → System → Output interaction loops |
| **HCDC** | Holy Cross of Davao College, the institution this platform serves |
| **VPAA** | Office of the Vice President for Academic Affairs, the primary system owner |

---

<div align="center">

---

## 12. UI Design & Visual Language

This section documents CROSSCERT's full visual design system — the color palette, typography, layout structure, animation engine, and component patterns — so users, administrators, and future developers understand how the interface is designed to feel **intuitive, accessible, and premium**.

---

### 12.1 Design Philosophy

CROSSCERT's interface is built around four guiding visual principles:

| Principle | How It Manifests |
|---|---|
| **Clarity** | Minimal clutter — every element on screen has a purpose |
| **Consistency** | Same color, spacing, and interaction patterns across all pages |
| **Feedback** | Every user action produces immediate, visible confirmation |
| **Delight** | Smooth animations and glassmorphism effects make the UI feel alive |

---

### 12.2 Color System

CROSSCERT uses a **dual-mode color system** — a clean light mode for daytime use and a deep dark mode for low-light environments. Colors are defined as CSS HSL variables for easy theming.

#### 🔴 Brand Primary — Red

The brand color is **Institutional Red**, matching HCDC's official identity.

```
┌─────────────────────────────────────────────────────────┐
│   MODE       │  VALUE (HSL)        │  HEX EQUIVALENT    │
│──────────────│─────────────────────│────────────────────│
│  Light Mode  │  hsl(354, 86%, 40%) │  #B80B1C           │
│  Dark Mode   │  hsl(0, 100%, 50%)  │  #FF0000           │
└─────────────────────────────────────────────────────────┘
```

Used for: primary buttons, active sidebar items, accent highlights, gradients.

**Gradient form** (used on buttons and active states):
```
from-red-600 → to-rose-600
```

#### 🎨 Full Palette — Light Mode

```
┌──────────────────┬──────────────────────┬─────────────────────────┐
│ Token            │ HSL Value            │ Purpose                 │
├──────────────────┼──────────────────────┼─────────────────────────┤
│ --background     │ hsl(0, 0%, 98%)      │ Page background         │
│ --foreground     │ hsl(0, 0%, 3%)       │ Primary text            │
│ --card           │ hsl(0, 0%, 100%)     │ Card surfaces           │
│ --muted          │ hsl(0, 0%, 96%)      │ Subdued backgrounds     │
│ --muted-foreground│ hsl(0, 0%, 45%)     │ Placeholder/hint text   │
│ --border         │ hsl(0, 0%, 89.8%)    │ Dividers, input borders │
│ --primary        │ hsl(354, 86%, 40%)   │ Brand red               │
│ --ring           │ hsl(210, 100%, 50%)  │ Focus ring (blue)       │
└──────────────────┴──────────────────────┴─────────────────────────┘
```

#### 🌑 Full Palette — Dark Mode

```
┌──────────────────┬──────────────────────┬─────────────────────────┐
│ Token            │ HSL Value            │ Purpose                 │
├──────────────────┼──────────────────────┼─────────────────────────┤
│ --background     │ hsl(0, 0%, 2%)       │ Near-black page bg      │
│ --foreground     │ hsl(0, 0%, 98%)      │ Off-white text          │
│ --card           │ hsl(0, 0%, 4%)       │ Dark card surface       │
│ --border         │ hsl(0, 0%, 12%)      │ Subtle dividers         │
│ --primary        │ hsl(0, 100%, 50%)    │ Pure red accent         │
│ --ring           │ hsl(0, 100%, 50%)    │ Focus ring (red)        │
└──────────────────┴──────────────────────┴─────────────────────────┘
```

**Dark mode background layers** (landing page):
```
Base:     Pure black  (#050505)
Glow 1:   Radial red glow  →  bottom-right  (red-600/20 opacity)
Glow 2:   Radial red glow  →  top-left      (red-900/10 opacity)
Overlay:  Gradient         →  transparent → #450a0a (deep crimson)
```

---

### 12.3 Department Color Coding

Each HCDC department has a unique **glassmorphism badge** color used throughout event cards and label chips:

```
┌───────────┬──────────────────────────────┬────────────────────────┐
│ Department │ Badge Color (Tailwind)       │ Visual                 │
├───────────┼──────────────────────────────┼────────────────────────┤
│ STE        │ bg-blue-800/60              │ 🔵 Blue Glass          │
│ CET        │ bg-orange-700/60            │ 🟠 Orange Glass        │
│ SBME       │ bg-yellow-600/60            │ 🟡 Yellow Glass        │
│ CHATME     │ bg-zinc-700/60              │ ⚫ Zinc/Dark Glass     │
│ HUSOCOM    │ bg-[#6d174b]/70             │ 🟣 Deep Fuchsia Glass  │
│ COME       │ bg-sky-800/60               │ 🩵 Sky Blue Glass      │
│ CCJE       │ bg-red-800/60               │ 🔴 Red Glass           │
└───────────┴──────────────────────────────┴────────────────────────┘
```

All badges use `backdrop-blur-md` for the **glassmorphism** frosted glass effect.

---

### 12.4 Typography

CROSSCERT uses two premium typefaces loaded from **Google Fonts**:

```
┌─────────────────┬────────────────────────┬──────────────────────────┐
│ Font Family     │ Variable               │ Usage                    │
├─────────────────┼────────────────────────┼──────────────────────────┤
│ Syne            │ --font-display         │ Headings, hero text,     │
│ (wt: 400–800)   │                        │ display titles           │
├─────────────────┼────────────────────────┼──────────────────────────┤
│ Space Grotesk   │ --font-sans            │ Body text, labels,       │
│ (wt: 300–700)   │                        │ navigation, forms        │
└─────────────────┴────────────────────────┴──────────────────────────┘
```

**Type Scale:**

| Element | Style |
|---|---|
| Hero Heading (`h1`) | `text-4xl` → `text-6xl`, `font-black`, `leading-[1.1]` |
| Section Heading (`h2`) | `text-2xl` – `text-3xl`, `font-bold` |
| Body / Paragraph | `text-base` – `text-xl`, `leading-relaxed` |
| Labels / Badges | `text-xs` – `text-sm`, `font-semibold` |
| Sidebar Nav Items | `text-sm`, `font-medium` |
| Placeholder / Muted | `text-muted-foreground`, reduced opacity |

**Font Rendering Enhancement:**
```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

---

### 12.5 Layout & Spacing System

#### Page Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  ADMIN & PARTICIPANT PAGES                                           │
│                                                                      │
│  ┌────────────┐  ┌──────────────────────────────────────────────┐   │
│  │            │  │  TOPBAR  (fixed, height ~64px)               │   │
│  │  SIDEBAR   │  ├──────────────────────────────────────────────┤   │
│  │  (fixed,   │  │                                              │   │
│  │  w-64)     │  │   MAIN CONTENT AREA                          │   │
│  │            │  │   (scrollable, padding: 32px)                │   │
│  │            │  │                                              │   │
│  └────────────┘  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

#### Responsive Breakpoints

| Breakpoint | Width | Behavior |
|---|---|---|
| **xs** (mobile) | `< 640px` | Sidebar hidden, hamburger menu shown; font-size 14px |
| **sm** (small) | `640px+` | Compact layout, stacked buttons |
| **md** (tablet) | `768px+` | Sidebar transitions to visible |
| **lg** (desktop) | `1024px+` | Full two-column layouts, sidebar always visible; font-size 16px |
| **xl / 2xl** | `1280px+` | Max content width capped at `1280px–1600px` |

#### Border Radius

All cards and interactive elements use `--radius: 0.75rem` (12px) for a modern, rounded aesthetic. Buttons use `rounded-xl` (16px).

#### Spacing

- Page padding: `p-6` (24px) on desktop, `p-4` (16px) on mobile
- Card gaps: `gap-4` to `gap-6`
- Sidebar item spacing: `space-y-1` with `px-4 py-3` per item

---

### 12.6 Animation System

CROSSCERT includes a purposeful animation system — animations always serve clarity, not distraction.

#### Defined Keyframe Animations

```
┌──────────────┬────────────────────────────────────────────────────┐
│ Animation    │ Description & Usage                                │
├──────────────┼────────────────────────────────────────────────────┤
│ float        │ Gentle vertical oscillation (0 → -20px → 0)       │
│              │ Used on: hero visual elements                      │
├──────────────┼────────────────────────────────────────────────────┤
│ blob         │ Organic scale + translate morphing                 │
│              │ Used on: background glow decorations               │
├──────────────┼────────────────────────────────────────────────────┤
│ scan         │ Top → bottom sweep, opacity fade                   │
│              │ Used on: QR check-in scanner overlay               │
├──────────────┼────────────────────────────────────────────────────┤
│ marqueeSlide │ Infinite left scroll (translateX 0 → -50%)        │
│              │ Used on: department badge ticker strip             │
└──────────────┴────────────────────────────────────────────────────┘
```

#### Page Transitions (Framer Motion)

The landing page uses **Framer Motion** for:
- **Splash screen entrance** — logo scales in (`scale 0.8 → 1`, `opacity 0 → 1`)
- **Splash screen exit** — slides up and fades (`y: -100`, `opacity: 0`) over `0.8s`
- Transition easing: `[0.76, 0, 0.24, 1]` (Expo ease)

#### Interactive Micro-animations

| Element | Hover/Active Effect |
|---|---|
| Sidebar nav items | Icon scales up (`group-hover:scale-110`) |
| Logo | Scales on hover (`group-hover:scale-105`) |
| Primary buttons | Shadow deepens (`shadow-red-500/30 → /40`) |
| Logout button | Icon slides left (`group-hover:-translate-x-1`) |
| Mobile menu toggle | Smooth slide-in (`transform transition-transform duration-300`) |

#### 3D Lanyard (Landing Page)

The landing page features an interactive **physics-based 3D lanyard** built with:
- **React Three Fiber** — 3D rendering engine
- **@react-three/rapier** — real-time physics (gravity, rope joints, colliders)
- The CROSSCERT ID card is **draggable** — users can grab and swing it

---

### 12.7 Component Design Patterns

#### Glass Effect (`.glass` utility)

Used on overlaying UI panels, badges, and modals:

```css
background: white/5 (light) or black/20 (dark)
backdrop-filter: blur(24px)
border: 1px solid white/10
```

#### Sidebar — Active State

When a navigation item is active (current page):
```
Background: gradient from-red-600 to-rose-600
Text: white
Right edge: white bar indicator (w-1, rounded-l-full)
Shadow: shadow-red-500/30
```

#### Sidebar — Inactive State

```
Text color: neutral-700 (light) / neutral-300 (dark)
Hover background: neutral-100 (light) / neutral-800 (dark)
```

#### Primary Button

```
Background: hsl(var(--primary))  →  Dark Red / Pure Red
Text: white
Border radius: rounded-xl (16px)
Shadow: shadow-xl shadow-primary/20
Hover: opacity 90%
```

#### Admin Badge (footer of sidebar)

```
Background: gradient from-red-50 to-rose-50 (light)
            gradient from-red-950/30 to-rose-950/30 (dark)
Border: red-200 (light) / red-800 (dark)
Icon: Sparkles (lucide-react), red-600 / red-400
```

#### Success Modal

Displayed after key actions (registration, evaluation submission):
- Centered overlay with backdrop blur
- Green checkmark icon ✅
- Bold confirmation message
- Auto-dismisses or has a "Close" button

#### Cards

All content cards use:
```
Background:     --card token (white / near-black)
Shadow:         shadow-sm
Border radius:  rounded-xl
Border:         1px solid --border
Padding:        p-6
```

---

### 12.8 Theme Toggle

CROSSCERT supports both **Light Mode** and **Dark Mode**, toggled from the topbar or settings.

```
USER INPUT   →  Clicks 🌙 / ☀️ theme toggle button
SYSTEM        →  next-themes resolves theme, applies .dark class to <html>
SYSTEM OUTPUT →  Entire UI re-renders with dark color variables instantly
```

**All logos adapt to the active theme:**

| Theme | HCDC Logo | CROSSCERT Logo |
|---|---|---|
| Light | `/hcdc red.png` | `/crosscert-typo-black.png` |
| Dark | `/hcdc white.png` | `/crosscert-typo-white.png` |

---

### 12.9 Custom Cursor

On desktop browsers, CROSSCERT applies a custom circular cursor:

```css
Size:         20px (--cursor-size)
Shape:        circle (border-radius: 50%)
Color:        white
Blend mode:   mix-blend-mode: difference
              (inverts color over dark/light elements automatically)
Z-index:      9999 (always on top)
```

This gives the platform a premium, editorial feel distinct from the default OS cursor.

---

### 12.10 Iconography

All icons are sourced from **Lucide React** — a consistent, open-source icon set:

| Icon | Used For |
|---|---|
| `LayoutDashboard` | Dashboard navigation |
| `Calendar` | Events section |
| `Users` | Participants section |
| `QrCode` | QR Attendance/Check-In |
| `Star` | Evaluations |
| `FileText` | Certificates |
| `BarChart3` | Insights/Analytics |
| `Settings` | Settings |
| `Bookmark` | Bookmarks |
| `Award` | Participant Certificates |
| `CalendarCheck` | My Events |
| `Sparkles` | Role badge / premium indicator |
| `LogOut` | Logout button |
| `Menu` / `X` | Mobile sidebar toggle |
| `ArrowRight` | CTA buttons |

All icons are rendered at `w-5 h-5` (20px) in navigation, with color-coded accents per section.

---

## 13. Step-by-Step Feature Walkthroughs

> This section is your **complete feature guide** — every action, numbered and explained in plain steps.
> Both the **Participant** and **Admin** journeys are covered from start to finish.

---

<div align="center">

```
█▀▀ █▀█ █▀█ █▀ █▀ █▀▀ █▀▀ █▀█ ▀█▀
█▄▄ █▀▄ █▄█ ▄█ ▄█ █▄▄ ██▄ █▀▄  █
```

### 🔴 CROSSCERT — Step-by-Step User Guide

*Holy Cross of Davao College — Event Management & Certificate Automation*

</div>

---

## 👤 PART A — PARTICIPANT WALKTHROUGH

---

### 🔐 STEP 1 — Go to the Platform & Log In

```
╔══════════════════════════════════════════════════════════════════════╗
║  🌐  Open your browser → Navigate to the CROSSCERT platform URL      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  ① The CROSSCERT splash screen appears with the animated logo        ║
║  ② The landing page loads — you see the 3D lanyard and hero text     ║
║  ③ Click  [ Sign In ]  in the top navigation bar                     ║
║  ④ Enter your  Email  and  Password                                  ║
║  ⑤ Click  [ Sign In ]                                                ║
║                                                                      ║
║  ✅  OUTPUT:  You land on  /participant/dashboard                     ║
╚══════════════════════════════════════════════════════════════════════╝
```

**Don't have an account yet?**

```
① Click  [ Sign Up ]  on the navigation bar
② Fill in:  Full Name → Email → Department → Password → Confirm Password
③ Click  [ Create Account ]
④ Check your email for confirmation
⑤ Return to  [ Sign In ]  and log in
```

> 🔴 **CROSSCERT TIP:** Your department selection (STE, CET, SBME, etc.) determines which department-colored badges appear on your events.

---

### 🏠 STEP 2 — View Your Dashboard

```
  PATH: /participant/dashboard

  ┌──────────────────────────────────────────────────────────────┐
  │  🔴 CROSSCERT                              [🌙 theme] [👤]   │
  ├────────────┬─────────────────────────────────────────────────┤
  │            │                                                 │
  │  🔴 Dashboard         📌 YOUR UPCOMING EVENTS               │
  │  🟠 Events            ┌────────┐ ┌────────┐ ┌────────┐      │
  │  🟡 Bookmarks         │Event 1 │ │Event 2 │ │Event 3 │      │
  │  🟢 My Events         └────────┘ └────────┘ └────────┘      │
  │  🟣 Certificates      📬 RECENT NOTIFICATIONS               │
  │  ⬜ Settings          📄 YOUR CERTIFICATES                   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

**What to do on the Dashboard:**
1. **Check Upcoming Events** — see events you are already registered for
2. **Read Notifications** — new events or certificate-ready alerts from admin
3. **Quick-access Certificates** — recently issued PDFs are shown here
4. **Use the Sidebar** — navigate to any section using the left menu

---

### 📅 STEP 3 — Discover & Browse Events

```
  PATH: /participant/events   OR   /discover

① Click  [ Events ]  in the sidebar                          🟠
② A grid of event cards appears — each card shows:
   → Event Name
   → Date & Time
   → Department badge     (e.g. 🟠 CET, 🔵 STE, 🟡 SBME)
   → Available Slots remaining
   → Bookmark icon

③ Use the  [ Search ]  bar to find a specific event by name
④ Filter by department or date if needed
⑤ Click any event card to open its   EVENT LANDING PAGE
```

**The Event Landing Page shows:**

| Section | Contents |
|---|---|
| 📸 Cover banner | Full-width event image with department color gradient |
| 📋 Description | What the event is about |
| 📅 Date & Time | Start and end schedule |
| 📍 Location | Venue or meeting link |
| 🎯 Slots left | How many registrations are still open |
| 🔴 Register button | The main call-to-action |

---

### 🎫 STEP 4 — Register / Join an Event

```
╔═══════════════════════════════════════════════════════════════════╗
║  HOW TO JOIN AN EVENT                                             ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  ① Open the event you want to attend                              ║
║  ② Review the event details (date, location, description)         ║
║  ③ Click the red  [ Register Now ]  button                        ║
║                                                                   ║
║      System checks:                                               ║
║        ✔ Are you signed in?                                       ║
║        ✔ Is the event Scheduled?                                  ║
║        ✔ Are there slots available?                               ║
║        ✔ Are you not already registered?                          ║
║                                                                   ║
║  ④ A  ✅ SUCCESS  modal pops up:                                   ║
║     "You're registered! Check your email for your QR ticket."     ║
║  ⑤ Your QR Digital Access Pass is sent to your email             ║
║  ⑥ The event now appears in  [ My Events ]                        ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

> ⚠️ **Event Full?** — If no slots remain, the Register button is disabled. Bookmark the event to watch for announcements.

---

### 🎟️ STEP 5 — Get & Use Your QR Ticket

```
  After registering you receive a  DIGITAL ACCESS PASS  (QR ticket)

  ┌─────────────────────────────────────┐
  │       🎫 CROSSCERT                  │
  │       DIGITAL ACCESS PASS           │
  │                                     │
  │   ■■■■■■■■■■■■■■■■                  │
  │   ■ ░░░░░░░░░░░░ ■                  │
  │   ■ ░ ■■■■■■■■ ░ ■  ← Encrypted    │
  │   ■ ░ ■■■■■■■■ ░ ■     QR Code     │
  │   ■ ░░░░░░░░░░░░ ■                  │
  │   ■■■■■■■■■■■■■■■■                  │
  │                                     │
  │   Your Name                         │
  │   Event Name                        │
  │   Date  ·  Department               │
  └─────────────────────────────────────┘

  WHERE TO FIND YOUR QR TICKET:
  → In your email inbox  (check spam if not found)
  → In the app under  [ My Events ]  → click your event
```

**How to use it on the event day:**

```
① Open your QR ticket from the app or email
② Maximize your screen brightness
③ Show the QR code to the admin at the entrance
④ Admin scans with the CROSSCERT QR Scanner
⑤ ✅  Screen flashes green — "Check-In Successful"
⑥ You are now recorded as ATTENDED
```

---

### 📋 STEP 6 — View My Events

```
  PATH: /participant/my-events

① Click  [ My Events ]  in the sidebar                        🟢
② See a list of ALL events you are registered for
③ Each row shows:

   EVENT NAME     │ STATUS      │ ATTENDANCE   │ EVALUATION │ CERTIFICATE
   ─────────────────────────────────────────────────────────────────────
   Web Dev Summit │ Scheduled   │ ⏳ Not Yet   │ ⏳ Pending │ ⏳ Not Yet
   AI Seminar     │ Live        │ ✅ Checked In │ ⏳ Pending │ ⏳ Not Yet
   HCDC Fiesta    │ Concluded   │ ✅ Attended  │ ✅ Done    │ 📄 Ready!

④ Click "Download" next to any Ready certificate to get your PDF
```

---

### 🔖 STEP 7 — Bookmark Events

```
  PATH: /participant/bookmarks

① While browsing events, click the  🔖  icon on any event card
② Event is saved to your Bookmarks list
③ Click  [ Bookmarks ]  in the sidebar to view all saved events
④ When ready to register, open the event and click  [ Register Now ]

   ⚠️  NOTE: Bookmarking does NOT reserve a slot.
              You still need to Register separately.
```

---

### ⭐ STEP 8 — Submit an Evaluation

After an event ends (Concluded status), you must evaluate before receiving your certificate.

```
╔══════════════════════════════════════════════════════════╗
║  HOW TO SUBMIT YOUR EVALUATION                           ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  ① Go to  [ My Events ]                                  ║
║  ② Find the concluded event → click  [ Evaluate ]        ║
║  ③ The evaluation form opens:                            ║
║                                                          ║
║     ⭐ ⭐ ⭐ ⭐ ⭐   (click to rate)                      ║
║     ┌─────────────────────────────────┐                  ║
║     │ Share your feedback...          │                  ║
║     └─────────────────────────────────┘                  ║
║                                                          ║
║  ④ Write your comments (optional but encouraged)         ║
║  ⑤ Click  [ Submit Evaluation ]                          ║
║  ⑥ ✅  "Thank you for your feedback!"                    ║
║                                                          ║
║  🔴 This unlocks your certificate for generation.        ║
╚══════════════════════════════════════════════════════════╝
```

---

### 📄 STEP 9 — Download Your Certificate

```
  PATH: /participant/certificates

① After submitting evaluation → wait for admin to generate certificates
② You receive an email: "Your certificate is ready!"
③ Click  [ Certificates ]  in the sidebar                   🟣
④ Your issued certificates appear as cards:

   ┌────────────────────────────────────────────────┐
   │  📄  Web Dev Summit Certificate                 │
   │  Holy Cross of Davao College                   │
   │  Date: March 15, 2026                          │
   │  [ ⬇ Download PDF ]                            │
   └────────────────────────────────────────────────┘

⑤ Click  [ Download PDF ]  → high-resolution certificate opens/saves
⑥ Certificate is print-ready at any paper size
```

**Your certificate contains:**
```
┌──────────────────────────────────────────────────────┐
│   🏫  HOLY CROSS OF DAVAO COLLEGE                    │
│       Office of the Vice President for Academic Affairs│
│                                                      │
│         CERTIFICATE OF PARTICIPATION                 │
│                                                      │
│   This is to certify that                           │
│             [ YOUR FULL NAME ]                       │
│   has successfully participated in                   │
│             [ EVENT TITLE ]                          │
│   held on   [ DATE ]                                 │
│                                                      │
│   ___________________    ___________________         │
│   Authorized Signatory   Authorized Signatory        │
│              [ Certificate ID: XXXXXXXX ]            │
└──────────────────────────────────────────────────────┘
```

---

### ⚙️ STEP 10 — Manage Your Settings

```
  PATH: /participant/settings

① Click  [ Settings ]  in the sidebar                        ⬜
② Configure:

   👤 PROFILE
      → Update Full Name
      → Change Department
      → Upload Profile Photo

   🔒 PASSWORD
      → Enter current password
      → Enter new password
      → Confirm new password
      → Click  [ Save Changes ]

   🔔 NOTIFICATIONS
      → Toggle email alerts for new events
      → Toggle certificate-ready notifications

   🌙 THEME
      → Click toggle to switch  Light ☀️  ↔  Dark 🌙
      → Interface reloads in selected theme instantly
```

---

### 🔚 STEP 11 — Log Out

```
① Scroll to the bottom of the sidebar
② Click  [ Logout ]
③ You are returned to the CROSSCERT landing page
④ Your session is securely ended
```

---

---

## 🔴 PART B — ADMIN WALKTHROUGH

---

### 🔐 ADMIN STEP 1 — Log In as Admin

```
╔══════════════════════════════════════════════════════════════════╗
║  ① Navigate to the CROSSCERT platform URL                        ║
║  ② Click  [ Sign In ]  on the navigation bar                     ║
║  ③ Enter your Admin  Email  and  Password                        ║
║  ④ Click  [ Sign In ]                                            ║
║                                                                  ║
║  ✅  OUTPUT: You land on  /admin/dashboard                       ║
║              The Admin Sidebar appears with the HCDC logo        ║
╚══════════════════════════════════════════════════════════════════╝
```

**Admin Sidebar — Complete Navigation:**

```
  ┌─────────────────────────────────────────────┐
  │  [ HCDC LOGO ]                              │
  ├─────────────────────────────────────────────┤
  │  🔴  Dashboard       /admin/dashboard        │
  │  🟠  Events          /admin/events           │
  │  🟦  Participants    /admin/participants      │
  │  🟩  Attendance      /admin/checkin          │
  │  🟨  Evaluations     /admin/evaluations      │
  │  🟣  Certificates    /admin/certificates     │
  │  🩷  Insights        /admin/insights         │
  │  ⬜  Settings        /admin/settings         │
  ├─────────────────────────────────────────────┤
  │  ✨ Admin Panel                              │
  │  [ Logout ]                                 │
  │  [ CROSSCERT logo ]                         │
  └─────────────────────────────────────────────┘
```

---

### 🏠 ADMIN STEP 2 — View the Admin Dashboard

```
  PATH: /admin/dashboard

① The dashboard loads automatically after login
② You see summary cards at a glance:
   ┌────────────┐  ┌───────────────┐  ┌──────────────────┐
   │ 📅 Events  │  │ 👥 Registered │  │ ✅ Checked In    │
   │    Active  │  │  Participants │  │   Today          │
   └────────────┘  └───────────────┘  └──────────────────┘
   ┌────────────┐  ┌───────────────┐
   │ 📄 Certs   │  │ ⭐ Evaluations│
   │   Issued   │  │   Submitted  │
   └────────────┘  └───────────────┘

③ Upcoming events with their current status are listed below
④ Recent check-in activity is shown in real-time
```

---

### 📅 ADMIN STEP 3 — Create an Event

```
  PATH: /admin/events

① Click  [ Events ]  in the sidebar
② Click the  [ + Create Event ]  button
③ Fill in the event creation form:

   ┌──────────────────────────────────────────────────┐
   │  Event Name     [________________________]        │
   │  Description    [________________________]        │
   │                 [________________________]        │
   │  Department     [ Dropdown: STE / CET / ... ]    │
   │  Date & Time    [ Date Picker ] [ Time Picker ]  │
   │  Location       [________________________]        │
   │  Cover Image    [ Upload Image ]                 │
   │  Theme Color    [ Color Picker ]                 │
   │  Max Slots      [ Number input ]                 │
   └──────────────────────────────────────────────────┘

④ Click  [ Create Event ]
⑤ ✅  Event is saved with  STATUS: DRAFT
⑥ It appears in your Events list — not visible to participants yet
```

---

### 🔄 ADMIN STEP 4 — Manage Event Status (Lifecycle)

Events must be moved through statuses manually. Each status change controls what participants can do.

```
  PATH: /admin/events → click your event → Status control

  FULL LIFECYCLE:

  ┌─────────┐       ┌───────────┐       ┌──────┐
  │  DRAFT  │ ────► │ SCHEDULED │ ────► │ LIVE │
  └─────────┘       └───────────┘       └──────┘
       ↑                  ↓                  ↓
  (edit only)    Visible to participants   QR Scanner
                  Registration opens       goes active
                                               ↓
                                         ┌────────┐
                                         │ PAUSED │
                                         └────────┘
                                               ↓
                                         ┌───────────┐
                                         │ CONCLUDED │
                                         └───────────┘
                                      Evaluations open
                                      Certificates unlocked
```

**To change status:**
```
① In Events list, click the event
② Find the  [ Status ]  control (dropdown or button)
③ Select the next status
④ ✅  Status updates instantly — participants see the change live
```

| You change to... | What happens |
|---|---|
| **Scheduled** | Event is published; participants can register |
| **Live** | QR attendance scanner activates; check-in begins |
| **Paused** | Temporarily halts — no new check-ins |
| **Concluded** | Event closed; evaluation forms sent to attendees |

---

### ✏️ ADMIN STEP 5 — Edit or Delete an Event

```
  PATH: /admin/events

  TO EDIT:
  ① Find the event in the list
  ② Click the  ✏️  Edit (pencil) icon
  ③ Modify any field (name, date, description, cover, slots...)
  ④ Click  [ Save Changes ]
  ⑤ ✅  Toast notification: "Event updated successfully"

  TO DELETE:
  ① Click the  🗑️  Delete icon on the event card
  ② A confirmation dialog appears:
     "Are you sure you want to delete this event?"
  ③ Click  [ Confirm Delete ]
  ④ The event and all its data are permanently removed
```

---

### 👥 ADMIN STEP 6 — Manage Participants

```
  PATH: /admin/participants

① Click  [ Participants ]  in the sidebar                    🟦
② A searchable table of all registered users appears
③ Available actions:

   🔍 SEARCH    → Type a name or email in the search bar
   🏷️ FILTER    → Filter by department or event
   👤 VIEW      → Click a participant to see their profile
                  and their full event registration history
   ❌ REMOVE    → Remove a participant from a specific event
                  (use only if needed — this cannot be undone)
```

---

### 📱 ADMIN STEP 7 — Run QR Scanner (Attendance Check-In)

```
  PATH: /admin/checkin

  ⚠️  Event must be in  LIVE  status for check-in to work.

╔══════════════════════════════════════════════════════════════════╗
║  HOW TO DO QR CHECK-IN                                           ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  ① Click  [ Attendance ]  in the sidebar          🟩             ║
║  ② Select the  LIVE  event from the dropdown                     ║
║  ③ Click  [ Start Scanner ]  — your camera activates            ║
║  ④ Point the camera at the participant's QR ticket              ║
║                                                                  ║
║     SCAN RESULT:                                                 ║
║     ╔══════════╗   ╔══════════════════════════════╗             ║
║     ║ ✅ GREEN ║   ║ ⚠️  YELLOW / ❌ RED          ║             ║
║     ╠══════════╣   ╠══════════════════════════════╣             ║
║     ║ "Check-  ║   ║ "Already Checked In"         ║             ║
║     ║  In      ║   ║ "Invalid QR Code"            ║             ║
║     ║  Recorded║   ║ "Wrong Event"                ║             ║
║     ╚══════════╝   ╚══════════════════════════════╝             ║
║                                                                  ║
║  ⑤ Attendance timestamp is logged automatically                 ║
║  ⑥ Next participant — scan again                                ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

**Check-Out (end of event):**
```
① Keep the scanner open
② Scan the same QR code as participant exits
③ System records the check-out timestamp
④ Full attendance duration is saved
```

> 💡 The system prevents check-out before check-in (sequence validation).

---

### ⭐ ADMIN STEP 8 — Review Evaluations

```
  PATH: /admin/evaluations

  ⚠️  Evaluations are only available after event is CONCLUDED.

① Click  [ Evaluations ]  in the sidebar                    🟨
② Select the event from the filter/dropdown
③ All submitted evaluations appear in a list:

   ┌────────────────────────────────────────────────────────┐
   │  👤 Juan dela Cruz     ⭐⭐⭐⭐⭐    March 15, 2026    │
   │  "Great seminar! Very informative and well-organized."  │
   ├────────────────────────────────────────────────────────┤
   │  👤 Maria Santos       ⭐⭐⭐⭐☆    March 15, 2026    │
   │  "Enjoyed the activities. Hope for more next time."     │
   └────────────────────────────────────────────────────────┘

④ Review ratings (1–5 stars) and written comments
⑤ Use this data to improve future events
```

> 📌 Only participants who submitted an evaluation will receive a certificate.

---

### 📄 ADMIN STEP 9 — Generate Certificates

```
  PATH: /admin/certificates

  ⚠️  Only participants who submitted evaluations are eligible.

╔══════════════════════════════════════════════════════════════════╗
║  HOW TO GENERATE CERTIFICATES                                    ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  ① Click  [ Certificates ]  in the sidebar         🟣            ║
║  ② Select the  CONCLUDED  event                                  ║
║  ③ Review the eligible participant list:                         ║
║                                                                  ║
║     NAME              EVALUATED?    CERTIFICATE                  ║
║     Juan dela Cruz    ✅ Yes         Pending                     ║
║     Maria Santos      ✅ Yes         Pending                     ║
║     Pedro Reyes       ❌ No          Blocked                     ║
║                                                                  ║
║  ④ Click  [ Generate Certificates ]                              ║
║                                                                  ║
║     System process:                                              ║
║       → PDF engine (ReportLab) builds certificate per person     ║
║       → Applies event branding, name, date, HCDC seal            ║
║       → Emails each PDF to participant inbox (SMTP)              ║
║       → Saves PDF to participant's digital portfolio             ║
║                                                                  ║
║  ⑤ ✅  "Certificates issued to 2 participants"                   ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

### 📊 ADMIN STEP 10 — View Insights & Analytics

```
  PATH: /admin/insights

① Click  [ Insights ]  in the sidebar                       🩷
② Analytics dashboard appears with visual charts:

   📈  REGISTRATION RATE per event
   ┌─────────────────────────────────────┐
   │  ████████████░░░░░  80%  Registered │
   └─────────────────────────────────────┘

   📊  ATTENDANCE vs. REGISTERED
   ┌─────────────────────────────────────┐
   │  ██████████░░░░░░░░  62%  Attended  │
   └─────────────────────────────────────┘

   ⭐  AVERAGE EVALUATION SCORE
   ┌─────────────────────────────────────┐
   │  4.3 / 5.0  ⭐⭐⭐⭐☆              │
   └─────────────────────────────────────┘

   🏬  DEPARTMENT PARTICIPATION BREAKDOWN
   ┌──────┬──────┬──────┬──────┬──────┐
   │ STE  │ CET  │ SBME │ COME │ CCJE │
   │  32  │  28  │  19  │  14  │  11  │
   └──────┴──────┴──────┴──────┴──────┘

   📄  CERTIFICATE COMPLETION RATE
   ┌─────────────────────────────────────┐
   │  ████████████████░░  90%  Issued    │
   └─────────────────────────────────────┘
```

---

### ⚙️ ADMIN STEP 11 — Configure Settings

```
  PATH: /admin/settings

① Click  [ Settings ]  in the sidebar                       ⬜
② Configure platform-wide options:

   🌙 THEME
      → Toggle Light ☀️ / Dark 🌙 mode

   🔒 ACCOUNT SECURITY
      → Change admin password

   📧 EMAIL CONFIGURATION
      → Set SMTP host, port, sender address
      → Used for QR ticket and certificate delivery

   🏫 INSTITUTIONAL BRANDING
      → Upload updated HCDC logos
      → Adjust platform color scheme
```

---

### 🔚 ADMIN STEP 12 — Log Out

```
① Scroll to the bottom of the Admin sidebar
② Click  [ Logout ]
③ Session is securely cleared
④ You are redirected to the CROSSCERT landing page
```

---

---

## 📌 QUICK REFERENCE — Complete Feature Map

```
╔══════════════════════════════════════════════════════════════════════╗
║                  🔴 C R O S S C E R T                               ║
║         Event Management & Certificate Automation Platform           ║
╠════════════════════════════╦═════════════════════════════════════════╣
║  👤 PARTICIPANT             ║  🔴 ADMIN                               ║
╠════════════════════════════╬═════════════════════════════════════════╣
║  ① Sign Up / Log In        ║  ① Log In (Admin role)                  ║
║  ② View Dashboard          ║  ② View Admin Dashboard                 ║
║  ③ Browse / Discover Events║  ③ Create a New Event                   ║
║  ④ Register for Event      ║  ④ Publish / Change Event Status        ║
║  ⑤ Get QR Ticket           ║  ⑤ Edit / Delete an Event               ║
║  ⑥ Show QR at Event Entrance║  ⑥ Manage Participants                 ║
║  ⑦ Check My Events         ║  ⑦ Run QR Scanner (Check-In/Out)       ║
║  ⑧ Bookmark Events         ║  ⑧ Review Evaluations                  ║
║  ⑨ Submit Evaluation       ║  ⑨ Generate Certificates               ║
║  ⑩ Download Certificate    ║  ⑩ View Insights & Analytics           ║
║  ⑪ Settings & Profile      ║  ⑪ Configure Settings                  ║
║  ⑫ Log Out                 ║  ⑫ Log Out                             ║
╚════════════════════════════╩═════════════════════════════════════════╝
```

---

<div align="center">

---

**CROSSCERT — Excellence in Motion**

*Built for HCDC — Office of the Vice President for Academic Affairs*

📧 Developed by: Arnado, Catherine · Asakil, Norman · Madriñan, Ashlee · Salazar, Joey · Palma, Xander

*Supervised by: John Rey Silverio*

---

*This manual follows Norman's Model of Interaction (1988) and the ACM HCI Framework.*
*It is intended for use by students, faculty, and administrators of Holy Cross of Davao College.*

</div>
