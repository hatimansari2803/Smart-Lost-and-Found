
"use strict";

const STORAGE_KEY = "armietLostFoundReports";

const dashboardItems = document.getElementById("dashboardItems");
const dashboardEmpty = document.getElementById("dashboardEmpty");
const dashboardSearch = document.getElementById("dashboardSearch");
const dashboardFilter = document.getElementById("dashboardFilter");

function getDashboardReports() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function escapeDashboardHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function renderDashboard() {
  const reports = getDashboardReports();

  document.getElementById("dashboardTotal").textContent = reports.length;
  document.getElementById("dashboardLost").textContent =
    reports.filter(report => report.status === "Lost").length;
  document.getElementById("dashboardFound").textContent =
    reports.filter(report => report.status === "Found").length;

  const query = (dashboardSearch.value || "").trim().toLowerCase();
  const status = dashboardFilter.value || "All";

  const filtered = reports.filter(report => {
    const searchable = [
      report.itemName, report.category, report.location,
      report.description, report.studentName, report.department,
      report.status, report.prn, report.contactNumber
    ].join(" ").toLowerCase();

    return searchable.includes(query) &&
      (status === "All" || report.status === status);
  });

  dashboardItems.innerHTML = filtered.map(report => {
    const badgeClass = report.status === "Lost" ? "lost" : "found";

    const photo = report.photo
      ? `<img class="item-photo" src="${report.photo}" alt="Photo of ${escapeDashboardHTML(report.itemName)}">`
      : `<div class="item-photo-placeholder">No photo provided</div>`;

    return `
      <article class="item-card">
        ${photo}
        <span class="badge ${badgeClass}">${escapeDashboardHTML(report.status)}</span>
        <h3>${escapeDashboardHTML(report.itemName)}</h3>
        <p><strong>Category:</strong> ${escapeDashboardHTML(report.category)}</p>
        <p><strong>Location:</strong> ${escapeDashboardHTML(report.location)}</p>
        <p><strong>Date:</strong> ${escapeDashboardHTML(report.itemDate)}</p>
        <p>${escapeDashboardHTML(report.description)}</p>
        <p><strong>Reported by:</strong> ${escapeDashboardHTML(report.studentName)}</p>
        <p><strong>PRN Number:</strong> ${escapeDashboardHTML(report.prn || "Not provided")}</p>
        <p><strong>Department:</strong> ${escapeDashboardHTML(report.department)}</p>
        <p><strong>Contact Number:</strong> ${escapeDashboardHTML(report.contactNumber || "Not provided")}</p>
        <p><strong>Contact Email:</strong> ${escapeDashboardHTML(report.email)}</p>
      </article>`;
  }).join("");

  dashboardEmpty.hidden = filtered.length > 0;

  if (!filtered.length) {
    dashboardEmpty.textContent = reports.length
      ? "No reports match your search."
      : "No reports available yet.";
  }
}

dashboardSearch.addEventListener("input", renderDashboard);
dashboardFilter.addEventListener("change", renderDashboard);
window.addEventListener("storage", renderDashboard);

renderDashboard();
