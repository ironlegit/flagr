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

// Field selection
searchParams.append("limit", limit);
searchParams.append("response_fields", "codes.alpha_2");
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
function renderFlags(countries) {
  const container = document.getElementById("flags-container");
  container.innerHTML = "";

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

      // Highlight the active letter
      if (activeLetter === letter) {
        letterCard.style.fontWeight = "italic";
      }

      container.appendChild(letterCard);

      countriesByLetter.forEach((country) => {
        // Create a container for each flag + name
        const flagCard = document.createElement("div");
        flagCard.className = "flag-card"; // For styling

        // Create the flag image
        const img = document.createElement("img");
        if (country.flag.url_png && country.flag.url_png !== "") {
          img.src = country.flag.url_png;
          img.alt = country.cca2;
        } else {
          img.src = "assets/placeholder_flag.png";
          img.alt = `Flag not found for ${country.names.common}`;
        }

        // Create the country name
        const name = document.createElement("p");
        name.textContent = country.names.common;

        // Add click handler
        flagCard.addEventListener("click", () => {
          showCountryInfo(country); // Pass the country data
        });

        // Append both to the card
        flagCard.appendChild(img);
        flagCard.appendChild(name);

        // Append the card to the main container
        container.appendChild(flagCard);
      });
    }
  });
}

// ===== Modal Country description =====
const modal = document.getElementById("country-modal");
const modalBody = modal.querySelector(".modal-body");

function showCountryInfo(country) {
  modalBody.innerHTML = `
  <div class="modal-header">
    <div class="header-box">
      <span class="modal-flag">${country.flag.emoji}</span>
    </div>
    <div class="header-box">
      <div>
        <h2>${country.names.common}</h2>
        <h4>${country.names.official}</h4>
      </div>
    </div>
  </div>
  <div class="info-row"><span class="label">Capital</span><span class="value">${country.capitals?.[0]?.name || "N/A"}</span></div>
  <div class="info-row"><span class="label">Population</span><span class="value accent">${country.population?.toLocaleString()}</span></div>
  <div class="info-row"><span class="label">Subregion</span><span class="value">${country.subregion}</span></div>
  <div class="info-row"><span class="label">Government</span><span class="value">${country.government_type}</span></div>
`;

  modal.classList.add("visible");
}

function closeModal() {
  modal.classList.remove("visible");
}

// × button
document.getElementById("modal-close").addEventListener("click", closeModal);

// Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// Click outside: only fires when the click lands on the modal itself
// (i.e., the dimmed area around the card), not its content
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
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

    console.log("search terms: " + searchTerms);

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
    // Find all <p> elements inside the flag-card class
    const names = document.querySelectorAll(".flag-card p");
    const isHidden = names[0].style.display === "none";
    // Set <p> to block (visible) or none (hidden)
    names.forEach((name) => {
      name.style.display = isHidden ? "block" : "none";
    });
    toggleNamesButton.textContent = isHidden ? "Hide Names" : "Show Names";
  });
}

// Toggle mode button
const toggleModeButton = document.getElementById("toggle-mode");
if (toggleModeButton) {
  toggleModeButton.addEventListener("click", () => {
    // Check current status of button
    const isOverviewMode = toggleModeButton.textContent === "Detail Mode";
    // Depending on mode decide which style to use in body
    if (isOverviewMode) {
      toggleModeButton.textContent = "Overview Mode";
      document.body.classList.remove("overview-mode");
    } else {
      toggleModeButton.textContent = "Detail Mode";
      document.body.classList.add("overview-mode");
    }
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
