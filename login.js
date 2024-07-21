const CLIENT_ID = '';
const REDIRECT_URI = 'https://';

document.getElementById('login-button').addEventListener('click', () => {
    const authUrl = `https://www.fitbit.com/oauth2/authorize?response_type=token&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=activity&expires_in=604800`;
    window.location.href = authUrl;
});

document.getElementById('logout-button').addEventListener('click', () => {
    localStorage.removeItem('fitbit_token');
    localStorage.removeItem('fitbit_token_expiry');
    window.location.reload();
});

function getHashParams() {
    const hashParams = {};
    let e,
        a = /\+/g,  // Regex for replacing addition symbol with a space
        r = /([^&;=]+)=?([^&;]*)/g,
        d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
        q = window.location.hash.substring(1);

    while (e = r.exec(q))
       hashParams[d(e[1])] = d(e[2]);

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
        // Clear the hash to remove the token from the URL
        window.location.hash = '';
    }

    const token = loadToken();

    if (token) {
        document.getElementById('login-button').style.display = 'none';
        document.getElementById('logout-button').style.display = 'block';
        document.getElementById('content').style.display = 'block';

        try {
            const data = await fetchActiveZoneMinutes(token);
            console.log('Data fetched:', data);

            if (data && data.length > 0) {
                console.log('Rendering chart...');
                renderChart(data);
                console.log('Displaying stats...');
            } else {
                console.error('No data available or data is empty');
                document.getElementById('content').innerHTML = '<p>No data available. Please make sure you have Active Zone Minutes data in your Fitbit account.</p>';
            }
        } catch (error) {
            console.error('Error fetching or processing data:', error);
            document.getElementById('content').innerHTML = '<p>Error fetching or processing data. Please try logging in again.</p>';
        }
    } else {
        document.getElementById('login-button').style.display = 'block';
        document.getElementById('logout-button').style.display = 'none';
        document.getElementById('content').style.display = 'none';
    }
});
