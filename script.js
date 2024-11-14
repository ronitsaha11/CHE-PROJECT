// Utility function to format the date
function formatDate(date) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(date).toLocaleDateString(undefined, options);
}

// Get elements
const energyForm = document.getElementById('energy-form');
const energyTable = document.getElementById('energy-table').getElementsByTagName('tbody')[0];
const totalConsumption = document.getElementById('total-consumption');
const avgConsumption = document.getElementById('avg-consumption');
const dailyGoalInput = document.getElementById('daily-goal');
const monthlyGoalInput = document.getElementById('monthly-goal');
const dailyGoalValue = document.getElementById('daily-goal-value');
const monthlyGoalValue = document.getElementById('monthly-goal-value');
const dailyProgress = document.getElementById('daily-progress');
const monthlyProgress = document.getElementById('monthly-progress');
const setGoalsButton = document.getElementById('set-goals');
const timeFilter = document.getElementById('time-filter');
const energyGraph = document.getElementById('energyGraph');
const goalGraph = document.getElementById('goalGraph');
let dailyGoal = 0;
let monthlyGoal = 0;

// Chart.js setup
let energyChart, goalChart;

// Load the data from localStorage and display it
function loadData() {
    const data = JSON.parse(localStorage.getItem('energyLog')) || [];
    let total = 0;
    let labels = [];
    let energyData = [];

    energyTable.innerHTML = ''; // Clear existing table rows

    data.forEach((entry, index) => {
        const row = energyTable.insertRow();
        const dateCell = row.insertCell(0);
        const energyCell = row.insertCell(1);
        const actionsCell = row.insertCell(2);

        dateCell.textContent = entry.date;
        energyCell.textContent = entry.energy + ' kWh';

        // Edit and Delete Buttons
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => editEntry(index);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteEntry(index);

        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);

        total += parseFloat(entry.energy);
        labels.push(entry.date);
        energyData.push(entry.energy);
    });

    // Calculate total and average consumption
    const avg = data.length > 0 ? total / data.length : 0;
    totalConsumption.textContent = total.toFixed(2);
    avgConsumption.textContent = avg.toFixed(2);

    updateProgress();

    // Update graphs
    updateEnergyGraph(labels, energyData);
    updateGoalGraph();
}

// Handle form submission
energyForm.addEventListener('submit', function(event) {
    event.preventDefault();
    
    const date = document.getElementById('date').value;
    const energy = document.getElementById('energy').value;

    if (!date || !energy) return;

    const data = JSON.parse(localStorage.getItem('energyLog')) || [];
    data.push({ date: formatDate(date), energy });
    localStorage.setItem('energyLog', JSON.stringify(data));

    loadData();
    energyForm.reset();
});

// Set energy goals
setGoalsButton.addEventListener('click', function() {
    dailyGoal = parseFloat(dailyGoalInput.value) || 0;
    monthlyGoal = parseFloat(monthlyGoalInput.value) || 0;

    dailyGoalValue.textContent = dailyGoal;
    monthlyGoalValue.textContent = monthlyGoal;

    localStorage.setItem('dailyGoal', dailyGoal);
    localStorage.setItem('monthlyGoal', monthlyGoal);

    updateProgress();
    updateGoalGraph();
});

// Update goal progress
function updateProgress() {
    const data = JSON.parse(localStorage.getItem('energyLog')) || [];
    let dailyTotal = 0;
    let monthlyTotal = 0;
    const currentDate = new Date();

    data.forEach(entry => {
        const entryDate = new Date(entry.date);
        const diffDays = Math.floor((currentDate - entryDate) / (1000 * 3600 * 24));

        if (diffDays === 0) {
            dailyTotal += parseFloat(entry.energy);
        }

        if (entryDate.getMonth() === currentDate.getMonth() && entryDate.getFullYear() === currentDate.getFullYear()) {
            monthlyTotal += parseFloat(entry.energy);
        }
    });

    dailyProgress.textContent = dailyTotal.toFixed(2);
    monthlyProgress.textContent = monthlyTotal.toFixed(2);
}

// Update energy consumption graph
function updateEnergyGraph(labels, data) {
    if (energyChart) energyChart.destroy();

    energyChart = new Chart(energyGraph, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Energy Consumption (kWh)',
                data: data,
                borderColor: '#3498db',
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Energy Consumption (kWh)'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// Update goal progress graph
function updateGoalGraph() {
    if (goalChart) goalChart.destroy();

    goalChart = new Chart(goalGraph, {
        type: 'bar',
        data: {
            labels: ['Daily Progress', 'Monthly Progress'],
            datasets: [{
                label: 'Progress vs Goal',
                data: [dailyProgress.textContent, monthlyProgress.textContent],
                backgroundColor: ['#3498db', '#2ecc71'],
                borderColor: ['#2980b9', '#27ae60'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Handle time filter change
timeFilter.addEventListener('change', function() {
    filterData(timeFilter.value);
});

// Filter data based on time selection
function filterData(period) {
    const data = JSON.parse(localStorage.getItem('energyLog')) || [];
    const currentDate = new Date();
    let filteredData = [];

    data.forEach(entry => {
        const entryDate = new Date(entry.date);
        if (period === 'daily' && entryDate.toDateString() === currentDate.toDateString()) {
            filteredData.push(entry);
        } else if (period === 'weekly' && isSameWeek(entryDate, currentDate)) {
            filteredData.push(entry);
        } else if (period === 'monthly' && entryDate.getMonth() === currentDate.getMonth()) {
            filteredData.push(entry);
        }
    });

    loadFilteredData(filteredData);
}

// Check if two dates are in the same week
function isSameWeek(date1, date2) {
    const startOfWeek = date2.getDate() - date2.getDay();
    const endOfWeek = startOfWeek + 6;
    const startOfWeekDate = new Date(date2.setDate(startOfWeek));
    const endOfWeekDate = new Date(date2.setDate(endOfWeek));

    return date1 >= startOfWeekDate && date1 <= endOfWeekDate;
}

// Display filtered data
function loadFilteredData(filteredData) {
    energyTable.innerHTML = '';
    let total = 0;
    filteredData.forEach(entry => {
        const row = energyTable.insertRow();
        const dateCell = row.insertCell(0);
        const energyCell = row.insertCell(1);
        const actionsCell = row.insertCell(2);

        dateCell.textContent = entry.date;
        energyCell.textContent = entry.energy + ' kWh';

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => editEntry(entry);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteEntry(entry);

        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);

        total += parseFloat(entry.energy);
    });

    totalConsumption.textContent = total.toFixed(2);
    avgConsumption.textContent = (total / filteredData.length).toFixed(2);
}

// Edit entry
function editEntry(index) {
    const data = JSON.parse(localStorage.getItem('energyLog')) || [];
    const entry = data[index];

    document.getElementById('date').value = entry.date;
    document.getElementById('energy').value = entry.energy;

    editingIndex = index;
}

// Delete entry
function deleteEntry(index) {
    const data = JSON.parse(localStorage.getItem('energyLog')) || [];
    data.splice(index, 1);
    localStorage.setItem('energyLog', JSON.stringify(data));

    loadData();
}

// Initialize app
loadData();
