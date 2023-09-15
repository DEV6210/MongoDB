import React from 'react'
import * as Realm from "realm-web";

export const login = () => {
    // Add your App ID
    const appConfig = {
        id: process.env.REACT_APP_REALM_APPLICATION_ID,
        baseUrl: 'https://realm.mongodb.com'
    };

    const app = new Realm.App(appConfig);
    // login
    async function loginUser(email, password) {
        try {
            const credentials = Realm.Credentials.emailPassword(email, password);
            const user = await app.logIn(credentials);
            console.log("Successfully logged in:", user);
            return user;
        } catch (error) {
            console.error("Error logging in:", error);
        }
    }
    loginUser('priya@gmail.com', '000000')
    
    return (
        <div>login</div>
    )
}
