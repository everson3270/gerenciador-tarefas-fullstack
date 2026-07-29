import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCpCBzvoVVVvuA9oLcBnazppn_kfZwe-b0",
  authDomain: "gerenciador-tarefas-3a2bd.firebaseapp.com",
  projectId: "gerenciador-tarefas-3a2bd",
  storageBucket: "gerenciador-tarefas-3a2bd.firebasestorage.app",
  messagingSenderId: "868103716148",
  appId: "1:868103716148:web:daa31825e72409215e7961",
  measurementId: "G-LJ71GG70XB"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);