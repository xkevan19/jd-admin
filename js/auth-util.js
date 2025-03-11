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
    return {
      url: "https://lizdybqvrzybcczvqdma.supabase.co",
      key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpemR5YnF2cnp5YmNjenZxZG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyNDQ3MDcsImV4cCI6MjA1NjgyMDcwN30.mXFeXH6UN-C9OEqVTL65n3BmJ4mBsIrcJGhlXjOqpFE",
    };
  }
};

// Handle logout functionality
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

// Audio feedback function
function playBeepBoop() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  function beep(time, frequency, duration) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = frequency;
    gainNode.gain.value = 0.1;
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(time);
    oscillator.stop(time + duration);
  }
  const now = audioContext.currentTime;
  beep(now, 880, 0.1);
  beep(now + 0.15, 587, 0.15);
  beep(now + 0.35, 349, 0.2);
}

// Make explosion cover more of the page
function enhanceExplosion() {
  const explosion = document.querySelector('.explosion');
  if (explosion) {
    // Make explosion larger and centered on page
    explosion.style.width = '300px';
    explosion.style.height = '300px';
    explosion.style.position = 'fixed';
    explosion.style.top = '50%';
    explosion.style.left = '50%';
    explosion.style.transform = 'translate(-50%, -50%) scale(0.5)';
    explosion.style.zIndex = '1000';
  }
}

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Handle logout button click
  const logoutBtn = document.getElementById('logoutBtn');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      if (!this.classList.contains('self-destruct')) {
        // Enhance explosion size
        enhanceExplosion();
        
        // Add animation class
        this.classList.add('self-destruct');
        
        // Play sound effect
        playBeepBoop();
        
        // Wait for animation to complete before logout
        // The animation takes about 2 seconds based on your CSS
        setTimeout(async () => {
          await handleLogout();
        }, 2000); // Set to slightly less than the full animation time
      }
    });
  }
});