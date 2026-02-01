# CROSSCERT
**The Next-Generation Event Management & Automated Certification Platform**

---

**CROSSCERT** is a high-fidelity web ecosystem designed for the **Office of the Vice President for Academic Affairs (VPAA)**. It revolutionizes institutional seminars, workshops, and assembly logistics through intelligent automation, bridging administrative efficiency with participant experience.

## The Vision

CROSSCERT eliminates manual certification hurdles and paper-based attendance. It provides a seamless, high-performance environment for both institutional administrators and participants at **Holy Cross of Davao College**.

## Core Functionalities

### 1. Advanced Event Lifecycle Management
*   **Operational Control**: Events are managed through distinct states: `Draft`, `Scheduled`, `Live`, `Paused`, `Concluded`.
*   **Visual Customization**: Admins can customize event branding with specialized theme engines and departmental tagging.
*   **Interactive Landing Pages**: High-impact landing pages for every event featuring modern design elements.

### 2. Digital Access Pass (QR Identification)
*   **Instant Identification**: Every registered participant receives a Digital Access Pass containing their unique QR ID.
*   **Real-time Updates**: Badge status reflects the actual operational status on the participant's device.
*   **Secure Registration**: Cross-referenced registration ensuring only relevant students or faculty can join specific institutional events.

### 3. Intelligent Attendance Logistics
*   **High-Speed Processing**: Admin-exclusive QR scanner capable of handling massive participant inflow efficiently.
*   **Smart Validations**: Prevents double check-ins and ensures participants follow the operational flow (Check-in, Presence, Check-out).
*   **Feedback Integration**: Links physical attendance to post-event evaluations.

### 4. Automated Intelligence & Certification
*   **Evaluation-Based Issuance**: Certificates are generated only after a participant completes the required evaluation form.
*   **High-Fidelity Generation**: PDF engine with proportional scaling that adapts to high-resolution templates.
*   **Automated Delivery**: Certificates are delivered via email and stored in a dedicated Certificate Portfolio.

### 5. Real-Time Analytics
*   **Live Metrics**: Data on attendance rates, total registrations, and certificate issuance stats.
*   **Departmental Insights**: Visualization of engagement by different college departments.

## Project Architecture

### Tech Stack

*   **Frontend**: Next.js, Tailwind CSS, Radix UI, TypeScript
*   **Backend**: Django, Python
*   **Database**: SQLite (Development), PostgreSQL (Production intended)
*   **Tools**: ReportLab (PDF Generation)

### Codebase Structure

#### Frontend (Next.js)
*   `app/`: App Router including Admin, Auth, and Participant views.
*   `components/`: Reusable UI components and low-level Radix implementations.
*   `lib/`: Shared business logic and utility functions.
*   `public/`: Static assets.

#### Backend (Django)
*   `certificates/`: PDF generation logic and mailers.
*   `events/`: Event lifecycle and status management.
*   `participants/`: Registration and attendance database models.
*   `crosscert/`: Central project configuration and security settings.

## System Operations Flow

### Phase 1: Preparation
1.  Admin creates an event and selects a departmental theme.
2.  System generates a unique registration endpoint.
3.  Participants discover the event on their dashboard.

### Phase 2: Execution
1.  Participant registers and receives a Digital Ticket.
2.  Admin starts the event; tickets update to Live Access Passes.
3.  QR scanning records attendance.

### Phase 3: Fulfillment
1.  Event concludes; participants access the Evaluation Modal.
2.  Upon submission, the system generates the certificate.
3.  Automated mailer dispatches the certificate to the registered email.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.