# CivicLens AI – Production Deployment & DevOps Guide

CivicLens AI is a production-ready, SaaS-enabled smart city municipal intelligence platform. This repository contains the source code and infrastructure configuration to build and deploy the entire stack using Docker, Docker Compose, Nginx, and Jenkins.

---

## Folder Structure

```text
Civic-Lens-AI/
├── backend/
│   ├── src/                    # Spring Boot Source Code
│   ├── pom.xml                 # Maven POM Config (Actuator, Resource Exclusions)
│   ├── Dockerfile              # Multi-stage JRE Alpine Build
│   └── .dockerignore           # Excludes target & local config
├── frontend/
│   ├── src/                    # React Vite Source Code
│   ├── nginx.conf              # SPA routing, gzip, security headers, proxy pass
│   ├── Dockerfile              # Node.js compile + Nginx runtime
│   └── .dockerignore           # Excludes node_modules & build artifacts
├── docker-compose.yml          # Container orchestration & network bridge
├── Jenkinsfile                 # CI/CD declarative pipeline with rollbacks
├── .env.example                # Template environment variables (no secrets)
├── .env.production             # Production environment parameters template
└── README.md                   # System configuration and deployment guide
```

---

## System Architecture

```text
       Internet (Port 80)
               │
               ▼
   ┌───────────────────────┐
   │    Nginx (Frontend)   │  ◄── Serves static React client & acts as proxy
   └───────────────────────┘
               │
               ▼ (Bridge Network, Port 9526)
   ┌───────────────────────┐
   │ Spring Boot (Backend) │  ◄── Private internal service (Google Gemini & Firestore)
   └───────────────────────┘
```

1. **Frontend**: Serves React compiled bundle via Nginx. Handles SPA routing, assets compression, and acts as the secure entrypoint proxy.
2. **Backend**: Containerized JRE 21 Alpine instance running Spring Boot. Private and hidden from direct external internet access.
3. **Database & Storage**: Remote connection via Firebase Admin SDK. Credentials are dynamically injected into `/opt/civiclens/firebase/firebase-service-account.json`.

---

## Firebase, Firestore & Cloud Storage Setup

### 1. Firestore Database Console Setup
1. Open the [Firebase Console](https://console.firebase.google.com/) and create a new project named `CivicLens AI`.
2. Go to **Firestore Database** in the left menu and click **Create database**.
3. Choose **Start in production mode**, select your database location, and click **Enable**.

### 2. Service Account Key Generation
1. In the Firebase Console, click the **Gear Icon** (Project Settings) next to *Project Overview* -> **Project settings**.
2. Navigate to the **Service accounts** tab.
3. Select the **Java** configuration, and click **Generate new private key**.
4. Save the downloaded JSON file as `firebase-service-account.json`. Place it in the directory `/opt/civiclens/firebase` on the deployment host.

### 3. Firebase Cloud Storage Setup (Optional)
1. Go to **Storage** in the left menu and click **Get Started**.
2. Select **Start in production mode**, configure your bucket location, and click **Done**.
3. Copy the storage bucket domain from the console (e.g. `civiclens-prod-storage.firebasestorage.app`).
4. Set the `FIREBASE_STORAGE_BUCKET` variable inside your `.env` file to this value.
   - *Note*: If you leave `FIREBASE_STORAGE_BUCKET` blank or unset, Firebase Storage will degrade gracefully. The application will start successfully, Firestore will continue to work, and image uploads will return a high-quality demonstration mock URL.

---

## Environment Variables

Configure these variables inside a `.env` file in the project root:

| Variable | Description | Default Fallback |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | Target Spring profile | `prod` |
| `PORT` | Container target port | `9526` |
| `GEMINI_API_KEY` | Google Gemini API key | `mock-gemini-key` |
| `GEMINI_MODEL` | Gemini LLM Model | `gemini-2.5-flash` |
| `FIREBASE_CONFIG_PATH` | path configuration on host container | `file:/opt/civiclens/firebase/firebase-service-account.json` |
| `FIREBASE_STORAGE_BUCKET` | Cloud storage bucket URL (Optional) | `(empty)` |
| `FIREBASE_DATABASE_URL` | Firebase database endpoint (Unused) | `(empty)` |
| `APP_ALLOWED_ORIGINS` | CORS origins (comma-separated list) | `http://localhost,http://localhost:80` |

---

## Deployment Instructions

### 1. Manual Local/Production Run
1. Clone this repository:
   ```bash
   git clone https://github.com/parvagr247/Civic-Lens-AI.git
   cd Civic-Lens-AI
   ```
2. Setup files on the host:
   - Create a folder named `/opt/civiclens/firebase/` and paste your `firebase-service-account.json` key inside it.
   - Copy `.env.example` to `.env` and fill in your actual credentials.
3. Launch using Docker Compose:
   ```bash
   docker compose up -d --build
   ```
4. Verify containers are running:
   ```bash
   docker compose ps
   ```

### 2. Jenkins Automated Pipeline Setup
The declarative [Jenkinsfile](file:///p:/Agentic%20AI/CivilLens%20AI%20(Vibe%2520Code)/Civic%2520Lens%2520AI/Jenkinsfile) triggers the following steps on git push:
1. **Checkout**: Pulls source branch from Github.
2. **Backend Compile**: Compiles Java files (`mvn clean package -DskipTests`).
3. **Frontend Compile**: Installs dependencies and bundles React assets (`npm run build`).
4. **Image Backups**: Tags the current running images as `:rollback` in case deployment checks fail.
5. **Docker Build**: Packages both services into production-optimized images tagged as `:stable`.
6. **Docker Compose Deploy**: Shuts down older containers and deploys the new images.
7. **Health Check Polling**: Actively sweeps `/actuator/health` of the backend container for up to 2 minutes.
8. **Rollback Trigger**: If health check fails, the pipeline automatically restores the previous containers and stable tags.

#### Recommended Jenkins Configuration Best Practices:
- Use **Jenkins Credentials Binding** to store secrets:
  - Create a `Secret text` credential for `GEMINI_API_KEY`.
  - Create a `Secret file` credential for `firebase-service-account.json` and copy it to the `/opt/civiclens/firebase/` path during the deploy phase.
- Use Jenkins environment mappings in the pipeline configuration to bind these values securely.

---

## Production Deployment Checklist
1. **Secrets Security**: Ensure `.env` and `firebase-service-account.json` are added to `.gitignore` and never committed to the repo.
2. **Permissions Setup**: Ensure `/opt/civiclens/logs` has read/write permissions for the non-root JRE Alpine user `civiclens` (UID 1000).
3. **Port Rules**: Ensure port 80/443 is open in your Google Cloud VM firewall rules, and port 9526 is closed to external requests.
4. **Logging Policies**: Monitor log rolling size and retention logs inside `/opt/civiclens/logs`.

---

## Monitoring & Troubleshooting

### Actuator Health Endpoint
Docker health checks sweep native actuator targets:
- **Backend**: `wget -q --spider http://localhost:9526/actuator/health || exit 1`
- **Frontend**: `wget -q --spider http://localhost/ || exit 1`

### Troubleshooting Steps
- **Actuator Health is DOWN**: Verify that `firebase-service-account.json` is correctly placed in `/opt/civiclens/firebase/` on the host. Check the spring startup logs for details:
  ```bash
  docker logs civiclens-backend
  ```
- **CORS Failures**: Ensure that your domain or VM public IP is listed inside the `APP_ALLOWED_ORIGINS` variable in `.env`.
- **Logs Inspection**:
  ```bash
  tail -f /opt/civiclens/logs/civiclens.log
  ```
