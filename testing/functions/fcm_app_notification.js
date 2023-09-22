exports = async function (deviceToken, msg) {

    const { google } = require("googleapis")

    const MESSAGING_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
    const SCOPES = [MESSAGING_SCOPE];

    // Read the service account JSON file
    const getAccessToken = async () => {
        const key = context.values.get("fcmServerKey");

        const jwtClient = new google.auth.JWT(
            key.client_email,
            null,
            key.private_key,
            SCOPES,
            null
        );
        return new Promise((resolve, reject) => {
            jwtClient.authorize((err, tokens) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(tokens.access_token);
            });
        });
    }

    // FCM HTTP v1 API endpoint
    const fcmEndpoint = "https://fcm.googleapis.com/v1/projects/theclink-6c9b5/messages:send";

    try {
        // Your FCM server key
        const serverKey = 'Bearer ' + await getAccessToken();
        const message = {
            message: {
                data: msg,
                token: deviceToken,
            },
        };


        context.http.post({
            url: "https://fcm.googleapis.com/v1/projects/theclink-6c9b5/messages:send",
            headers: {
                "Content-Type": ["application/json"],
                "Authorization": [serverKey],
            },
            body: JSON.stringify(message),
        })
    } catch (error) {
        console.log(error)
    }
};