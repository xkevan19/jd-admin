document.addEventListener("DOMContentLoaded", async function () {
  // Sidebar functionality
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

  // Dashboard data functions
  const updateTotalMediaCount = async () => {
    try {
      const { count, error } = await supabaseClient
        .from("uploads")
        .select("id", { count: "exact", head: true });

      if (error) console.error("Error fetching media count:", error.message);
      document.getElementById("totalMedia").textContent = count || 0;
    } catch (error) {
      console.error("Error updating media count:", error.message);
    }
  };

  const updateTotalCategoryCount = async () => {
    try {
      const { count, error } = await supabaseClient
        .from("categories")
        .select("id", { count: "exact", head: true });

      if (error) console.error("Error fetching category count:", error.message);
      document.getElementById("totalCategories").textContent = count || 0;
    } catch (error) {
      console.error("Error updating category count:", error.message);
    }
  };

  const updateStorageUsed = async () => {
    try {
      const { data, error } = await supabaseClient
        .from("uploads")
        .select("file_size");

      if (error) console.error("Error fetching storage used:", error.message);

      // Calculate total size in bytes
      const totalSizeBytes = data.reduce(
        (acc, file) => acc + file.file_size,
        0
      );

      let displaySize;
      if (totalSizeBytes < 1024) {
        displaySize = `${totalSizeBytes} B`;
      } else if (totalSizeBytes < 1024 * 1024) {
        displaySize = `${(totalSizeBytes / 1024).toFixed(0)} KB`;
      } else if (totalSizeBytes < 1024 * 1024 * 1024) {
        displaySize = `${(totalSizeBytes / (1024 * 1024)).toFixed(2)} MB`;
      } else {
        displaySize = `${(totalSizeBytes / (1024 * 1024 * 1024)).toFixed(
          2
        )} GB`;
      }

      const totalCapacityBytes = 1024 * 1024 * 1024;

      // Calculate percentage
      const percentageUsed = (totalSizeBytes / totalCapacityBytes) * 100;
      const roundedPercentage = percentageUsed.toFixed(1);

      // Update display elements
      document.getElementById(
        "storageUsed"
      ).textContent = `${displaySize} / 1 GB`;
      document.getElementById(
        "storagePercentage"
      ).textContent = `${roundedPercentage}% of total capacity`;
      document.getElementById(
        "storageProgressBar"
      ).style.width = `${percentageUsed}%`;

      // Update the progress bar
      const storageBar = document.getElementById("storageBar");
      if (storageBar) {
        storageBar.style.width = `${usedPercentage}%`;

        if (usedPercentage > 90) {
          storageBar.classList.remove("bg-blue-500");
          storageBar.classList.add("bg-red-500");
        } else if (usedPercentage > 70) {
          storageBar.classList.remove("bg-blue-500");
          storageBar.classList.add("bg-orange-500");
        } else {
          storageBar.classList.remove("bg-red-500", "bg-orange-500");
          storageBar.classList.add("bg-blue-500");
        }
      }
    } catch (error) {
      console.error("Error updating storage used:", error.message);
    }
  };

  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  const updateMediaTypeInfo = async () => {
    try {
      const { data, error } = await supabaseClient
        .from("uploads")
        .select("file_type");

      if (error) {
        console.error("Error fetching media types:", error.message);
        return;
      }

      // Count occurrences of each file type
      const typeCounts = {};
      data.forEach((item) => {
        const type = item.file_type || "unknown";
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });

      // Find the most common type
      let primaryType = "None";
      let maxCount = 0;
      let totalFiles = 0;

      for (const [type, count] of Object.entries(typeCounts)) {
        totalFiles += count;
        if (count > maxCount) {
          maxCount = count;
          primaryType = type;
        }
      }

      // Format the primary type for display
      const formattedType =
        primaryType.charAt(0).toUpperCase() + primaryType.slice(1);
      document.getElementById("primaryMediaType").textContent = formattedType;

      // Create breakdown text
      if (totalFiles > 0) {
        const percentage = Math.round((maxCount / totalFiles) * 100);
        let breakdownText = `${percentage}% of your media`;

        const typeEntries = Object.entries(typeCounts).sort(
          (a, b) => b[1] - a[1]
        );
        if (typeEntries.length > 1) {
          const secondType = typeEntries[1][0];
          const secondCount = typeEntries[1][1];
          const secondPercentage = Math.round((secondCount / totalFiles) * 100);
          breakdownText += `, ${secondType}: ${secondPercentage}%`;
        }

        document.getElementById("mediaTypeBreakdown").textContent =
          breakdownText;
      } else {
        document.getElementById("mediaTypeBreakdown").textContent =
          "No media files";
      }
    } catch (error) {
      console.error("Error updating media types:", error.message);
    }
  };

  const subscribeToUploads = () => {
    supabaseClient
      .channel("uploads-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "uploads" },
        () => {
          updateTotalMediaCount();
          updateStorageUsed();
          updateMediaTypeInfo();
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "uploads" },
        () => {
          updateTotalMediaCount();
          updateStorageUsed();
          updateMediaTypeInfo();
        }
      )
      .subscribe();
  };

  const subscribeToCategories = () => {
    supabaseClient
      .channel("categories-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "categories" },
        updateTotalCategoryCount
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "categories" },
        updateTotalCategoryCount
      )
      .subscribe();
  };

  const loadRecentActivity = async () => {
    try {
      const { data, error } = await supabaseClient
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) {
        console.error("Error fetching activity logs:", error.message);
        return;
      }

      const activityTable = document.getElementById("activityTable");
      activityTable.innerHTML = "";

      if (data.length === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.className = "text-zinc-300";
        emptyRow.innerHTML = `
                    <td colspan="5" class="py-3 text-center">No recent activity found</td>
                `;
        activityTable.appendChild(emptyRow);
        return;
      }

      data.forEach((activity) => {
        const row = document.createElement("tr");
        row.className = "border-b border-zinc-800 text-zinc-300";

        // Format the date
        const activityDate = new Date(activity.created_at);
        const today = new Date();
        let dateDisplay;

        if (activityDate.toDateString() === today.toDateString()) {
          dateDisplay = `Today, ${activityDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}`;
        } else if (activityDate.getTime() > today.getTime() - 86400000) {
          dateDisplay = `Yesterday, ${activityDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}`;
        } else {
          dateDisplay = activityDate.toLocaleDateString([], {
            month: "short",
            day: "numeric",
          });
        }

        row.innerHTML = `
                    <td class="py-3">${activity.action || "-"}</td>
                    <td class="py-3 hidden sm:table-cell">${
                      activity.item_name || "-"
                    }</td>
                    <td class="py-3 hidden md:table-cell">${
                      activity.category || "-"
                    }</td>
                    <td class="py-3">${dateDisplay}</td>
                    <td class="py-3">${activity.user_name || "System"}</td>
                `;

        activityTable.appendChild(row);
      });

      renderActivityChart();
    } catch (error) {
      console.error("Error loading activity:", error.message);
    }
  };

  function resetActiveStates() {
    const barChartButton = document.getElementById("toggleBarChart");
    const lineChartButton = document.getElementById("toggleLineChart");

    barChartButton.classList.remove("bg-zinc-600");
    barChartButton.classList.add("bg-zinc-800");

    lineChartButton.classList.remove("bg-zinc-600");
    lineChartButton.classList.add("bg-zinc-800");
  }

  // Example button event listener to toggle chart type
  document.getElementById("toggleBarChart").addEventListener("click", () => {
    resetActiveStates(); 
    const barChartButton = document.getElementById("toggleBarChart");
    barChartButton.classList.remove("bg-zinc-800");
    barChartButton.classList.add("bg-zinc-600"); 
    toggleChartType("bar"); 
  });

  document.getElementById("toggleLineChart").addEventListener("click", () => {
    resetActiveStates();
    const lineChartButton = document.getElementById("toggleLineChart");
    lineChartButton.classList.remove("bg-zinc-800");
    lineChartButton.classList.add("bg-zinc-600");
    toggleChartType("line");
  });

  // Function to render the activity chart (fetching 100 records)
  const renderActivityChart = async () => {
    try {
      const { data, error } = await supabaseClient
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching activity logs for chart:", error.message);
        return;
      }

      // Process the data for the chart
      const activityDates = data.map(
        (activity) => new Date(activity.created_at)
      );
      const dailyCounts = {};

      activityDates.forEach((date) => {
        const dateKey = date.toISOString().split("T")[0];
        dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
      });

      // Convert the dailyCounts object into an array for the chart
      const labels = Object.keys(dailyCounts).sort();
      const counts = labels.map((label) => dailyCounts[label]);

      const ctx = document
        .getElementById("recentActivityChart")
        .getContext("2d");
      if (window.activityChart) {
        window.activityChart.destroy();
      }

      window.activityChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Recent Activities",
              data: counts,
              backgroundColor: "rgba(255, 99, 132, 0.2)",
              borderColor: "rgba(255, 99, 132, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          animations: {
            tension: {
              duration: 1000,
              easing: "easeInOutCubic",
              from: 1,
              to: 0,
              loop: true,
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Date",
              },
            },
            y: {
              title: {
                display: true,
                text: "Number of Activities",
              },
              beginAtZero: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error loading activity chart:", error.message);
    }
  };

  // Function to toggle between Bar and Line chart
  const toggleChartType = (chartType) => {
    const chart = window.activityChart;

    if (chartType === "bar") {
      chart.config.type = "bar";
    } else if (chartType === "line") {
      chart.config.type = "line";
    }

    chart.update();
  };

  // Function to subscribe to changes in activity logs
  const subscribeToActivityLogs = () => {
    const channel = supabaseClient
      .channel("activity-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_logs",
        },
        () => {
          loadRecentActivity();
        }
      )
      .subscribe();
  };

  // Function to log activities
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

  // Load dashboard statistics
  const loadDashboardStats = async () => {
    await loadRecentActivity();
    await updateTotalMediaCount();
    await updateTotalCategoryCount();
    await updateStorageUsed();
    await updateMediaTypeInfo();
  };

  // Initialize app
  const initializeApp = async () => {
    const session = await initializeSession();
    if (session) {
      await loadUserProfile(session);
      await loadDashboardStats();
      subscribeToActivityLogs();
      subscribeToUploads();
      subscribeToCategories();
    }
  };

  initializeApp();
});
