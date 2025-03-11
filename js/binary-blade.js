document.addEventListener("DOMContentLoaded", () => {
  // Sidebar functionality
  const openSidebarBtn = document.getElementById("openSidebar");
  const closeSidebarBtn = document.getElementById("closeSidebar");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  openSidebarBtn?.addEventListener("click", () => {
    sidebar.classList.remove("-translate-x-full");
    overlay.classList.remove("hidden");
    document.body.classList.add("overflow-hidden", "md:overflow-auto");
  });

  closeSidebarBtn?.addEventListener("click", () => {
    sidebar.classList.add("-translate-x-full");
    overlay.classList.add("hidden");
    document.body.classList.remove("overflow-hidden", "md:overflow-auto");
  });

  overlay?.addEventListener("click", () => {
    sidebar.classList.add("-translate-x-full");
    overlay.classList.add("hidden");
    document.body.classList.remove("overflow-hidden", "md:overflow-auto");
  });

  // Back to top button
  const backToTopBtn = document.getElementById("backToTopBtn");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.remove("opacity-0", "invisible");
      backToTopBtn.classList.add("opacity-100", "visible");
    } else {
      backToTopBtn.classList.add("opacity-0", "invisible");
      backToTopBtn.classList.remove("opacity-100", "visible");
    }
  });

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");
  const browseButton = document.getElementById("browseButton");
  const fileList = document.getElementById("fileList");
  const convertAllButton = document.getElementById("convertAllButton");
  const convertedList = document.getElementById("convertedList");
  const conversionArea = document.getElementById("conversionArea");
  const convertedArea = document.getElementById("convertedArea");
  const bulkDownloadButton = document.getElementById("bulkDownloadButton");
  const convertMoreButton = document.getElementById("convertMoreButton");
  const conversionProgress = document.getElementById("conversionProgress");
  const conversionCounter = document.getElementById("conversionCounter");
  const totalFiles = document.getElementById("totalFiles");

  // Resize settings elements
  const enableResize = document.getElementById("enableResize");
  const resizeOptions = document.getElementById("resizeOptions");
  const resizePercentage = document.getElementById("resizePercentage");
  const resizeDimensions = document.getElementById("resizeDimensions");
  const percentageResize = document.getElementById("percentageResize");
  const dimensionsResize = document.getElementById("dimensionsResize");
  const scalePercentage = document.getElementById("scalePercentage");
  const scaleValue = document.getElementById("scaleValue");
  const maxWidth = document.getElementById("maxWidth");
  const maxHeight = document.getElementById("maxHeight");
  const maintainAspectRatio = document.getElementById("maintainAspectRatio");
  const qualitySlider = document.getElementById("qualitySlider");
  const qualityValue = document.getElementById("qualityValue");

  let uploadedFiles = [];
  let convertedFiles = [];
  let conversionInProgress = false;

  // Event listeners for resize settings
  enableResize.addEventListener("change", () => {
    if (enableResize.checked) {
      resizeOptions.classList.remove("opacity-50", "pointer-events-none");
    } else {
      resizeOptions.classList.add("opacity-50", "pointer-events-none");
    }
  });

  resizePercentage.addEventListener("change", () => {
    percentageResize.classList.remove("hidden");
    dimensionsResize.classList.add("hidden");
  });

  resizeDimensions.addEventListener("change", () => {
    percentageResize.classList.add("hidden");
    dimensionsResize.classList.remove("hidden");
  });

  scalePercentage.addEventListener("input", () => {
    scaleValue.textContent = scalePercentage.value;
  });

  qualitySlider.addEventListener("input", () => {
    qualityValue.textContent = qualitySlider.value;
  });

  // Event listeners for the dropzone
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dropzone-active");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dropzone-active");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dropzone-active");
    handleFiles(e.dataTransfer.files);
  });

  browseButton.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", () => {
    handleFiles(fileInput.files);
  });

  convertAllButton.addEventListener("click", convertAllFiles);
  bulkDownloadButton.addEventListener("click", downloadAllFiles);
  convertMoreButton.addEventListener("click", resetForMoreConversion);

  // Function to handle files
  function handleFiles(files) {
    if (files.length === 0) return;

    conversionArea.classList.remove("hidden");

    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;

      const fileId = `file-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      uploadedFiles.push({
        id: fileId,
        file: file,
        converted: false,
      });

      createFileItem(file, fileId);
    }
  }

  // Create file item in the list
  function createFileItem(file, fileId) {
    const fileSize = formatFileSize(file.size);
    const fileItem = document.createElement("div");
    fileItem.id = fileId;
    fileItem.className =
      "flex items-center justify-between bg-zinc-800 rounded-lg p-3 hover:bg-zinc-700 transition";

    // Create a reader to get the image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      fileItem.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="h-12 w-12 overflow-hidden rounded-md bg-zinc-700 flex-shrink-0">
                        <img src="${e.target.result}" alt="${file.name}" class="h-full w-full object-cover">
                    </div>
                    <div>
                        <h3 class="text-zinc-200 font-medium truncate max-w-xs">${file.name}</h3>
                        <p class="text-zinc-400 text-sm">${fileSize}</p>
                    </div>
                </div>
                <button class="convert-btn px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition" data-id="${fileId}">
                    Convert
                </button>
            `;

      fileItem.querySelector(".convert-btn").addEventListener("click", () => {
        convertFile(fileId);
      });
    };
    reader.readAsDataURL(file);

    fileList.appendChild(fileItem);
  }

  // Get current resize settings
  function getResizeSettings() {
    return {
      enabled: enableResize.checked,
      method: resizePercentage.checked ? "percentage" : "dimensions",
      scale: parseInt(scalePercentage.value) / 100,
      maxWidth: parseInt(maxWidth.value),
      maxHeight: parseInt(maxHeight.value),
      maintainAspectRatio: maintainAspectRatio.checked,
      quality: parseInt(qualitySlider.value) / 100,
    };
  }

  // Convert a single file
  function convertFile(fileId) {
    const fileData = uploadedFiles.find((f) => f.id === fileId);
    if (!fileData || fileData.converted) return;

    const file = fileData.file;
    const img = new Image();
    const settings = getResizeSettings();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions based on resize settings
      if (settings.enabled) {
        if (settings.method === "percentage") {
          width = Math.round(img.width * settings.scale);
          height = Math.round(img.height * settings.scale);
        } else {
          const aspectRatio = img.width / img.height;

          if (settings.maintainAspectRatio) {
            if (img.width > settings.maxWidth) {
              width = settings.maxWidth;
              height = Math.round(width / aspectRatio);
            }

            if (height > settings.maxHeight) {
              height = settings.maxHeight;
              width = Math.round(height * aspectRatio);
            }
          } else {
            width = Math.min(img.width, settings.maxWidth);
            height = Math.min(img.height, settings.maxHeight);
          }
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      // Store original dimensions for display
      const originalDimensions = {
        width: img.width,
        height: img.height,
      };
      const newDimensions = {
        width: width,
        height: height,
      };

      canvas.toBlob(
        (blob) => {
          if (!blob) return;

          const convertedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, ".webp"),
            {
              type: "image/webp",
            }
          );

          fileData.converted = true;
          fileData.convertedFile = convertedFile;
          fileData.originalDimensions = originalDimensions;
          fileData.newDimensions = newDimensions;

          convertedFiles.push({
            id: fileId,
            originalFile: file,
            convertedFile: convertedFile,
            originalDimensions: originalDimensions,
            newDimensions: newDimensions,
          });

          createConvertedItem(
            file,
            convertedFile,
            fileId,
            originalDimensions,
            newDimensions
          );

          updateUI();

          const fileItem = document.getElementById(fileId);
          if (fileItem) {
            const convertBtn = fileItem.querySelector(".convert-btn");
            convertBtn.textContent = "Converted";
            convertBtn.classList.remove("bg-indigo-600", "hover:bg-indigo-700");
            convertBtn.classList.add("blue-gradient", "cursor-default");
            convertBtn.disabled = true;
          }

          // Update counter for batch conversion
          if (conversionInProgress) {
            conversionCounter.textContent =
              parseInt(conversionCounter.textContent) + 1;

            if (
              parseInt(conversionCounter.textContent) ===
              parseInt(totalFiles.textContent)
            ) {
              finishConversion();
            }
          }
        },
        "image/webp",
        settings.quality
      );
    };

    img.src = URL.createObjectURL(file);
  }

  function convertAllFiles() {
    const unconverted = uploadedFiles.filter((f) => !f.converted);
    if (unconverted.length === 0) return;

    conversionArea.classList.add("hidden");
    conversionProgress.classList.remove("hidden");
    conversionCounter.textContent = "0";
    totalFiles.textContent = unconverted.length;
    conversionInProgress = true;

    unconverted.forEach((file) => {
      convertFile(file.id);
    });
  }

  // Finish conversion and transition to download view
  function finishConversion() {
    setTimeout(() => {
      conversionProgress.classList.add("hidden");
      convertedArea.classList.remove("hidden");
      conversionInProgress = false;
      updateUI();
    }, 800);
  }

  // Create converted file item
  function createConvertedItem(
    originalFile,
    convertedFile,
    fileId,
    originalDimensions,
    newDimensions
  ) {
    convertedArea.classList.remove("hidden");

    const originalSize = formatFileSize(originalFile.size);
    const convertedSize = formatFileSize(convertedFile.size);
    const reduction = Math.round(
      (1 - convertedFile.size / originalFile.size) * 100
    );

    // Add dimension change information
    const dimensionsChanged =
      originalDimensions.width !== newDimensions.width ||
      originalDimensions.height !== newDimensions.height;

    const dimensionInfo = dimensionsChanged
      ? `${originalDimensions.width}×${originalDimensions.height} → ${newDimensions.width}×${newDimensions.height}`
      : `${newDimensions.width}×${newDimensions.height}`;

    const convertedItem = document.createElement("div");
    convertedItem.className =
      "flex items-center justify-between bg-zinc-800 rounded-lg p-3 hover:bg-zinc-700 transition";

    const reader = new FileReader();
    reader.onload = (e) => {
      convertedItem.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="h-12 w-12 overflow-hidden rounded-md bg-zinc-700 flex-shrink-0">
                        <img src="${e.target.result}" alt="${convertedFile.name}" class="h-full w-full object-cover">
                    </div>
                    <div>
                        <h3 class="text-zinc-200 font-medium truncate max-w-xs">${convertedFile.name}</h3>
                        <div class="flex space-x-2 text-sm">
                            <span class="text-zinc-400">${convertedSize}</span>
                            <span class="text-green-500">-${reduction}%</span>
                        </div>
                        <div class="text-zinc-500 text-xs">${dimensionInfo}</div>
                    </div>
                </div>
                <button class="download-btn px-3 py-1 blue-gradient text-white text-sm rounded hover:bg-green-700 transition" data-id="${fileId}">
                    Download
                </button>
            `;

      convertedItem
        .querySelector(".download-btn")
        .addEventListener("click", () => {
          downloadFile(fileId);
        });
    };
    reader.readAsDataURL(convertedFile);

    convertedList.appendChild(convertedItem);
  }

  // Download a single file
  function downloadFile(fileId) {
    const fileData = convertedFiles.find((f) => f.id === fileId);
    if (!fileData) return;

    const url = URL.createObjectURL(fileData.convertedFile);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileData.convertedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Download all files as ZIP
  function downloadAllFiles() {
    if (convertedFiles.length === 0) return;

    bulkDownloadButton.innerHTML = `
            <span class="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
            Preparing ZIP...
        `;
    bulkDownloadButton.disabled = true;

    const zip = new JSZip();
    let counter = 0;

    convertedFiles.forEach((fileData) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const content = e.target.result;
        zip.file(fileData.convertedFile.name, content);

        counter++;

        if (counter === convertedFiles.length) {
          zip.generateAsync({ type: "blob" }).then(function (content) {
            const url = URL.createObjectURL(content);
            const a = document.createElement("a");
            a.href = url;
            a.download = "converted-images.zip";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            bulkDownloadButton.innerHTML = "Download All";
            bulkDownloadButton.disabled = false;
          });
        }
      };
      reader.readAsArrayBuffer(fileData.convertedFile);
    });
  }

  function resetForMoreConversion() {
    t;
    convertedList.innerHTML = "";
    uploadedFiles = uploadedFiles.filter((file) => !file.converted);
    convertedFiles = [];

    dropzone.classList.remove("hidden");
    if (uploadedFiles.length > 0) {
      conversionArea.classList.remove("hidden");
    }
    convertedArea.classList.add("hidden");
    fileInput.value = "";
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  function updateUI() {
    if (convertedFiles.length > 0) {
      bulkDownloadButton.classList.remove("hidden");
    } else {
      bulkDownloadButton.classList.add("hidden");
    }

    if (convertedFiles.length >= 6) {
      bulkDownloadButton.classList.add("blue-gradient", "hover:bg-green-700");
      bulkDownloadButton.classList.remove(
        "bg-green-500",
        "hover:blue-gradient"
      );
    } else {
      bulkDownloadButton.classList.add("blue-gradient", "hover:bg-green-700");
      bulkDownloadButton.classList.remove(
        "bg-green-500",
        "hover:blue-gradient"
      );
    }
  }
});
