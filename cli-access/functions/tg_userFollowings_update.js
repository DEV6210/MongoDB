exports = async (changeEvent) => {
    try {
        const dbServices = context.values.get('database').dbServices;
        const dbName = context.values.get('database').dbName;

        const UserFollowings = context.services.get(dbServices).db(dbName).collection("user_followings");

        const { updateDescription, documentKey } = changeEvent;

        const updatedDocument = await UserFollowings.findOne({ _id: documentKey._id })

        //***___following --- OR --- unfollowed --- OR --- requested ___***
        if (updatedDocument.listFollowings && updatedDocument.listFollowings.length > 0) {
            if (Object.keys(updateDescription.updatedFields)[0] === 'listFollowings' || Object.keys(updateDescription.updatedFields)[0].split(".")[0] === 'listFollowings') {

                // find my following
                const documentData = await UserFollowings.findOne({ _id: documentKey._id })

                const updatedField = Object.keys(updateDescription.updatedFields)[0];
                const indexKey = parseInt(updatedField.split('.')[1])
                const followingObject = documentData.listFollowings[indexKey]

                var followingData = followingObject

                if (followingObject === undefined) {
                    documentData.listFollowings.forEach(async (value, index) => {
                        followingData = value
                    })
                }
                // console.log(followingData)

                // find friend follower list 
                const followerData = await UserFollowings.findOne({ mongoUserId: followingData.mongoUserId })
                if (followerData.listFollowers) {
                    const follower = followerData.listFollowers.find(follower => follower.mongoUserId === documentData.mongoUserId);
                    // console.log(follower)

                    if (follower === undefined || follower === null) {
                        // follow friend                       
                        await UserFollowings.updateOne({ mongoUserId: followerData.mongoUserId }, {
                            $push: {
                                listFollowers: {
                                    mongoUserId: documentData.mongoUserId,
                                    followingFlag: followingData.followingFlag,
                                    timeStamp: new Date(),
                                }
                            }
                        })
                        console.log('Push New')
                        IncreaseFollowing(documentData, followerData, followingData.followingFlag)


                    } else {
                        // following and unfollow friend update
                        await UserFollowings.updateOne(
                            { mongoUserId: followingData.mongoUserId, "listFollowers.mongoUserId": documentData.mongoUserId },
                            {
                                $set: {
                                    // "listFollowers.$.mongoUserId": documentData.mongoUserId,
                                    "listFollowers.$.followingFlag": followingData.followingFlag,
                                    "listFollowers.$.timeStamp": new Date(),
                                }
                            }
                        );
                        console.log('updated flag-->:', followingData.followingFlag, follower.followingFlag)

                        if (followingData.followingFlag === 'unfollowed' && follower.followingFlag === 'following' ||
                            followingData.followingFlag === 'following' && follower.followingFlag === 'unfollowed' ||
                            followingData.followingFlag === 'requested' && follower.followingFlag === 'unfollowed'
                        ) {
                            IncreaseFollowing(documentData, followerData, followingData.followingFlag);

                        } else if (followingData.followingFlag === 'unfollowed' && follower.followingFlag === 'requested') {
                            // (follower.mongoUserId, followingData.followingFlag);
                            decreaseFollowRequests(followingData.mongoUserId, followingData.followingFlag);
                        }
                    }
                } else {
                    await UserFollowings.updateOne({ mongoUserId: followerData.mongoUserId }, {
                        $push: {
                            listFollowers: {
                                mongoUserId: documentData.mongoUserId,
                                followingFlag: followingData.followingFlag,
                                timeStamp: new Date(),
                            }
                        }
                    });
                    console.log('Push New');
                    IncreaseFollowing(documentData, followerData, followingData.followingFlag);
                }
            }
        }

        if (updatedDocument.listFollowers && updatedDocument.listFollowers.length > 0) {
            if (Object.keys(updateDescription.updatedFields)[0] === 'listFollowers' ||
                Object.keys(updateDescription.updatedFields)[0].split(".")[0] === 'listFollowers') {

                const documentData2 = await UserFollowings.findOne({ _id: documentKey._id });
                // console.log(documentData2)

                const updatedField2 = Object.keys(updateDescription.updatedFields)[0];
                const indexKey2 = parseInt(updatedField2.split('.')[1]);
                const followersObject2 = documentData2.listFollowers[indexKey2];

                var followersData = followersObject2;

                if (followersObject2 === undefined) {
                    documentData2.listFollowers.forEach(async (value, index) => {
                        followersData = value;
                    });
                }
                const followingdata = await UserFollowings.findOne({ mongoUserId: followersData.mongoUserId });
                const following = followingdata.listFollowings.find(following => following.mongoUserId === documentData2.mongoUserId);

                // console.log('find--', followersData.mongoUserId)
                // console.log('change--', documentData2.mongoUserId)

                if (followersData.followingFlag === 'unfollowed' && following.followingFlag === 'following') {
                    await UserFollowings.updateOne(
                        { mongoUserId: followersData.mongoUserId, "listFollowings.mongoUserId": documentData2.mongoUserId },
                        {
                            $set: {
                                // "listFollowings.$.mongoUserId": followersData.mongoUserId,
                                "listFollowings.$.followingFlag": followersData.followingFlag,
                                "listFollowings.$.timeStamp": new Date(),
                            }
                        }
                    );
                    console.log('remove follower');
                    removeFollowers(documentData2.mongoUserId, followersData.mongoUserId);
                }

                if (followersData.followingFlag === 'following' && following.followingFlag === 'requested') {
                    await UserFollowings.updateOne(
                        { mongoUserId: followersData.mongoUserId, "listFollowings.mongoUserId": documentData2.mongoUserId },
                        {
                            $set: {
                                // "listFollowings.$.mongoUserId": followersData.mongoUserId,
                                "listFollowings.$.followingFlag": followersData.followingFlag,
                                "listFollowings.$.timeStamp": new Date(),
                            }
                        }
                    );

                    const dbServices = context.values.get('database').dbServices;
                    const dbName = context.values.get('database').dbName;
                    const UserInfo = context.services.get(dbServices).db(dbName).collection("userinfos");

                    await UserInfo.updateOne({ mongoUserId: followersData.mongoUserId }, { $inc: { allFollowings: 1, activeFollowings: 1 } });

                    await UserInfo.updateOne({ mongoUserId: documentData2.mongoUserId }, {
                        $inc: {
                            allFollowers: 1,
                            activeFollowers: 1,
                            followRequests: -1, // Decrease followRequests by 1
                        },
                    })

                    // decreaseFollowRequests(documentData2.mongoUserId, followersData.followingFlag);
                    followingNotification(documentData2, followersData, 'approved');

                }

                if (followersData.followingFlag === 'unfollowed' && following.followingFlag === 'requested') {
                    await UserFollowings.updateOne(
                        { mongoUserId: followersData.mongoUserId, "listFollowings.mongoUserId": documentData2.mongoUserId },
                        {
                            $set: {
                                // "listFollowings.$.mongoUserId": followersData.mongoUserId,
                                "listFollowings.$.followingFlag": followersData.followingFlag,
                                "listFollowings.$.timeStamp": new Date(),
                            }
                        }
                    );
                    console.log('remove request');
                    decreaseFollowRequests(documentData2.mongoUserId, followersData.followingFlag);
                }
            }
        }
    } catch (error) {
        console.log('error occured from followingunfollowing controller', error);
    }
};

