// ========================================
// CONFIGURACIÓN INICIAL
// ========================================

const VALID_EMAIL = "usuario@alke.cl";
const VALID_PASSWORD = "1234";
const INITIAL_BALANCE = 80000;

const defaultContacts = [
    {
        name: "María González",
        alias: "maria.gonzalez",
        bank: "Banco Estado",
        cbu: "123456789"
    },
    {
        name: "Juan Pérez",
        alias: "juan.perez",
        bank: "Banco de Chile",
        cbu: "987654321"
    },
    {
        name: "Carolina Soto",
        alias: "carolina.soto",
        bank: "Banco Santander",
        cbu: "456789123"
    }
];


// ========================================
// OBTENER DATOS DE LOCALSTORAGE
// ========================================

function getStoredArray(key, defaultValue) {
    try {
        const storedValue = localStorage.getItem(key);

        if (!storedValue) {
            return defaultValue;
        }

        const parsedValue = JSON.parse(storedValue);

        return Array.isArray(parsedValue)
            ? parsedValue
            : defaultValue;

    } catch (error) {
        console.error(`Error al recuperar ${key}:`, error);
        return defaultValue;
    }
}


let balance = Number(localStorage.getItem("balance"));

if (!Number.isFinite(balance)) {
    balance = INITIAL_BALANCE;
}

let contacts = getStoredArray(
    "contacts",
    defaultContacts
);

let transactions = getStoredArray(
    "transactions",
    []
);


// ========================================
// FUNCIONES GENERALES
// ========================================

function saveData() {
    localStorage.setItem(
        "balance",
        balance.toString()
    );

    localStorage.setItem(
        "contacts",
        JSON.stringify(contacts)
    );

    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );
}


function formatCurrency(amount) {
    return new Intl.NumberFormat(
        "es-CL",
        {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0
        }
    ).format(amount);
}


function escapeHtml(value) {
    return $("<div>")
        .text(value)
        .html();
}


function showMessage(message, type = "success") {
    const messageContainer = $("#message");

    if (!messageContainer.length) {
        return;
    }

    messageContainer
        .stop(true, true)
        .hide()
        .html(`
            <div class="alert alert-${type}" role="alert">
                ${escapeHtml(message)}
            </div>
        `)
        .fadeIn(300);
}


function updateBalanceView() {
    $("#balance").text(
        formatCurrency(balance)
    );
}


// ========================================
// LOGIN
// ========================================

function loginUser(event) {
    event.preventDefault();

    const email = $("#email")
        .val()
        .trim();

    const password = $("#password")
        .val()
        .trim();

    if (email === "" || password === "") {
        showMessage(
            "Debes completar el correo y la contraseña.",
            "danger"
        );

        return;
    }

    if (
        email === VALID_EMAIL &&
        password === VALID_PASSWORD
    ) {
        localStorage.setItem(
            "loggedUser",
            "true"
        );

        window.location.href = "menu.html";

    } else {
        showMessage(
            "Correo o contraseña incorrectos.",
            "danger"
        );
    }
}


// ========================================
// DEPÓSITOS
// ========================================

function depositMoney(event) {
    event.preventDefault();

    const depositAmount = Number(
        $("#depositAmount").val()
    );

    if (
        !Number.isFinite(depositAmount) ||
        depositAmount <= 0
    ) {
        showMessage(
            "Ingresa un monto válido mayor que cero.",
            "danger"
        );

        return;
    }

    balance += depositAmount;

    transactions.push({
        type: "income",
        description: "Depósito de fondos",
        amount: depositAmount,
        date: new Date().toLocaleString("es-CL")
    });

    saveData();
    updateBalanceView();
    renderTransactions();

    $("#depositAmount").val("");

    showMessage(
        `Depósito de ${formatCurrency(depositAmount)} realizado correctamente.`,
        "success"
    );
}


// ========================================
// TRANSFERENCIAS
// ========================================

