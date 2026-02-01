<div align="center">
  <img src="public/readme-banner.png" alt="CROSSCERT Professional Banner" width="100%" style="border-radius: 10px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">

  <img src="https://hcdc.edu.ph/wp-content/uploads/2021/04/hcdc-logo.png" alt="HCDC Logo" width="60" style="margin-bottom: 10px;">

  # CROSSCERT
  ### The Next-Generation Event Management & Automated Certification Platform

  <br />

  [![Next.js](https://img.shields.io/badge/Next.js-15+-black?logo=next.js&logoColor=white&style=for-the-badge)](https://nextjs.org/)
  [![Django](https://img.shields.io/badge/Django-5.1-092e20?logo=django&logoColor=white&style=for-the-badge)](https://www.djangoproject.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css&logoColor=white&style=for-the-badge)](https://tailwindcss.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript&logoColor=white&style=for-the-badge)](https://www.typescriptlang.org/)

  <br />

  <p align="center">
    <strong>Elevating institutional logistics through high-performance automation.</strong><br />
    Designed exclusively for the Holy Cross of Davao College - Office of the Vice President for Academic Affairs.
  </p>
</div>

---

## Vision and Strategy
> **CROSSCERT** serves as a sophisticated bridge between institutional administration and participant experience. By digitizing the end-to-end event lifecycle—from registration to certification—we eliminate manual friction and paper-based overhead, delivering a premium, modern experience for the **Holy Cross of Davao College** community.

---

## Core Capabilities

### Advanced Event Orchestration
*   **State-Driven Management**: Fluid transitions between `Draft`, `Scheduled`, `Live`, `Paused`, and `Concluded` statuses.
*   **Dynamic Theme Engine**: Tailor event branding with departmental color schemes and immersive cover imagery.
*   **High-Impact Landing Pages**: Automatically generated, glassmorphism-inspired event hubs for every occasion.

### Secure Digital Access
*   **Encrypted QR Identification**: Instantaneous, secure participant verification via unique Digital Access Passes.
*   **Live Status Propagation**: Real-time ticket updates reflecting current event phases directly on user devices.
*   **Institutional Guardrails**: Cross-platform registration validation ensuring participant eligibility across departments.

### Intelligent Operational Logistics
*   **Sub-Second Processing**: High-throughput QR scanners designed for rapid participant check-in and check-out.
*   **Flow Validation**: Intelligent logic preventing sequence errors and ensuring accurate attendance tracking.
*   **Automated Fulfillment**: Direct integration between attendance records and post-event evaluation workflows.

### Automated Certification Engine
*   **Evaluation-Triggered Issuance**: Integrity-first certification paths that require feedback submission prior to generation.
*   **High-Fidelity PDF Core**: Proportional scaling engine ensuring ultra-high-resolution certificate output.
*   **Portfolio Integration**: Seamless automated delivery via SMTP and persistent storage in the participant's digital portfolio.

---

## Project Architecture

### Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js, TypeScript, Radix UI, Tailwind CSS |
| **Backend** | Django, Python, ReportLab (PDF) |
| **Messaging** | Automated SMTP Suite |
| **Data Architecture** | PostgreSQL / SQLite High-Performance Models |

### Codebase Organization

```text
CROSSCERT/
├── app/               # Next.js App Router (Admin, Auth, Participant)
├── backend/           # Django Services (Events, Certificates, Participants)
├── components/        # High-End Shadcn/ui & Custom Components
├── lib/               # Shared Utilities & API Orchestration
└── public/            # Optimized Static Assets & Templates
```

### System Workflow
```mermaid
graph LR
    A[Admin] -- Creates --> E[Event]
    P[Participant] -- Registers --> T[Digital Ticket]
    T -- Scanned --> ATT[Attendance Recorded]
    ATT -- Evaluation --> CERT[PDF Certificate]
    CERT -- Delivery --> Inbox[Participant Inbox]
    
    style E fill:#092e20,stroke:#fff,stroke-width:2px,color:#fff
    style T fill:#38B2AC,stroke:#fff,stroke-width:2px,color:#fff
    style ATT fill:#5a2d81,stroke:#fff,stroke-width:2px,color:#fff
    style CERT fill:#003366,stroke:#fff,stroke-width:2px,color:#fff
```

---

## Deployment & Setup

### Prerequisites
*   Environment: Node.js 18.x, Python 3.10.x, PostgreSQL (Optional)
*   Dependencies: Git, NPM, Pip

### Quick Start

**Backend Orchestration**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Frontend Initialization**
```bash
npm install
npm run dev
```

---

## The Development Team
*   **Engineering**: Arnado, Catherine · Asakil, Norman · Madriñan, Ashlee · Salazar, Joey · Palma, Xander
*   **Supervision**: John Rey Silverio

---

## Legal
Licensed under the **MIT License**. For detailed terms, please consult the [LICENSE](LICENSE) documentation.

<div align="center">
  <br />
  <p><strong>Excellence in Motion</strong> | Built for HCDC - VPAA</p>
</div>