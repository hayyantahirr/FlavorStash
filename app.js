/**
 * FlavorStash — Frontend Application Logic
 * Vanilla JavaScript UI Controller
 *
 * NOTE: CRUD logic and backend API endpoints will be connected in future tasks.
 * Currently handling UI states, modals, theme interactions, and display toggles.
 */
// UI Logic
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // ================= DOM ELEMENT REFERENCES =================
  const searchInput = document.getElementById("searchInput");
  const openAddRecipeBtn = document.getElementById("openAddRecipeBtn");
  const ctaAddRecipeBtn = document.getElementById("ctaAddRecipeBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  // Modals
  const recipeModal = document.getElementById("recipeModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelModalBtn = document.getElementById("cancelModalBtn");
  const modalTitle = document.getElementById("modalTitle");
  const saveRecipeMockBtn = document.getElementById("saveRecipeMockBtn");

  const recipeDetailModal = document.getElementById("recipeDetailModal");
  const closeDetailModalBtn = document.getElementById("closeDetailModalBtn");
  const closeDetailActionBtn = document.getElementById("closeDetailActionBtn");
  const editFromDetailBtn = document.getElementById("editFromDetailBtn");

  const deleteModal = document.getElementById("deleteModal");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const confirmDeleteMockBtn = document.getElementById("confirmDeleteMockBtn");

  const logoutModal = document.getElementById("logoutModal");
  const cancelLogoutBtn = document.getElementById("cancelLogoutBtn");
  const confirmLogoutMockBtn = document.getElementById("confirmLogoutMockBtn");

  // View Switchers
  const viewGridBtn = document.getElementById("viewGridBtn");
  const viewListBtn = document.getElementById("viewListBtn");
  const recipeGrid = document.getElementById("recipeGrid");

  // Category Pills
  const categoryPills = document.querySelectorAll(".category-pill");

  // Toast Container
  const toastContainer = document.getElementById("toastContainer");

  // ================= TOAST NOTIFICATION HELPER =================
  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    const bgColor =
      type === "danger"
        ? "bg-brutal-paprika text-white"
        : type === "success"
          ? "bg-brutal-matcha text-brutal-ink"
          : "bg-brutal-yellow text-brutal-ink";

    toast.className = `${bgColor} border-3 border-brutal-ink px-4 py-3 font-display font-bold text-xs brutal-shadow flex items-center gap-2 transform translate-y-2 opacity-0 transition-all duration-200 pointer-events-auto select-none`;
    toast.innerHTML = `<span>${type === "danger" ? "⚠️" : type === "success" ? "✅" : "🔔"}</span> <span>${message}</span>`;

    toastContainer.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove("translate-y-2", "opacity-0");
    });

    // Auto remove after 3 seconds
    setTimeout(() => {
      toast.classList.add("translate-y-2", "opacity-0");
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  }

  // ================= MODAL CONTROLLERS =================
  function openModal(modal) {
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.classList.add("overflow-hidden");
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.classList.remove("overflow-hidden");
  }

  // Close modals on backdrop click
  [recipeModal, recipeDetailModal, deleteModal, logoutModal].forEach(
    (modal) => {
      if (modal) {
        modal.addEventListener("click", (e) => {
          if (e.target === modal) {
            closeModal(modal);
          }
        });
      }
    },
  );

  // ESC key to close any active modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      [recipeModal, recipeDetailModal, deleteModal, logoutModal].forEach(
        closeModal,
      );
    }
  });

  // ================= ADD / EDIT RECIPE MODAL TRIGGERS =================
  function handleOpenAddModal() {
    if (modalTitle) modalTitle.textContent = "STASH A NEW RECIPE";
    const form = document.getElementById("recipeForm");
    if (form) form.reset();
    openModal(recipeModal);
  }

  if (openAddRecipeBtn)
    openAddRecipeBtn.addEventListener("click", handleOpenAddModal);
  if (ctaAddRecipeBtn)
    ctaAddRecipeBtn.addEventListener("click", handleOpenAddModal);

  if (closeModalBtn)
    closeModalBtn.addEventListener("click", () => closeModal(recipeModal));
  if (cancelModalBtn)
    cancelModalBtn.addEventListener("click", () => closeModal(recipeModal));

  // Save Recipe Button placeholder
  if (saveRecipeMockBtn) {
    saveRecipeMockBtn.addEventListener("click", () => {
      const titleInput = document.getElementById("recipeTitleInput");
      const title = titleInput?.value.trim() || "Custom Recipe";
      closeModal(recipeModal);
      showToast(`Recipe "${title}" ready for stash! (CRUD ready)`, "success");
    });
  }

  // ================= RECIPE CARD ACTIONS (VIEW, EDIT, DELETE) =================
  document.addEventListener("click", (e) => {
    // View Recipe Button
    const viewBtn = e.target.closest(".view-recipe-btn");
    if (viewBtn) {
      const card = viewBtn.closest(".recipe-card");
      const title = card
        ? card.querySelector("h3")?.textContent.trim()
        : "Recipe Preview";
      const imgSrc = card
        ? card.querySelector("img")?.getAttribute("src")
        : "assets/spicy_ramen.jpg";

      const detailTitle = document.getElementById("detailTitle");
      const detailImage = document.getElementById("detailImage");
      if (detailTitle) detailTitle.textContent = title;
      if (detailImage && imgSrc) detailImage.src = imgSrc;

      openModal(recipeDetailModal);
      return;
    }

    // Edit Recipe Button
    const editBtn = e.target.closest(".edit-recipe-btn");
    if (editBtn) {
      const card = editBtn.closest(".recipe-card");
      const title = card ? card.querySelector("h3")?.textContent.trim() : "";
      if (modalTitle) modalTitle.textContent = `EDIT: ${title.toUpperCase()}`;

      const titleInput = document.getElementById("recipeTitleInput");
      if (titleInput) titleInput.value = title;

      openModal(recipeModal);
      return;
    }

    // Delete Recipe Button
    const deleteBtn = e.target.closest(".delete-recipe-btn");
    if (deleteBtn) {
      openModal(deleteModal);
      return;
    }

    // Favorite Heart Toggle (Visual state toggle)
    const favBtn = e.target.closest(".favorite-toggle");
    if (favBtn) {
      const icon = favBtn.querySelector("svg") || favBtn.querySelector("i");
      const isFilled = favBtn.classList.contains("text-red-500");

      if (isFilled) {
        favBtn.classList.remove("text-red-500");
        favBtn.classList.add("text-zinc-400");
        if (icon) icon.classList.remove("fill-current");
        showToast("Removed from favorites", "info");
      } else {
        favBtn.classList.add("text-red-500");
        favBtn.classList.remove("text-zinc-400");
        if (icon) icon.classList.add("fill-current");
        showToast("Added to your favorite bites! ❤️", "success");
      }
      return;
    }
  });

  // Recipe Detail Modal Close Buttons
  if (closeDetailModalBtn)
    closeDetailModalBtn.addEventListener("click", () =>
      closeModal(recipeDetailModal),
    );
  if (closeDetailActionBtn)
    closeDetailActionBtn.addEventListener("click", () =>
      closeModal(recipeDetailModal),
    );
  if (editFromDetailBtn) {
    editFromDetailBtn.addEventListener("click", () => {
      closeModal(recipeDetailModal);
      handleOpenAddModal();
    });
  }

  // Delete Modal Confirmation
  if (cancelDeleteBtn)
    cancelDeleteBtn.addEventListener("click", () => closeModal(deleteModal));
  if (confirmDeleteMockBtn) {
    confirmDeleteMockBtn.addEventListener("click", () => {
      closeModal(deleteModal);
      showToast("Recipe marked for deletion! (UI demo)", "danger");
    });
  }

  // ================= LOGOUT CONTROLLER =================
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      openModal(logoutModal);
    });
  }
  if (cancelLogoutBtn)
    cancelLogoutBtn.addEventListener("click", () => closeModal(logoutModal));
  if (confirmLogoutMockBtn) {
    confirmLogoutMockBtn.addEventListener("click", () => {
      closeModal(logoutModal);
      showToast("Logged out successfully! See you soon chef 👨‍🍳", "info");
    });
  }

  // ================= CATEGORY PILL FILTER TOGGLE =================
  categoryPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      categoryPills.forEach((p) => {
        p.classList.remove("bg-brutal-ink", "text-white", "active-category");
        p.classList.add("bg-white", "text-brutal-ink");
      });
      pill.classList.add("bg-brutal-ink", "text-white", "active-category");
      pill.classList.remove("bg-white", "text-brutal-ink");

      const categoryName = pill.textContent.trim();
      showToast(`Filtered by: ${categoryName}`, "info");
    });
  });

  // ================= VIEW TOGGLE (GRID VS LIST) =================
  if (viewGridBtn && viewListBtn && recipeGrid) {
    viewGridBtn.addEventListener("click", () => {
      viewGridBtn.classList.add("bg-brutal-yellow");
      viewGridBtn.classList.remove("bg-white");
      viewListBtn.classList.remove("bg-brutal-yellow");
      viewListBtn.classList.add("bg-white");

      recipeGrid.className =
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8";
    });

    viewListBtn.addEventListener("click", () => {
      viewListBtn.classList.add("bg-brutal-yellow");
      viewListBtn.classList.remove("bg-white");
      viewGridBtn.classList.remove("bg-brutal-yellow");
      viewGridBtn.classList.add("bg-white");

      recipeGrid.className = "grid grid-cols-1 gap-4";
    });
  }

  // ================= KEYBOARD SHORTCUT (CMD/CTRL+K or /) =================
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
  });

  console.log("🔥 FlavorStash Dashboard UI initialized smoothly.");
});
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const authCheck = (() => {
  const chefId = localStorage.getItem("chefId");
  console.log("authCheck", chefId);

  if (chefId) {
    return window.location.replace("./dashboard.html");
  }
})();

