import {
    deleteTransactionFromFirestore,
    getUserTransactions,
    saveTransaction as saveTransactionToFirestore,
    updateTransactionInFirestore
} from "./firestore.js";
import { auth } from "./firebase.js";

import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

let transactions = [];
let editingIndex = null;
let monthlyBudget = 0;
let currentUserId = null;

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUserId = user.uid;
    monthlyBudget = getCachedBudget();
    if (budgetInput) {
        budgetInput.value = monthlyBudget || "";
    }

    document.body.classList.remove("auth-checking");
    console.log("Logged in:", user.email);
    await loadTransactions();

});
const modal = document.getElementById("transactionModal");

const openBtn = document.getElementById("addTransactionBtn");

const closeBtn = document.querySelector(".close");

openBtn.onclick = () => {

    editingIndex = null;
    form.reset();
    modal.style.display = "flex";

};

closeBtn.onclick = () => {

    editingIndex = null;
    form.reset();
    modal.style.display = "none";

};

window.onclick = (e)=>{

    if(e.target===modal){

        editingIndex = null;
        form.reset();
        modal.style.display="none";

    }

};

// -----------------------------
// Form
// -----------------------------

const form = document.getElementById("transactionForm");

form.addEventListener("submit", addTransaction);

const navItems = document.querySelectorAll(".sidebar li[data-view]");
const viewSections = document.querySelectorAll(".view-section");
const pageTitle = document.querySelector("header h1");
const budgetInput = document.getElementById("monthlyBudgetInput");
const saveBudgetBtn = document.getElementById("saveBudgetBtn");
const generateInsightBtn = document.getElementById("generateInsightBtn");
const aiResult = document.getElementById("aiResult");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");

if (saveBudgetBtn) {
    saveBudgetBtn.addEventListener("click", () => {
        monthlyBudget = Number(budgetInput.value) || 0;
        localStorage.setItem(getBudgetStorageKey(), monthlyBudget);
        updateDashboard();
        alert("Budget saved");
    });
}

navItems.forEach((item) => {
    item.addEventListener("click", () => {
        showView(item.dataset.view);
    });
});

if (generateInsightBtn) {
    generateInsightBtn.addEventListener("click", async () => {
        const localInsights = generateFinancialInsights();
        aiResult.innerHTML = localInsights;

        const aiAnswer = await askConnectedAI("Generate a short financial report with 3 practical recommendations.");

        if (aiAnswer) {
            aiResult.innerHTML = `<p>${aiAnswer}</p>`;
        }
    });
}

if (chatForm) {
    chatForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const question = chatInput.value.trim();

        if (!question) {
            return;
        }

        addChatMessage(question, "user-message");
        chatInput.value = "";

        const thinkingMessage = addChatMessage("Thinking...", "bot-message");
        const connectedAnswer = await askConnectedAI(question);
        thinkingMessage.innerText = connectedAnswer || answerFinanceQuestion(question);
        chatInput.value = "";
    });
}

// -----------------------------

function showView(view) {

    navItems.forEach((item) => {
        item.classList.toggle("active", item.dataset.view === view);
    });

    viewSections.forEach((section) => {
        const sectionViews = section.dataset.section.split(" ");
        section.style.display = sectionViews.includes(view) ? "" : "none";
    });

    if (pageTitle) {
        const titles = {
            dashboard: "Dashboard",
            transactions: "Transactions",
            analytics: "Analytics",
            ai: "AI Insights",
            settings: "Settings"
        };

        pageTitle.innerText = titles[view] || "Dashboard";
    }

    if (openBtn) {
        openBtn.style.display = view === "dashboard" || view === "transactions" ? "" : "none";
    }

}

async function loadTransactions() {

    const cachedTransactions = getCachedTransactions();

    try {
        const firestoreTransactions = await getUserTransactions();
        transactions = mergeTransactions(firestoreTransactions, cachedTransactions);
        persistTransactions();
        syncLocalTransactions();
    } catch (error) {
        console.log(error);
        transactions = cachedTransactions;
    }

    updateDashboard();

}

function getTransactionsStorageKey() {

    return currentUserId ? `transactions:${currentUserId}` : "transactions";

}

function getBudgetStorageKey() {

    return currentUserId ? `monthlyBudget:${currentUserId}` : "monthlyBudget";

}

function getCachedTransactions() {

    const userTransactions = JSON.parse(localStorage.getItem(getTransactionsStorageKey())) || [];
    const oldTransactions = JSON.parse(localStorage.getItem("transactions")) || [];

    return mergeTransactions(userTransactions, oldTransactions);

}

function getCachedBudget() {

    return Number(localStorage.getItem(getBudgetStorageKey())) || Number(localStorage.getItem("monthlyBudget")) || 0;

}

