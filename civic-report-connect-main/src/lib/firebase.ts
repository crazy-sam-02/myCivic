import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC8yjnGhn3pyAyeeMmtfrhtqFp2M-FIoEo",
  authDomain: "my-civic-8b551.firebaseapp.com",
  projectId: "my-civic-8b551",
  storageBucket: "my-civic-8b551.firebasestorage.app",
  messagingSenderId: "633482562977",
  appId: "1:633482562977:web:2052c86817e8f108b90fe0",
  measurementId: "G-BV86Z6FVMD"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

export default firebaseApp;
