// ===============================
// ALKE WALLET - JAVASCRIPT + JQUERY
// ===============================

// Saldo inicial
let balance = localStorage.getItem("balance")
  ? parseInt(localStorage.getItem("balance"))
  : 60000;

// Transacciones iniciales
let transactions = JSON.parse(localStorage.getItem("transactions")) || [
  {
    type: "Compra en línea",
    amount: 500,
    detail: "Pago realizado",
    date: "Inicial"
  },
  {
    type: "Depósito",
    amount: 10000,
    detail: "Depósito inicial",
    date: "Inicial"
  },
  {
    type: "Transferencia recibida",
    amount: 7500,
    detail: "Dinero recibido",
    date: "Inicial"
  }
];

// Contactos iniciales
let contacts = JSON.parse(localStorage.getItem("contacts")) || [
  {
    name: "John Doe",
    cbu: "123456789",
    alias: "john.doe",
    bank: "ABC Bank"
  },
  {
    name: "Jane Smith",
    cbu: "987654321",
    alias: "jane.smith",
    bank: "XYZ Bank"
  }
];

// Guardar datos en navegador
function saveData() {
  localStorage.setItem("balance", balance);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  localStorage.setItem("contacts", JSON.stringify(contacts));
}

// Formatear dinero
function formatMoney(amount) {
  return "$" + amount.toLocaleString("es-CL");
}

// Actualizar saldo en cualquier pantalla
function updateBalanceView() {
  const balanceElement = document.getElementById("balance");

  if (balanceElement) {
    balanceElement.textContent = formatMoney(balance);
  }
}

// Mostrar mensajes con Bootstrap
function showMessage(message, type = "success") {
  const messageBox = document.getElementById("message");

  if (!messageBox) return;

  messageBox.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show mt-3" role="alert">
      ${message}
      <button type="button" class="close" data-dismiss="alert" aria-label="Cerrar">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  `;
}

// Registrar transacción
function addTransaction(type, amount, detail) {
  const newTransaction = {
    type: type,
    amount: amount,
    detail: detail,
    date: new Date().toLocaleDateString("es-CL")
  };

  transactions.unshift(newTransaction);
  saveData();
}

// Login
function loginUser(event) {
  event.preventDefault();

  const email = $("#email").val();
  const password = $("#password").val();

  if (email === "usuario@alke.cl" && password === "1234") {
    localStorage.setItem("loggedUser", "true");
    window.location.href = "menu.html";
  } else {
    showMessage("Correo o contraseña incorrectos. Usa usuario@alke.cl / 1234", "danger");
  }
}

// Depósito
function depositMoney(event) {
  event.preventDefault();

  const amount = parseInt($("#depositAmount").val());

  if (isNaN(amount) || amount <= 0) {
    showMessage("Ingresa un monto válido para depositar.", "danger");
    return;
  }

  balance += amount;

  addTransaction(
    "Depósito",
    amount,
    "Depósito realizado desde la cuenta principal"
  );

  updateBalanceView();
  $("#depositAmount").val("");

  showMessage("Depósito realizado correctamente.", "success");
}

// Mostrar contactos
function renderContacts(filter = "") {
  const contactList = $("#contactList");

  if (!contactList.length) return;

  contactList.empty();

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(filter.toLowerCase()) ||
    contact.alias.toLowerCase().includes(filter.toLowerCase()) ||
    contact.bank.toLowerCase().includes(filter.toLowerCase())
  );

  if (filteredContacts.length === 0) {
    contactList.append(`
      <li class="list-group-item text-muted">
        No se encontraron contactos.
      </li>
    `);
    return;
  }

  filteredContacts.forEach(contact => {
    contactList.append(`
      <li class="list-group-item contact-item" data-name="${contact.name}">
        <div class="contact-info">
          <strong class="contact-name">${contact.name}</strong><br>
          <small>CBU: ${contact.cbu}, Alias: ${contact.alias}, Banco: ${contact.bank}</small>
        </div>
      </li>
    `);
  });
}

// Enviar dinero
function sendMoney(event) {
  event.preventDefault();

  const contactName = $("#searchContact").val();
  const amount = parseInt($("#sendAmount").val());

  if (contactName.trim() === "") {
    showMessage("Debes seleccionar o escribir un contacto.", "danger");
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    showMessage("Ingresa un monto válido para transferir.", "danger");
    return;
  }

  if (amount > balance) {
    showMessage("Saldo insuficiente para realizar la transferencia.", "danger");
    return;
  }

  balance -= amount;

  addTransaction(
    "Transferencia enviada",
    amount,
    "Transferencia enviada a " + contactName
  );

  updateBalanceView();

  $("#searchContact").val("");
  $("#sendAmount").val("");

  showMessage("Transferencia realizada correctamente.", "success");
}

// Agregar contacto simple
function addNewContact() {
  const contactName = $("#searchContact").val();

  if (contactName.trim() === "") {
    showMessage("Escribe el nombre del nuevo contacto.", "danger");
    return;
  }

  const exists = contacts.some(contact =>
    contact.name.toLowerCase() === contactName.toLowerCase()
  );

  if (exists) {
    showMessage("Este contacto ya existe.", "warning");
    return;
  }

  const newContact = {
    name: contactName,
    cbu: "000000000",
    alias: contactName.toLowerCase().replaceAll(" ", "."),
    bank: "Banco Demo"
  };

  contacts.push(newContact);
  saveData();
  renderContacts();

  showMessage("Contacto agregado correctamente.", "success");
}

// Mostrar transacciones
function renderTransactions() {
  const transactionList = $("#transactionList");

  if (!transactionList.length) return;

  transactionList.empty();

  transactions.forEach(transaction => {
    const isPositive =
      transaction.type === "Depósito" ||
      transaction.type === "Transferencia recibida";

    const sign = isPositive ? "+" : "-";
    const textClass = isPositive ? "text-success" : "text-danger";

    transactionList.append(`
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <div>
          <strong>${transaction.type}</strong><br>
          <small class="text-muted">${transaction.detail} - ${transaction.date}</small>
        </div>
        <span class="${textClass}">
          ${sign}${formatMoney(transaction.amount)}
        </span>
      </li>
    `);
  });
}

// Cuando carga la página
$(document).ready(function () {
  updateBalanceView();
  renderContacts();
  renderTransactions();

  // Login
  $("#loginForm").on("submit", loginUser);

  // Depósito
  $("#depositForm").on("submit", depositMoney);

  // Enviar dinero
  $("#sendMoneyForm").on("submit", sendMoney);

  // Agregar contacto
  $("#addContactBtn").on("click", addNewContact);

  // Buscar contacto con jQuery
  $("#searchContact").on("input", function () {
    const searchText = $(this).val();
    renderContacts(searchText);
  });

  // Seleccionar contacto desde la lista
  $(document).on("click", ".contact-item", function () {
    const selectedName = $(this).data("name");
    $("#searchContact").val(selectedName);
  });
});