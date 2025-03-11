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

const handleLogout = async () => {
  try {
    const config = await fetchSupabaseConfig();
    const supabaseClient = createClient(config.url, config.key);

    // Sign out the user
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      console.error("Logout error:", error.message);
      return false;
    }

    // Redirect to login page
    window.location.href = "index.html";
    return true;
  } catch (error) {
    console.error("Logout failed:", error.message);
    return false;
  }
};
