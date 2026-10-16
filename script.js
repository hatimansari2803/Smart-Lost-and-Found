
let items = JSON.parse(localStorage.getItem("lostFoundItems")) || [];
let nextId = Number(localStorage.getItem("nextItemId")) || 1;

// Save items in browser storage
function saveItems() {
    localStorage.setItem("lostFoundItems", JSON.stringify(items));
    localStorage.setItem("nextItemId", String(nextId));
}

// Add an item
function addItem() {
    const itemName = document.getElementById("itemName").value.trim();
    const location = document.getElementById("location").value.trim();
    const status = document.getElementById("status").value;

    if (!itemName || !location) {
        alert("Please fill all fields.");
        return;
    }

    items.push({
        id: nextId++,
        name: itemName,
        location: location,
        status: status
    });

    saveItems();
    document.getElementById("itemName").value = "";
    document.getElementById("location").value = "";

    displayItems();
}

// Search, filter and display items
function displayItems() {
    const itemList = document.getElementById("itemList");
    const searchInput = document.getElementById("searchInput");
    const filterInput = document.getElementById("filterStatus");

    if (!itemList || !searchInput || !filterInput) return;

    const searchText = searchInput.value.toLowerCase().trim();
    const filterStatus = filterInput.value;

    itemList.innerHTML = "";

    const filteredItems = items.filter(function(item) {
        const matchesSearch =
            item.name.toLowerCase().includes(searchText) ||
            item.location.toLowerCase().includes(searchText);

        const matchesStatus =
            filterStatus === "All" || item.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    if (filteredItems.length === 0) {
        itemList.textContent = "No matching items found.";
        return;
    }

    filteredItems.forEach(function(item) {
        const card = document.createElement("div");
        card.className = "item";

        const name = document.createElement("h3");
        name.textContent = item.name;

        const location = document.createElement("p");
        location.textContent = "Location: " + item.location;

        const statusBadge = document.createElement("span");
        statusBadge.textContent = item.status.toUpperCase();
        statusBadge.classList.add("status-badge");
        statusBadge.classList.add(
            item.status === "Lost" ? "lost" : "found"
        );

        // Edit button
        const editButton = document.createElement("button");
        editButton.textContent = "Edit Item";
        editButton.className = "edit-button";
        editButton.onclick = function() {
            editItem(item.id);
        };

        // Delete button
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete Item";
        deleteButton.className = "delete-button";
        deleteButton.onclick = function() {
            deleteItem(item.id);
        };

        card.appendChild(name);
        card.appendChild(location);
        card.appendChild(statusBadge);
        card.appendChild(editButton);
        card.appendChild(deleteButton);

        itemList.appendChild(card);
    });
}

// Edit an existing item
function editItem(id) {
    const item = items.find(function(entry) {
        return entry.id === id;
    });

    if (!item) return;

    const newName = prompt("Edit item name:", item.name);
    if (newName === null) return;

    const newLocation = prompt("Edit item location:", item.location);
    if (newLocation === null) return;

    const newStatus = prompt(
        "Enter status: Lost or Found",
        item.status
    );

    if (newStatus === null) return;

    const cleanName = newName.trim();
    const cleanLocation = newLocation.trim();
    const cleanStatus = newStatus.trim().toLowerCase();

    if (!cleanName || !cleanLocation) {
        alert("Item name and location cannot be empty.");
        return;
    }

    if (cleanStatus !== "lost" && cleanStatus !== "found") {
        alert("Status must be Lost or Found.");
        return;
    }

    item.name = cleanName;
    item.location = cleanLocation;
    item.status = cleanStatus === "lost" ? "Lost" : "Found";

    saveItems();
    displayItems();
}

// Delete an item
function deleteItem(id) {
    if (!confirm("Are you sure you want to delete this item?")) {
        return;
    }

    items = items.filter(function(item) {
        return item.id !== id;
    });

    saveItems();
    displayItems();
}

// Load saved items when the website opens
displayItems();
