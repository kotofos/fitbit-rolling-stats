async function fetchActiveZoneMinutes(token) {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(new Date().setDate(new Date().getDate() - 20)).toISOString().split('T')[0];

    const response = await fetch(`https://api.fitbit.com/1/user/-/activities/minutesFairlyActive/date/${startDate}/${endDate}.json`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch data');
    }

    const data = await response.json();
    return data['activities-minutesFairlyActive'];
}

function calculateRollingAverages(data, windowSize = 7) {
    const activeMinutes = data.map(day => parseInt(day.value));
    const rollingAverages = activeMinutes.map((_, idx, arr) => {
        const slice = arr.slice(Math.max(0, idx - windowSize + 1), idx + 1);
        return slice.reduce((acc, val) => acc + val, 0) / slice.length;
    });

    return rollingAverages.slice(-7);
}

function renderChart(labels, dailyData, rollingData) {
    const ctx = document.getElementById('activeZoneMinutesChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Daily Active Zone Minutes',
                    data: dailyData,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    fill: false,
                    pointRadius: 5,
                    pointBackgroundColor: 'rgba(75, 192, 192, 1)'
                },
                {
                    label: 'Rolling Average of Active Zone Minutes',
                    data: rollingData,
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1,
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function displayCurrentDayAvg(currentDayAvg) {
    const avgElement = document.getElementById('current-day-avg');
    avgElement.textContent = `Current Day's Average Active Zone Minutes: ${currentDayAvg}`;
}
