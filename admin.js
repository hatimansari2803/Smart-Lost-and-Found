
"use strict";

const STORAGE_KEY = "armietLostFoundReports";

const adminTableBody = document.getElementById("adminTableBody");
const adminEmpty = document.getElementById("adminEmpty");
const adminSearch = document.getElementById("adminSearch");
const adminFilter = document.getElementById("adminFilter");
const adminMessage = document.getElementById("adminMessage");

function getAdminReports() {
  try {
    const reports = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(reports) ? reports : [];
  } catch {
    return [];
  }
}

function safeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function renderAdmin() {
  const reports = getAdminReports();

  document.getElementById("adminTotal").textContent = reports.length;
  document.getElementById("adminLost").textContent =
    reports.filter(report => report.status === "Lost").length;
  document.getElementById("adminFound").textContent =
    reports.filter(report => report.status === "Found").length;

  const query = (adminSearch.value || "").trim().toLowerCase();
  const status = adminFilter.value || "All";

  const filtered = reports.filter(report => {
    const searchable = [
      report.itemName, report.category, report.location,
      report.status, report.studentName, report.department,
      report.prn, report.contactNumber, report.email
    ].join(" ").toLowerCase();

    return searchable.includes(query) &&
      (status === "All" || report.status === status);
  });

  adminTableBody.innerHTML = filtered.map(report => `
    <tr>
      <td>${safeText(report.itemName)}</td>
      <td><span class="badge ${report.status === "Lost" ? "lost" : "found"}">${safeText(report.status)}</span></td>
      <td>${safeText(report.category)}</td>
      <td>${safeText(report.location)}</td>
      <td>${safeText(report.itemDate)}</td>
      <td>${safeText(report.studentName)}</td>
      <td>${safeText(report.prn || "Not provided")}</td>
      <td>${safeText(report.contactNumber || "Not provided")}</td>
      <td><button class="delete-button" type="button" data-delete-id="${safeText(report.id)}">Delete</button></td>
    </tr>
  `).join("");

  adminEmpty.hidden = filtered.length > 0;
  if (!filtered.length) {
    adminEmpty.textContent = reports.length
      ? "No reports match your search."
      : "No reports available.";
  }
}

adminTableBody.addEventListener("click", event => {
  const button = event.target.closest("[data-delete-id]");
  if (!button) return;

  const reportId = button.dataset.deleteId;
  if (!confirm("Delete this report from this browser?")) return;

  const updated = getAdminReports().filter(
    report => String(report.id) !== reportId
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  adminMessage.textContent = "Report deleted from this browser.";
  adminMessage.className = "form-message success";
  renderAdmin();
});

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

document.getElementById("exportButton").addEventListener("click", () => {
  const reports = getAdminReports();

  if (!reports.length) {
    adminMessage.textContent = "There are no reports to export.";
    adminMessage.className = "form-message error";
    return;
  }

  const columns = [
    ["Item", "itemName"],
    ["Status", "status"],
    ["Category", "category"],
    ["Location", "location"],
    ["Date", "itemDate"],
    ["Description", "description"],
    ["Reported By", "studentName"],
    ["PRN Number", "prn"],
    ["Department", "department"],
    ["Contact Number", "contactNumber"],
    ["Contact Email", "email"],
    ["Created At", "createdAt"]
  ];

  const csv = [
    columns.map(column => csvCell(column[0])).join(","),
    ...reports.map(report =>
      columns.map(column => csvCell(report[column[1]])).join(",")
    )
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "armiet-lost-found-reports.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  adminMessage.textContent = "CSV export downloaded.";
  adminMessage.className = "form-message success";
});

adminSearch.addEventListener("input", renderAdmin);
adminFilter.addEventListener("change", renderAdmin);
window.addEventListener("storage", renderAdmin);

renderAdmin();
