// Client-side data service functions

// Get current user data
export const getCurrentUser = async () => {
  try {
    const response = await fetch("/api/auth/me");
    if (!response.ok) {
      throw new Error("Failed to fetch user data");
    }
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

// Get current user role (client-side)
export const getCurrentUserRole = async (): Promise<string> => {
  try {
    const response = await fetch("/api/auth/me");
    if (!response.ok) {
      return "";
    }
    const data = await response.json();
    return data.user?.role?.toLowerCase() || "";
  } catch (error) {
    console.error("Error getting current user role:", error);
    return "";
  }
};

// Client-side data fetching functions that use API routes
