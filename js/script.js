// ===== Base Vars =====
// API url construction
const api_base = "/api"; // proxied
const api_version = "v5";
const searchParams = new URLSearchParams();

// Basic DEV switch
const isDev =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const limit = isDev ? 10 : 300;
const offset = isDev ? 207 : 0;

// Field selection
searchParams.append("limit", limit);
searchParams.append("offset", offset);
searchParams.append("response_fields", "names.common");
searchParams.append("response_fields", "names.official");
searchParams.append("response_fields", "capitals");
searchParams.append("response_fields", "subregion");
searchParams.append("response_fields", "population");
searchParams.append("response_fields", "government_type");
searchParams.append("response_fields", "flag.url_png");
searchParams.append("response_fields", "flag.emoji");
searchParams.append("response_fields", "flag.description");
const url = `${api_base}/${api_version}?${searchParams.toString()}`;

// Filters
let activeLetter = null;

// ===== Get data from API =====
let allCountries = [];

fetch(url)
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
  })
  .then((data) => {
    const { objects } = data.data;

    objects.forEach((country) => {
      const desc = country.flag.description;
      country.keywords = desc.toLowerCase().split(/[^a-zA-Z'-]+/);
    });

    allCountries = objects;
    renderFlags(allCountries);
  })
  .catch((error) => console.error("Error:", error));

// ===== Render flags =====
function createFlagCard(country) {
  // Create a container for each flag + name
  const flagCard = document.createElement("div");
  flagCard.className = "flag-card";

  // Create the flag image
  const img = document.createElement("img");
  img.src = flagImgSrc(country);
  img.alt = `Flag of ${country.names.common}`;

  // Create the country name
  const name = document.createElement("p");
  name.textContent = country.names.common;
  name.style.display = hideNames ? "none" : "block";

  // Add click handler
  flagCard.addEventListener("click", () => showCountryInfo(country));

  // Append both to the card
  flagCard.appendChild(img);
  flagCard.appendChild(name);

  return flagCard;
}

function renderFlags(countries) {
  const container = document.getElementById("flags-container");
  container.innerHTML = "";

  // Game mode
  if (gameMode) {
    countries.forEach((country) => {
      container.appendChild(createFlagCard(country));
    });
    return;
  }

  // Sort countries alphabetically
  countries.sort((a, b) => a.names.common.localeCompare(b.names.common));

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  alphabet.forEach((letter) => {
    // Filter countries starting with current letter
    const countriesByLetter = countries.filter((country) => {
      const firstChar = country.names.common
        .normalize("NFD") // Decompose characters like "Å" into "A" + diacritical mark
        .charAt(0)
        .toUpperCase();
      return firstChar === letter;
    });

    if (countriesByLetter.length > 0) {
      const letterCard = document.createElement("div");

      // Use same class for letters and flag
      letterCard.className = "flag-card letter-header";
      letterCard.textContent = letter;

      // Add click handler to toggle the letter filter
      letterCard.addEventListener("click", () => {
        // Toggle: if the same letter is clicked again, clear the filter
        activeLetter = activeLetter === letter ? null : letter;
        const filteredData = filterCountries(
          searchInput.value.trim(),
          activeLetter,
        );
        renderFlags(filteredData);
      });

      container.appendChild(letterCard);

      countriesByLetter.forEach((country) => {
        container.appendChild(createFlagCard(country));
      });
    }
  });
}

function flagImgSrc(country) {
  return country.flag.url_png && country.flag.url_png !== ""
    ? country.flag.url_png
    : "assets/placeholder_flag.png";
}

function parseCapitals(capitals) {
  // Use RHS if null
  const list = capitals ?? [];

  // If multiple capitals show capital type (e.g. judicial)
  const displayType = list.length > 1;

  return list.map(({ name, attributes = {} }) => {
    const type = Object.keys(attributes).find(
      (key) => attributes[key] === true,
    );

    if (displayType && type) {
      return `${name} (${type})`;
    }
    return name;
  });
}

// ===== Game mode =====

let gameMode = false;
let gameDeck = [];
let hideNames = false;

// Fisher-Yates Shuffling
function shuffleFlags(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ===== Modal Country description =====
const modal = document.getElementById("country-modal");
const modalBody = modal.querySelector(".modal-body");

function showCountryInfo(country) {
  modalBody.innerHTML = `
  <div class="modal-header">
    <div class="header-box">
      <img class="modal-flag" src="${flagImgSrc(country)}" alt="">
    </div>
    <div class="header-box">
      <div>
        <h2>${country.names.common}</h2>
        <h4>${country.names.official}</h4>
      </div>
    </div>
  </div>
  <div class="info-row"><span class="label">Capital</span><span class="value">${parseCapitals(country.capitals).join("<br>") || "N/A"}</span></div>
  <div class="info-row"><span class="label">Population</span><span class="value accent">${country.population?.toLocaleString()}</span></div>
  <div class="info-row"><span class="label">Region</span><span class="value">${country.subregion}</span></div>
  <div class="info-row"><span class="label">Government</span><span class="value">${country.government_type}</span></div>
  <div class="modal-description">
    <span class="label">Flag description</span>
    <p>${country.flag.description || "N/A"}</p>
  </div>`;

  modal.classList.add("visible");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  modal.classList.remove("visible");
  modal.setAttribute("aria-hidden", "true");
}

// × button
document.getElementById("modal-close").addEventListener("click", closeModal);

// Escape key (only when the modal is open)
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("visible")) closeModal();
});

// Click outside: ignore clicks that land inside the card,
// close on anything else (the backdrop or the modal itself)
modal.addEventListener("click", (e) => {
  if (e.target.closest(".modal-content")) return;
  closeModal();
});

