const checkAuthStatus = async () => {
  try {
    const { createClient } = window.supabase;
    const config = await fetchSupabaseConfig();
    const supabaseClient = createClient(config.url, config.key);

    // Check if user is logged in
    const {
      data: { session },
      error,
    } = await supabaseClient.auth.getSession();

    if (error) {
      console.error("Authentication error:", error.message);
      redirectToLogin();
      return null;
    }

    if (!session) {
      console.log("No active session found");
      redirectToLogin();
      return null;
    }

    console.log("User authenticated:", session.user.email);
    return session;
  } catch (error) {
    console.error("Session verification failed:", error.message);
    redirectToLogin();
    return null;
  }
};

const redirectToLogin = () => {
  window.location.href = "index.html";
};

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

// Simple error alert function since it was missing
const showErrorAlert = (message) => {
  alert(message); // You can replace this with a more sophisticated UI approach
};

const handleLogout = async () => {
  try {
    // Get a fresh Supabase client inside this function
    const { createClient } = window.supabase;
    const config = await fetchSupabaseConfig();
    const supabaseClient = createClient(config.url, config.key);
    
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      console.error("Logout error:", error.message);
      showErrorAlert("Logout failed. Please try again.");
    } else {
      console.log("Successfully logged out");
      window.location.href = "index.html";
    }
  } catch (error) {
    console.error("Logout failed:", error.message);
    showErrorAlert("An error occurred during logout. Please try again.");
  }
};

const logoutButton = document.getElementById("logoutBtn");
if (logoutButton) {
  logoutButton.addEventListener("click", handleLogout);
}