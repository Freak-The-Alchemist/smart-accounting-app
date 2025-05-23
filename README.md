# Smart Accounting App for Petrol Stations & Businesses

A comprehensive, accountant-focused accounting and management solution for petrol stations and businesses. Built by accountants for accountants, featuring professional-grade accounting tools, real-time financial tracking, advanced reporting, OCR/voice input, AI assistant, and multi-user collaboration.

---

## Table of Contents
- [Features](#features)
- [Roadmap & Phases](#roadmap--phases)
- [Major Services & Models](#major-services--models)
- [AI Assistant: Azera](#ai-assistant-azera)
- [Collaboration & Multi-user](#collaboration--multi-user)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)
- [CI/CD Pipeline](#ci-cd-pipeline)

---

## Features

### Core (Implemented & In Progress)
- Real-time fuel sales tracking
- Shift management & handover
- Multiple payment method support
- Daily sales summary
- Stock & inventory management
- Expense tracking and categorization
- Financial reporting (daily, monthly, custom)
- Payment method analytics
- Data export (Excel, PDF, CSV)
- OCR for receipt scanning (English & Swahili)
- Voice input for transaction entry (English & Swahili)
- Automated data extraction from receipts/voice
- Validation and error handling
- Accounting dashboard (web & mobile)
- Transaction entry forms (manual, OCR, voice)
- Data visualization (charts, breakdowns)
- Mobile app (React Native/Expo)
- Web app (React/MUI)
- Firebase integration (Firestore, Auth)
- TypeScript type safety

### Advanced & Planned
- Multi-currency support (KES, USD, EUR, GBP, TZS, UGX)
- Complex transaction types
- Automated categorization
- Reconciliation tools
- Custom report builder
- Data import capabilities
- API integrations
- AI assistant (Azera) with Swahili support
- Real-time collaboration & multi-user editing
- Role-based access control & permissions
- Team management & audit trails
- Fuel station-specific features (shift log, sales, inventory)
- Mobile offline support & push notifications
- Advanced analytics & forecasting
- Third-party integrations & plugin system
- Security, compliance, and audit systems
- UI/UX improvements & accessibility

---

## Roadmap & Phases

### Phase 1: Core Accounting Foundation
- Basic accounting structure (models, chart of accounts, statements)
- OCR & voice input integration
- Basic accounting UI (dashboard, forms, reporting, visualization)

### Phase 2: Enhanced Accounting Features
- Advanced transaction management (multi-currency, reconciliation)
- Financial reporting (balance sheet, income statement, cash flow, custom reports)
- Data export & integration (Excel, PDF, API)

### Phase 3: AI & Automation
- Azera AI assistant (NLP, smart suggestions, Swahili support)
- Automated reconciliation, categorization, predictive analytics

### Phase 4: Collaboration & Multi-user
- User management, roles, permissions
- Real-time collaboration, change tracking, conflict resolution

### Phase 5: Fuel Station Features
- Sales, inventory, and shift management for fuel stations

### Phase 6: Mobile Application
- Mobile core (auth, navigation, accounting, UI)
- Mobile OCR, voice input, offline support, push notifications

### Phase 7: Advanced Features
- Advanced analytics, business intelligence, forecasting
- Third-party integrations, plugin system

### Phase 8: Polish & Optimization
- Performance, security, compliance, UX, documentation

---

## Major Services & Models

### 1. Invoice Management
- Professional invoice creation and tracking
- Multi-currency support
- Tax calculation and tracking
- Payment status monitoring
- Aging reports
- Client management
- Automated reminders

### 2. Budget Management
- Multi-period budgeting
- Department/cost center tracking
- Variance analysis
- Budget vs. actual reporting
- Forecast adjustments
- Alert system for overruns

### 3. Transaction Management
- Double-entry recording
- Multi-currency support
- Tax handling
- Category management
- Payment tracking
- Document attachment
- Audit trail
- Reconciliation tools

### 4. Currency Management
- Multi-currency support
- Real-time exchange rates
- Currency conversion
- Exchange gain/loss tracking
- Currency formatting
- Validation rules

### 5. OCR Service
- Professional receipt scanning
- Multi-language support (EN/SW)
- Tax extraction
- Vendor recognition
- Amount validation
- Category suggestion
- Error detection

### 6. Export Service
- Professional report generation
- Multiple formats (XLSX, CSV, PDF)
- Custom templates
- Data filtering
- Chart generation
- Multi-currency support

### 7. Report Service
- Financial statements
- Custom reports
- Trend analysis
- Ratio calculations
- Budget analysis
- Tax reports
- Audit reports

#### Shared Features
- Firebase integration, TypeScript, singleton services, error handling, user-specific data

---

## AI Assistant: Azera
- **AzeraHelper**: Web & mobile components for accountant-friendly help
- Swahili & English support
- Knowledge base (terms, FAQs, templates)
- Natural language search
- Smart suggestions for accounting tasks
- Performance optimizations (caching, lazy loading)
- Quick journal templates (e.g., fuel sale)
- Example: `azera_knowledge.json` for localized help

---

## Collaboration & Multi-user
- Dual collaboration system: Organizations & Peer Projects
- Organization/project creation, invites, role assignment
- Real-time collaboration, multi-user editing
- Change tracking, conflict resolution
- Audit logs for user actions
- Example code for Firebase-based collaboration system

---

## Tech Stack
- **Frontend**: React (web), React Native/Expo (mobile)
- **UI**: Material-UI (web), React Native Paper (mobile)
- **State Management**: React Context, Redux Toolkit
- **Backend**: Firebase (Firestore, Auth)
- **OCR**: Google Cloud Vision (planned: local/affordable alternatives)
- **AI**: Custom knowledge base, planned LLM/NLP integration
- **Type Safety**: TypeScript
- **Testing**: Jest, Testing Library, Cypress

---

## Project Structure
```
packages/
├── web/      # Web app (React, MUI)
├── mobile/   # Mobile app (React Native, Expo)
├── shared/   # Shared types, services, logic
```

---

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm v7+ (for workspaces)
- Expo CLI (for mobile)
- Firebase account

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/smart-accounting-app.git
   cd smart-accounting-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Firebase:
   - Create a Firebase project
   - Enable Auth & Firestore
   - Add config to `packages/shared/src/config/firebase.ts`
4. Start development:
   ```bash
   npm run dev
   ```
5. Run on mobile:
   ```bash
   cd packages/mobile && npm start
   ```

---

## Development
- TypeScript best practices
- Functional components & hooks
- Error handling & validation
- Meaningful comments
- Consistent code structure

### Testing
```bash
npm test
npm run test:coverage
```

---

## Contributing
1. Fork the repo
2. Create a feature branch
3. Commit & push
4. Open a Pull Request

---

## License
MIT License - see [LICENSE](LICENSE)

---

## Acknowledgments
- React Native Paper, Material-UI
- Firebase
- Expo
- All contributors

---

## Full Roadmap & Documentation
See `F Documentation/upgrade roadmap.txt` and `F Documentation/App Functions.txt` for the complete, detailed roadmap and service descriptions. All planned and implemented features are tracked there, including:
- AI assistant (Azera)
- Collaboration system
- Mobile & web features
- Export, reporting, analytics
- Security, compliance, and more

## Core Accounting Features

### Professional Accounting Tools
- **Double-Entry Bookkeeping**
  - Automated journal entries
  - Debit/credit validation
  - Transaction balancing
  - Chart of accounts management
- **Financial Statements**
  - Real-time balance sheet
  - Income statement (P&L)
  - Cash flow statement
  - Trial balance
  - General ledger
- **Account Reconciliation**
  - Bank reconciliation
  - Account balancing
  - Discrepancy detection
  - Audit trail

### Accountant-Specific Features
- **Transaction Management**
  - Multi-currency support (KES, USD, EUR, GBP, TZS, UGX)
  - Complex transaction types
  - Automated categorization
  - Tax calculation and tracking
  - Payment method tracking
  - Receipt/document attachment
- **Reporting & Analytics**
  - Custom report builder
  - Financial ratios
  - Trend analysis
  - Budget vs. actual
  - Cash flow forecasting
  - Tax reports
- **Compliance & Audit**
  - Audit trails
  - Change history
  - User activity logs
  - Data validation
  - Error detection
  - Backup and recovery

### Smart Automation
- **OCR & Voice Input**
  - Receipt scanning (English & Swahili)
  - Voice transaction entry
  - Automated data extraction
  - Smart categorization
  - Validation and error handling
- **AI Assistant (Azera)**
  - Accounting terminology help
  - Transaction suggestions
  - Error detection
  - Compliance checks
  - Multi-language support (EN/SW)

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment. The pipeline includes:

### Workflow

1. **Testing**
   - Runs on every push and pull request
   - Executes all unit tests
   - Ensures code quality and functionality

2. **Web App Deployment**
   - Builds the web application
   - Deploys to Firebase Hosting
   - Only triggers on pushes to main branch

3. **Mobile App Deployment**
   - Builds Android and iOS apps using EAS
   - Submits to Play Store and App Store
   - Only triggers on pushes to main branch

### Setup Instructions

1. Install GitHub CLI:
   ```bash
   # macOS
   brew install gh
   
   # Windows
   winget install GitHub.cli
   
   # Linux
   sudo apt install gh
   ```

2. Authenticate with GitHub:
   ```bash
   gh auth login
   ```

3. Run the setup script:
   ```bash
   chmod +x scripts/setup-github-secrets.sh
   ./scripts/setup-github-secrets.sh
   ```

4. Follow the prompts to enter:
   - Firebase configuration
   - Firebase service account key
   - Expo token

### Required Secrets

The following secrets need to be configured in your GitHub repository:

- `FIREBASE_API_KEY`: Firebase API key
- `FIREBASE_AUTH_DOMAIN`: Firebase auth domain
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `FIREBASE_STORAGE_BUCKET`: Firebase storage bucket
- `FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID
- `FIREBASE_APP_ID`: Firebase app ID
- `FIREBASE_SERVICE_ACCOUNT`: Firebase service account JSON
- `EXPO_TOKEN`: Expo access token

### Branch Strategy

- `main`: Production branch, triggers full deployment
- `develop`: Development branch, runs tests and builds
- Feature branches: Run tests only

### Manual Triggers

You can manually trigger the workflow from the GitHub Actions tab:
1. Go to the "Actions" tab in your repository
2. Select the "CI/CD Pipeline" workflow
3. Click "Run workflow"
4. Select the branch and click "Run workflow" 