// increase my following and friend follower
const IncreaseFollowing = async (mydata, frienddata, flag) => {
    const MyMongoUserId = mydata.mongoUserId
    const FriendMongoUserId = frienddata.mongoUserId
    // console.log(MyMongoUserId, FriendMongoUserId, flag)

    const dbServices = context.values.get('database').dbServices;
    const dbName = context.values.get('database').dbName;
    const UserInfo = context.services.get(dbServices).db(dbName).collection("userinfos");

    if (flag === 'following') {
        await UserInfo.updateOne({ mongoUserId: MyMongoUserId }, { $inc: { allFollowings: 1, activeFollowings: 1 } });

        await UserInfo.updateOne({ mongoUserId: FriendMongoUserId }, {
            $inc: { allFollowers: 1, activeFollowers: 1 }
        })
        followingNotification(mydata, frienddata, flag)

    } else if (flag === 'unfollowed') {
        await UserInfo.updateOne({ mongoUserId: MyMongoUserId, activeFollowings: { $gt: 0 } }, {
            $inc: { allUnFollowings: 1, activeFollowings: -1 }
        })

        await UserInfo.updateOne({ mongoUserId: FriendMongoUserId, activeFollowers: { $gt: 0 } }, {
            $inc: { allUnFollowers: 1, activeFollowers: -1 }
        })

    } else if (flag === 'requested') {
        // increase friend followRequests
        await UserInfo.updateOne({ mongoUserId: FriendMongoUserId }, {
            $inc: { followRequests: 1 }
        })
        followingNotification(mydata, frienddata, flag)
    }
}


