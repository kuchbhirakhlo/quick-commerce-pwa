// Export Firebase configuration
export { app, auth, db, storage } from './config';

// Export Firebase client utilities
export {
  initializeFirebaseApp,
  initializeFirebaseAuth,
  initializeFirebaseStorage,
  retryFirestoreOperation,
  getAuth,
  getFirestore,
  getStorage
} from './firebase-client';

// Export vendor authentication functions
export {
  signInVendor,
  signOutVendor,
  resetVendorPassword,
  getCurrentVendorData
} from './vendor-auth';

// Export vendor schema and functions
export {
  type VendorCredential,
  createVendorWithAuth,
  getVendorById,
  getVendorByUid,
  getVendorByEmail,
  updateVendor,
  updateVendorPassword,
  sendVendorPasswordReset,
  deleteVendor,
  getAllVendors,
  getActiveVendors,
  updateVendorLoginTimestamp
} from './vendor-schema';

// Export Firestore types and functions
export {
  type Product,
  type Vendor,
  type Order,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  getOrderById,
  getOrdersByUser
} from './firestore'; 