// Vendor schema and functions for Firebase Firestore
import { db, auth } from "./config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  type User,
} from "firebase/auth";

// Vendor interface
export interface VendorCredential {
  id?: string;
  uid: string;           // Firebase Auth UID
  name: string;          // Vendor's business name
  email: string;         // Email used for authentication
  phone: string;         // Contact phone number
  address: string;       // Physical address
  pincodes: string[];    // Service areas
  password?: string;     // Only used during creation, not stored
  role: "vendor";        // Role for authorization
  status: "active" | "pending" | "blocked"; // Account status
  productsCount?: number; // Number of products
  joinedDate: string;     // ISO string of join date
  createdAt?: Timestamp;  // Server timestamp
  updatedAt?: Timestamp;  // Server timestamp
  lastLogin?: Timestamp;  // Last login timestamp
  profileComplete: boolean; // Whether profile is complete
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
  };
  businessDetails?: {
    gstNumber: string;
    panNumber: string;
    businessType: string;
  };
}

// Create a new vendor with authentication
export const createVendorWithAuth = async (vendorData: Omit<VendorCredential, "id" | "uid" | "createdAt" | "updatedAt" | "joinedDate">) => {
  try {
    if (!vendorData.password) {
      throw new Error("Password is required for vendor creation");
    }

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      vendorData.email,
      vendorData.password
    );

    const uid = userCredential.user.uid;
    const vendorId = `vendor_${uid}`;

    // Prepare vendor data for Firestore (exclude password)
    const { password, ...vendorDataForFirestore } = vendorData;
    
    // Add additional fields
    const vendorDocData = {
      ...vendorDataForFirestore,
      uid,
      joinedDate: new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      profileComplete: false,
      productsCount: 0,
    };

    // Save to Firestore
    await setDoc(doc(db, "vendors", vendorId), vendorDocData);

    return {
      id: vendorId,
      ...vendorDocData,
    };
  } catch (error) {
    console.error("Error creating vendor:", error);
    throw error;
  }
};

// Get vendor by ID
export const getVendorById = async (vendorId: string) => {
  try {
    const docRef = doc(db, "vendors", vendorId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as VendorCredential;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting vendor by ID:", error);
    return null;
  }
};

// Get vendor by UID (Firebase Auth user ID)
export const getVendorByUid = async (uid: string) => {
  try {
    // Try direct UID match
    const vendorId = `vendor_${uid}`;
    const docRef = doc(db, "vendors", vendorId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as VendorCredential;
    }
    
    // If not found, try query by uid field
    const vendorsQuery = query(
      collection(db, "vendors"),
      where("uid", "==", uid)
    );
    
    const querySnapshot = await getDocs(vendorsQuery);
    if (!querySnapshot.empty) {
      const vendorDoc = querySnapshot.docs[0];
      return { id: vendorDoc.id, ...vendorDoc.data() } as VendorCredential;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting vendor by UID:", error);
    return null;
  }
};

// Get vendor by email
export const getVendorByEmail = async (email: string) => {
  try {
    const vendorsQuery = query(
      collection(db, "vendors"),
      where("email", "==", email)
    );
    
    const querySnapshot = await getDocs(vendorsQuery);
    if (!querySnapshot.empty) {
      const vendorDoc = querySnapshot.docs[0];
      return { id: vendorDoc.id, ...vendorDoc.data() } as VendorCredential;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting vendor by email:", error);
    return null;
  }
};

// Update vendor
export const updateVendor = async (
  vendorId: string,
  vendorData: Partial<Omit<VendorCredential, "id" | "uid" | "createdAt" | "updatedAt">>
) => {
  try {
    const docRef = doc(db, "vendors", vendorId);
    
    // Add updatedAt timestamp
    const updateData = {
      ...vendorData,
      updatedAt: serverTimestamp(),
    };
    
    await updateDoc(docRef, updateData);
    
    return {
      id: vendorId,
      ...updateData,
    };
  } catch (error) {
    console.error("Error updating vendor:", error);
    throw error;
  }
};

// Update vendor password
export const updateVendorPassword = async (user: User, newPassword: string) => {
  try {
    await updatePassword(user, newPassword);
    return true;
  } catch (error) {
    console.error("Error updating vendor password:", error);
    throw error;
  }
};

// Send password reset email
export const sendVendorPasswordReset = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

// Delete vendor
export const deleteVendor = async (vendorId: string) => {
  try {
    await deleteDoc(doc(db, "vendors", vendorId));
    return true;
  } catch (error) {
    console.error("Error deleting vendor:", error);
    throw error;
  }
};

// Get all vendors
export const getAllVendors = async () => {
  try {
    const vendorsQuery = query(
      collection(db, "vendors"),
      orderBy("joinedDate", "desc")
    );
    
    const querySnapshot = await getDocs(vendorsQuery);
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as VendorCredential[];
  } catch (error) {
    console.error("Error getting all vendors:", error);
    throw error;
  }
};

// Get active vendors
export const getActiveVendors = async () => {
  try {
    const vendorsQuery = query(
      collection(db, "vendors"),
      where("status", "==", "active"),
      orderBy("joinedDate", "desc")
    );
    
    const querySnapshot = await getDocs(vendorsQuery);
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as VendorCredential[];
  } catch (error) {
    console.error("Error getting active vendors:", error);
    throw error;
  }
};

// Update vendor login timestamp
export const updateVendorLoginTimestamp = async (vendorId: string) => {
  try {
    const docRef = doc(db, "vendors", vendorId);
    
    await updateDoc(docRef, {
      lastLogin: serverTimestamp(),
    });
    
    return true;
  } catch (error) {
    console.error("Error updating vendor login timestamp:", error);
    return false;
  }
}; 