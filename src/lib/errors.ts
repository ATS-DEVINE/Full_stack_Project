const ERROR_MAP: Record<string, string> = {
  "invalid input syntax for type uuid": "Invalid ID format. Please try again.",
  "duplicate key value violates unique constraint": "This record already exists.",
  "new row violates row-level security policy": "You don't have permission to do this.",
  "null value in column": "Please fill in all required fields.",
  "foreign key violation": "This item is linked to other data and can't be changed right now.",
  "check constraint": "The value you entered is not valid.",
  "JWT expired": "Your session has expired. Please log in again.",
  "not authenticated": "Please log in to continue.",
  "PGRST301": "You don't have permission to access this.",
  "Failed to fetch": "Network error. Please check your connection.",
  "23505": "This record already exists.",
  "23503": "This item is linked to other records.",
  "42501": "You don't have permission to do this.",
  "PGRST116": "Record not found.",
};

export function friendlyError(error: any): string {
  const msg = typeof error === "string" ? error : error?.message || error?.details || error?.hint || "Something went wrong";

  for (const [key, friendly] of Object.entries(ERROR_MAP)) {
    if (msg.toLowerCase().includes(key.toLowerCase())) {
      return friendly;
    }
  }

  // Strip technical prefixes
  if (msg.includes("relation") || msg.includes("column") || msg.includes("syntax") || msg.includes("uuid") || msg.includes("violates")) {
    return "Something went wrong. Please try again or contact support.";
  }

  return msg;
}
