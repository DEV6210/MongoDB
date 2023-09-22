exports = async function(changeEvent){
    try {

        const UserInfo = context.services.get("mongodb-atlas").db("theclinkapp").collection("userinfos");

        const { documentKey, updateDescription } = changeEvent;

        const updatedDocument = await UserInfo.findOne({ _id: documentKey._id });
        // console.log('Updated document:', updatedDocument.mongoUserId);
        // console.log(changeEvent)

        if (updatedDocument.blockedList && updatedDocument.blockedList.length > 0) {
            if (Object.keys(updateDescription.updatedFields)[0].split(".")[0] === 'blockedList') {

                var blockedList_index = '';

                const updatedFields = updateDescription.updatedFields;

                if (updatedFields && updatedFields.blockedList) {
                    blockedList_index = `blockList.${0}`
                } else {
                    blockedList_index = Object.keys(updatedFields)[0]
                }
                const fieldPath = blockedList_index; // The string to destructure
                const index = parseInt(fieldPath.split('.')[1]); // Extract the index value
                // console.log(index)

                const data = await UserInfo.findOne({ _id: documentKey._id })
                // console.log(data.blockedList[index].mongoUserId)

                if (data.blockedList[index].blockFlag === 'blocked') {
                    // Find data from blockByList
                    const data2 = await UserInfo.findOne({ mongoUserId: data.blockedList[index].mongoUserId });
                    // console.log(data2.blockByList);

                    if (data2.blockByList) {
                        // console.log(data2.blockByList)

                        const blockId = data2.blockByList.find(block => block === data.mongoUserId);
                        // console.log(blockId);

                        if (data2.blockByList.length > 0 && blockId === data.mongoUserId) {
                            console.log('matched not allow')
                        } else {
                            // push data to the friends document
                            await UserInfo.updateOne({ mongoUserId: data.blockedList[index].mongoUserId }, {
                                $push: { blockByList: { $each: [data.mongoUserId] } }
                            })
                            console.log('block--->>>>>')
                        }
                    } else {
                        // push data to the friends document
                        await UserInfo.updateOne({ mongoUserId: data.blockedList[index].mongoUserId }, {
                            $push: { blockByList: { $each: [data.mongoUserId] } }
                        })
                        console.log('block--->>>>>first')
                    }

                } else if (data.blockedList[index].blockFlag === 'unblocked') {
                    const unblockdata = await UserInfo.findOne({ mongoUserId: data.blockedList[index].mongoUserId });

                    const unblockId = unblockdata.blockByList.includes(data.mongoUserId);
                    if (unblockId) {
                        await UserInfo.updateOne(
                            { mongoUserId: unblockdata.mongoUserId },
                            { $pull: { blockByList: data.mongoUserId } }
                        );
                        console.log('unblock---<<<')
                    }
                }
            }
        }

        if (updateDescription.truncatedArrays.length > 0) {
            console.log('remove-->', updateDescription.truncatedArrays)
        } else {
            // pending
            VisitCount(updatedDocument, changeEvent);
            visitNotification(updatedDocument, changeEvent, UserInfo);
        }

    } catch (error) {
        console.log('error occure from user block/Unblock update time', error)
    }
}



const visitNotification = async (updatedDocument, changeEvent) => {
    const data = changeEvent.updateDescription.updatedFields
    if (Object.keys(data).find(value => value === 'listVisitor')) {

        const visitor = updatedDocument.listVisitor
        console.log('+++XXX')

        visitNotify(updatedDocument, changeEvent, visitor)

    } else if (Object.keys(data)[0].split('.')[0] === 'listVisitor') {
        console.log('---XXX')

        const index = Object.keys(data)[0].split('.')[1]
        const visitor = updatedDocument.listVisitor[index]
        visitNotify(updatedDocument, changeEvent, visitor)
    }
}



