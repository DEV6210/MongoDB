import React from 'react'

export const signup = () => {
    const appConfig = {
        id: process.env.REACT_APP_REALM_APPLICATION_ID,
        baseUrl: 'https://realm.mongodb.com'
    };

    const app = new Realm.App(appConfig);

    // signup
    async function registerUser(email, password) {

        try {
            await app.emailPasswordAuth.registerUser({ email, password });
            console.log("User registered successfully.");
        } catch (error) {
            console.error("Error registering user:", error);
        }

    }
    registerUser('newuser@example.com', '000000');
    return (
        <div>signup</div>
    )
}