const register = async () => {
  const chefName = document.querySelector("#regName");
  const chefEmail = document.querySelector("#regEmail");
  const chefPassword = document.querySelector("#regPassword");
  const confirmPassword = document.querySelector("#regConfirmPassword");

  const nameValue = chefName ? chefName.value.trim() : "";
  const emailValue = chefEmail ? chefEmail.value.trim() : "";
  const passwordValue = chefPassword ? chefPassword.value : "";
  const confirmPasswordValue = confirmPassword ? confirmPassword.value : "";

  // Get selected cuisines by filtering out chips that have selection styles (not bg-white)
  const cuisineChips = document.querySelectorAll(".cuisine-chip");
  const selectedCuisines = Array.from(cuisineChips)
    .filter(
      (chip) =>
        chip.classList.contains("bg-brutal-yellow") ||
        chip.classList.contains("bg-brutal-matcha"),
    )
    .map((chip) => chip.textContent.trim());

  console.log("Chef Name:", nameValue);
  console.log("Chef Email:", emailValue);
  console.log("Password:", passwordValue);
  console.log("Confirm Password:", confirmPasswordValue);
  console.log("Selected Cuisines:", selectedCuisines);

  if (!nameValue || !emailValue || !passwordValue || !confirmPasswordValue) {
    alert("Required fields are missing!");
    return;
  }

  if (passwordValue !== confirmPasswordValue) {
    alert("password not match!");
    return;
  }

  const registerData = {
    name: nameValue,
    email: emailValue,
    password: passwordValue,
    cuisine: selectedCuisines,
  };

  try {
    const registerDataResponse = await fetch(
      `http://localhost:5000/api/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
      },
    ).then((res) => res.json());

    console.log("registerDataResponse", registerDataResponse);

    if (registerDataResponse.status) {
      alert("sign Successfully");
      window.location.assign("./login.html");
    } else {
      alert(registerDataResponse.message);
    }
  } catch (error) {}
};
