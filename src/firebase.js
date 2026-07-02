import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";
import { 
  getFirestore, collection, addDoc, getDocs, 
  deleteDoc, doc, updateDoc, query, orderBy 
} from "firebase/firestore";

export const firebaseConfig = {
  // Replace with your actual config from the Firebase Console
  apiKey: "AIzaSyAcTz_t6In9YEh5sHBjaTVcIYQLIreAiV4",
  authDomain: "iconx-1a576.firebaseapp.com",
  projectId: "iconx-1a576",
  storageBucket: "iconx-1a576.firebasestorage.app",
  messagingSenderId: "227631904472",
  appId: "1:227631904472:web:f07ddac207ce0bd95909ad"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, "us-central1");

// CRUD: Create (Add Attendance)
export const addAttendanceRecord = async (empId, hours, rate, extraFields = {}) => {
  return await addDoc(collection(db, "attendance"), {
    emp_id: empId,
    work_hour: Number(hours),
    base_salary_rate: Number(rate),
    timestamp: new Date().toISOString(),
    ...extraFields,
  });
};

// Supporting alias for TestAuth.js
export const addAttendance = addAttendanceRecord;

// CRUD: Read
export const getAttendanceRecords = async () => {
  const q = query(collection(db, "attendance"), orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

// CRUD: Update
export const updateAttendanceRecord = async (id, updatedFields) => {
  const docRef = doc(db, "attendance", id);
  return await updateDoc(docRef, updatedFields);
};

// CRUD: Delete
export const deleteAttendanceRecord = async (id) => {
  const docRef = doc(db, "attendance", id);
  return await deleteDoc(docRef);
};


// Add product with image URL
export const addProduct = async (name, description, price, imageUrl) => {
  return await addDoc(collection(db, "products"), {
    name,
    description,
    price: Number(price),
    imageUrl,           // Cloudinary URL stored here
    createdAt: new Date().toISOString(),
  });
};

// Get all products
export const getProducts = async () => {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Delete product
export const deleteProduct = async (id) => {
  return await deleteDoc(doc(db, "products", id));
};
