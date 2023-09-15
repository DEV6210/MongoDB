import React from 'react'

export const logout = () => {
    const appConfig = {
        id: process.env.REACT_APP_REALM_APPLICATION_ID,
        baseUrl: 'https://realm.mongodb.com'
    };

    const app = new Realm.App(appConfig);
    // logout
    async function logoutUser() {
        try {
            await app.currentUser?.logOut();
            console.log("Successfully logged out.");
        } catch (error) {
            console.error("Error logging out:", error);
        }
    }
    logoutUser()
    return (
        <div>logout</div>
    )
}
