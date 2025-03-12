document.addEventListener("DOMContentLoaded", async function () {
  // Variables
  const { createClient } = window.supabase;
  let supabaseClient;
  let currentPage = 1;
  let totalPages = 1;
  let pageSize = 12;
  let currentCategory = "all";
  let currentSearchQuery = "";
  let currentImages = [];
  let selectedImages = new Set();
  let currentLightboxImageId = null;

  // DOM Elements
  const imageGrid = document.getElementById("imageGrid");
  const loadingState = document.getElementById("loadingState");
  const emptyState = document.getElementById("emptyState");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const selectAllCheckbox = document.getElementById("selectAllCheckbox");
  const bulkActionButtons = document.getElementById("bulkActionButtons");
  const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
  const prevPageBtn = document.getElementById("prevPageBtn");
  const nextPageBtn = document.getElementById("nextPageBtn");
  const pageIndicator = document.getElementById("pageIndicator");
  const lightboxModal = document.getElementById("lightboxModal");
  const lightboxImage = document.getElementById("lightboxImage");
  const imageCategory = document.getElementById("imageCategory");
  const imageDate = document.getElementById("imageDate");
  const deleteImageBtn = document.getElementById("deleteImageBtn");
  const confirmationModal = document.getElementById("confirmationModal");
  const confirmationTitle = document.getElementById("confirmationTitle");
  const confirmationMessage = document.getElementById("confirmationMessage");
  const confirmActionBtn = document.getElementById("confirmActionBtn");

  // Sidebar Elements
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const openSidebarBtn = document.getElementById("openSidebar");
  const closeSidebarBtn = document.getElementById("closeSidebar");

  const openSidebar = () => {
    sidebar.classList.add("open");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  };

  const closeSidebar = () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  };

  if (openSidebarBtn) openSidebarBtn.addEventListener("click", openSidebar);
  if (closeSidebarBtn) closeSidebarBtn.addEventListener("click", closeSidebar);
  if (overlay) overlay.addEventListener("click", closeSidebar);

  // Close sidebar when clicking on menu items on mobile
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      if (window.innerWidth < 768) closeSidebar();
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 768) closeSidebar();
  });

  // Fetch Supabase config securely
  const fetchSupabaseConfig = async () => {
    try {
      const response = await fetch("/.netlify/functions/getsupabaseconfig");
      if (!response.ok) throw new Error("Failed to fetch configuration");
      return await response.json();
    } catch (error) {
      console.error("Error fetching config:", error);
      return null;
    }
  };

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
        window.location.href = "login.html";
        return null;
      }

      document.getElementById("userEmail").textContent = session.user.email;
      return session;
    } catch (error) {
      console.error("Session verification failed:", error.message);
      window.location.href = "login.html";
      return null;
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logActivity("Logout");
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      window.location.href = "login.html";
    } catch (error) {
      console.error("Logout failed:", error.message);
      statusEl.innerText = "Logout failed. Please try again.";
      statusEl.classList.add("text-red-500");
    }
  };

  const fetchImages = async () => {
    showLoading();

    try {
      let query = supabaseClient
        .from("uploads")
        .select("*", { count: "exact" });

      // Apply category filter if not "all"
      if (currentCategory !== "all") {
        query = query.eq("category", currentCategory);
      }

      // Apply search filter if present
      if (currentSearchQuery) {
        query = query.ilike("image_url", `%${currentSearchQuery}%`);
      }

      // Get total count first
      const { count, error: countError } = await query;
      if (countError) throw countError;

      totalPages = Math.max(1, Math.ceil(count / pageSize));

      if (currentPage > totalPages) {
        currentPage = totalPages;
      }
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      // Fetch data
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      currentImages = data;
      renderImages(data);
      updatePagination();

      // Log activity after fetching images
      logActivity(
        "Fetched images",
        `Category: ${currentCategory}, Search: ${currentSearchQuery}`,
        "Media"
      );
    } catch (error) {
      console.error("Error fetching images:", error);
      showEmptyState();
    }
  };

  // Render images to the grid
  const renderImages = (images) => {
    imageGrid.innerHTML = "";

    if (images.length === 0) {
      showEmptyState();
      return;
    }

    hideLoading();
    hideEmptyState();

    images.forEach((imageData) => {
      const card = document.createElement("div");
      card.className =
        "image-card relative group rounded-xl overflow-hidden shadow-lg";
      card.dataset.id = imageData.id;

      const img = document.createElement("img");
      img.src = imageData.image_url;
      img.alt = "Media image";
      img.className =
        "w-full h-48 object-cover transition-transform group-hover:scale-105";
      img.addEventListener("click", () => openLightbox(imageData));
      const checkboxWrapper = document.createElement("div");
      checkboxWrapper.className = "absolute top-2 left-2 z-10";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "w-4 h-4 accent-orange-500";
      checkbox.checked = selectedImages.has(imageData.id);
      checkbox.addEventListener("change", (e) => {
        e.stopPropagation();
        toggleImageSelection(imageData.id);
      });

      checkboxWrapper.appendChild(checkbox);

      const overlay = document.createElement("div");
      overlay.className =
        "absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent";

      const category = document.createElement("span");
      category.className =
        "text-xs font-medium bg-zinc-800 text-zinc-300 px-2 py-1 rounded-full";
      category.innerHTML = `<i class="${getCategoryIcon(
        imageData.category
      )}"></i> ${imageData.category}`;

      const date = document.createElement("div");
      date.className = "text-xs text-zinc-400 mt-2";
      date.textContent = formatDate(imageData.created_at);

      overlay.appendChild(category);
      overlay.appendChild(date);

      card.appendChild(img);
      card.appendChild(checkboxWrapper);
      card.appendChild(overlay);
      imageGrid.appendChild(card);
    });

    updateBulkActionVisibility();
  };

  // Show/hide states
  const showLoading = () => {
    loadingState.classList.remove("hidden");
    imageGrid.classList.add("hidden");
    emptyState.classList.add("hidden");
  };

  const hideLoading = () => {
    loadingState.classList.add("hidden");
    imageGrid.classList.remove("hidden");
  };

  const showEmptyState = () => {
    loadingState.classList.add("hidden");
    imageGrid.classList.add("hidden");
    emptyState.classList.remove("hidden");
  };

  const hideEmptyState = () => {
    emptyState.classList.add("hidden");
  };

  // Filter by category
  const filterByCategory = (category) => {
    currentCategory = category;
    currentPage = 1;

    // Update active button
    filterButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.category === category);
    });

    fetchImages();
  };

  // Handle search
  const handleSearch = () => {
    currentSearchQuery = searchInput.value.trim();
    currentPage = 1;
    fetchImages();
  };

  // Toggle image selection
  const toggleImageSelection = (imageId) => {
    if (selectedImages.has(imageId)) {
      selectedImages.delete(imageId);
    } else {
      selectedImages.add(imageId);
    }

    updateImageCheckboxes();
    updateSelectAllCheckbox();
    updateBulkActionVisibility();
  };

  // Select/deselect all images
  const toggleSelectAll = () => {
    if (selectedImages.size === currentImages.length) {
      selectedImages.clear();
    } else {
      currentImages.forEach((img) => selectedImages.add(img.id));
    }

    updateImageCheckboxes();
    updateBulkActionVisibility();
  };

  // Update all image checkboxes
  const updateImageCheckboxes = () => {
    const checkboxes = imageGrid.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      const imageId = parseInt(checkbox.closest(".image-card").dataset.id);
      checkbox.checked = selectedImages.has(imageId);
    });
  };

  // Update Select All checkbox
  const updateSelectAllCheckbox = () => {
    if (currentImages.length === 0) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.disabled = true;
    } else {
      selectAllCheckbox.disabled = false;
      selectAllCheckbox.checked = selectedImages.size === currentImages.length;
    }
  };

  // Update bulk action buttons visibility
  const updateBulkActionVisibility = () => {
    if (selectedImages.size > 0) {
      bulkActionButtons.classList.remove("hidden");
    } else {
      bulkActionButtons.classList.add("hidden");
    }
  };

  // Update pagination controls
  const updatePagination = () => {
    pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
  };

  const deleteSelectedImages = async () => {
    if (selectedImages.size === 0) return;

    showConfirmationModal(
      "Delete Selected Images",
      `Are you sure you want to delete ${selectedImages.size} selected image(s)? This action cannot be undone.`,
      async () => {
        try {
          for (const id of selectedImages) {
            const { data: imageData } = await supabaseClient
              .from("uploads")
              .select("image_url")
              .eq("id", id)
              .single();

            if (imageData) {
              await supabaseClient.from("uploads").delete().eq("id", id);

              // Extract file path from URL to delete from storage
              const urlParts = imageData.image_url.split("/");
              const fileName = urlParts[urlParts.length - 1];

              // Delete from storage
              await supabaseClient.storage
                .from("portfolio-images")
                .remove([`uploads/${fileName}`]);

              // Log activity after deleting image
              logActivity(
                "Deleted image",
                `Image URL: ${imageData.image_url}`,
                "Media"
              );
            }
          }

          selectedImages.clear();
          await fetchImages();
          updateBulkActionVisibility();
        } catch (error) {
          console.error("Error deleting images:", error);
          alert("An error occurred while deleting images. Please try again.");
        }
      }
    );
  };

  // Open lightbox
  const openLightbox = (imageData) => {
    lightboxImage.src = imageData.image_url;
    imageCategory.innerHTML = `<i class="${getCategoryIcon(
      imageData.category
    )}"></i> ${imageData.category}`;
    imageDate.textContent = formatDate(imageData.created_at);
    currentLightboxImageId = imageData.id;
    lightboxModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  };

  // Close lightbox
  window.closeLightbox = () => {
    lightboxModal.classList.add("hidden");
    document.body.style.overflow = "";
    currentLightboxImageId = null;
  };

  // Delete image from lightbox
  const deleteCurrentImage = () => {
    if (!currentLightboxImageId) return;

    showConfirmationModal(
      "Delete Image",
      "Are you sure you want to delete this image? This action cannot be undone.",
      async () => {
        try {
          // Get the image URL first
          const { data: imageData } = await supabaseClient
            .from("uploads")
            .select("image_url")
            .eq("id", currentLightboxImageId)
            .single();

          if (imageData) {
            await supabaseClient
              .from("uploads")
              .delete()
              .eq("id", currentLightboxImageId);

            // Extract file path from URL
            const urlParts = imageData.image_url.split("/");
            const fileName = urlParts[urlParts.length - 1];

            // Delete from storage
            await supabaseClient.storage
              .from("portfolio-images")
              .remove([`uploads/${fileName}`]);

            closeLightbox();
            await fetchImages();
          }
        } catch (error) {
          console.error("Error deleting image:", error);
          alert(
            "An error occurred while deleting the image. Please try again."
          );
        }
      }
    );
  };

  // Show confirmation modal
  const showConfirmationModal = (title, message, onConfirm) => {
    confirmationTitle.textContent = title;
    confirmationMessage.textContent = message;

    confirmActionBtn.onclick = () => {
      onConfirm();
      closeConfirmationModal();
    };

    confirmationModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  };

  // Close confirmation modal
  window.closeConfirmationModal = () => {
    confirmationModal.classList.add("hidden");
    document.body.style.overflow = "";
  };

  // Helper functions
  const getCategoryIcon = (category) => {
    switch (category) {
      case "Client":
        return "fas fa-user-tie";
      case "Restaurant":
        return "fas fa-utensils";
      case "Events":
        return "fas fa-calendar-alt";
      default:
        return "fas fa-image";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Event listeners
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterByCategory(button.dataset.category);
    });
  });

  searchBtn.addEventListener("click", handleSearch);

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  });

  selectAllCheckbox.addEventListener("change", toggleSelectAll);

  deleteSelectedBtn.addEventListener("click", deleteSelectedImages);

  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      fetchImages();
    }
  });

  nextPageBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      fetchImages();
    }
  });

  deleteImageBtn.addEventListener("click", deleteCurrentImage);

  // Initialize
  const init = async () => {
    const session = await checkAuthStatus();
    if (!session) return;

    document
      .getElementById("logoutBtn")
      .addEventListener("click", handleLogout);
    await fetchImages();
  };

  // Back to Top Button functionality
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

  init();
});
