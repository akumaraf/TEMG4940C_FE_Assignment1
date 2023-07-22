// Selectors: Retrieve references to important HTML elements using their IDs or classes.
const searchInput = document.getElementById("search"); // Search input element for filtering cards.
const addCardBtn = document.querySelector(".add-card"); // "Add Card" button for opening the card creation modal.
const cardModal = document.getElementById("card-modal"); // Modal for adding new cards.
const editModal = document.getElementById("edit-modal"); // Modal for editing existing cards.
const closeBtns = document.querySelectorAll(".close"); // Close buttons for hiding the modals.
const columns = document.querySelectorAll(".column"); // Columns where cards can be dragged and dropped.

// Event listeners: Add event listeners to various elements for handling user interactions.
searchInput.addEventListener("input", searchCards); // When the user types in the search input, filter cards accordingly.
addCardBtn.addEventListener("click", openCardModal); // When the "Add Card" button is clicked, open the card creation modal.
closeBtns.forEach(btn => btn.addEventListener("click", closeModal)); // When a close button is clicked, hide the modals.
columns.forEach(column => {
  column.addEventListener("dragover", dragOver); // When a card is dragged over a column, allow dropping.
  column.addEventListener("drop", drop); // When a card is dropped on a column, handle the drop event.
});

// Functions: Define various functions for handling the Kanban board's functionalities.

// Search cards based on the input value.
function searchCards(e) {
  // Get the search term from the input and convert it to lowercase for case-insensitive search.
  const term = e.target.value.toLowerCase();
  // Loop through each card and check if the title or description contains the search term.
  cards.forEach(card => {
    const title = card.querySelector("h4").innerText.toLowerCase();
    const description = card.querySelector("p").innerText.toLowerCase();
    // If the title or description matches the search term, display the card; otherwise, hide it.
    if (title.includes(term) || description.includes(term)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}

// Open the card creation modal.
function openCardModal() {
  cardModal.style.display = "block";
}

// Open the edit modal and populate it with the existing card's data.
function openEditModal(e) {
  const card = e.target.closest(".card");
  const title = card.querySelector("h4").innerText;
  const description = card.querySelector("p").innerText;
  const editTitleInput = editModal.querySelector("#edit-title");
  const editDescriptionInput = editModal.querySelector("#edit-description");
  editTitleInput.value = title;
  editDescriptionInput.value = description;
  editModal.style.display = "block";
  editModal.dataset.cardId = card.dataset.cardId;
}

// Close both the card and edit modals.
function closeModal() {
  cardModal.style.display = "none";
  editModal.style.display = "none";
}

// Handle the dragstart event when a card is dragged.
function dragStart(e) {
  draggedCard = this;
  this.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", this.dataset.cardId);
}

// Handle the dragend event when a card is dropped.
function dragEnd(e) {
  this.classList.remove("dragging");
  updateCardEventListeners();
  saveData();
}

// Handle the dragover event when a card is dragged over a column.
function dragOver(e) {
  e.preventDefault();
  const afterElement = getDragAfterElement(this, e.clientY);
  if (afterElement == null) {
    this.appendChild(draggedCard);
  } else {
    this.insertBefore(draggedCard, afterElement);
  }
}

// Handle the drop event when a card is dropped on a column (currently empty, no functionality).
function drop(e) {
  e.preventDefault();
}

// Find the element after which the dragged card should be placed.
function getDragAfterElement(container, mouseY) {
  const draggableElements = [...container.querySelectorAll(".card:not(.dragging)")];
  // Iterate through the draggable elements and calculate the offset from the mouse position.
  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = mouseY - box.top - box.height / 2;
      // Find the element closest to the mouse position (above the current dragged card).
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

// Update event listeners for cards after cards are rearranged.
function updateCardEventListeners() {
  cards = document.querySelectorAll(".card");
  // Remove the previous event listeners from all cards.
  cards.forEach(card => {
    card.removeEventListener("dragstart", dragStart);
    card.removeEventListener("dragover", dragOver);
    card.removeEventListener("dragend", dragEnd);
  });
  // Add new event listeners to all cards, including edit and delete buttons.
  cards.forEach(card => {
    card.addEventListener("dragstart", dragStart);
    card.addEventListener("dragover", dragOver);
    card.addEventListener("dragend", dragEnd);
    card.querySelector(".edit-btn").addEventListener("click", openEditModal);
    card.querySelector(".delete-btn").addEventListener("click", deleteCard);
  });
}

// Delete a card from the Kanban board.
function deleteCard(e) {
  const card = e.target.closest(".card");
  card.parentNode.removeChild(card);
  updateCardEventListeners();
  saveData();
}

// Add a new card to a specific column in the Kanban board.
function addCard(title, description, columnIndex) {
  const column = columns[columnIndex];
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.cardId = Date.now(); // Assign a unique ID to the card using the current timestamp.
  card.draggable = true;
  card.innerHTML = `
    <h4>${title}</h4>
    <p>${description}</p>
    <div class="card-btns">
        <button class="edit-btn"><i class="far fa-edit"></i></button>
        <button class="delete-btn"><i class="far fa-trash-alt"></i></button>
    </div>
  `;
  card.addEventListener("dragstart", dragStart);
  card.addEventListener("dragover", dragOver);
  card.addEventListener("dragend", dragEnd);
  card.querySelector(".edit-btn").addEventListener("click", openEditModal);
  card.querySelector(".delete-btn").addEventListener("click", deleteCard);
  column.appendChild(card);
  updateCardEventListeners();
  saveData();
}

// Save a new card's data to the Kanban board.
function saveCard(e) {
  e.preventDefault();
  const title = document.getElementById("card-title").value;
  const description = document.getElementById("card-description").value;
  const columnIndex = 0; // Set the default column index to 0 (To-Do column).
  addCard(title, description, columnIndex);
  closeModal();
}

// Update an existing card's data in the Kanban board.
function updateCard(e) {
  e.preventDefault();
  const card = document.querySelector(`[data-card-id="${editModal.dataset.cardId}"]`);
  const title = document.getElementById("edit-title").value;
  const description = document.getElementById("edit-description").value;
  card.querySelector("h4").innerText = title;
  card.querySelector("p").innerText = description;
  closeModal();
  saveData();
}

// Save the current state of the Kanban board to local storage.
function saveData() {
  const columnsData = Array.from(columns).map((column, columnIndex) => {
    const cardNodes = column.querySelectorAll(".card");
    const columnCards = Array.from(cardNodes).map((card, cardIndex) => ({
      title: card.querySelector("h4").textContent,
      description: card.querySelector("p").textContent,
      cardIndex: cardIndex // add new property to represent the index of the card within the column
    }));
    return columnCards;
  });
  localStorage.setItem("kanbanData", JSON.stringify(columnsData));
}

// Load previously saved Kanban board data from local storage and populate the board.
function loadData() {
  const jsonData = localStorage.getItem("kanbanData");
  if (jsonData) {
    const data = JSON.parse(jsonData);
    data.forEach((columnData, columnIndex) => {
      if (columnData) {
        columnData.forEach(cardData => {
          const { title, description, cardIndex } = cardData;
          addCard(title, description, columnIndex);
        });
      }
    });
  }
}

// Add submit event listener to card modal form for saving new cards.
cardModal.querySelector("form").addEventListener("submit", saveCard);

// Add submit event listener to edit modal form for updating existing cards.
editModal.querySelector("form").addEventListener("submit", updateCard);

// Initialize the Kanban board by loading previous data from local storage on page load.
loadData();
