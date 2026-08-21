// const authCheck = (() => {
//   const authToken = localStorage.getItem("authToken");

//   if (authToken) {
//     return window.location.replace("./dashboard.html");
//   }
// })();
(() => {
  const token = localStorage.getItem("authToken");
  const currentPath = window.location.pathname;

  const isAuthPage =
    currentPath.endsWith("login.html") || currentPath.endsWith("register.html");

  // Not logged in -> Kick out of protected pages
  if (!token && !isAuthPage) {
    return window.location.replace("/login.html");
  }

  // Logged in -> Keep away from login/register
  if (token && isAuthPage) {
    return window.location.replace("/");
  }
})();
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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
  } catch (error) {
    alert(error.message);
  }
};
