// This function is the endpoint's request handler.
exports = async function({ query, headers, body}, response) {
  
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
        const serverKey ='Bearer ' + await getAccessToken();
        const message = {
            message: {
                notification: {
                  title: 'FCM Test Api VS1 With Realm',
                 body: 'This is an Your notification Message',
                },
                token: "eesDLbyiSES9ng9d-ZOvBl:APA91bEPiSA4PqTUIQMh1hfzbaoppKe4UFVz0lKTXQBCvcFhaxbr-hYHv1pVCU9_U_VnKAOXiATMIf0kK9p971O56Fyim3pEfh7z-8-TZLs40Upl23dGlGHs5r18zuY1v0A_wY2i9ytI",
            },
        };

    
      const result=await context.http.post({
        url: "https://fcm.googleapis.com/v1/projects/theclink-6c9b5/messages:send",
        headers: {
            "Content-Type": ["application/json"],
            "Authorization": [serverKey],
        },
        body: JSON.stringify(messagasde),
      })
      console.log(JSON.stringify(result))

    } catch (error) {
        console.log(error)
    }
};
