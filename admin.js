
"use strict";

const API_URL =
  "https://smart-lost-and-found-1-tib2.onrender.com/api/items";

const adminTableBody = document.getElementById("adminTableBody");
const adminEmpty = document.getElementById("adminEmpty");
const adminSearch = document.getElementById("adminSearch");
const adminFilter = document.getElementById("adminFilter");
const adminMessage = document.getElementById("adminMessage");
const exportButton = document.getElementById("exportButton");

let adminReports = [];
let isLoading = false;

function safeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function showMessage(message, type = "success") {
  adminMessage.textContent = message;
  adminMessage.className = `form-message ${type}`;
}

async function loadAdminReports() {
  if (isLoading) return;
  isLoading = true;

  adminEmpty.hidden = false;
  adminEmpty.textContent = "Loading reports...";

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Unexpected response from server.");
    }

    adminReports = data;
    renderAdmin();
  } catch (error) {
    console.error("Could not load admin reports:", error);
    adminTableBody.innerHTML = "";
    document.getElementById("adminTotal").textContent = "—";
    document.getElementById("adminLost").textContent = "—";
    document.getElementById("adminFound").textContent = "—";
    adminEmpty.hidden = false;
    adminEmpty.textContent =
      "Unable to load reports. Please refresh and try again.";
    showMessage(
      "Could not connect to the backend. Check your internet connection and try again.",
      "error"
    );
  } finally {
    isLoading = false;
  }
}

function renderAdmin() {
  document.getElementById("adminTotal").textContent =
    adminReports.length;

  document.getElementById("adminLost").textContent =
    adminReports.filter(report =>
      String(report.status).toLowerCase() === "lost"
    ).length;

  document.getElementById("adminFound").textContent =
    adminReports.filter(report =>
      String(report.status).toLowerCase() === "found"
    ).length;

  const query = (adminSearch.value || "").trim().toLowerCase();
  const status = adminFilter.value || "All";

  const filtered = adminReports.filter(report => {
    const searchable = [
      report.itemName,
      report.category,
      report.location,
      report.status,
      report.studentName,
      report.department,
      report.prn,
      report.contactNumber || report.contact,
      report.email
    ].join(" ").toLowerCase();

    return searchable.includes(query) &&
      (status === "All" ||
       String(report.status).toLowerCase() === status.toLowerCase());
  });

  adminTableBody.innerHTML = filtered.map(report => `
    <tr>
      <td>${safeText(report.itemName || "—")}</td>
      <td>
        <span class="badge ${
          String(report.status).toLowerCase() === "lost"
            ? "lost"
            : "found"
        }">${safeText(report.status || "Unknown")}</span>
      </td>
      <td>${safeText(report.category || "—")}</td>
      <td>${safeText(report.location || "—")}</td>
      <td>${safeText(report.itemDate || "—")}</td>
      <td>${safeText(report.studentName || "—")}</td>
      <td>${safeText(report.prn || "Not provided")}</td>
      <td>${safeText(report.contactNumber || report.contact || "Not provided")}</td>
      <td>
        <button
          class="delete-button"
          type="button"
          data-delete-id="${safeText(report.id)}"
        >Delete</button>
      </td>
    </tr>
  `).join("");

  adminEmpty.hidden = filtered.length > 0;

  if (!filtered.length) {
    adminEmpty.textContent = adminReports.length
      ? "No reports match your search."
      : "No reports available.";
  }
}

adminTableBody.addEventListener("click", async event => {
  const button = event.target.closest("[data-delete-id]");
  if (!button) return;

  const reportId = button.dataset.deleteId;

  if (!confirm(
    "Delete this report from the shared database? This action cannot be undone."
  )) {
    return;
  }

  button.disabled = true;
  button.textContent = "Deleting...";

  try {
    const response = await fetch(
      `${API_URL}/${encodeURIComponent(reportId)}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    adminReports = adminReports.filter(
      report => String(report.id) !== reportId
    );

    renderAdmin();
    showMessage("Report deleted from the shared database.", "success");
  } catch (error) {
    console.error("Could not delete report:", error);
    showMessage(
      "Could not delete the report. Please try again.",
      "error"
    );
    await loadAdminReports();
  }
});

function csvCell(value) {
  let text = String(value ?? "");

  // Prevent spreadsheet formulas from being executed when CSV is opened.
  if (/^[\s]*[=+\-@]/.test(text)) {
    text = "'" + text;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

exportButton.addEventListener("click", () => {
  if (!adminReports.length) {
    showMessage("There are no reports to export.", "error");
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
    ...adminReports.map(report =>
      columns.map(([heading, key]) => {
        const value = key === "contactNumber"
          ? report.contactNumber || report.contact
          : report[key];

        return csvCell(value);
      }).join(",")
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

  showMessage("CSV export downloaded.", "success");
});

adminSearch.addEventListener("input", renderAdmin);
adminFilter.addEventListener("change", renderAdmin);

loadAdminReports();
