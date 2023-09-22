/*
  This function will run after a user is created and is called with an object representing that user.

  This function runs as a System user and has full access to Services, Functions, and MongoDB Data.

  Example below:

  exports = (user) => {
    // use collection that Custom User Data is configured on
    const collection = context.services.get("<SERVICE_NAME>").db("<DB_NAME>").collection("<COLL_NAME>");

    // insert custom data into collection, using the user id field that Custom User Data is configured on
    const doc = collection.insertOne({ <USER_ID_FIELD>: user.id, name: user.data.name });
  };
*/

exports = async(user) => {
    try{
      // use collection that Custom User Data is configured on
      const dbServices=context.values.get('database').dbServices;
      const dbName=context.values.get('database').dbName;
      const students = context.services.get(dbServices).db(dbName).collection("students");
      const customdata = context.services.get(dbServices).db(dbName).collection("customdata");
      
      const data=await students.findOne();
    

      // // insert custom data into collection, using the user id field that Custom User Data is configured on
      const doc = customdata.insertOne({
        _id: new BSON.ObjectId(user.id),
        mongoUserId: user.id,
        fullName: data.fullName,
      });
      
      console.log(doc)
    }catch(error){
      console.log('function',error)
    }
};
