(function () {
  const PRELAUNCH_ENABLED = true;

  // Password gate is kept for future launches, but disabled for live campaign.
  if (!PRELAUNCH_ENABLED) {
    return;
  }

  const PRELAUNCH_STORAGE_KEY = "verbena_prelaunch_access";
  const PRELAUNCH_PASSWORD = "verbena2026";

  function normalizePassword(input) {
    return (input || "").replace(/\s+/g, "").toLowerCase();
  }

  try {
    if (localStorage.getItem(PRELAUNCH_STORAGE_KEY) === "ok") {
      return;
    }
  } catch (error) {
    console.warn("Nie udało się odczytać localStorage:", error);
  }

  let isValid = false;
  while (!isValid) {
    const enteredPassword = window.prompt("Podaj hasło dostępu do strony:", "");
    if (enteredPassword === null) {
      continue;
    }

    isValid = normalizePassword(enteredPassword) === normalizePassword(PRELAUNCH_PASSWORD);
  }

  try {
    localStorage.setItem(PRELAUNCH_STORAGE_KEY, "ok");
  } catch (error) {
    console.warn("Nie udało się zapisać localStorage:", error);
  }
})();