function mergeTransactions(primaryTransactions, fallbackTransactions) {

    const mergedTransactions = [];
    const seenKeys = new Set();

    [...primaryTransactions, ...fallbackTransactions].forEach((transaction) => {
        const idKey = transaction.id ? `id:${transaction.id}` : "";
        const detailKey = `detail:${transaction.date}-${transaction.type}-${transaction.category}-${transaction.amount}-${transaction.description}`;

        if (!seenKeys.has(idKey) && !seenKeys.has(detailKey)) {
            if (idKey) {
                seenKeys.add(idKey);
            }
            seenKeys.add(detailKey);
            mergedTransactions.push(transaction);
        }
    });

    return mergedTransactions;

}

function persistTransactions() {

    localStorage.setItem(
        getTransactionsStorageKey(),
        JSON.stringify(transactions)
    );

}

function getFinancialSummary() {

    let income = 0;
    let expense = 0;
    const categoryTotals = {};

    transactions.forEach((item) => {
        const amount = Number(item.amount) || 0;

        if (item.type === "Income") {
            income += amount;
        } else {
            expense += amount;
            categoryTotals[item.category] = (categoryTotals[item.category] || 0) + amount;
        }
    });

    const balance = income - expense;
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

    return {
        income,
        expense,
        balance,
        topCategory: topCategory ? topCategory[0] : "None",
        topCategoryAmount: topCategory ? topCategory[1] : 0,
        savingsRate: income > 0 ? Math.round((balance / income) * 100) : 0
    };

}

async function askConnectedAI(question) {

    try {
        const response = await fetch("/api/ai", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                question,
                summary: getFinancialSummary(),
                transactions: transactions.map((transaction) => ({
                    amount: transaction.amount,
                    category: transaction.category,
                    type: transaction.type,
                    date: transaction.date,
                    description: transaction.description
                }))
            })
        });

        if (!response.ok) {
            return "";
        }

        const data = await response.json();

        return data.answer || "";
    } catch (error) {
        console.log(error);
        return "";
    }

}

function formatMoney(amount) {

    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;

}

function generateFinancialInsights() {

    const summary = getFinancialSummary();
    const insights = [];

    if (!transactions.length) {
        return "Add a few transactions first, then I can generate a useful report.";
    }

    insights.push(`Income: ${formatMoney(summary.income)}`);
    insights.push(`Expenses: ${formatMoney(summary.expense)}`);
    insights.push(`Balance: ${formatMoney(summary.balance)}`);

    if (summary.topCategory !== "None") {
        insights.push(`Highest expense category: ${summary.topCategory} (${formatMoney(summary.topCategoryAmount)})`);
    }

    if (summary.balance < 0) {
        insights.push("Warning: your expenses are higher than income. Reduce non-essential spending first.");
    } else if (summary.savingsRate >= 30) {
        insights.push("Great job: your savings rate is strong. Consider investing part of the surplus.");
    } else if (summary.savingsRate >= 10) {
        insights.push("Good progress: try to increase savings by 5-10% next month.");
    } else {
        insights.push("Savings are low. Set a small weekly saving target and track it consistently.");
    }

    if (monthlyBudget && summary.expense > monthlyBudget) {
        insights.push(`Budget alert: expenses are ${formatMoney(summary.expense - monthlyBudget)} above your budget.`);
    } else if (monthlyBudget) {
        insights.push(`Budget status: ${formatMoney(monthlyBudget - summary.expense)} remaining.`);
    }

    return insights.map((insight) => `<p>${insight}</p>`).join("");

}

function addChatMessage(message, className) {

    const messageElement = document.createElement("div");
    messageElement.className = className;
    messageElement.innerText = message;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return messageElement;

}

function answerFinanceQuestion(question) {

    const text = question.toLowerCase();
    const summary = getFinancialSummary();

    if (!transactions.length) {
        return "Add at least one transaction first, then I can answer using your real data.";
    }

    if (text.includes("income")) {
        return `Your total income is ${formatMoney(summary.income)}.`;
    }

    if (text.includes("expense") || text.includes("spend")) {
        return `Your total expense is ${formatMoney(summary.expense)}. Highest spending is ${summary.topCategory} at ${formatMoney(summary.topCategoryAmount)}.`;
    }

    if (text.includes("balance") || text.includes("saving")) {
        return `Your current balance is ${formatMoney(summary.balance)} and savings rate is about ${summary.savingsRate}%.`;
    }

    if (text.includes("budget")) {
        if (!monthlyBudget) {
            return "You have not set a monthly budget yet. Open Settings and add one.";
        }

        return summary.expense > monthlyBudget
            ? `You are over budget by ${formatMoney(summary.expense - monthlyBudget)}.`
            : `You have ${formatMoney(monthlyBudget - summary.expense)} remaining from your budget.`;
    }

    if (text.includes("tip") || text.includes("advice") || text.includes("help")) {
        return summary.balance < 0
            ? "Start by cutting the biggest expense category and avoid new non-essential purchases this week."
            : "Try the 50/30/20 rule: needs, wants, and savings. Your first focus should be keeping expenses below income.";
    }

    return "I can answer about income, expenses, balance, budget, savings, and money tips.";

}