function sendMoney(event) {
    event.preventDefault();

    const contactSearch = $("#searchContact")
        .val()
        .trim();

    const sendAmount = Number(
        $("#sendAmount").val()
    );

    if (contactSearch === "") {
        showMessage(
            "Debes seleccionar un contacto.",
            "danger"
        );

        return;
    }

    const selectedContact = contacts.find(contact => {
        const searchText = contactSearch.toLowerCase();

        return (
            contact.name.toLowerCase() === searchText ||
            contact.alias.toLowerCase() === searchText
        );
    });

    if (!selectedContact) {
        showMessage(
            "El contacto seleccionado no existe.",
            "danger"
        );

        return;
    }

    if (
        !Number.isFinite(sendAmount) ||
        sendAmount <= 0
    ) {
        showMessage(
            "Ingresa un monto válido mayor que cero.",
            "danger"
        );

        return;
    }

    if (sendAmount > balance) {
        showMessage(
            "No tienes saldo suficiente para realizar esta transferencia.",
            "danger"
        );

        return;
    }

    const confirmed = window.confirm(
        `¿Confirmas la transferencia de ${formatCurrency(sendAmount)} a ${selectedContact.name}?`
    );

    if (!confirmed) {
        return;
    }

    balance -= sendAmount;

    transactions.push({
        type: "expense",
        description: `Transferencia a ${selectedContact.name}`,
        amount: sendAmount,
        date: new Date().toLocaleString("es-CL")
    });

    saveData();
    updateBalanceView();
    renderTransactions();

    $("#searchContact").val("");
    $("#sendAmount").val("");

    renderContacts();

    showMessage(
        "Transferencia realizada correctamente.",
        "success"
    );
}


// ========================================
// AGREGAR CONTACTOS
// ========================================

function addNewContact(event) {
    event.preventDefault();

    const contactName = $("#contactName")
        .val()
        .trim();

    const contactAlias = $("#contactAlias")
        .val()
        .trim();

    const contactBank = $("#contactBank")
        .val()
        .trim();

    const contactAccount = $("#contactAccount")
        .val()
        .trim();

    const contactMessage = $("#contactMessage");

    contactMessage.empty();

    if (
        contactName === "" ||
        contactAlias === "" ||
        contactBank === "" ||
        contactAccount === ""
    ) {
        contactMessage.html(`
            <div class="alert alert-danger" role="alert">
                Debes completar todos los datos del contacto.
            </div>
        `);

        return;
    }

    if (!/^\d+$/.test(contactAccount)) {
        contactMessage.html(`
            <div class="alert alert-danger" role="alert">
                El número de cuenta debe contener solamente números.
            </div>
        `);

        return;
    }

    const contactExists = contacts.some(contact => {
        return (
            contact.name.toLowerCase() ===
                contactName.toLowerCase() ||

            contact.alias.toLowerCase() ===
                contactAlias.toLowerCase() ||

            contact.cbu === contactAccount
        );
    });

    if (contactExists) {
        contactMessage.html(`
            <div class="alert alert-warning" role="alert">
                Ya existe un contacto con ese nombre, alias o número de cuenta.
            </div>
        `);

        return;
    }

    const newContact = {
        name: contactName,
        alias: contactAlias,
        bank: contactBank,
        cbu: contactAccount
    };

    contacts.push(newContact);

    saveData();
    renderContacts();

    $("#searchContact").val(contactName);

    $("#contactForm")[0].reset();

    $("#contactModal").modal("hide");

    showMessage(
        "Contacto agregado correctamente.",
        "success"
    );
}


// ========================================
// MOSTRAR CONTACTOS
// ========================================