const pushNotification_FCM = async (deviceToken, NotificationData) => {
    // console.log(deviceToken, NotificationData)
    const message = {
        "to": `${deviceToken}`,
        // "notification": {
        //     "title": `${NotificationData.type}`,
        //     "body": `${NotificationData.subType}`,
        //     "type": "BIGPIC",
        // },
        "data": {
            "_id": new BSON.ObjectId().toString(),
            "type": 'profile',
            "subType": NotificationData.subType,
            "timeStamp": NotificationData.timeStamp,
            "showType": NotificationData.showType,
            "readFlag": NotificationData.readFlag,
            "readStamp": '',
            "count": NotificationData.count,
            "mongoUserId": NotificationData.mongoUserId,
            "userName": NotificationData.userName,
            "userImage": NotificationData.userImage
        }
    };
    return context.http.post({
        url: "https://fcm.googleapis.com/fcm/send",
        headers: {
            "Content-Type": ["application/json"],
            "Authorization": ["key=AAAA3EFzA5Y:APA91bGS4IfvQjJDkktNOAzAAGx0hxOZFlWlVa-EPg9bBXW0_k2zToBmDYrefuzNtLNF5O-RAabWwZ_a5NOaHHCmScOhVqSB4VcvYzdPVI_gOtTRrMG-u71pRn_dVXHzPiebVCKJVQkL"],
        },
        body: JSON.stringify(message),
    })
    console.log('successfully send fcm')
}





const visitNotify = async (updatedDocument, changeEvent, visitor) => {
    const UserInfo = context.services.get("mongodb-atlas").db("theclinkapp").collection("userinfos");

    let data = await UserInfo.findOne({ mongoUserId: updatedDocument.mongoUserId })

    const notification = {
        _id: new BSON.ObjectId().toString(),
        type: 'profile',
        subType: 'visitor',
        timeStamp: new Date(),
        showType:false,
        readFlag: false,
        readStamp: null,
        count: 1,
        mongoUserList: [
            {
                mongoUserId: visitor.mongoUserId,
                userName: visitor.userName,
                userImage: visitor.userImage
            }
        ],
    }

    if (data.notification) {
        const notificationx = data.notification;

        const filteredNotifications = notificationx.filter((notification) => {
            const { mongoUserList, subType } = notification;
            return (
                subType === 'visitor' &&
                mongoUserList.some((id) => visitor.mongoUserId === id.mongoUserId)
            )
        });
        const lastNotification = filteredNotifications[filteredNotifications.length - 1]
        if (lastNotification) {
            if (new Date() - new Date(lastNotification.timeStamp) > 1 * 5 * 1000) {

                pushNotification_FCM(data.tokenId, notification)
                //push notification
                await UserInfo.updateOne({ mongoUserId: updatedDocument.mongoUserId }, {
                    $push: { notification }
                })
                console.log('visitor notification created 1')
            } else {
                console.log('not meet the time')
            }
        } else {
            pushNotification_FCM(data.tokenId, notification)
            //push notification
            await UserInfo.updateOne({ mongoUserId: updatedDocument.mongoUserId }, {
                $push: { notification }
            })
            console.log(1, 'empty array->x ')
            console.log('visitor notification created 2')
        }
    } else {
        pushNotification_FCM(data.tokenId, notification)
        //push notification
        await UserInfo.updateOne({ mongoUserId: updatedDocument.mongoUserId }, {
            $push: { notification }
        })
        console.log('visitor notification created 0')
    }
}


const VisitCount = async (updatedDocument, changeEvent) => {
    try {
        const UserInfo = context.services.get("mongodb-atlas").db("theclinkapp").collection("userinfos");

        const updatedFields = changeEvent.updateDescription.updatedFields
        if (Object.keys(updatedFields).length > 1) {
            if (Object.keys(updatedFields)[0].split(".")[0] === "listVisitor") {
                const sum = updatedDocument.listVisitor.reduce((accumulator, visitor) => {
                    if (visitor.visitCount) {
                        return accumulator + visitor.visitCount;
                    }
                    return accumulator;
                }, 0);

                // console.log("Sum of visitCount:",sum);
                await UserInfo.updateOne({ mongoUserId: updatedDocument.mongoUserId }, {
                    $set: { visitCount: sum }
                })

            }
        }
    } catch (error) {
        console.log('error occure from visit count', error)
    }
}