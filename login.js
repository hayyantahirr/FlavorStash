const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const login = async () => {
  const chefEmail = document.querySelector("#loginEmail");
  const chefPassword = document.querySelector("#loginPassword");

  const emailValue = chefEmail ? chefEmail.value.trim() : "";
  const passwordValue = chefPassword ? chefPassword.value : "";

  if (!emailValue || !passwordValue) {
    alert("Required fields are missing!");
    return;
  }

  if (!emailRegex.test(emailValue)) {
    alert("Invalid email address!");
    return;
  }

  const loginData = {
    email: emailValue,
    password: passwordValue,
  };

  try {
    const loginDataResponse = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    const data = await loginDataResponse.json();
    console.log("data", data);
    console.log("Token", data.token);
    localStorage.setItem("authToken", data.token);
    console.log("Token saved successfully!");
    window.location.replace("/");
  } catch (error) {
    alert(error.message);
  }
};
