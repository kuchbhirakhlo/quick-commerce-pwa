"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { VendorForm } from "./components/VendorForm"
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
  getFirestore,
  where,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot
} from "firebase/firestore"
import {
  initializeFirebaseApp,
  retryFirestoreOperation
} from "@/lib/firebase/firebase-client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Search, Filter, ChevronLeft, ChevronRight, WifiOff, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useFirebaseConnection } from "@/hooks/useFirebaseConnection"

interface Vendor {
  id: string
  name: string
  email: string
  phone: string
  pincodes: string[]
  status: string
  productsCount: number
  joinedDate: string
  deliveryMessage?: string
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [allVendors, setAllVendors] = useState<Vendor[]>([]) // Store all vendors for client-side filtering
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3
  // Add loading state for status changes
  const [statusChangeLoading, setStatusChangeLoading] = useState<{ [key: string]: boolean }>({})

  // Use our custom hook for connection status
  const { isOffline, isOnline, lastOnlineTime, shouldShowWarning } = useFirebaseConnection();

  // Search and filtering
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const initializeAndFetch = async () => {
      try {
        // Initialize Firebase app
        const app = initializeFirebaseApp();

        if (!app) {
          throw new Error("Firebase initialization failed");
        }

        // Get Firestore instance
        const firestoreDb = getFirestore(app);

        if (!firestoreDb) {
          throw new Error("Firestore initialization failed");
        }

        // Fetch vendors
        await fetchVendors(firestoreDb);
      } catch (error: any) {
        console.error("Error initializing Firebase:", error);
        setError(error.message || "Failed to initialize Firebase");

        // Retry initialization if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          console.log(`Retrying initialization (${retryCount + 1}/${maxRetries})...`);
          setRetryCount(retryCount + 1);
          setTimeout(() => initializeAndFetch(), 1500 * Math.pow(2, retryCount)); // Exponential backoff
        } else {
          setLoading(false);
        }
      }
    };

    initializeAndFetch();
  }, [retryCount]);

  // Apply filters and pagination whenever search term, status filter, or page changes
  useEffect(() => {
    if (allVendors.length > 0) {
      applyFiltersAndPagination();
    }
  }, [searchTerm, statusFilter, currentPage, allVendors]);

  const fetchVendors = async (firestoreDb: any) => {
    try {
      setError(null);
      setLoading(true);

      // Use the retry utility for better error handling
      const vendorsData = await retryFirestoreOperation(async () => {
        // Create a simple query to get all vendors
        const vendorsRef = collection(firestoreDb, "vendors");
        const vendorsQuery = query(vendorsRef, orderBy("joinedDate", "desc"));

        // Get vendors data
        const snapshot = await getDocs(vendorsQuery);

        if (snapshot.empty) {
          console.log("No vendors found in the database");
          return [];
        }

        // Map data to Vendor interface
        return snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            pincodes: Array.isArray(data.pincodes) ? data.pincodes : [],
            status: data.status || 'pending',
            productsCount: data.productsCount || 0,
            joinedDate: data.joinedDate || new Date().toISOString(),
            deliveryMessage: data.deliveryMessage || 'Delivery in 8 minutes',
          };
        });
      });

      console.log(`Fetched ${vendorsData.length} vendors from Firestore`);

      // Store all vendors for filtering
      setAllVendors(vendorsData);

      // Apply initial filters and pagination
      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching vendors:", error);
      setError(error.message || "Failed to fetch vendors. Please try again.");
      setLoading(false);
    }
  };

  const applyFiltersAndPagination = () => {
    // Apply status filter
    let filteredVendors = allVendors;

    if (statusFilter !== "all") {
      filteredVendors = filteredVendors.filter(vendor => vendor.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredVendors = filteredVendors.filter(vendor =>
        vendor.name.toLowerCase().includes(searchLower) ||
        vendor.email.toLowerCase().includes(searchLower) ||
        vendor.phone.includes(searchTerm)
      );
    }

    // Calculate total pages
    const calculatedTotalPages = Math.max(1, Math.ceil(filteredVendors.length / pageSize));
    setTotalPages(calculatedTotalPages);

    // Adjust current page if needed
    if (currentPage > calculatedTotalPages) {
      setCurrentPage(calculatedTotalPages);
      return; // The useEffect will trigger again with the corrected page
    }

    // Apply pagination
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedVendors = filteredVendors.slice(startIndex, startIndex + pageSize);

    setVendors(paginatedVendors);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleStatusChange = async (vendorId: string, newStatus: string) => {
    try {
      setError(null);
      // Set loading state for this specific vendor
      setStatusChangeLoading(prev => ({ ...prev, [vendorId]: true }));

      // Initialize Firebase app
      const app = initializeFirebaseApp();
      if (!app) {
        throw new Error("Firebase is not initialized");
      }

      // Get Firestore instance
      const firestoreDb = getFirestore(app);
      if (!firestoreDb) {
        throw new Error("Firestore is not initialized");
      }

      console.log(`Updating vendor ${vendorId} status to ${newStatus}...`);

      // Update vendor status using retry utility
      await retryFirestoreOperation(async () => {
        return updateDoc(doc(firestoreDb, "vendors", vendorId), {
          status: newStatus,
          updatedAt: new Date().toISOString()
        });
      });

      // Update local state
      const updatedAllVendors = allVendors.map(vendor =>
        vendor.id === vendorId ? { ...vendor, status: newStatus } : vendor
      );
      setAllVendors(updatedAllVendors);

      // Apply filters to update the displayed vendors
      applyFiltersAndPagination();

      // Success message
      console.log(`Vendor ${vendorId} status updated to ${newStatus}`);
    } catch (error: any) {
      console.error("Error updating vendor status:", error);
      setError(`Failed to update vendor status: ${error.message || "Unknown error"}`);
    } finally {
      // Clear loading state for this specific vendor
      setStatusChangeLoading(prev => ({ ...prev, [vendorId]: false }));
    }
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setSelectedVendor(null);

    // Initialize Firebase app
    const app = initializeFirebaseApp();
    if (app) {
      const firestoreDb = getFirestore(app);
      if (firestoreDb) {
        await fetchVendors(firestoreDb);
      }
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setRetryCount(0);
  };

  const getActiveVendorsCount = () => {
    return allVendors.filter(v => v.status === "active").length;
  };

  const getPendingVendorsCount = () => {
    return allVendors.filter(v => v.status === "pending").length;
  };

  // Format the last online time
  const formatLastOnlineTime = () => {
    if (!lastOnlineTime) return "";

    const now = new Date();
    const diffMs = now.getTime() - lastOnlineTime.getTime();
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins === 1) return "1 minute ago";
    if (diffMins < 60) return `${diffMins} minutes ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1 hour ago";
    return `${diffHours} hours ago`;
  };

  if (loading && retryCount === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isOffline && (
        <Alert variant={shouldShowWarning ? "destructive" : "default"}>
          <WifiOff className="h-4 w-4" />
          <AlertTitle>You are offline</AlertTitle>
          <AlertDescription>
            {shouldShowWarning
              ? "Connection to Firebase has been lost. Your changes will be saved when your connection is restored."
              : "You appear to be offline. Some features may be limited until your connection is restored."}
            {lastOnlineTime && (
              <div className="flex items-center mt-1 text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Last online: {formatLastOnlineTime()}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <Button
              variant="link"
              className="p-0 h-auto text-sm ml-2 text-white underline"
              onClick={handleRetry}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vendors</h1>
        <Button onClick={() => setShowForm(true)}>Add New Vendor</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allVendors.length}</div>
            <p className="text-xs text-muted-foreground">Registered vendors in the system</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getActiveVendorsCount()}</div>
            <p className="text-xs text-muted-foreground">Currently active vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getPendingVendorsCount()}</div>
            <p className="text-xs text-muted-foreground">Vendors awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <VendorForm
          vendor={selectedVendor || undefined}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setSelectedVendor(null);
          }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Vendor Management</CardTitle>
          <CardDescription>Manage your vendors, approve new registrations, or block vendors.</CardDescription>

          <div className="flex flex-col gap-4 mt-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search vendors..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1); // Reset to first page on filter change
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                {allVendors.length === 0
                  ? "No vendors found in the database."
                  : "No vendors match your search criteria."}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Pincodes</TableHead>
                    <TableHead>Delivery Message</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">{vendor.name}</TableCell>
                      <TableCell>
                        <div>{vendor.email}</div>
                        <div className="text-sm text-gray-500">{vendor.phone}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {vendor.pincodes.slice(0, 3).map((pincode) => (
                            <Badge key={pincode} variant="outline">
                              {pincode}
                            </Badge>
                          ))}
                          {vendor.pincodes.length > 3 && (
                            <Badge variant="outline">+{vendor.pincodes.length - 3}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{vendor.deliveryMessage || "Delivery in 8 minutes"}</TableCell>
                      <TableCell>{vendor.productsCount}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            vendor.status === "active"
                              ? "bg-green-100 text-green-800"
                              : vendor.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {vendor.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedVendor(vendor);
                              setShowForm(true);
                            }}
                          >
                            Edit
                          </Button>
                          {vendor.status === "pending" && (
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => handleStatusChange(vendor.id, "active")}
                              disabled={isOffline || statusChangeLoading[vendor.id]}
                            >
                              {statusChangeLoading[vendor.id] ? (
                                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></span>
                              ) : null}
                              Approve
                            </Button>
                          )}
                          {vendor.status === "active" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleStatusChange(vendor.id, "blocked")}
                              disabled={isOffline || statusChangeLoading[vendor.id]}
                            >
                              {statusChangeLoading[vendor.id] ? (
                                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></span>
                              ) : null}
                              Block
                            </Button>
                          )}
                          {vendor.status === "blocked" && (
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => handleStatusChange(vendor.id, "active")}
                              disabled={isOffline || statusChangeLoading[vendor.id]}
                            >
                              {statusChangeLoading[vendor.id] ? (
                                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></span>
                              ) : null}
                              Unblock
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  {statusFilter === "all" && !searchTerm
                    ? `Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, allVendors.length)} of ${allVendors.length} vendors`
                    : `Showing filtered results (page ${currentPage} of ${totalPages})`
                  }
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm">Page {currentPage} of {totalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