async function syncLocalTransactions() {

    const localTransactions = transactions.filter((transaction) => transaction.id && transaction.id.startsWith("local-"));

    for (const transaction of localTransactions) {
        try {
            const { id, ...transactionData } = transaction;
            const transactionId = await saveTransactionToFirestore(transactionData);

            if (transactionId) {
                transactions = transactions.map((item) => (
                    item.id === id
                        ? { id: transactionId, ...transactionData }
                        : item
                ));
                persistTransactions();
            }
        } catch (error) {
            console.log(error);
        }
    }

}


function closeTransactionModal() {

    form.reset();

    editingIndex = null;

    modal.style.display = "none";

    const submitButton =
        form.querySelector("button[type='submit']");

    submitButton.disabled = false;

    submitButton.innerText = "Save Transaction";

}

async function addTransaction(e) {

    e.preventDefault();

    const submitButton = form.querySelector("button[type='submit']");

    submitButton.disabled = true;
    submitButton.innerText = "Saving...";

    try {

        const transaction = {

            amount: Number(document.getElementById("amount").value),

            category: document.getElementById("category").value,

            type: document.getElementById("type").value,

            date: document.getElementById("date").value,

            description: document.getElementById("description").value

        };

        if (editingIndex !== null) {

            const oldId = transactions[editingIndex].id;

            transactions[editingIndex] = {

                id: oldId,

                ...transaction

            };

            persistTransactions();

            updateDashboard();

            closeTransactionModal();

            if (oldId && !oldId.startsWith("local-")) {

                await updateTransactionInFirestore(
                    oldId,
                    transaction
                );

            }

            editingIndex = null;

        }

else {

    const firestoreId = await saveTransactionToFirestore(transaction);

    transactions.unshift({

        id: firestoreId,

        ...transaction

    });

    persistTransactions();

    updateDashboard();

    closeTransactionModal();



try {

    const firestoreId = await saveTransactionToFirestore(transaction);

    transactions[0].id = firestoreId;

    persistTransactions();

} catch (error) {

    console.error(error);

}

        }

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

    finally {

        submitButton.disabled = false;

        submitButton.innerText = "Save Transaction";

    }

}

function updateDashboard(){

    let income=0;

    let expense=0;

    transactions.forEach(item=>{

        if(item.type==="Income"){

            income+=item.amount;

        }else{

            expense+=item.amount;

        }

    });

    const balance=income-expense;

    document.getElementById("income").innerText="₹"+income;

    document.getElementById("expense").innerText="₹"+expense;

    document.getElementById("balance").innerText="₹"+balance;

    document.getElementById("budget").innerText="₹"+monthlyBudget;

    renderTable();

drawCharts(income, expense);

}
function renderTable() {

    const table = document.getElementById("transactionTable");

    table.innerHTML = "";

    if (!transactions.length) {
        table.innerHTML = `

        <tr>

            <td colspan="6">No transactions yet. Add your first transaction to see it here.</td>

        </tr>

        `;
        return;
    }

    transactions.forEach((item, index) => {

        table.innerHTML += `

        <tr>

            <td>${item.date}</td>

            <td>${item.category}</td>

            <td>${item.type}</td>

            <td>₹${item.amount}</td>

            <td>${item.description}</td>

            <td>

                <button class="edit-btn" onclick="editTransaction(${index})">
                    ✏ Edit
                </button>

                <button class="delete-btn" onclick="deleteTransaction(${index})">
                    🗑 Delete
                </button>

            </td>

        </tr>

        `;

    });

}
async function deleteTransaction(index){

    if(confirm("Delete this transaction?")){

        const transaction = transactions[index];

        if (transaction && transaction.id && !transaction.id.startsWith("local-")) {
            await deleteTransactionFromFirestore(transaction.id);
        }

        transactions.splice(index,1);
        persistTransactions();

        updateDashboard();

    }

}
function editTransaction(index){

    const transaction = transactions[index];

    document.getElementById("amount").value = transaction.amount;

    document.getElementById("category").value = transaction.category;

    document.getElementById("type").value = transaction.type;

    document.getElementById("date").value = transaction.date;

    document.getElementById("description").value = transaction.description;

    modal.style.display="flex";

    editingIndex = index;

}
window.deleteTransaction = deleteTransaction;
window.editTransaction = editTransaction;

const logoutItem = document.getElementById("logout");

if (logoutItem) {
    logoutItem.addEventListener("click", async () => {
        await signOut(auth);
        window.location.href = "login.html";
    });
}

showView("dashboard");
