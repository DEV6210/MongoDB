import React from 'react'

export const fetchData = () => {
    const appConfig = {
        id: process.env.REACT_APP_REALM_APPLICATION_ID,
        baseUrl: 'https://realm.mongodb.com'
    };

    const app = new Realm.App(appConfig);
    // fetch data from db
    const fetchdata = async () => {
        try {
            const user = app.currentUser
            // Access a synchronized collection
            const tasksCollection = user.mongoClient("mongodb-atlas").db("theclinkapp").collection("users");

            // Query or manipulate data in the collection
            const tasks = await tasksCollection.findOne({ email: user.profile.email });
            console.log("Uncompleted tasks:", tasks);

        } catch (error) {
            console.log('error', error)
        }
    }
    fetchdata()
    return (
        <div>fetchData</div>
    )
}
