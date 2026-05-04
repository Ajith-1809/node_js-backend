# 🚀 HR Management System (Pro)

A high-performance, professional HR Management Portal featuring a state-of-the-art **Glassmorphism UI**, real-time analytics, and secure role-based access control.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/frontend-ReactJS-61DAFB.svg)
![Node](https://img.shields.io/badge/backend-NodeJS-339933.svg)
![MongoDB](https://img.shields.io/badge/database-MongoDB-47A248.svg)

---

## ✨ Key Features

- **💎 Glassmorphism UI**: Premium visual design with smooth animations and interactive elements.
- **📊 Real-time Analytics**: Dynamic charts for Department Distribution, Gender Diversity, and Employee Status.
- **🛡️ Secure Auth**: JWT-based authentication with Admin and User role-based permissions.
- **👥 Employee Management**: Full CRUD operations with smart validation (e.g., 18+ age verification).
- **📋 Audit Logging**: Comprehensive tracking of all administrative actions for transparency.
- **📱 Responsive Design**: Fully optimized for mobile, tablet, and desktop viewports.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Lucide Icons, Recharts |
| **Backend** | Node.js, Express, JWT, BcryptJS |
| **Database** | MongoDB Atlas (Cloud) |
| **Hosting** | Firebase (Frontend) & Render (Backend) |

---

## 🚀 Deployment Architecture

This project is optimized for a **Multi-Cloud Deployment** strategy:

1.  **Frontend**: Hosted on **Firebase Hosting** for global CDN performance.
    - URL: `https://ajith-nodejs-hr-portal.web.app`
2.  **Backend**: Hosted on **Render** as a high-availability Web Service.
    - URL: `https://node-js-backend-3l5m.onrender.com`
3.  **Database**: **MongoDB Atlas** providing a secure, scalable cloud document store.

---

## ⚙️ Local Setup

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Ajith-1809/node_js-backend.git
    cd node_js-backend
    ```

2.  **Configure Environment**:
    Create a `.env` file in the `backend` folder:
    ```env
    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=your_secret_key
    PORT=5000
    ```

3.  **Install & Run**:
    - **Backend**: `cd backend && npm install && npm start`
    - **Frontend**: `cd frontend && npm install && npm run dev`

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---
**Developed with ❤️ by [Ajith](https://github.com/Ajith-1809)**
