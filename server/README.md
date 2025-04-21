<!-- Full project instructions -->

# SwaggerDrill 🔥

A MERN stack app that accepts an OpenAPI JSON URL, parses endpoints, hits `GET` and `POST` routes using Axios, and returns logs + status.

## Features

- Accept OpenAPI (Swagger) JSON URL
- Test GET/POST endpoints
- View structured logs & status codes
- React + Vite + Tailwind frontend
- Node.js + Express backend

## Getting Started

1. **Backend**
```bash
cd server
npm install
npm run dev

# Project Title

## Deployment Instructions
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Create a `.env` file in the root directory and add your environment variables.
4. Start the server with `npm start`.
5. Run the frontend with `npm start` in the frontend directory.

## Steps to Run the Application in VS Code
1. Open the project in VS Code.
2. Open a terminal and navigate to the backend directory.
3. Run `npm start` to start the backend server.
4. Open another terminal and navigate to the frontend directory.
5. Run `npm start` to start the frontend application.

## Assumptions Made
- The application assumes that the OAS file provided is valid and accessible.
- The application can handle both JSON and YAML formats for OAS files.
- The application uses MongoDB for logging requests and responses.