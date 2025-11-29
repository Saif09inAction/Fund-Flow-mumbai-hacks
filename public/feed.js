// ------------------ CONFIG ------------------
const NEWS_API_KEY = "a3561730183044ce82841d7f71fa54fd";
let page = 1;              // for infinite scroll
let currentQuery = "finance";
let isLoading = false;

// ------------------ FETCH NEWS ------------------
async function fetchNews(query = "finance", pageNum = 1) {
  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&pageSize=10&page=${pageNum}&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`
    );

    const data = await res.json();
    return data.articles || [];
  } catch (err) {
    console.error("❌ Error fetching news:", err);
    return [];
  }
}

// ------------------ MODAL ------------------
function openArticleModal(article) {
  const modal = document.getElementById("article-modal");
  const modalBody = document.getElementById("article-modal-body");

  modalBody.innerHTML = `
    <img src="${article.urlToImage || 'placeholder.jpg'}" alt="${article.title}">
    <h2>${article.title}</h2>
    
    <p style="font-style: italic;">
        ${article.description || article.title}
    </p>
    
    <p>${article.content || "Full content unavailable. Visit source link."}</p>

    <div class="modal-source">
      Source: ${article.source?.name || "Unknown"} | 
      Published: ${new Date(article.publishedAt).toLocaleDateString()}
    </div>

    <a href="${article.url}" target="_blank" class="news-card-link" style="margin-top:20px;display:inline-block;">
      Read Full Article <i class="fa-solid fa-arrow-up-right-from-square"></i>
    </a>
  `;

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeArticleModal() {
  document.getElementById("article-modal").classList.add("hidden");
  document.body.style.overflow = "auto";
}

window.openArticleModal = openArticleModal;
window.closeArticleModal = closeArticleModal;

// ------------------ CARD CREATION ------------------
function createNewsCard(article) {
  const card = document.createElement("div");
  card.className = "news-card";

  card.onclick = () => openArticleModal(article);

  card.innerHTML = `
    <img src="${article.urlToImage || 'placeholder.jpg'}" alt="${article.title}">
    <div class="news-content-wrapper">
      <h3 class="news-card-title">${article.title}</h3>

      <div class="news-card-meta">
        <span><i class="fa-solid fa-clock"></i> ${new Date(article.publishedAt).toLocaleDateString()}</span>
        <span><i class="fa-solid fa-user"></i> ${article.source?.name || "Unknown"}</span>
      </div>

      <p class="news-card-summary">${article.description || ""}</p>
    </div>
  `;

  return card;
}

// ------------------ RENDER NEWS ------------------
function renderNews(articles) {
  const list = document.getElementById("news-list");
  list.classList.add("news-grid-container");

  articles.forEach(article => {
    list.appendChild(createNewsCard(article));
  });
}

// ------------------ LOAD & REFRESH ------------------
async function loadInitialNews() {
  page = 1;
  const list = document.getElementById("news-list");
  list.innerHTML = "<p>Loading...</p>";

  const articles = await fetchNews(currentQuery, page);
  list.innerHTML = "";
  renderNews(articles);
}

async function loadMoreNews() {
  if (isLoading) return;
  isLoading = true;

  page++;
  const articles = await fetchNews(currentQuery, page);

  if (articles.length > 0) renderNews(articles);

  isLoading = false;
}

// ------------------ INFINITE SCROLL ------------------
window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
    loadMoreNews(); // load more when near bottom
  }
});

// ------------------ SEARCH HANDLER ------------------
document.addEventListener("DOMContentLoaded", () => {
  loadInitialNews();

  const searchBtn = document.getElementById("search-btn");
  const searchInput = document.getElementById("search-input");

  searchBtn.addEventListener("click", () => {
    const q = searchInput.value.trim();
    if (!q) return;

    currentQuery = q;
    loadInitialNews();
  });
  // 🔄 Refresh button
const refreshBtn = document.getElementById("refresh-btn");
refreshBtn.addEventListener("click", () => {
  page = 1;
  loadInitialNews();
});


  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const q = searchInput.value.trim();
      if (!q) return;

      currentQuery = q;
      loadInitialNews();
    }
  });
});
