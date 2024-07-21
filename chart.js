const targetMinutes = 150

async function fetchActiveZoneMinutes(token) {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(new Date().setDate(new Date().getDate() - 13)).toISOString().split('T')[0];

    const response = await fetch(`https://api.fitbit.com/1/user/-/activities/active-zone-minutes/date/${startDate}/${endDate}.json`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch data');
    }

    const data = await response.json();
    console.log('Fetched data:', data['activities-active-zone-minutes']);
    return data['activities-active-zone-minutes'];
}

function convertToActiveZoneMinutes(entries) {
    const activeZoneMinutes = [];
    const datesArray = [];

    const dates = entries.map(entry => entry.dateTime);
    const startDate = new Date(dates[0]);
    const endDate = new Date(dates[dates.length - 1]);

    // Create a map for easy lookup
    const dateMap = new Map(entries.map(entry => [entry.dateTime, entry.value.activeZoneMinutes]));

    // Iterate by day and try to find it in input data
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]; // Convert date to 'YYYY-MM-DD' format
        datesArray.push(dateStr);
        activeZoneMinutes.push(dateMap.get(dateStr) || 0);
    }

    return [activeZoneMinutes, datesArray];
}

function calculateCumulativeSum(data) {
    const result = [];
    for (let i = 6; i < data.length; i++) {
        let sum = 0;
        for (let j = i; j > i - 7; j--) {
            sum += data[j];
        }
        result.push(sum);
    }
    return result;
}

function renderChart(data) {
    console.log('Rendering chart with data:', data);
    const ctx = document.getElementById('activeZoneMinutesChart').getContext('2d');
    var [dailyData, dates] = convertToActiveZoneMinutes(data);
    console.log('daily data', dailyData)
    var cumulativeSum = calculateCumulativeSum(dailyData);

    // only 7 days
    labels=dates.slice(-7)
    cumulativeSum=cumulativeSum.slice(-7)
    dailyData=dailyData.slice(-7)

    const todayCumulative = cumulativeSum[cumulativeSum.length-1]
    const todayMinutes = dailyData[dailyData.length - 1]
    const oldestDayMinutes = dailyData[0]
    const todayLeft = targetMinutes - (todayCumulative - todayMinutes - oldestDayMinutes) //150-(108-4-4)
    displayCurrentStats(todayMinutes, todayCumulative, todayLeft)

    console.log('Cumulative sum:', cumulativeSum);
    console.log('Labels:', labels);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Daily Active Zone Minutes',
                    data: dailyData,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    yAxisID: 'y-axis-1'
                },
                {
                    label: 'Cumulative Sum',
                    data: cumulativeSum,
                    type: 'line',
                    fill: false,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    pointRadius: 3,
                    yAxisID: 'y-axis-2'
                },
                {
                    label: `Weekly Target (${targetMinutes} minutes)`,
                    data: new Array(7).fill(targetMinutes),
                    type: 'line',
                    fill: false,
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    yAxisID: 'y-axis-2'
                }
            ]
        },
        options: {
            scales: {
                'y-axis-1': {
                    type: 'linear',
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Daily Minutes'
                    },
                    beginAtZero: true
                },
                'y-axis-2': {
                    type: 'linear',
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Cumulative Sum'
                    },
                    beginAtZero: true,
                    max: 500  // Set this to slightly above your weekly target
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(0);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
    console.log('Chart rendered');
}

function displayCurrentStats(currentDayValue, currentWeekSum, todayLeft) {
    const statsElement = document.getElementById('current-day-avg');
    statsElement.innerHTML = `Today's Active Zone Minutes: ${currentDayValue}<br>
                              Last 7 Days Total: ${currentWeekSum} <br>
                              Today Left: ${todayLeft}`;
}
