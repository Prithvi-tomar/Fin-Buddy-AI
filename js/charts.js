let expenseChart;
let incomeChart;
let balanceChart;

function drawCharts(income, expense) {

    // Destroy old charts before creating new ones
    if (expenseChart) expenseChart.destroy();
    if (incomeChart) incomeChart.destroy();
    if (balanceChart) balanceChart.destroy();

    // Expense Pie Chart
    expenseChart = new Chart(
        document.getElementById("expenseChart"),
        {
            type: "pie",
            data: {
                labels: ["Income", "Expense"],
                datasets: [{
                    data: [income, expense]
                }]
            }
        }
    );

    // Income vs Expense Bar Chart
    incomeChart = new Chart(
        document.getElementById("incomeChart"),
        {
            type: "bar",
            data: {
                labels: ["Income", "Expense"],
                datasets: [{
                    label: "Amount",
                    data: [income, expense]
                }]
            }
        }
    );

    // Balance Line Chart
    balanceChart = new Chart(
        document.getElementById("balanceChart"),
        {
            type: "line",
            data: {
                labels: ["Income", "Expense", "Balance"],
                datasets: [{
                    label: "Financial Overview",
                    data: [income, expense, income - expense],
                    fill: false
                }]
            }
        }
    );

}