const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function debugConnection() {
    console.log('🔍 Starting Debugger...');

    // 1. Read Config
    const configPath = path.join(__dirname, 'src/config/config.json');
    if (!fs.existsSync(configPath)) {
        console.error('❌ Config file not found at:', configPath);
        return;
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('✅ Config loaded.');
    console.log(`   - API URL: ${config.apiUrl}`);
    console.log(`   - Token: ${config.token ? config.token.substring(0, 10) + '...' : 'MISSING'}`);

    if (!config.token) {
        console.error('❌ No token found in config.json. Please update it.');
        return;
    }

    // 2. Test Connection & Token
    console.log('\n📡 Testing API Connection...');

    try {
        const response = await axios.get(`${config.apiUrl}/sessions/active`, {
            headers: { 'Authorization': `Bearer ${config.token}` }
        });

        console.log('✅ Connection Successful! (200 OK)');
        if (response.data.session) {
            console.log('✅ Active Session Found:', response.data.session.id);
        } else {
            console.log('⚠️ No active session found (Connection is good, but no session is running).');
        }

    } catch (error) {
        if (error.response) {
            console.error(`❌ API Error: ${error.response.status} ${error.response.statusText}`);
            if (error.response.status === 401) {
                console.error('   👉 YOUR TOKEN IS INVALID OR EXPIRED.');
                console.error('   👉 Action: Go to Web App -> Profile -> Copy Access Token -> Update Desktop App.');
            }
        } else {
            console.error('❌ Network Error:', error.message);
        }
    }

    // 3. Test Session Start (Auto-Start)
    if (!config.token) return;

    console.log('\n🚀 Testing Session Auto-Start...');
    try {
        const startResponse = await axios.post(`${config.apiUrl}/sessions/start`, {}, {
            headers: { 'Authorization': `Bearer ${config.token}` }
        });
        console.log('✅ Session Start Request: Success', startResponse.status);
        console.log('   New Session ID:', startResponse.data.session ? startResponse.data.session.id : 'Unknown');

    } catch (error) {
        if (error.response) {
            console.error(`❌ Session Start Failed: ${error.response.status} ${error.response.statusText}`);
            console.error('   Response Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('❌ Session Start Failed (Network):', error.message);
        }
    }
}

debugConnection();
