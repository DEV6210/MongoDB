exports = async function(changeEvent){
  try {
        const Student = context.services.get("mongodb-atlas").db("theclinkapp").collection("students");
        const ChatGroups = context.services.get("mongodb-atlas").db("theclinkapp").collection("chat_groups");
        const ChatRooms = context.services.get("mongodb-atlas").db("theclinkapp").collection("chat_rooms");

        const { fullDocument, documentKey } = changeEvent;

        // verify students in student connection
        await Student.updateOne({ mobile: fullDocument.mobile }, { $set: { status: fullDocument.status } });
        console.log('User status verified from student collection')

        // add to the chat group
        const userDetails = {
            mongoUserId: fullDocument.mongoUserId,
            userName: fullDocument.fullName,
            memberType: "justMember",
            requestType: "accepted",
            timeStamp: new Date(),
            accessType: "readWrite"
        }
        const condition = {
            collegeCode: fullDocument.collegeCode,
            courseCode: fullDocument.courseCode,
            batchCode: fullDocument.yoj,
            section: fullDocument.section
        }

        const chatGroup = await ChatGroups.findOne(condition)
        if (chatGroup) {
            // Filter group members by using mongoUserId
            const filteredMembers = chatGroup.groupMembers.filter(member => member.mongoUserId === userDetails.mongoUserId);

            // If the filteredMembers array is not empty, it means the user already exists in the group
            if (filteredMembers.length > 0) {
                console.log("User already exists in the group.");
            } else {
                const groupDetails = {
                    _id: new BSON.ObjectId().toString(),
                    myConvoId: fullDocument.mongoUserId,
                    requestBy: chatGroup.creatorId,
                    myId: "",
                    friendId: "",
                    request: "accepted",
                    groupId: chatGroup._id.toString(),
                    groupImage: chatGroup.groupImage,
                    groupName: chatGroup.groupName,
                    type: "groupChat",
                    groupType: "classroom",
                    subtype: "classroom",
                    lastMessage: null,
                    groupAdmin: null,
                    lastSender: null,
                    friendConvoId: "",
                    dateStarted: new Date(),
                    timeStamp: new Date(),
                    semester: chatGroup.semester,
                    collegeCode: chatGroup.collegeCode,
                    courseCode: chatGroup.courseCode,
                    batchCode: chatGroup.batchCode,
                    addedBy: chatGroup.addedBy
                }

                //push member data
                await ChatGroups.updateOne(condition, {
                    $push: { groupMembers: userDetails }
                });
                // push group data
                await ChatRooms.updateOne({ mongoUserId: userDetails.mongoUserId }, {
                    $push: { listRooms: groupDetails }
                });
                console.log("User added to the group.");
            }
        }

    } catch (error) {
        console.log('error from insert user', error)
    }
};