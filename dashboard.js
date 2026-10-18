
"use strict";

const API_URL =
  "https://smart-lost-and-found-1-tib2.onrender.com/api/items";

const dashboardItems = document.getElementById("dashboardItems");
const dashboardEmpty = document.getElementById("dashboardEmpty");
const dashboardSearch = document.getElementById("dashboardSearch");
const dashboardFilter = document.getElementById("dashboardFilter");

let dashboardReports = [];
let isLoading = false;

function escapeDashboardHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function showDashboardMessage(message, type = "error") {
  let messageElement = document.getElementById("dashboardMessage");

  if (!messageElement) {
    messageElement = document.createElement("p");
    messageElement.id = "dashboardMessage";
    messageElement.className = "form-message";
    messageElement.setAttribute("role", "status");

    dashboardItems.parentNode.insertBefore(
      messageElement,
      dashboardItems
    );
  }

  messageElement.textContent = message;
  messageElement.className = `form-message ${type}`;
}

async function loadDashboardReports() {
  if (isLoading) return;
  isLoading = true;

  dashboardEmpty.hidden = false;
  dashboardEmpty.textContent = "Loading reports...";

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Unexpected response from server.");
    }

    dashboardReports = data;
    renderDashboard();

    const messageElement = document.getElementById("dashboardMessage");
    if (messageElement) {
      messageElement.textContent = "";
      messageElement.className = "form-message";
    }
  } catch (error) {
    console.error("Could not load dashboard reports:", error);

    dashboardItems.innerHTML = "";
    document.getElementById("dashboardTotal").textContent = "—";
    document.getElementById("dashboardLost").textContent = "—";
    document.getElementById("dashboardFound").textContent = "—";

    dashboardEmpty.hidden = false;
    dashboardEmpty.textContent =
      "Unable to load reports. Please refresh and try again.";

    showDashboardMessage(
      "Could not connect to the backend. Check your internet connection and try again."
    );
  } finally {
    isLoading = false;
  }
}

function renderDashboard() {
  document.getElementById("dashboardTotal").textContent =
    dashboardReports.length;

  document.getElementById("dashboardLost").textContent =
    dashboardReports.filter(report =>
      String(report.status).toLowerCase() === "lost"
    ).length;

  document.getElementById("dashboardFound").textContent =
    dashboardReports.filter(report =>
      String(report.status).toLowerCase() === "found"
    ).length;

  const query = (dashboardSearch.value || "").trim().toLowerCase();
  const status = dashboardFilter.value || "All";

  const filtered = dashboardReports.filter(report => {
    const searchable = [
      report.itemName,
      report.category,
      report.location,
      report.description,
      report.studentName,
      report.department,
      report.status,
      report.prn,
      report.contactNumber || report.contact,
      report.email
    ].join(" ").toLowerCase();

    return searchable.includes(query) &&
      (status === "All" ||
       String(report.status).toLowerCase() === status.toLowerCase());
  });

  dashboardItems.innerHTML = filtered.map(report => {
    const isLost = String(report.status).toLowerCase() === "lost";
    const badgeClass = isLost ? "lost" : "found";

    const photo = report.photo
      ? `<img class="item-photo"
           src="${escapeDashboardHTML(report.photo)}"
           alt="Photo of ${escapeDashboardHTML(report.itemName)}"
           loading="lazy">`
      : `<div class="item-photo-placeholder">No photo provided</div>`;

    return `
      <article class="item-card">
        ${photo}
        <span class="badge ${badgeClass}">
          ${escapeDashboardHTML(report.status || "Unknown")}
        </span>
        <h3>${escapeDashboardHTML(report.itemName || "Unnamed item")}</h3>
        <p><strong>Category:</strong> ${escapeDashboardHTML(report.category || "—")}</p>
        <p><strong>Location:</strong> ${escapeDashboardHTML(report.location || "—")}</p>
        <p><strong>Date:</strong> ${escapeDashboardHTML(report.itemDate || "—")}</p>
        <p>${escapeDashboardHTML(report.description || "No description provided.")}</p>
        <p><strong>Reported by:</strong> ${escapeDashboardHTML(report.studentName || "—")}</p>
        <p><strong>PRN Number:</strong> ${escapeDashboardHTML(report.prn || "Not provided")}</p>
        <p><strong>Department:</strong> ${escapeDashboardHTML(report.department || "—")}</p>
        <p><strong>Contact Number:</strong> ${escapeDashboardHTML(report.contactNumber || report.contact || "Not provided")}</p>
        <p><strong>Contact Email:</strong> ${escapeDashboardHTML(report.email || "Not provided")}</p>
      </article>`;
  }).join("");

  dashboardEmpty.hidden = filtered.length > 0;

  if (!filtered.length) {
    dashboardEmpty.textContent = dashboardReports.length
      ? "No reports match your search."
      : "No reports available yet.";
  }
}

dashboardSearch.addEventListener("input", renderDashboard);
dashboardFilter.addEventListener("change", renderDashboard);

loadDashboardReports();