// ===== Keyword Search function =====
function filterCountries(searchTerm, letter = null) {
  let filteredCountries = allCountries;

  // Apply letter filter first
  if (letter) {
    filteredCountries = filteredCountries.filter((country) => {
      const firstChar = country.names.common
        .normalize("NFD")
        .charAt(0)
        .toUpperCase();
      return firstChar === letter;
    });
  }

  // Apply search term filter
  if (searchTerm) {
    // Prepare and split search terms by comma or space
    const searchTerms = searchTerm
      .toLowerCase()
      .trim()
      .split(/[,\s]+/)
      .filter((token) => token.length > 0);

    // console.log("search terms: " + searchTerms);

    // Create new filtered array from allCountries
    filteredCountries = filteredCountries.filter((country) => {
      // For each country check searchTerms in keywords or common names
      return searchTerms.every(
        (term) =>
          // Simple fuzzy search (prefix-based search)
          country.keywords.some((keyword) =>
            keyword.toLowerCase().startsWith(term),
          ) || country.names.common.toLowerCase().startsWith(term),
      );
    });
  }

  return filteredCountries;
}

// Add event listener for the existing search input
const searchInput = document.getElementById("search-bar");
searchInput.addEventListener("input", () => {
  const filteredData = filterCountries(searchInput.value.trim(), activeLetter);
  renderFlags(filteredData);
});

// ===== Navigation Options =====

// Toggle names buttoon
const toggleNamesButton = document.getElementById("toggle-names");
if (toggleNamesButton) {
  toggleNamesButton.addEventListener("click", () => {
    // Make top-level variable as it need to be accessed outside the click handler
    hideNames = toggleNamesButton.getAttribute("aria-pressed") !== "true";
    toggleNamesButton.setAttribute("aria-pressed", hideNames);
    document.querySelectorAll(".flag-card p").forEach((name) => {
      name.style.display = hideNames ? "none" : "block";
    });
  });
}

// Toggle Game Mode
const toggleGameButton = document.getElementById("toggle-game");
if (toggleGameButton) {
  toggleGameButton.addEventListener("click", () => {
    gameMode = !gameMode;
    toggleGameButton.setAttribute("aria-pressed", gameMode);

    if (gameMode) {
      // Shuffle country cards
      gameDeck = shuffleFlags(allCountries);

      // Force hide-names toggle
      hideNames = true;
      toggleNamesButton?.setAttribute("aria-pressed", "true");

      // Restore search or letter filter-btn-vis
      activeLetter = null;
      searchInput.value = "";

      renderFlags(gameDeck);
    } else {
      // Return to ordered view when deactivated
      renderFlags(filterCountries(searchInput.value.trim(), activeLetter));
    }
  });
}

// Toggle mode button
const toggleModeButton = document.getElementById("toggle-mode");
if (toggleModeButton) {
  toggleModeButton.addEventListener("click", () => {
    const overview = toggleModeButton.getAttribute("aria-pressed") !== "true";
    toggleModeButton.setAttribute("aria-pressed", overview);
    document.body.classList.toggle("overview-mode", overview);
  });
}

// ===== Visual filter logic =====

const visualFilterMap = {
  blue: ["blue", "turquoise", "cobalt"],
  green: ["green", "lime", "olive"],
  red: ["red", "crimson"],
  yellow: ["yellow", "gold"],
  orange: ["orange"],
  white: ["white"],
  black: ["black"],
  // Patterns
  "stripes-hor": ["horizontal", "bars", "fess"],
  "stripes-ver": ["vertical", "pales"],
  // Shapes
  star: ["star", "stars", "sun"],
  moon: ["moon", "crescent"],
  cross: ["cross"],
  triangle: ["triangle", "chevron"],
};

let activeVisualFilters = [];

function handleVisualFilterClick(event) {
  // Extract the filter key from the button ID (e.g., "toggle-blue" -> "blue")
  const filterKey = event.currentTarget.id.replace("toggle-", "");
  const button = event.currentTarget;

  // Toggle the filter key in activeVisualFilters
  if (activeVisualFilters.includes(filterKey)) {
    activeVisualFilters = activeVisualFilters.filter((f) => f !== filterKey);
    button.classList.remove("active");
  } else {
    activeVisualFilters.push(filterKey);
    button.classList.add("active");
  }

  // Reset search bar and re-render
  searchBar.value = "";
  const filteredData = filterCountriesByVisuals(activeVisualFilters);
  renderFlags(filteredData);
}

function filterCountriesByVisuals(filters) {
  if (filters.length === 0) {
    return allCountries;
  }

  return allCountries.filter((country) => {
    // Check if ALL active filters have at least one matching keyword
    return filters.every((filterKey) => {
      const keywords = visualFilterMap[filterKey];
      return keywords.some(
        (keyword) =>
          country.flag.description.toLowerCase().includes(keyword) ||
          country.keywords.some((kw) => kw.includes(keyword)),
      );
    });
  });
}

const searchBar = document.getElementById("search-bar");
const visualFilterButtons = document.querySelectorAll(".filter-btn-vis");

visualFilterButtons.forEach((button) => {
  button.addEventListener("click", handleVisualFilterClick);
});

// ===== Wave header =====
function applyWave(id, amplitude) {
  const el = document.getElementById(id);
  const text = el.getAttribute("data-text");

  el.innerHTML = text
    .split("")
    .map((ch, i) => {
      const amp = amplitude * (0.5 + (i / text.length) * 0.6);
      const delay = i * 0.08;
      const char = ch === " " ? "&nbsp;" : ch;
      return `<span class="wave-char" style="--amp:${amp}px; animation-delay:${delay}s">${char}</span>`;
    })
    .join("");
}

applyWave("cyber-header", 8);
