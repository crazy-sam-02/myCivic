# Civic Report Connect

This repository contains two separate apps:

- `civic-report-connect-main/` - the frontend built with Vite, React, TypeScript, and Tailwind CSS
- `backend/` - the Express + MongoDB API server

## Prerequisites

Before installing the project, make sure you have:

- Node.js installed
- npm installed
- a MongoDB database URI
- Cloudinary credentials
- a Hugging Face token for the AI endpoints

If you do not already have Node.js installed, the simplest option is to install it through [nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

## 1. Clone the repository

Clone the GitHub repository to your local machine, then open the project folder:

```sh
git clone <YOUR_GITHUB_REPO_URL>
cd myCivic
```

If you already downloaded the source code another way, just open the `myCivic` folder in your editor.

## 2. Install the frontend

The frontend lives in [civic-report-connect-main](civic-report-connect-main).

```sh
cd civic-report-connect-main
npm install
```

After installation finishes, you can start the frontend development server with:

```sh
npm run dev
```

The Vite dev server usually runs at `http://localhost:5173`.

### Frontend environment variable

The frontend reads the API base URL from `VITE_API_BASE_URL` in [src/lib/api.ts](src/lib/api.ts). If you do not set it, the app automatically falls back to `http://localhost:5000`.

If you want to create a local `.env` file for the frontend, it can contain:

```env
VITE_API_BASE_URL=http://localhost:5000
```

## 3. Install the backend

The backend lives in [backend](backend) and must be installed separately.

Open a second terminal, then run:

```sh
cd backend
npm install
```

Start the backend server with:

```sh
npm run dev
```

By default, the backend starts on port `5000`.

## 4. Configure backend environment variables

The backend will not work correctly until its `.env` file is configured.

Create a file named `.env` inside the [backend](backend) folder and add the required values:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRECT_KEY=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
HF_TOKEN=your_hugging_face_token
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Important notes:

- `MONGO_URI` is used in [backend/db/db.js](backend/db/db.js) to connect to MongoDB.
- `JWT_SECRECT_KEY` and `JWT_REFRESH_SECRET` are used for authentication in [backend/controllers/Auth/authController.js](backend/controllers/Auth/authController.js).
- `HF_TOKEN` is required by [backend/controllers/aiController.js](backend/controllers/aiController.js) for image description and categorization.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are required by [backend/utils/cloudinaryUploader.js](backend/utils/cloudinaryUploader.js) for image uploads.

## 5. Run both apps together

Use two terminals:

```sh
# Terminal 1
cd civic-report-connect-main
npm run dev
```

```sh
# Terminal 2
cd backend
npm run dev
```

Once both servers are running:

- open the frontend in your browser at the Vite URL
- confirm the backend health endpoint works at `http://localhost:5000/api/health`

## 6. Optional checks

The frontend also provides these scripts:

```sh
npm run lint
npm run test
```

## Technologies

This project uses:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Express
- MongoDB
- Cloudinary
- Hugging Face inference APIs
