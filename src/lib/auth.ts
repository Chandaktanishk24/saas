/**
 * Safe Authentication and LocalStorage Helper Library
 * Provides robust wrappers for getItem, setItem, removeItem, and JSON parsing
 * with comprehensive validation and centralized error logging.
 */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Centralized logging for authentication and storage failures
 */
export function logAuthError(context: string, error: any): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[AUTH_STORAGE_ERROR] in context "${context}":`, message, error);
}

/**
 * Safe retrieval from localStorage with error catching
 */
export function safeGetItem(key: string): string | null {
  try {
    const val = localStorage.getItem(key);
    if (val === null || val === undefined || val.trim() === "") {
      return null;
    }
    return val;
  } catch (error) {
    logAuthError(`safeGetItem(${key})`, error);
    return null;
  }
}

/**
 * Safe write to localStorage with error catching
 */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    logAuthError(`safeSetItem(${key})`, error);
    return false;
  }
}

/**
 * Safe removal from localStorage with error catching
 */
export function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    logAuthError(`safeRemoveItem(${key})`, error);
    return false;
  }
}

/**
 * Validates and parses JSON in a type-safe manner with custom validator checks
 */
export function safeParseJSON<T>(
  jsonStr: string | null,
  validator?: (data: any) => boolean
): { success: boolean; data: T | null; error: string | null } {
  if (!jsonStr || jsonStr.trim() === "") {
    return { success: false, data: null, error: "Empty or null JSON string provided." };
  }

  try {
    const parsed = JSON.parse(jsonStr);
    
    // Run custom validator checking if provided
    if (validator && !validator(parsed)) {
      return { success: false, data: null, error: "JSON parsed successfully but failed validation checks." };
    }

    return { success: true, data: parsed as T, error: null };
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, data: null, error: `JSON syntax error: ${msg}` };
  }
}

/**
 * Validate AuthUser shape
 */
export function isValidAuthUser(data: any): data is AuthUser {
  return (
    data !== null &&
    typeof data === "object" &&
    typeof data.id === "string" &&
    data.id.trim() !== "" &&
    typeof data.name === "string" &&
    data.name.trim() !== "" &&
    typeof data.email === "string" &&
    data.email.trim() !== "" &&
    typeof data.role === "string" &&
    data.role.trim() !== ""
  );
}

/**
 * Specific AuthUser persistence and retrieval helper
 */
export function getStoredUser(): AuthUser | null {
  const raw = safeGetItem("veloce_user");
  if (!raw) return null;

  const result = safeParseJSON<AuthUser>(raw, isValidAuthUser);
  if (!result.success) {
    logAuthError("getStoredUser: Validation failed, clearing corrupted data.", result.error);
    safeRemoveItem("veloce_user");
    safeRemoveItem("veloce_token"); // Remove linked token if session is broken
    return null;
  }
  return result.data;
}

export function setStoredUser(user: AuthUser): void {
  if (isValidAuthUser(user)) {
    safeSetItem("veloce_user", JSON.stringify(user));
  } else {
    logAuthError("setStoredUser: Invalid user object schema", user);
  }
}

export function removeStoredUser(): void {
  safeRemoveItem("veloce_user");
}

/**
 * Specific Token persistence and retrieval helper
 */
export function getStoredToken(): string | null {
  return safeGetItem("veloce_token");
}

export function setStoredToken(token: string): void {
  if (token && token.trim() !== "") {
    safeSetItem("veloce_token", token);
  } else {
    logAuthError("setStoredToken: Token is empty or invalid", token);
  }
}

export function removeStoredToken(): void {
  safeRemoveItem("veloce_token");
}

/**
 * Specific CMSData persistence and retrieval helper
 */
export function getStoredCmsData(fallback: any): any {
  const raw = safeGetItem("veloce_cms_data");
  if (!raw) return fallback;

  const result = safeParseJSON<any>(raw, (data) => data && typeof data === "object");
  if (!result.success) {
    logAuthError("getStoredCmsData: CMS JSON corrupt or malformed. Using fallback.", result.error);
    return fallback;
  }
  return result.data;
}

export function setStoredCmsData(data: any): void {
  if (data && typeof data === "object") {
    safeSetItem("veloce_cms_data", JSON.stringify(data));
  } else {
    logAuthError("setStoredCmsData: CMS data is not a valid object", data);
  }
}

export function removeStoredCmsData(): void {
  safeRemoveItem("veloce_cms_data");
}

/**
 * Cookie consent helper
 */
export function getStoredCookieConsent(): boolean {
  return safeGetItem("veloce_cookie_consent") === "true";
}

export function setStoredCookieConsent(consent: boolean): void {
  safeSetItem("veloce_cookie_consent", consent ? "true" : "false");
}

/**
 * Calendly Link helper
 */
export function getStoredCalendlyLink(fallback: string): string {
  return safeGetItem("veloce_calendly_link") || fallback;
}

export function setStoredCalendlyLink(link: string): void {
  if (link && link.trim() !== "") {
    safeSetItem("veloce_calendly_link", link);
  }
}