function renderContacts(searchText = "") {
    const contactList = $("#contactList");

    if (!contactList.length) {
        return;
    }

    contactList.empty();

    const normalizedSearch = searchText
        .trim()
        .toLowerCase();

    const filteredContacts = contacts.filter(contact => {
        return (
            contact.name
                .toLowerCase()
                .includes(normalizedSearch) ||

            contact.alias
                .toLowerCase()
                .includes(normalizedSearch) ||

            contact.bank
                .toLowerCase()
                .includes(normalizedSearch)
        );
    });

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
            <li
                class="list-group-item contact-item"
                data-name="${escapeHtml(contact.name)}"
            >
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong>
                            ${escapeHtml(contact.name)}
                        </strong>

                        <div class="small text-muted">
                            ${escapeHtml(contact.alias)}
                        </div>

                        <div class="small">
                            ${escapeHtml(contact.bank)}
                        </div>

                        <div class="small">
                            Cuenta: ${escapeHtml(contact.cbu)}
                        </div>
                    </div>

                    <span class="badge badge-primary">
                        Seleccionar
                    </span>
                </div>
            </li>
        `);
    });
}


// ========================================
// MOSTRAR TRANSACCIONES
// ========================================

function renderTransactions() {
    const transactionList = $("#transactionList");

    if (!transactionList.length) {
        return;
    }

    transactionList.empty();

    if (transactions.length === 0) {
        transactionList.append(`
            <li class="list-group-item text-muted text-center">
                No hay movimientos registrados.
            </li>
        `);

        return;
    }

    [...transactions]
        .reverse()
        .forEach(transaction => {

            const isIncome =
                transaction.type === "income";

            const transactionClass = isIncome
                ? "transaction-income"
                : "transaction-expense";

            const amountClass = isIncome
                ? "text-success"
                : "text-danger";

            const sign = isIncome
                ? "+"
                : "-";

            transactionList.append(`
                <li class="list-group-item ${transactionClass}">

                    <div class="d-flex justify-content-between align-items-start">

                        <div>
                            <strong>
                                ${escapeHtml(transaction.description)}
                            </strong>

                            <div class="small text-muted">
                                ${escapeHtml(transaction.date)}
                            </div>
                        </div>

                        <span class="${amountClass} font-weight-bold">
                            ${sign}${formatCurrency(transaction.amount)}
                        </span>

                    </div>

                </li>
            `);
        });
}


// ========================================
// PROTECCIÓN Y CIERRE DE SESIÓN
// ========================================

function getCurrentPage() {
    return (
        window.location.pathname
            .split("/")
            .pop() ||
        "index.html"
    );
}


function protectPrivatePages() {
    const privatePages = [
        "menu.html",
        "deposit.html",
        "sendmoney.html",
        "transactions.html"
    ];

    const currentPage = getCurrentPage();

    const loggedUser =
        localStorage.getItem("loggedUser");

    if (
        privatePages.includes(currentPage) &&
        loggedUser !== "true"
    ) {
        window.location.href = "login.html";
    }
}


function logoutUser(event) {
    event.preventDefault();

    localStorage.removeItem("loggedUser");

    window.location.href = "login.html";
}


// ========================================
// EVENTOS CUANDO CARGA LA PÁGINA
// ========================================

$(document).ready(function () {

    protectPrivatePages();

    updateBalanceView();
    renderContacts();
    renderTransactions();

    $("#loginForm")
        .on("submit", loginUser);

    $("#depositForm")
        .on("submit", depositMoney);

    $("#sendMoneyForm")
        .on("submit", sendMoney);

    $("#contactForm")
        .on("submit", addNewContact);

    $("#searchContact")
        .on("input", function () {

            const searchText =
                $(this).val();

            renderContacts(searchText);
        });

    $(document)
        .on(
            "click",
            ".contact-item",
            function () {

                const selectedName =
                    $(this).data("name");

                $("#searchContact")
                    .val(selectedName);

                showMessage(
                    `Contacto seleccionado: ${selectedName}`,
                    "info"
                );
            }
        );

    $("#contactModal")
        .on("show.bs.modal", function () {

            $("#contactMessage").empty();

            $("#contactForm")[0]?.reset();
        });

    $("#logoutBtn")
        .on("click", logoutUser);

});