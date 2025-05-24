# Smart Accounting App for Petrol Stations & Businesses

A comprehensive, accountant-focused platform designed to simplify financial management for petrol stations and businesses. Built by accountants for accountants, this system offers real-time tracking, advanced reporting, AI assistance, OCR and voice input, and seamless multi-user collaboration.

---

## Table of Contents

* [Features](#features)
* [Roadmap](#roadmap)
* [Services & Models](#services--models)
* [AI Assistant (Azera)](#ai-assistant-azera)
* [Collaboration Features](#collaboration-features)
* [Tech Stack](#tech-stack)
* [Project Structure](#project-structure)
* [Getting Started](#getting-started)
* [Development Guidelines](#development-guidelines)
* [Contributing](#contributing)
* [License](#license)
* [CI/CD Pipeline](#ci-cd-pipeline)
* [Acknowledgments](#acknowledgments)

---

## Features

### Core

* Real-time fuel sales tracking and shift handovers
* Multi-payment method support and analytics
* Inventory and expense management
* Financial reports (daily, monthly, custom)
* Data exports (Excel, PDF, CSV)
* OCR for receipts and voice transaction entry (English & Swahili)
* Accounting dashboard (web & mobile)
* Manual and automated transaction entries
* Data visualization (charts, trends)
* Firebase integration (Firestore, Auth)
* TypeScript support for type safety

### Advanced (Planned)

* Multi-currency support (KES, USD, EUR, etc.)
* Automated reconciliation and categorization
* Custom report builder and API integrations
* AI assistant with Swahili NLP support
* Real-time multi-user collaboration
* Role-based access control and audit trails
* Fuel station-specific shift/inventory tools
* Offline mobile support and push notifications
* Plugin system for third-party extensions
* Advanced analytics, security, and compliance

---

## Roadmap

Phased implementation covering: Core Accounting, AI & Automation, Collaboration, Mobile App, Advanced Features, and Performance Optimization.

---

## Services & Models

* Invoice, Budget, Transaction, and Currency Management
* OCR and Export Services
* Report generation, analytics, and compliance tools

---

## AI Assistant (Azera)

* Natural language help (English & Swahili)
* Journal entry suggestions and terminology guidance
* Contextual assistance, caching, and lazy loading support

---

## Collaboration Features

* Organization and peer-to-peer collaboration
* Role-based permissions and audit logging
* Real-time editing and conflict resolution

---

## Tech Stack

* **Frontend**: React (web), React Native/Expo (mobile)
* **Backend**: Firebase (Firestore, Auth)
* **UI Libraries**: Material-UI, React Native Paper
* **OCR/AI**: Google Cloud Vision, custom models
* **CI/CD**: GitHub Actions
* **Languages**: TypeScript
* **Testing**: Jest, Testing Library, Cypress

---

## Project Structure

```
packages/
├── web/      # Web application
├── mobile/   # Mobile app using React Native
├── shared/   # Shared logic and type definitions
```

---

## Getting Started

### Prerequisites

* Node.js v16+
* pnpm or npm v7+
* Expo CLI
* Firebase project with Firestore and Auth enabled

### Installation

```bash
git clone git@github.com:yourusername/smart-accounting-app.git
cd smart-accounting-app
pnpm install
```

Configure Firebase in `packages/shared/src/config/firebase.ts`, then:

```bash
pnpm run dev
cd packages/mobile && pnpm start
```

---

## Development Guidelines

* Follow TypeScript best practices
* Use React hooks and functional components
* Validate forms and handle errors

```bash
pnpm test
pnpm run test:coverage
```

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

---

## License

This software is proprietary and copyrighted by Freak-The-Alchemist.

By using this software, you agree to the terms in the [LICENSE](LICENSE), [Terms of Service](terms.md), and [Privacy Policy](privacy.md).

Contact: [muthamarichard47@gmail.com](mailto:muthamarichard47@gmail.com)

---

## CI/CD Pipeline

### Testing

* GitHub Actions run tests on every push and pull request

### Deployment

* Web: Firebase Hosting
* Mobile: EAS for Play Store/App Store distribution

Required GitHub secrets include Firebase API keys, Service Account JSON, and Expo token.

---

## Acknowledgments

* React, React Native, Firebase
* Expo, MUI, and all supporting open-source contributors
