
"use strict";

const STORAGE_KEY = "armietLostFoundReports";
const form = document.getElementById("itemForm");
const list = document.getElementById("itemList");
const emptyMessage = document.getElementById("emptyMessage");
const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");
const formMessage = document.getElementById("formMessage");
const photoInput = document.getElementById("photo");

function getReports() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveReports(reports) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function updateStats(reports) {
  document.getElementById("totalCount").textContent = reports.length;
  document.getElementById("lostCount").textContent =
    reports.filter(report => report.status === "Lost").length;
  document.getElementById("foundCount").textContent =
    reports.filter(report => report.status === "Found").length;
}

function renderReports() {
  if (!list) return;

  const reports = getReports();
  updateStats(reports);

  const query = (searchInput?.value || "").trim().toLowerCase();
  const status = filterStatus?.value || "All";

  const filtered = reports.filter(report => {
    const searchable = [
      report.itemName, report.category, report.location,
      report.description, report.department, report.status,
      report.studentName, report.prn, report.contactNumber
    ].join(" ").toLowerCase();

    return searchable.includes(query) &&
      (status === "All" || report.status === status);
  });

  list.innerHTML = filtered.map(report => {
    const badgeClass = report.status === "Lost" ? "lost" : "found";
    const photo = report.photo
      ? `<img class="item-photo" src="${report.photo}" alt="Photo of ${escapeHTML(report.itemName)}">`
      : `<div class="item-photo-placeholder">No photo provided</div>`;

    return `
      <article class="item-card">
        ${photo}
        <span class="badge ${badgeClass}">${escapeHTML(report.status)}</span>
        <h3>${escapeHTML(report.itemName)}</h3>
        <p><strong>Category:</strong> ${escapeHTML(report.category)}</p>
        <p><strong>Location:</strong> ${escapeHTML(report.location)}</p>
        <p><strong>Date:</strong> ${escapeHTML(report.itemDate)}</p>
        <p>${escapeHTML(report.description)}</p>
        <p><strong>Reported by:</strong> ${escapeHTML(report.studentName)}</p>
        <p><strong>PRN Number:</strong> ${escapeHTML(report.prn || "Not provided")}</p>
        <p><strong>Department:</strong> ${escapeHTML(report.department)}</p>
        <p><strong>Contact Number:</strong> ${escapeHTML(report.contactNumber || "Not provided")}</p>
        <p><strong>Contact Email:</strong> <a href="mailto:${encodeURIComponent(report.email || "")}">${escapeHTML(report.email)}</a></p>
      </article>`;
  }).join("");

  emptyMessage.hidden = filtered.length > 0;
  if (filtered.length === 0) {
    emptyMessage.textContent = reports.length
      ? "No reports match your search."
      : "No reports yet. Be the first to submit one.";
  }
}

function readPhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");

    if (!file.type.startsWith("image/")) {
      return reject(new Error("Please select an image file."));
    }

    if (file.size > 1024 * 1024) {
      return reject(new Error("Photo must be 1 MB or smaller."));
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the photo."));
    reader.readAsDataURL(file);
  });
}

form?.addEventListener("submit", async event => {
  event.preventDefault();

  formMessage.textContent = "";
  formMessage.className = "form-message";

  const submitButton = document.getElementById("submitButton");
  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";

  try {
    const studentName = document.getElementById("studentName").value.trim();
    const prn = document.getElementById("prn").value.trim();
    const department = document.getElementById("department").value.trim();
    const contactNumber = document.getElementById("contactNumber").value.trim();
    const itemName = document.getElementById("itemName").value.trim();
    const category = document.getElementById("category").value;
    const status = document.getElementById("status").value;
    const location = document.getElementById("location").value.trim();
    const itemDate = document.getElementById("itemDate").value;
    const email = document.getElementById("email").value.trim();
    const description = document.getElementById("description").value.trim();

    if (
      !studentName || !prn || !department || !contactNumber ||
      !itemName || !category || !status || !location ||
      !itemDate || !email || !description
    ) {
      throw new Error("Please complete all required fields marked with *.");
    }

    if (!/^[0-9]{10}$/.test(contactNumber)) {
      throw new Error("Enter a valid 10-digit contact number.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Enter a valid email address.");
    }

    const photo = await readPhoto(photoInput.files[0]);
    const reports = getReports();

    reports.unshift({
      id: window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      studentName,
      prn,
      department,
      contactNumber,
      itemName,
      category,
      status,
      location,
      itemDate,
      email,
      description,
      photo,
      createdAt: new Date().toISOString()
    });

    saveReports(reports);
    form.reset();

    formMessage.textContent = "Report submitted successfully!";
    formMessage.classList.add("success");

    renderReports();
    document.getElementById("browseItems").scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    formMessage.textContent = error.message || "Could not submit the report.";
    formMessage.classList.add("error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Report";
  }
});

searchInput?.addEventListener("input", renderReports);
filterStatus?.addEventListener("change", renderReports);
window.addEventListener("storage", renderReports);

renderReports();
