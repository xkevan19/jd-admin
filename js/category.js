document.addEventListener("DOMContentLoaded", async function () {

  // DOM Elements - Main UI
  const categoryForm = document.getElementById("categoryForm");
  const categoryName = document.getElementById("categoryName");
  const statusEl = document.getElementById("status");
  const categoryList = document.getElementById("categoryList");
  const loadingMessage = document.getElementById("loadingMessage");
  const noCategories = document.getElementById("noCategories");
  const refreshBtn = document.getElementById("refreshBtn");

  // DOM Elements - Edit Modal
  const editModal = document.getElementById("editModal");
  const editForm = document.getElementById("editForm");
  const editCategoryId = document.getElementById("editCategoryId");
  const editCategoryName = document.getElementById("editCategoryName");
  const editStatus = document.getElementById("editStatus");

  // DOM Elements - Delete Confirmation Modal
  const deleteModal = document.getElementById("deleteModal");
  const deleteModalCategoryName = document.getElementById(
    "deleteModalCategoryName"
  );
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  let categoryToDelete = null;

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

  // Fetch categories from database
  const fetchCategories = async () => {
    try {
      loadingMessage.classList.remove("hidden");
      categoryList.classList.add("hidden");
      noCategories.classList.add("hidden");

      const { data, error } = await supabaseClient
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;

      categories = data || [];

      if (categories.length === 0) {
        noCategories.classList.remove("hidden");
      } else {
        renderCategoryList();
        categoryList.classList.remove("hidden");
      }

      loadingMessage.classList.add("hidden");
    } catch (error) {
      console.error("Error fetching categories:", error);
      loadingMessage.classList.add("hidden");
      statusEl.innerText = "Failed to load categories. Please try again.";
      statusEl.classList.add("text-red-500");
    }
  };

  // Render the category list
  const renderCategoryList = () => {
    categoryList.innerHTML = "";

    categories.forEach((category) => {
      const item = document.createElement("div");
      item.className =
        "category-item flex items-center justify-between p-4 bg-zinc-800 rounded-lg";

      const leftSide = document.createElement("div");
      leftSide.className = "flex items-center";
      leftSide.innerHTML = `
          <div>
            <h3 class="font-medium">${category.name}</h3>
          </div>
        `;

      const rightSide = document.createElement("div");
      rightSide.className = "flex space-x-2";

      // Edit button
      const editBtn = document.createElement("button");
      editBtn.className =
        "bg-zinc-700 hover:bg-zinc-600 text-zinc-200 px-3 py-1 rounded transition";
      editBtn.innerHTML = '<i class="fas fa-edit"></i>';
      editBtn.onclick = () => openEditModal(category);

      // Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.className =
        "bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition";
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
      deleteBtn.onclick = () => openDeleteModal(category);

      rightSide.appendChild(editBtn);
      rightSide.appendChild(deleteBtn);

      item.appendChild(leftSide);
      item.appendChild(rightSide);
      categoryList.appendChild(item);
    });
  };

  const addCategory = async (e) => {
    e.preventDefault();

    try {
      const newCategory = { name: categoryName.value };
      const { data, error } = await supabaseClient
        .from("categories")
        .insert([newCategory])
        .select();

      if (error) throw error;

      logActivity("Add Category", `Added new category: ${newCategory.name}`);

      categoryForm.reset();
      statusEl.innerText = "Category added successfully!";
      statusEl.className = "mt-2 text-center text-green-500 min-h-[24px]";
      await fetchCategories();
    } catch (error) {
      statusEl.innerText = `Error: ${error.message}`;
      statusEl.className = "mt-2 text-center text-red-500 min-h-[24px]";
    }
  };

  // Open edit modal
  const openEditModal = (category) => {
    editCategoryId.value = category.id;
    editCategoryName.value = category.name;

    // Show modal
    editModal.classList.remove("hidden");
  };

  // Close edit modal
  window.closeEditModal = () => {
    editModal.classList.add("hidden");
    editStatus.innerText = "";
  };

  // Open delete confirmation modal
  const openDeleteModal = (category) => {
    categoryToDelete = category;
    deleteModalCategoryName.textContent = category.name;
    deleteModal.classList.remove("hidden");
  };

  // Close delete confirmation modal
  window.closeDeleteModal = () => {
    deleteModal.classList.add("hidden");
    categoryToDelete = null;
  };

  const updateCategory = async (e) => {
    e.preventDefault();

    try {
      const updatedCategory = { name: editCategoryName.value };
      const { error } = await supabaseClient
        .from("categories")
        .update(updatedCategory)
        .eq("id", editCategoryId.value);

      if (error) throw error;

      logActivity(
        "Update Category",
        `Updated category: ${editCategoryId.value} from ${categoryToUpdate.name} to ${updatedCategory.name}`
      );

      editStatus.innerText = "Category updated successfully!";
      editStatus.className = "mt-2 text-center text-green-500 min-h-[24px]";
      await fetchCategories();

      setTimeout(() => {
        closeEditModal();
      }, 1500);
    } catch (error) {
      editStatus.innerText = `Error: ${error.message}`;
      editStatus.className = "mt-2 text-center text-red-500 min-h-[24px]";
    }
  };

  const deleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const { error } = await supabaseClient
        .from("categories")
        .delete()
        .eq("id", categoryToDelete.id);

      if (error) throw error;

      logActivity(
        "Delete Category",
        `Deleted category: ${categoryToDelete.name}`
      );

      statusEl.innerText = "Category deleted successfully!";
      statusEl.className = "mt-2 text-center text-green-500 min-h-[24px]";
      closeDeleteModal();
      await fetchCategories();

      setTimeout(() => {
        statusEl.innerText = "";
      }, 3000);
    } catch (error) {
      statusEl.innerText = `Error: ${error.message}`;
      statusEl.className = "mt-2 text-center text-red-500 min-h-[24px]";
      closeDeleteModal();
    }
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

  // Scroll to top when button is clicked
  backToTopBtn.addEventListener("click", function () {
    mainContent.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  init();
});
