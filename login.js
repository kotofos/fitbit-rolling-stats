const CLIENT_ID = '';
const REDIRECT_URI = '';

document.getElementById('login-button').addEventListener('click', () => {
    const authUrl = `https://www.fitbit.com/oauth2/authorize?response_type=token&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=activity&expires_in=604800`;
    window.location.href = authUrl;
});

function getHashParams() {
    const hashParams = {};
    let e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while (e = r.exec(q)) {
        hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
}

function saveToken(token, expiresIn) {
    const expiryTime = new Date().getTime() + expiresIn * 1000;
    localStorage.setItem('fitbit_token', token);
    localStorage.setItem('fitbit_token_expiry', expiryTime);
}

function loadToken() {
    const token = localStorage.getItem('fitbit_token');
    const expiryTime = localStorage.getItem('fitbit_token_expiry');
    if (token && expiryTime && new Date().getTime() < expiryTime) {
        return token;
    } else {
        localStorage.removeItem('fitbit_token');
        localStorage.removeItem('fitbit_token_expiry');
        return null;
    }
}

window.addEventListener('load', async () => {
    const params = getHashParams();

    if (params.access_token) {
        saveToken(params.access_token, params.expires_in);
    }

    const token = loadToken();

    if (token) {
        document.getElementById('login-button').style.display = 'none';
        document.getElementById('content').style.display = 'block';

        try {
            const data = await fetchActiveZoneMinutes(token);
            const dailyData = data.map(day => parseInt(day.value));
            const rollingAverages = calculateRollingAverages(data);
            const labels = data.slice(-7).map(day => day.dateTime);
            const currentDayAvg = dailyData[dailyData.length - 1];

            renderChart(labels, dailyData.slice(-7), rollingAverages);
            displayCurrentDayAvg(rollingAverages[rollingAverages.length - 1]);
        } catch (error) {
            console.error('Error fetching or processing data:', error);
        }
    } else {
        document.getElementById('login-button').style.display = 'block';
        document.getElementById('content').style.display = 'none';
    }
});
