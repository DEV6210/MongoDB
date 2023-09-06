// To update the email addresses of all documents in your MongoDB collection by appending "@gmail.com" to the existing names and fetch all names, you can use the MongoDB shell commands. Here's how you can achieve this:

// Note: Be cautious when updating data in a production environment. Make sure you have proper backups and understand the implications of the changes.

// Open the MongoDB shell or MongoDB Compass.

// Execute the following commands:

// Find all documents in your collection
var cursor = db.your_collection_name.find();

// Iterate through each document and update the email
cursor.forEach(function(doc) {
  var updatedEmail = doc.name + "@gmail.com";
  
  // Update the document with the new email
  db.your_collection_name.updateOne(
    { "_id": doc._id },
    { $set: { "email": updatedEmail } }
  );
  
  print("Updated email for " + doc.name + " to " + updatedEmail);
});

// Fetch all names after the update
var updatedNames = db.your_collection_name.find({}, { "_id": 0, "name": 1 });

// Display the updated names
updatedNames.forEach(function(doc) {
  print("Name: " + doc.name);
});
