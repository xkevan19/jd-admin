let supabaseClient;

const fetchSupabaseConfig = async () => {
  try {
    const response = await fetch("/.netlify/functions/getsupabaseconfig");
    if (response.ok) {
      return await response.json();
    }
    throw new Error("Could not fetch secure config");
  } catch (error) {
    console.error("Error fetching config:", error);
    throw new Error("Failed to get Supabase configuration");
  }
};

// Initialize session
const initializeSession = async () => {
  try {
    const { createClient } = window.supabase;
    const config = await fetchSupabaseConfig();
    if (!config) {
      redirectToLogin("Configuration error");
      return null;
    }
    supabaseClient = createClient(config.url, config.key);
    const {
      data: { session },
      error,
    } = await supabaseClient.auth.getSession();
    if (error || !session) {
      redirectToLogin("No active session");
      return null;
    }
    return session;
  } catch (error) {
    console.error("Session initialization failed:", error.message);
    redirectToLogin("Session error");
    return null;
  }
};

const redirectToLogin = (reason) => {
  console.log(`Redirecting to login: ${reason}`);
  window.location.href = "login.html";
};

// Load user profile
const loadUserProfile = async (session) => {
  try {
    const userEmail = session.user.email;
    document.getElementById("userEmail").textContent = userEmail;
    const initials = userEmail.split("@")[0].substring(0, 2).toUpperCase();
    document.getElementById("userInitials").textContent = initials;
    if (document.getElementById("mobileUserInitials")) {
      document.getElementById("mobileUserInitials").textContent = initials;
    }
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .single();
    document.getElementById("userName").textContent =
      data?.full_name || userEmail.split("@")[0];
  } catch (error) {
    console.error("Error loading profile:", error.message);
  }
};

const showErrorAlert = (message) => {
  const alert = document.createElement("div");
  alert.classList.add(
    "bg-red-500",
    "text-white",
    "p-4",
    "rounded-lg",
    "shadow-lg",
    "flex",
    "items-center",
    "space-x-3",
    "mb-4",
    "transition-all",
    "opacity-100"
  );
  alert.innerHTML = `
    <i class="fas fa-exclamation-triangle"></i>
    <span>${message}</span>
  `;
  const alertContainer = document.getElementById("alertContainer");
  alertContainer.appendChild(alert);
  setTimeout(() => {
    alert.classList.add("opacity-0");
    setTimeout(() => {
      alert.remove();
    }, 500);
  }, 5000);
};

const handleLogout = async () => {
  try {
    if (!supabaseClient) {
      await initializeSession();
      if (!supabaseClient) {
        showErrorAlert("Unable to establish connection for logout.");
        return;
      }
    }

    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      console.error("Logout error:", error.message);
      showErrorAlert("Logout failed. Please try again.");
    } else {
      console.log("Successfully logged out");
      window.location.href = "login.html";
    }
  } catch (error) {
    console.error("Logout failed:", error.message);
    showErrorAlert("An error occurred during logout. Please try again.");
  }
};

// Add event listener to logout button
const logoutButton = document.getElementById("logoutBtn");
if (logoutButton) {
  logoutButton.addEventListener("click", handleLogout);
}

// Initialize authentication on page load
const initAuth = async () => {
  const session = await initializeSession();
  if (session) {
    await loadUserProfile(session);
  }
};

// Run initialization if not on the login page
if (!window.location.pathname.includes("login.html")) {
  initAuth();
}
