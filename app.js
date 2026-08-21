/**
 * FlavorStash — Frontend Application Logic
 * Vanilla JavaScript UI Controller
 *
 * NOTE: CRUD logic and backend API endpoints will be connected in future tasks.
 * Currently handling UI states, modals, theme interactions, and display toggles.
 */
// UI Logic
const authCheck = (() => {
  const authToken = localStorage.getItem("authToken");
  console.log("authCheck", authToken);

  if (!authToken) {
    return window.location.replace("/login.html");
  }
})();
const authCheckForDashboard = (() => {
  const userToken = localStorage.getItem("authToken");
  console.log("authCheck", userToken);

  if (userToken) {
    return window.location.replace("./dashboard.html");
  }
})();

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

  let allRecipes = [];
  let editingRecipeId = null;
  let deletingRecipeId = null;

  // New element references for our CRUD logic
  const recipeImageInput = document.getElementById("recipeImageInput");
  const detailIngredientsList = document.getElementById(
    "detailIngredientsList",
  );
  const detailInstructionsList = document.getElementById(
    "detailInstructionsList",
  );
  const filterDifficulty = document.getElementById("filterDifficulty");
  const filterMaxTime = document.getElementById("filterMaxTime");
  const filterSort = document.getElementById("filterSort");

  // ================= FETCH & RENDER DYNAMIC RECIPES =================
  // fetchRecipes gets the complete list of recipes from the backend API,
  // updates the local cache, triggers filtering/sorting, and refreshes metrics.
  async function fetchRecipes() {
    try {
      const response = await fetch("http://localhost:5000/api/recipies");
      const data = await response.json();
      // Store all recipes globally (checking if backend returns direct array or wrapped data)
      allRecipes = Array.isArray(data) ? data : data.data || [];
      filterAndRender();
      updateMetrics();
    } catch (error) {
      console.error("Error fetching recipes:", error);
      showToast("Could not load recipes from database", "danger");
    }
  }

  function updateMetrics() {
    const totalCount = allRecipes.length;
    const totalRecipesCountEl = document.getElementById("totalRecipesCount");
    const metricTotalRecipesEl = document.getElementById("metricTotalRecipes");
    const metricAvgCookTimeEl = document.getElementById("metricAvgCookTime");
    const metricCuisinesCountEl = document.getElementById(
      "metricCuisinesCount",
    );

    if (totalRecipesCountEl)
      totalRecipesCountEl.textContent = `${totalCount} recipe${totalCount !== 1 ? "s" : ""}`;
    if (metricTotalRecipesEl) metricTotalRecipesEl.textContent = totalCount;

    // Avg Cook Time
    const avgCookTime = totalCount
      ? Math.round(
          allRecipes.reduce((sum, r) => sum + parseInt(r.prepTime || 0), 0) /
            totalCount,
        )
      : 0;
    if (metricAvgCookTimeEl) {
      metricAvgCookTimeEl.innerHTML = `${avgCookTime}<span class="text-lg font-bold">m</span>`;
    }

    // Cuisines Count
    const cuisines = new Set(allRecipes.map((r) => r.category).filter(Boolean));
    if (metricCuisinesCountEl)
      metricCuisinesCountEl.textContent = cuisines.size;
  }

  function filterAndRender() {
    let filtered = [...allRecipes];

    // 1. Search Query
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    if (query) {
      filtered = filtered.filter(
        (recipe) =>
          (recipe.title || "").toLowerCase().includes(query) ||
          (recipe.description || "").toLowerCase().includes(query) ||
          (recipe.category || "").toLowerCase().includes(query) ||
          (recipe.ingredients || "").toLowerCase().includes(query),
      );
    }

    // 2. Category Pill Filter
    const activePill = document.querySelector(".category-pill.active-category");
    if (activePill) {
      const text = activePill.textContent.toLowerCase();
      if (!text.includes("all")) {
        filtered = filtered.filter((recipe) => {
          const cat = (recipe.category || "").toLowerCase();
          if (
            text.includes("spicy") &&
            (cat.includes("asian") || cat.includes("mexican"))
          )
            return true;
          if (text.includes("healthy") && cat.includes("healthy")) return true;
          if (text.includes("pasta") && cat.includes("italian")) return true;
          if (text.includes("sweet") && cat.includes("dessert")) return true;
          if (
            text.includes("street") &&
            (cat.includes("mexican") || cat.includes("american"))
          )
            return true;
          return false;
        });
      }
    }

    // 3. Difficulty Filter
    if (filterDifficulty) {
      const difficultyVal = filterDifficulty.value;
      if (difficultyVal !== "all") {
        filtered = filtered.filter((recipe) => {
          const diff = (recipe.difficulty || "").toLowerCase();
          if (difficultyVal === "easy") return diff.includes("easy");
          if (difficultyVal === "medium")
            return diff.includes("medium") || diff.includes("intermediate");
          if (difficultyVal === "hard")
            return (
              diff.includes("hard") ||
              diff.includes("master") ||
              diff.includes("gourmet")
            );
          return true;
        });
      }
    }

    // 4. Max Time Filter
    if (filterMaxTime) {
      const maxTimeVal = filterMaxTime.value;
      if (maxTimeVal !== "all") {
        const maxTime = parseInt(maxTimeVal);
        filtered = filtered.filter(
          (recipe) => parseInt(recipe.prepTime || 0) <= maxTime,
        );
      }
    }

    // 5. Sort Filter
    if (filterSort) {
      const sortVal = filterSort.value;
      if (sortVal === "newest") {
        filtered.sort((a, b) => (b._id || "").localeCompare(a._id || ""));
      } else if (sortVal === "rating") {
        filtered.sort((a, b) => 0);
      } else if (sortVal === "fastest") {
        filtered.sort(
          (a, b) => parseInt(a.prepTime || 0) - parseInt(b.prepTime || 0),
        );
      } else if (sortVal === "alpha") {
        filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      }
    }

    // 6. Update Shown Counter Badge
    const shownRecipesCountEl = document.getElementById("shownRecipesCount");
    if (shownRecipesCountEl) {
      shownRecipesCountEl.textContent = `${filtered.length} SHOWN`;
    }

    renderCards(filtered);
  }

  function renderCards(recipes) {
    if (!recipeGrid) return;
    recipeGrid.innerHTML = "";

    if (recipes.length === 0) {
      recipeGrid.innerHTML = `
        <div class="col-span-full border-4 border-dashed border-brutal-ink p-8 text-center bg-white brutal-shadow">
          <p class="text-sm font-bold text-zinc-600">No stashed recipes found matching your criteria. 🍳</p>
        </div>
      `;
      return;
    }

    recipes.forEach((recipe) => {
      // Determine colors based on category
      const cat = (recipe.category || "").toLowerCase();
      let badgeColor = "bg-brutal-yellow";
      let emoji = "🥗";
      if (cat.includes("asian")) {
        badgeColor = "bg-brutal-yellow";
        emoji = "🍜";
      } else if (cat.includes("italian")) {
        badgeColor = "bg-brutal-matcha";
        emoji = "🍝";
      } else if (cat.includes("mexican")) {
        badgeColor = "bg-brutal-cyan";
        emoji = "🌮";
      } else if (cat.includes("american")) {
        badgeColor = "bg-brutal-bubblegum";
        emoji = "🍔";
      } else if (cat.includes("dessert") || cat.includes("sweet")) {
        badgeColor = "bg-brutal-bubblegum";
        emoji = "🍰";
      } else if (cat.includes("healthy") || cat.includes("vegan")) {
        badgeColor = "bg-brutal-matcha";
        emoji = "🥑";
      }

      const ingredientsArray = (recipe.ingredients || "")
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);
      const ingredientsHTML = ingredientsArray
        .slice(0, 3)
        .map(
          (ing) => `
        <span class="bg-zinc-100 border border-brutal-ink px-2 py-0.5 text-[10px] font-bold text-zinc-800">${ing}</span>
      `,
        )
        .join("");

      const extraCount = ingredientsArray.length - 3;
      const extraHTML =
        extraCount > 0
          ? `
        <span class="bg-zinc-100 border border-brutal-ink px-2 py-0.5 text-[10px] font-bold text-zinc-800">+${extraCount} more</span>
      `
          : "";

      const card = document.createElement("article");
      card.className =
        "recipe-card bg-white border-3 border-brutal-ink brutal-card flex flex-col justify-between overflow-hidden group";
      card.dataset.id = recipe._id;
      card.innerHTML = `
        <div>
          <!-- Image Frame with Stickers -->
          <div class="relative h-52 w-full border-b-3 border-brutal-ink overflow-hidden bg-zinc-100">
            <img
              src="${recipe.image || "assets/spicy_ramen.jpg"}"
              alt="${recipe.title}"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onerror="this.src='assets/spicy_ramen.jpg'"
            />
            <!-- Cuisine Sticker -->
            <span class="absolute top-3 left-3 ${badgeColor} text-brutal-ink border-2 border-brutal-ink px-2.5 py-0.5 font-display font-black text-xs uppercase tracking-wider brutal-shadow-sm rotate-neg-2">
              ${emoji} ${recipe.category || "Custom"}
            </span>
            <!-- Bookmark / Favorite Button -->
            <button
              class="favorite-toggle absolute top-3 right-3 w-8 h-8 bg-white border-2 border-brutal-ink flex items-center justify-center text-zinc-400 hover:text-red-500 brutal-shadow-sm hover:scale-110 active:scale-95 transition-transform"
              title="Toggle Favorite"
            >
              <i data-lucide="heart" class="w-4 h-4"></i>
            </button>
            <!-- Cook Time & Servings Strip -->
            <div class="absolute bottom-2 left-2 bg-black/85 backdrop-blur-sm text-white border-2 border-white px-2 py-1 flex items-center gap-3 text-[11px] font-bold">
              <span class="flex items-center gap-1">
                <i data-lucide="clock" class="w-3 h-3 text-brutal-yellow"></i>
                ${recipe.prepTime || "0"} min
              </span>
              <span class="flex items-center gap-1">
                <i data-lucide="users" class="w-3 h-3 text-brutal-matcha"></i>
                2 Servings
              </span>
            </div>
          </div>

          <!-- Card Content Body -->
          <div class="p-5 space-y-3">
            <div class="flex items-start justify-between gap-2">
              <h3 class="font-display font-black text-xl text-brutal-ink leading-snug group-hover:text-brutal-paprika transition-colors">
                ${recipe.title}
              </h3>
              <div class="flex items-center gap-1 bg-amber-100 border-2 border-brutal-ink px-1.5 py-0.5 text-xs font-black brutal-shadow-sm shrink-0">
                ⭐ 4.8
              </div>
            </div>

            <p class="text-xs text-zinc-600 font-semibold line-clamp-2">
              ${recipe.description || ""}
            </p>

            <!-- Ingredient Tag Pills -->
            <div class="flex flex-wrap gap-1.5 pt-1">
              ${ingredientsHTML}
              ${extraHTML}
            </div>
          </div>
        </div>

        <!-- Card Action Buttons -->
        <div class="p-5 pt-0 border-t-2 border-zinc-100 mt-2 flex items-center justify-between gap-2">
          <button class="view-recipe-btn flex-1 brutal-btn bg-brutal-yellow hover:bg-yellow-400 text-brutal-ink font-display font-bold text-xs py-2 px-3 flex items-center justify-center gap-1.5">
            <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            View Recipe
          </button>
          <div class="flex items-center gap-1.5">
            <button class="edit-recipe-btn brutal-btn bg-white hover:bg-zinc-100 text-brutal-ink p-2" title="Edit Recipe">
              <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
            </button>
            <button class="delete-recipe-btn brutal-btn hover:bg-brutal-paprika hover:text-white text-zinc-600 p-2" title="Delete Recipe">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      `;
      recipeGrid.appendChild(card);
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // ================= ADD / EDIT RECIPE MODAL TRIGGERS =================
  function handleOpenAddModal() {
    editingRecipeId = null;
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

  // Save Recipe Button (Create / Update)
  if (saveRecipeMockBtn) {
    saveRecipeMockBtn.addEventListener("click", async () => {
      const title = document.getElementById("recipeTitleInput")?.value.trim();
      const category = document.getElementById("recipeCategoryInput")?.value;
      const prepTime = document.getElementById("recipeTimeInput")?.value;
      const difficulty = document.getElementById(
        "recipeDifficultyInput",
      )?.value;
      const description = document
        .getElementById("recipeDescInput")
        ?.value.trim();
      const ingredients = document
        .getElementById("recipeIngredientsInput")
        ?.value.trim();
      const instructions = document
        .getElementById("recipeStepsInput")
        ?.value.trim();
      const image =
        document.getElementById("recipeImageInput")?.value.trim() ||
        "assets/spicy_ramen.jpg";

      if (!title) {
        showToast("Recipe Title is required!", "danger");
        return;
      }

      const recipeData = {
        title,
        category,
        prepTime,
        difficulty,
        description,
        ingredients,
        instructions,
        image,
      };

      try {
        let response;
        if (editingRecipeId) {
          // Update Recipe
          response = await fetch(
            `http://localhost:5000/api/recipies?recipieID=${editingRecipeId}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(recipeData),
            },
          );
        } else {
          // Add Recipe
          response = await fetch(`http://localhost:5000/api/recipies`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(recipeData),
          });
        }

        const resData = await response.json();
        if (response.ok || resData.status) {
          showToast(
            editingRecipeId
              ? "Recipe updated successfully!"
              : "Recipe added to stash!",
            "success",
          );
          closeModal(recipeModal);
          editingRecipeId = null;
          fetchRecipes();
        } else {
          showToast(resData.message || "Failed to save recipe", "danger");
        }
      } catch (error) {
        console.error("Error saving recipe:", error);
        showToast(error.message || "Network error while saving", "danger");
      }
    });
  }

  // ================= RECIPE CARD ACTIONS (VIEW, EDIT, DELETE) =================
  document.addEventListener("click", async (e) => {
    // View Recipe Button
    const viewBtn = e.target.closest(".view-recipe-btn");
    if (viewBtn) {
      const card = viewBtn.closest(".recipe-card");
      const recipeId = card?.dataset.id;
      if (!recipeId) return;

      try {
        // Fetch specific recipe details by ID from the API
        const response = await fetch(
          `http://localhost:5000/api/recipies?recipieID=${recipeId}`,
        );
        const resData = await response.json();
        // Extract recipe data (handles both wrapped in .data or returned directly)
        const recipe = resData.data || resData;

        const detailTitle = document.getElementById("detailTitle");
        const detailImage = document.getElementById("detailImage");
        const detailDesc = document.getElementById("detailDesc");
        const detailCategory = document.getElementById("detailCategory");

        // Populate details modal fields with specific recipe values
        if (detailTitle) detailTitle.textContent = recipe.title || "";
        if (detailImage)
          detailImage.src = recipe.image || "assets/spicy_ramen.jpg";
        if (detailDesc) detailDesc.textContent = recipe.description || "";
        if (detailCategory) {
          detailCategory.textContent = `🍜 ${recipe.category || "Custom"}`;
        }

        // Populate dynamic stats
        const statsContainer = document.querySelector(
          "#recipeDetailModal .grid-cols-3",
        );
        if (statsContainer) {
          statsContainer.innerHTML = `
            <div>
              <span class="text-[10px] font-bold uppercase text-zinc-500 block">Prep & Cook</span>
              <span class="font-display font-black text-sm text-brutal-ink">⏱️ ${recipe.prepTime || "0"} Mins</span>
            </div>
            <div class="border-x-2 border-brutal-ink">
              <span class="text-[10px] font-bold uppercase text-zinc-500 block">Yield</span>
              <span class="font-display font-black text-sm text-brutal-ink">🍽️ 2 Servings</span>
            </div>
            <div>
              <span class="text-[10px] font-bold uppercase text-zinc-500 block">Level</span>
              <span class="font-display font-black text-sm text-brutal-ink">${recipe.difficulty || "Easy"}</span>
            </div>
          `;
        }

        // Populate ingredients
        if (detailIngredientsList) {
          detailIngredientsList.innerHTML = "";
          const ings = (recipe.ingredients || "")
            .split(",")
            .map((i) => i.trim())
            .filter(Boolean);
          if (ings.length === 0) {
            detailIngredientsList.innerHTML = `<li class="p-2 text-zinc-500">No ingredients specified.</li>`;
          } else {
            ings.forEach((ing) => {
              const li = document.createElement("li");
              li.className =
                "flex items-center gap-2 bg-zinc-50 border border-zinc-300 p-2";
              li.innerHTML = `
                <input type="checkbox" class="w-4 h-4 accent-brutal-matcha cursor-pointer" />
                ${ing}
              `;
              detailIngredientsList.appendChild(li);
            });
          }
        }

        // Populate instructions
        if (detailInstructionsList) {
          detailInstructionsList.innerHTML = "";
          const steps = (recipe.instructions || "")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
          if (steps.length === 0) {
            detailInstructionsList.innerHTML = `<li class="p-2 text-zinc-500">No instructions specified.</li>`;
          } else {
            steps.forEach((step) => {
              const li = document.createElement("li");
              li.className = "font-semibold p-1";
              li.textContent = step;
              detailInstructionsList.appendChild(li);
            });
          }
        }

        // Also track editing ID in case they click "Edit Recipe" from details modal
        editingRecipeId = recipeId;

        openModal(recipeDetailModal);
      } catch (error) {
        console.error("Error loading recipe detail:", error);
        showToast("Error loading recipe details", "danger");
      }
      return;
    }

    // Edit Recipe Button
    const editBtn = e.target.closest(".edit-recipe-btn");
    if (editBtn) {
      const card = editBtn.closest(".recipe-card");
      const recipeId = card?.dataset.id;
      if (!recipeId) return;

      try {
        // Fetch specific recipe details by ID to pre-populate edit form fields
        const response = await fetch(
          `http://localhost:5000/api/recipies?recipieID=${recipeId}`,
        );
        const resData = await response.json();
        // Extract recipe data (handles both wrapped in .data or returned directly)
        const recipe = resData.data || resData;

        editingRecipeId = recipeId;
        if (modalTitle) modalTitle.textContent = "EDIT RECIPE";

        const titleInput = document.getElementById("recipeTitleInput");
        const categoryInput = document.getElementById("recipeCategoryInput");
        const timeInput = document.getElementById("recipeTimeInput");
        const difficultyInput = document.getElementById(
          "recipeDifficultyInput",
        );
        const descInput = document.getElementById("recipeDescInput");
        const ingredientsInput = document.getElementById(
          "recipeIngredientsInput",
        );
        const stepsInput = document.getElementById("recipeStepsInput");
        const imageInput = document.getElementById("recipeImageInput");

        // Fill form fields with existing recipe data
        if (titleInput) titleInput.value = recipe.title || "";
        if (categoryInput) categoryInput.value = recipe.category || "Asian";
        if (timeInput) timeInput.value = recipe.prepTime || "";
        if (difficultyInput)
          difficultyInput.value = recipe.difficulty || "🟢 Easy";
        if (descInput) descInput.value = recipe.description || "";
        if (ingredientsInput) ingredientsInput.value = recipe.ingredients || "";
        if (stepsInput) stepsInput.value = recipe.instructions || "";
        if (imageInput) imageInput.value = recipe.image || "";

        openModal(recipeModal);
      } catch (error) {
        console.error("Error loading recipe for edit:", error);
        showToast("Error loading recipe for edit", "danger");
      }
      return;
    }

    // Delete Recipe Button
    const deleteBtn = e.target.closest(".delete-recipe-btn");
    if (deleteBtn) {
      const card = deleteBtn.closest(".recipe-card");
      deletingRecipeId = card?.dataset.id;
      if (deletingRecipeId) {
        openModal(deleteModal);
      }
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
    editFromDetailBtn.addEventListener("click", async () => {
      closeModal(recipeDetailModal);
      if (editingRecipeId) {
        try {
          // Fetch specific recipe details by ID to edit from detail view
          const response = await fetch(
            `http://localhost:5000/api/recipies?recipieID=${editingRecipeId}`,
          );
          const resData = await response.json();
          // Extract recipe data (handles both wrapped in .data or returned directly)
          const recipe = resData.data || resData;

          if (modalTitle) modalTitle.textContent = "EDIT RECIPE";

          const titleInput = document.getElementById("recipeTitleInput");
          const categoryInput = document.getElementById("recipeCategoryInput");
          const timeInput = document.getElementById("recipeTimeInput");
          const difficultyInput = document.getElementById(
            "recipeDifficultyInput",
          );
          const descInput = document.getElementById("recipeDescInput");
          const ingredientsInput = document.getElementById(
            "recipeIngredientsInput",
          );
          const stepsInput = document.getElementById("recipeStepsInput");
          const imageInput = document.getElementById("recipeImageInput");

          if (titleInput) titleInput.value = recipe.title || "";
          if (categoryInput) categoryInput.value = recipe.category || "Asian";
          if (timeInput) timeInput.value = recipe.prepTime || "";
          if (difficultyInput)
            difficultyInput.value = recipe.difficulty || "🟢 Easy";
          if (descInput) descInput.value = recipe.description || "";
          if (ingredientsInput)
            ingredientsInput.value = recipe.ingredients || "";
          if (stepsInput) stepsInput.value = recipe.instructions || "";
          if (imageInput) imageInput.value = recipe.image || "";

          openModal(recipeModal);
        } catch (error) {
          console.error("Error loading recipe for edit:", error);
          showToast("Error loading recipe for edit", "danger");
        }
      } else {
        handleOpenAddModal();
      }
    });
  }

  // Delete Modal Confirmation
  if (cancelDeleteBtn)
    cancelDeleteBtn.addEventListener("click", () => {
      deletingRecipeId = null;
      closeModal(deleteModal);
    });
  if (confirmDeleteMockBtn) {
    confirmDeleteMockBtn.addEventListener("click", async () => {
      if (!deletingRecipeId) return;

      try {
        const response = await fetch(
          `http://localhost:5000/api/recipies?recipieID=${deletingRecipeId}`,
          {
            method: "DELETE",
          },
        );
        const resData = await response.json();

        if (response.ok || resData.status) {
          showToast("Recipe tossed from stash successfully!", "danger");
          closeModal(deleteModal);
          deletingRecipeId = null;
          fetchRecipes();
        } else {
          showToast(resData.message || "Failed to delete recipe", "danger");
        }
      } catch (error) {
        console.error("Error deleting recipe:", error);
        showToast("Network error while deleting recipe", "danger");
      }
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

      filterAndRender();
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

  // Add event listeners for new filters if they exist
  if (filterDifficulty)
    filterDifficulty.addEventListener("change", filterAndRender);
  if (filterMaxTime) filterMaxTime.addEventListener("change", filterAndRender);
  if (filterSort) filterSort.addEventListener("change", filterAndRender);
  if (searchInput) searchInput.addEventListener("input", filterAndRender);

  // Load recipes from database on startup
  if (recipeGrid) {
    fetchRecipes();
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

const verifyUser = async () => {
  const userToken = localStorage.getItem("authToken");
  // if (!userToken) {
  //   return window.location.replace("./login.html");
  // }

  const user = JSON.parse(userToken);
};
