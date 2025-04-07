
# 🚀 SwaggerDrill

SwaggerDrill is a MERN stack application designed to automate the testing of GET/POST endpoints from OpenAPI Specification (OAS) URLs. It parses the OAS file, tests endpoints using dummy inputs, and displays the results in an interactive frontend interface.

---

## 🌍 Deployment Instructions

### ✅ Prerequisites

Ensure the following tools are installed on your system:

- **Node.js** (v16+)
- **MongoDB** (optional for future versions)
- **npm** or **yarn**
- **VS Code**
- **Git**

---

## 📁 Backend Deployment

### 🔧 Local Deployment

1. **Clone the Repository**
   ```bash
   git clone https://github.com/abdulaamir9496/swaggerdrill.git
   cd swaggerdrill/swaggerdrill-backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` File**
   Add the following environment variable in the root of `swaggerdrill-backend`:
   ```env
   PORT=5000
   ```

4. **Start the Backend Server**
   ```bash
   npm run dev
   ```
   or, if you’re not using `nodemon`:
   ```bash
   node index.js
   ```

The backend server will run on `http://localhost:5000/api/oas/test`

---

### ☁️ Cloud Deployment (Render)

1. Go to [Render.com](https://render.com/)
2. Click “New +” → “Web Service”
3. Connect your GitHub repository (select `swaggerdrill-backend` folder)
4. Set the following:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Environment Variable:** `PORT=5000`
5. Click **Deploy**

---

## 💻 Frontend Deployment (Vite + React)

1. **Navigate to frontend**
   ```bash
   cd swaggerdrill-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set Backend URL**
   In `.env` or directly inside `App.jsx`:
   ```env
   VITE_BACKEND_URL=https://your-backend-url.onrender.com/api/oas/test
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **For production (Netlify/Vercel):**
   - Connect GitHub repository
   - Set `VITE_BACKEND_URL` in environment settings
   - Click **Deploy**

---

## 🔍 Assumptions Made

- SwaggerDrill expects a publicly accessible OpenAPI JSON URL.
- Only GET and POST methods are supported for automatic testing.
- Dummy request bodies are generated where necessary.
- Endpoints requiring authentication are not yet supported.
- This app is designed to work with standard OpenAPI 3.0+ specs.

---

## 📘 License

MIT © 2025 Aamir | SwaggerDrill
