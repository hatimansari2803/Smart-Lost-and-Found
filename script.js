
"use strict";

const API_URL = "https://smart-lost-and-found-1-tib2.onrender.com/api/items";

const form = document.getElementById("itemForm");
const list = document.getElementById("itemList");
const emptyMessage = document.getElementById("emptyMessage");
const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");
const formMessage = document.getElementById("formMessage");
const photoInput = document.getElementById("photo");

let reports = [];
let isLoading = true;

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function normalizeReport(report) {
  return {
    ...report,
    contactNumber: report.contactNumber || report.contact || ""
  };
}

async function fetchReports() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Could not load reports from the server.");
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from the server.");
  }

  reports = data.map(normalizeReport);
  isLoading = false;
  renderReports();
}

function updateStats(items) {
  const total = document.getElementById("totalCount");
  const lost = document.getElementById("lostCount");
  const found = document.getElementById("foundCount");

  if (total) total.textContent = items.length;

  if (lost) {
    lost.textContent = items.filter(
      item => String(item.status).toLowerCase() === "lost"
    ).length;
  }

  if (found) {
    found.textContent = items.filter(
      item => String(item.status).toLowerCase() === "found"
    ).length;
  }
}

function renderReports() {
  if (!list) return;

  updateStats(reports);

  const query = (searchInput?.value || "").trim().toLowerCase();
  const status = filterStatus?.value || "All";

  const filtered = reports.filter(report => {
    const searchable = [
      report.itemName,
      report.category,
      report.location,
      report.description,
      report.department,
      report.status,
      report.studentName,
      report.prn,
      report.contactNumber,
      report.email
    ].join(" ").toLowerCase();

    return searchable.includes(query) &&
      (status === "All" || report.status === status);
  });

  list.innerHTML = filtered.map(report => {
    const isLost = String(report.status).toLowerCase() === "lost";
    const badgeClass = isLost ? "lost" : "found";

    const photo = typeof report.photo === "string" &&
      report.photo.startsWith("data:image/")
      ? `<img class="item-photo"
          src="${escapeHTML(report.photo)}"
          alt="Photo of ${escapeHTML(report.itemName)}">`
      : `<div class="item-photo-placeholder">No photo provided</div>`;

    const email = String(report.email || "");
    const emailHTML = email
      ? `<a href="mailto:${encodeURIComponent(email)}">${escapeHTML(email)}</a>`
      : "Not provided";

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
        <p><strong>Contact Email:</strong> ${emailHTML}</p>
      </article>
    `;
  }).join("");

  if (emptyMessage) {
    emptyMessage.hidden = filtered.length > 0;

    if (filtered.length === 0) {
      if (isLoading) {
        emptyMessage.textContent = "Loading reports...";
      } else if (reports.length > 0) {
        emptyMessage.textContent = "No reports match your search.";
      } else {
        emptyMessage.textContent =
          "No reports yet. Be the first to submit one.";
      }
    }
  }
}

function readPhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      reject(new Error("Please select a JPG, PNG, or WebP image."));
      return;
    }

    if (file.size > 1024 * 1024) {
      reject(new Error("Photo must be 1 MB or smaller."));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the photo."));

    reader.readAsDataURL(file);
  });
}

if (form) {
  form.addEventListener("submit", async event => {
    event.preventDefault();

    if (formMessage) {
      formMessage.textContent = "";
      formMessage.className = "form-message";
    }

    const submitButton = document.getElementById("submitButton");

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";
    }

    try {
      const getValue = id =>
        document.getElementById(id)?.value.trim() || "";

      const studentName = getValue("studentName");
      const prn = getValue("prn");
      const department = getValue("department");
      const contactNumber = getValue("contactNumber");
      const itemName = getValue("itemName");
      const category = getValue("category");
      const status = getValue("status");
      const location = getValue("location");
      const itemDate = getValue("itemDate");
      const email = getValue("email");
      const description = getValue("description");

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

      const photo = await readPhoto(photoInput?.files?.[0]);

      const newReport = {
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
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(newReport)
      });

      if (!response.ok) {
        const details = await response.text();
        console.error("Backend error:", response.status, details);

        throw new Error(
          `Server could not save the report (HTTP ${response.status}).`
        );
      }

      const savedReport = normalizeReport(await response.json());

      form.reset();

      try {
        await fetchReports();
      } catch (refreshError) {
        console.error("Refresh error:", refreshError);

        reports = [
          savedReport,
          ...reports.filter(item => item.id !== savedReport.id)
        ];

        isLoading = false;
        renderReports();
      }

      if (formMessage) {
        formMessage.textContent = "Report submitted successfully!";
        formMessage.classList.add("success");
      }

      document.getElementById("browseItems")
        ?.scrollIntoView({ behavior: "smooth" });

    } catch (error) {
      console.error("Submission failed:", error);

      if (formMessage) {
        formMessage.textContent =
          error.message || "Could not submit the report.";
        formMessage.classList.add("error");
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Report";
      }
    }
  });
}

searchInput?.addEventListener("input", renderReports);
filterStatus?.addEventListener("change", renderReports);

async function initializeReports() {
  isLoading = true;
  renderReports();

  try {
    await fetchReports();
  } catch (error) {
    isLoading = false;
    renderReports();

    if (emptyMessage) {
      emptyMessage.hidden = false;
      emptyMessage.textContent =
        "Could not load reports. Please refresh the page and try again.";
    }

    console.error("Backend loading error:", error);
  }
}

initializeReports();
