# 🌟 PJSOFONIC Connect (sofoChat Frontend)

An enterprise-grade, real-time collaboration and messaging platform built with **Angular 19 (Standalone Components & Signals)**, **TypeScript**, **WebSockets**, and **WebRTC**.

Designed for high-speed internal team communication, instant 1-on-1 chats, group collaboration, and multi-party video/audio meetings with seamless EMS (Employee Management System) directory integration.

---

## ✨ Features & Highlights

- **💬 WhatsApp-Style Real-Time Messaging**:
  - **Message Layout**: Sent messages on the **right** with read receipts and glowing bubbles; received messages on the **left** with sender avatars and name tags.
  - **Reactions & Attachments**: Interactive emoji reaction picker (👍, ❤️, 😂, 🔥, 🎉, 🙏), quick image/document sharing, and voice note simulation.
  - **Real-Time Typing & Presence**: Live typing indicators and online/offline status updates.

- **🔔 Targeted Real-Time Notifications**:
  - Real-time push alerts delivered over WebSockets strictly to specific recipients and group members.
  - In-app notification tray with unread counters and one-click **Mark All As Read**.
  - Browser notification support via standard Web Notifications API.

- **👥 Dynamic EMS Directory & Contact Management**:
  - Direct integration with enterprise EMS backend to view real authenticated colleagues.
  - **Add Contact**: Quickly add colleagues by Name, Employee ID, Email, and Designation.
  - **Delete Contact**: Remove contacts from directory with immediate synchronization.

- **👥 Group Creation & Management**:
  - Create groups with custom titles, descriptions, and participant selection.
  - **Manage Members**: Add new colleagues or remove existing members from the Group Info drawer.
  - **Delete Group**: Full group deletion (`DELETE /api/groups/{id}`) with cascade message cleanup.

- **🎥 WebRTC Video & Audio Conferencing (Zoom / Meet Style)**:
  - High-definition video and crystal-clear audio via WebRTC mesh signaling.
  - Instant meeting link and alphanumeric meeting code generation.
  - Camera toggle, microphone mute/unmute, and high-framerate screen sharing.
  - Dynamic participant roster with live active speaker indicators.

- **📱 Ultra-Responsive Glassmorphic UI**:
  - Mobile-first responsive viewport adapted for mobile browsers, tablets, and desktop workstations.
  - Cyberpunk/Liquid-Glass modern aesthetics, smooth transitions, and tactile hover effects.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Angular 19](https://angular.dev/) (Standalone Architecture & Reactive Signals) |
| **Language** | TypeScript 5.5+ |
| **Styling** | SCSS / CSS3 Glassmorphism with Google Material Symbols |
| **State Management** | Angular Signals (`signal`, `computed`, `effect`) + RxJS |
| **Real-Time Protocol** | Native WebSockets (`ws://`) |
| **Media & P2P** | WebRTC (`RTCPeerConnection`, `getUserMedia`, `getDisplayMedia`) |
| **HTTP Client** | Angular `provideHttpClient` with Interceptors for JWT & EMS token sync |
| **Server & Container** | Nginx Alpine & Docker Multi-Stage Build |

---

## 📁 Frontend Architecture & Directory Structure

```text
frontend/
├── src/
│   ├── app/
│   │   ├── core/                      # Singleton services, interceptors, and data models
│   │   │   ├── guards/                # Auth & Route protection guards
│   │   │   ├── interceptors/          # JWT & EMS Token injection interceptor
│   │   │   ├── models/                # TypeScript interfaces (User, Message, Group, Notification)
│   │   │   └── services/              # Core API, Auth, Chat, WebRTC, WebSocket, Notification services
│   │   ├── features/                  # Standalone feature modules & routed components
│   │   │   ├── auth/login/            # EMS Login & Authentication
│   │   │   ├── chat/                  # Chat Workspace, WhatsApp message bubble layout, drawer
│   │   │   ├── meetings/              # Meeting Room & Video/Audio Dashboard
│   │   │   ├── notifications/         # Notification tray & alerts
│   │   │   ├── profile/               # Employee Profile & Bio
│   │   │   └── settings/              # User preferences & Avatar uploads
│   │   ├── shared/                    # Reusable UI widgets and navigation components
│   │   ├── app.component.ts           # Root application shell
│   │   ├── app.config.ts              # Global providers & standalone routing configuration
│   │   └── app.routes.ts              # Application route definitions
│   ├── assets/                        # Static brand assets, badges, and icons
│   ├── index.html                     # HTML entry point with viewport & Google fonts
│   ├── main.ts                        # Application bootstrap
│   └── styles.scss                    # Global theme tokens, scrollbars, and animations
├── angular.json                       # Angular CLI workspace build configurations
├── Dockerfile                         # Production Nginx containerization setup
├── nginx.conf                         # Reverse proxy & SPA fallback configuration
├── package.json                       # Dependencies and build scripts
├── tsconfig.json                      # TypeScript compiler configuration
└── README.md                          # Frontend documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.x` or `v20.x` LTS
- **npm**: `v9.x` or `v10.x`

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/mrCoderPj04/SOFO-Chat.git
cd SOFO-Chat

# Install npm packages
npm install
```

### 2. Run Development Server
```bash
npm start
```
Navigate to `http://localhost:4200/`. The application will automatically reload if you change any source files.

### 3. Production Build
```bash
npm run build
```
The build artifacts will be stored in the `dist/pjsofonic-connect-web/` directory.

---

## 🐳 Docker Deployment

To build and run the frontend using Docker and Nginx:

```bash
# Build the Docker image
docker build -t sofochat-frontend:latest .

# Run container on port 80
docker run -d -p 80:80 --name sofochat-frontend-instance sofochat-frontend:latest
```

Access the web app at `http://localhost`.

---

## 🌐 Environment & API Configuration

The frontend is pre-configured to proxy requests to the backend API (`http://localhost:8000`) and WebSocket server (`ws://localhost:8000/ws`).

For custom backend endpoints, configure `src/environments/environment.ts` or set the API base URL in `api.service.ts`:
- **Backend API**: `http://localhost:8000/api`
- **WebSocket Gateway**: `ws://localhost:8000/ws`

---

## 📄 License
Internal Enterprise System — **PJSOFONIC Connect**. All rights reserved.
