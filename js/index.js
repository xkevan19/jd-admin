document.addEventListener("DOMContentLoaded", async function () {
  // Variables
  const { createClient } = window.supabase;
  let supabaseClient;
  let selectedFiles = [];
  let selectedForDeletion = new Set();

  const logActivity = async (action, itemName = null, category = null) => {
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) return;

      const { error } = await supabaseClient.from("activity_logs").insert({
        user_id: session.user.id,
        user_name: session.user.email.split("@")[0],
        action: action,
        item_name: itemName,
        category: category,
        created_at: new Date().toISOString(),
      });

      if (error) console.error("Error logging activity:", error.message);
    } catch (error) {
      console.error("Activity logging failed:", error.message);
    }
  };

  // DOM Elements
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");
  const imagePreviews = document.getElementById("imagePreviews");
  const uploadBtn = document.getElementById("uploadBtn");
  const statusEl = document.getElementById("status");
  const progressContainer = document.getElementById("progressContainer");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  const noImagesMessage = document.getElementById("noImagesMessage");
  const selectAllBtn = document.getElementById("selectAllBtn");
  const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
  const lightboxModal = document.getElementById("lightboxModal");
  const lightboxImage = document.getElementById("lightboxImage");

  // Category elements
  const categoryClient = document.getElementById("categoryClient");
  const categoryRestaurant = document.getElementById("categoryRestaurant");
  const categoryEvents = document.getElementById("categoryEvents");
  const selectedCategory = document.getElementById("selectedCategory");

  // Set initial category selection
  categoryClient.classList.add("selected");
  categoryClient.querySelector(".fa-check").classList.remove("hidden");

  // Category selection handlers
  const categoryOptions = [categoryClient, categoryRestaurant, categoryEvents];

  categoryOptions.forEach((option) => {
    option.addEventListener("click", () => {
      categoryOptions.forEach((opt) => {
        opt.classList.remove("selected");
        opt.querySelector(".fa-check").classList.add("hidden");
      });

      option.classList.add("selected");
      option.querySelector(".fa-check").classList.remove("hidden");

      const categoryName = option.id.replace("category", "");
      selectedCategory.value = categoryName;
    });
  });

  // Fetch Supabase config securely
  const fetchSupabaseConfig = async () => {
    try {
      const response = await fetch("/.netlify/functions/getsupabaseconfig");
      if (!response.ok) throw new Error("Failed to fetch configuration");
      return await response.json();
    } catch (error) {
      console.error("Error fetching config:", error);
      statusEl.innerText = "Configuration error. Please contact support.";
      statusEl.classList.add("text-red-500");
      return null;
    }
  };

  // Check authentication status
  const checkAuthStatus = async () => {
    try {
      const config = await fetchSupabaseConfig();
      if (!config) return null;

      supabaseClient = createClient(config.url, config.key);
      const {
        data: { session },
        error,
      } = await supabaseClient.auth.getSession();

      if (error || !session) {
        console.error("Authentication error or no session");
        window.location.href = "index.html";
        return null;
      }

      document.getElementById("userEmail").textContent = session.user.email;
      return session;
    } catch (error) {
      console.error("Session verification failed:", error.message);
      window.location.href = "index.html";
      return null;
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logActivity("Logout");
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      window.location.href = "index.html";
    } catch (error) {
      console.error("Logout failed:", error.message);
      statusEl.innerText = "Logout failed. Please try again.";
      statusEl.classList.add("text-red-500");
    }
  };

  // Update UI based on selected files
  const updateUI = () => {
    if (selectedFiles.length === 0) {
      noImagesMessage.classList.remove("hidden");
      imagePreviews.classList.add("hidden");
    } else {
      noImagesMessage.classList.add("hidden");
      imagePreviews.classList.remove("hidden");
    }

    // Update upload button
    uploadBtn.disabled = selectedFiles.length === 0;
    uploadBtn.innerText = `Upload ${selectedFiles.length} Image${
      selectedFiles.length !== 1 ? "s" : ""
    }`;

    // Update delete button state
    deleteSelectedBtn.disabled = selectedForDeletion.size === 0;
    deleteSelectedBtn.classList.toggle(
      "opacity-50",
      selectedForDeletion.size === 0
    );
  };

  // Image selection for deletion
  const toggleImageSelection = (index, checkboxEl) => {
    if (selectedForDeletion.has(index)) {
      selectedForDeletion.delete(index);
      checkboxEl.checked = false;
    } else {
      selectedForDeletion.add(index);
      checkboxEl.checked = true;
    }

    // Update delete button state
    deleteSelectedBtn.disabled = selectedForDeletion.size === 0;
    deleteSelectedBtn.classList.toggle(
      "opacity-50",
      selectedForDeletion.size === 0
    );
  };

  // File handling functions
  const handleFiles = async (files) => {
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      selectedFiles.push(file);
      await logActivity("Select", file.name, "image");
    }

    renderPreviews();
    updateUI();
  };

  // Render all preview images
  const renderPreviews = () => {
    imagePreviews.innerHTML = "";

    selectedFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewContainer = document.createElement("div");
        previewContainer.className =
          "relative group border border-gray-700 rounded-lg overflow-hidden";

        // Image preview
        const preview = document.createElement("img");
        preview.src = e.target.result;
        preview.className =
          "preview-image w-full h-32 object-cover cursor-pointer";
        preview.alt = file.name;
        preview.onclick = () => showLightbox(e.target.result, file.name);

        // Selection checkbox
        const checkboxContainer = document.createElement("div");
        checkboxContainer.className = "absolute top-2 left-2";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "w-4 h-4 accent-orange-500 cursor-pointer";
        checkbox.onclick = (e) => {
          e.stopPropagation();
          toggleImageSelection(index, checkbox);
        };

        checkboxContainer.appendChild(checkbox);

        // Controls overlay
        const controls = document.createElement("div");
        controls.className =
          "absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-2 flex justify-between items-center transform translate-y-full group-hover:translate-y-0 transition-transform";

        // File info
        const fileInfo = document.createElement("div");
        fileInfo.className = "text-xs truncate max-w-[80%]";
        fileInfo.textContent = file.name;

        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "text-red-400 hover:text-red-300";
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          removeFile(index);
        };

        controls.appendChild(fileInfo);
        controls.appendChild(deleteBtn);

        previewContainer.appendChild(preview);
        previewContainer.appendChild(checkboxContainer);
        previewContainer.appendChild(controls);
        imagePreviews.appendChild(previewContainer);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove a single file
  const removeFile = async (index) => {
    const file = selectedFiles[index];
    selectedFiles.splice(index, 1);
    selectedForDeletion.clear();
    renderPreviews();
    updateUI();

    await logActivity("Delete", file.name, "image");
  };

  // Remove multiple selected files
  const removeSelectedFiles = async () => {
    const indicesToRemove = Array.from(selectedForDeletion).sort(
      (a, b) => b - a
    );
    for (const index of indicesToRemove) {
      const file = selectedFiles[index];
      selectedFiles.splice(index, 1);
    }
    selectedForDeletion.clear();
    renderPreviews();
    updateUI();

    await logActivity("Delete", `${indicesToRemove.length} images`, "image");
  };

  // Lightbox functions
  window.showLightbox = (src, alt) => {
    lightboxImage.src = src;
    lightboxImage.alt = alt || "Enlarged image";
    lightboxModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  };

  window.closeLightbox = () => {
    lightboxModal.classList.add("hidden");
    document.body.style.overflow = "";
  };

  // Upload images
  const uploadImages = async () => {
    if (selectedFiles.length === 0) return;

    const category = selectedCategory.value;

    try {
      statusEl.innerText = "Preparing upload...";
      statusEl.className = "mt-4 text-center text-blue-400 min-h-[24px]";

      progressContainer.classList.remove("hidden");

      let completedUploads = 0;
      const totalFiles = selectedFiles.length;

      for (const file of selectedFiles) {
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

        // Get file size in bytes
        const fileSize = file.size;

        // Upload to Supabase Storage
        const { data, error } = await supabaseClient.storage
          .from("portfolio-images")
          .upload(`uploads/${fileName}`, file);

        if (error) throw error;

        await logActivity("Upload", file.name, category);

        // Get the URL of the uploaded file
        const config = await fetchSupabaseConfig();
        const imageUrl = `${config.url}/storage/v1/object/public/portfolio-images/uploads/${fileName}`;

        const { error: insertError } = await supabaseClient
          .from("uploads")
          .insert([
            {
              image_url: imageUrl,
              category,
              file_size: fileSize,
            },
          ]);

        if (insertError) throw insertError;

        completedUploads++;
        const percentage = Math.round((completedUploads / totalFiles) * 100);
        progressBar.style.width = `${percentage}%`;
        progressText.innerText = `${percentage}% (${completedUploads}/${totalFiles})`;
      }

      statusEl.innerText = "All uploads successful!";
      statusEl.className = "mt-4 text-center text-green-500 min-h-[24px]";

      selectedFiles = [];
      selectedForDeletion.clear();
      renderPreviews();
      updateUI();

      // Hide progress after 3 seconds
      setTimeout(() => {
        progressContainer.classList.add("hidden");
      }, 3000);
    } catch (err) {
      statusEl.innerText = `Error: ${err.message}`;
      statusEl.className = "mt-4 text-center text-red-500 min-h-[24px]";

      // Show error in progress bar
      progressBar.style.width = "100%";
      progressBar.className = "bg-red-500 h-4 rounded-full";
      progressText.innerText = "Upload failed";
    }
  };

  // Event listeners for dropzone
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("active");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("active");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("active");
    handleFiles(e.dataTransfer.files);
  });

  // Click to browse
  fileInput.addEventListener("change", (e) => {
    handleFiles(e.target.files);
  });

  // Upload button
  uploadBtn.addEventListener("click", uploadImages);

  // Delete selected button
  deleteSelectedBtn.addEventListener("click", removeSelectedFiles);

  // Select all button
  selectAllBtn.addEventListener("click", () => {
    const checkboxes = imagePreviews.querySelectorAll('input[type="checkbox"]');

    const allSelected = selectedForDeletion.size === selectedFiles.length;

    if (allSelected) {
      selectedForDeletion.clear();
      checkboxes.forEach((cb) => (cb.checked = false));
    } else {
      selectedFiles.forEach((_, index) => selectedForDeletion.add(index));
      checkboxes.forEach((cb) => (cb.checked = true));
    }

    // Update delete button state
    deleteSelectedBtn.disabled = selectedForDeletion.size === 0;
    deleteSelectedBtn.classList.toggle(
      "opacity-50",
      selectedForDeletion.size === 0
    );
  });

  // Verify authentication first
  const session = await checkAuthStatus();
  if (!session) return;

  // Setup logout
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);

  const backToTopBtn = document.getElementById("backToTopBtn");
  const mainContent = document.querySelector("main");

  // Show button when scrolling down, hide when at top
  mainContent.addEventListener("scroll", function () {
    if (mainContent.scrollTop > 300) {
      backToTopBtn.classList.remove("opacity-0", "invisible");
      backToTopBtn.classList.add("opacity-100", "visible");
    } else {
      backToTopBtn.classList.remove("opacity-100", "visible");
      backToTopBtn.classList.add("opacity-0", "invisible");
    }
  });

  backToTopBtn.addEventListener("click", function () {
    mainContent.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  updateUI();
});