const removeFollowers = async (FriendMongoUserId, MyMongoUserId) => {
    const dbServices = context.values.get('database').dbServices;
    const dbName = context.values.get('database').dbName;
    const UserInfo = context.services.get(dbServices).db(dbName).collection("userinfos");

    await UserInfo.updateOne({ mongoUserId: FriendMongoUserId, activeFollowers: { $gt: 0 } },
        { $inc: { allFollowings: 1, activeFollowers: -1 } });

    await UserInfo.updateOne({ mongoUserId: MyMongoUserId, activeFollowings: { $gt: 0 } }, {
        $inc: { allFollowers: 1, activeFollowings: -1 }
    })
}


// decrease friend followRequests
const decreaseFollowRequests = async (FriendMongoUserId, flag) => {

    const dbServices = context.values.get('database').dbServices;
    const dbName = context.values.get('database').dbName;
    const UserInfo = context.services.get(dbServices).db(dbName).collection("userinfos");

    await UserInfo.updateOne({ mongoUserId: FriendMongoUserId }, {
        $inc: { followRequests: -1 }
    })
    console.log(FriendMongoUserId, flag)
}

const followingNotification = async (mydata, frienddata, flag) => {
    // console.log(mydata, frienddata)

    const dbServices = context.values.get('database').dbServices;
    const dbName = context.values.get('database').dbName;

    const UserInfo = context.services.get(dbServices).db(dbName).collection("userinfos");
    const MyMongoUserId = mydata.mongoUserId;
    const FriendMongoUserId = frienddata.mongoUserId;

    const notification = {
        _id: new BSON.ObjectId().toString(),
        type: 'profile',
        subType: flag,
        showType: true,
        readFlag: false,
        readStamp: null,
        mongoUserId: mydata.mongoUserId,
        userName: mydata.userDetails.userName,
        userImage: mydata.userDetails.userImage,
        count: 1,
        timeStamp: new Date(),
        mongoUserList: [{
            mongoUserId: mydata.mongoUserId,
            userName: mydata.userDetails.userName,
            userImage: mydata.userDetails.userImage
        }]
    };


    const data = await UserInfo.findOne({ mongoUserId: FriendMongoUserId })

    if (data.notification) {
        const newData = data.notification.filter(item => item.subType === flag)
        const matchId = newData[newData.length - 1]

        if (matchId) {
            if (matchId && matchId.timeStamp) {
                // 10 * 60 * 1000 ( 10 minutes )
                if (new Date() - new Date(matchId.timeStamp) > 1 * 1 * 1000) {
                    console.log('time > 10min')
                    pushNotification_FCM(data.tokenId, notification)

                    await UserInfo.updateOne({ mongoUserId: FriendMongoUserId }, {
                        $push: { notification }
                    })
                } else {
                    console.log('time < 10min')
                    pushNotification_FCM(data.tokenId, notification)
                    await UserInfo.updateOne({ mongoUserId: FriendMongoUserId }, {
                        $push: { notification }
                    })
                }
            }
        } else {
            pushNotification_FCM(data.tokenId, notification)
            await UserInfo.updateOne({ mongoUserId: FriendMongoUserId }, {
                $push: { notification }
            })
        }
    } else {
        pushNotification_FCM(data.tokenId, notification)
        await UserInfo.updateOne({ mongoUserId: FriendMongoUserId }, {
            $push: { notification }
        })
    }
};



const pushNotification_FCM = async (deviceToken, NotificationData) => {
    // console.log(deviceToken, NotificationData)
    try {
        const data = {
            type: NotificationData.type,
            subType: NotificationData.subType,
            // count: (NotificationData.count).toString(),
            mongoUserId: NotificationData.mongoUserId,
            userName: NotificationData.userName,
            userImage: NotificationData.userImage,
            timeStamp: NotificationData.timeStamp,
        }
        context.functions.execute('fcm_app_notification', deviceToken, data)
    } catch (error) {
        console.log('userfolloeing Notification', error)
    }
}