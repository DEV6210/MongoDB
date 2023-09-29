exports = async function (changeEvent) {
    try {

        const PostReaction = context.services.get("mongodb-atlas").db("theclinkapp").collection("post_reactions");
        const Post = context.services.get("mongodb-atlas").db("theclinkapp").collection("posts");
        const UserInfo = context.services.get("mongodb-atlas").db("theclinkapp").collection("userinfos");

        const { updateDescription, documentKey } = changeEvent;

        if (Object.keys(updateDescription.updatedFields).includes('likeCount') && updateDescription.updatedFields.likeCount !== undefined) {
            const updatedDocument = await PostReaction.findOne({ _id: documentKey._id });

            // post schema -->>> update post like
            await Post.updateOne({ postId: updatedDocument.postId }, {
                $set: {
                    likeCount: updatedDocument.likeCount
                }
            });

            const query = { ownerId: updatedDocument.ownerId, reactionType: 'like' };
            const result = await PostReaction.find(query).toArray();  //use toarray() when put mongo function
            const likeCounts = result.map((doc) => doc.likeCount);
            // console.log('Like counts:', likeCounts);
            const sum = likeCounts.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

            // userinfo schema-- >>> update all post likecount which are posted by users
            await UserInfo.updateOne({ mongoUserId: updatedDocument.ownerId }, {
                $set: { postLikeCount: sum }
            });
        }

        // post like notification..................................
        postReactionNotification(changeEvent);

    } catch (error) {
        console.log('like count', error);
    }
};


const pushNotification_FCM = async (deviceToken, NotificationData) => {
    // console.log(deviceToken, NotificationData)
    const message = {
        "to": `${deviceToken}`,
        "notification": {
            // "title": `${NotificationData.type}`,
            // "body": `${NotificationData.subType}`,
            "type": "BIGPIC",
        },
        "data": {
            "_id":NotificationData._id,
            "type": NotificationData.type,
            "subType": NotificationData.subType,
            "showType":NotificationData.showType,
            "postId": NotificationData.postId,
            "postType": NotificationData.postType,
            "rawText": NotificationData.firstTenWords,
            "thumbnail": NotificationData.thumbnail,
            "count": NotificationData.count,
            "comment": NotificationData.comment,
            "mongoUserId": NotificationData.mongoUserId,
            "userName": NotificationData.userName,
            "userImage": NotificationData.userImage,
            "timeStamp": NotificationData.timeStamp,
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
}


const postReactionNotification = async (changeEvent) => {
    try {
        const PostReaction = context.services.get("mongodb-atlas").db("theclinkapp").collection("post_reactions");
        const UserInfo = context.services.get("mongodb-atlas").db("theclinkapp").collection("userinfos");

        const { updateDescription, documentKey } = changeEvent;

        const pushNotification = async (mongoUser, reactionType) => {

            const RealPostData = await PostReaction.findOne({ _id: documentKey._id });


            if (mongoUser.mongoUserId !== RealPostData.ownerId) {
                var minutes = 1;
                var count = 1;
                if (reactionType === 'like') {
                    minutes = 1;
                    count = RealPostData.likeCount;
                } else if (reactionType === 'comment') {
                    minutes = 1;
                    count = 1;
                }

                const getFirstTenWords = (str) => {
                    const words = str.split(" ");
                    return words.slice(0, 10).join(" ");
                }
                const firstTenWords = getFirstTenWords(RealPostData.rawText);

                const notification = {
                    _id: new BSON.ObjectId().toString(),
                    type: 'post',
                    showType:true,
                    readFlag: false,
                    readStamp: null,
                    subType: reactionType,
                    ownerId: RealPostData.ownerId,
                    postId: RealPostData.postId,
                    postType: RealPostData.postType,
                    rawText: firstTenWords,
                    thumbnail: RealPostData.thumbnail,
                    userImage: mongoUser.userImage,
                    userName: mongoUser.userName,
                    mongoUserId: mongoUser.mongoUserId,
                    count: count,
                    timeStamp: new Date(),
                    mongoUserList: [mongoUser]
                };


                // // find user from userinfo collection 
                const userInfoData = await UserInfo.findOne({ mongoUserId: RealPostData.ownerId })

                // Extract the notification array from the provided data
                const notifications = userInfoData.notification;
                const postIdToCheck = RealPostData.postId;

                if (notifications && notifications.length > 0) {
                    const filteredNotifications = notifications.filter((notification) => {
                        const { postId, subType } = notification;
                        return (
                            postId === postIdToCheck &&
                            subType === reactionType
                            // mongoUserList.includes(likeById)
                        )
                    });

                    const lastNotification = filteredNotifications[filteredNotifications.length - 1]
                    if (lastNotification) {
                        if (new Date() - new Date(lastNotification.timeStamp) > 1 * 1 * 1000) {

                            pushNotification_FCM(userInfoData.tokenId, notification)
                            // push notification
                            await UserInfo.updateOne({ mongoUserId: RealPostData.ownerId }, {
                                $push: { notification }
                            });
                            console.log('NOTIFY');
                        } else {
                            if (lastNotification.mongoUserList.some((user) => user.mongoUserId === mongoUser.mongoUserId)) {
                                if (new Date() - new Date(lastNotification.timeStamp) > 1 * 1 * 1000) {
                                    console.log('timeStamp is crossed define time period');

                                    pushNotification_FCM(userInfoData.tokenId, notification)

                                    // push notification
                                    await UserInfo.updateOne({ mongoUserId: RealPostData.ownerId }, {
                                        $push: { notification }
                                    });
                                } else {
                                    console.log('timeStamp not crossed define time period');
                                }
                            } else {

                                if (mongoUser) {
                                    pushNotification_FCM(userInfoData.tokenId, notification)
                                    // pushed new users object
                                    await UserInfo.updateOne({ mongoUserId: RealPostData.ownerId, [`notification._id`]: lastNotification._id }, {
                                        $push: {
                                            [`notification.$.mongoUserList`]: mongoUser,
                                        },
                                        $set: {
                                            [`notification.$.userImage`]: mongoUser, userImage,
                                            [`notification.$.userName`]: mongoUser.userName,
                                            [`notification.$.mongoUserId`]: mongoUser.mongoUserId,
                                        },
                                        $inc: {
                                            [`notification.$.count`]: 1
                                        }
                                    });
                                    console.log('pushed new users object');
                                }
                            }
                        }

                    } else {
                        console.log('liled/comment');

                        pushNotification_FCM(userInfoData.tokenId, notification)
                        // push notification
                        await UserInfo.updateOne({ mongoUserId: RealPostData.ownerId }, {
                            $push: { notification }
                        });
                    }

                } else {
                    pushNotification_FCM(userInfoData.tokenId, notification)
                    // push notification
                    await UserInfo.updateOne({ mongoUserId: RealPostData.ownerId }, {
                        $push: { notification }
                    });
                    console.log('notification field created,someone give first reactions ');
                }
            } else {
                console.log('someone liked/comment his own post');
            }
        }

        //----------------------------------- POST TAG Notification ------------------------------------
        const commentMentionNotification = async (mongoUser) => {

            const RealPostData = await PostReaction.findOne({ _id: documentKey._id });

            // console.log(mongoUser)
            const getFirstTenWords = (str) => {
                const words = str.split(" ");
                return words.slice(0, 10).join(" ");
            }
            const firstTenWords = getFirstTenWords(RealPostData.rawText);

            const notification = {
                _id: new BSON.ObjectId().toString(),
                type: 'post',
                subType: 'commentMention',
                showType:true,
                readFlag: false,
                readStamp: null,
                ownerId: RealPostData.ownerId,
                postId: RealPostData.postId,
                postType: RealPostData.postType,
                rawText: firstTenWords,
                thumbnail: RealPostData.thumbnail,
                userImage: mongoUser.userImage,
                userName: mongoUser.userName,
                mongoUserId: mongoUser.mongoUserId,
                count: 1,
                timeStamp: new Date(),
                mongoUserList: [mongoUser]
            };
            // console.log(notification)

            // find user from userinfo collection 
            const userInfoData = await UserInfo.findOne({ mongoUserId: mongoUser.replyTo })

            // Extract the notification array from the provided data
            const notifications = userInfoData.notification;
            const postIdToCheck = RealPostData.postId;
            if (notifications && notifications.length > 0) {
                const filteredNotifications = notifications.filter((notification) => {
                    const { postId, subType } = notification;
                    return (
                        postId === postIdToCheck &&
                        subType === 'commentMention'
                    )
                });

                const lastNotification = filteredNotifications[filteredNotifications.length - 1]
                if (lastNotification) {
                    if (new Date() - new Date(lastNotification.timeStamp) > 1 * 1 * 1000) {
                        pushNotification_FCM(userInfoData.tokenId, notification)
                        //push notification
                        await UserInfo.updateOne({ mongoUserId: mongoUser.replyTo }, {
                            $push: { notification }
                        });
                    } else {
                        pushNotification_FCM(userInfoData.tokenId, notification)
                        //push notification
                        await UserInfo.updateOne({ mongoUserId: mongoUser.replyTo }, {
                            $push: { notification }
                        });
                    }
                } else {
                    pushNotification_FCM(userInfoData.tokenId, notification)
                    //push notification
                    await UserInfo.updateOne({ mongoUserId: mongoUser.replyTo }, {
                        $push: { notification }
                    });
                }
            } else {
                pushNotification_FCM(userInfoData.tokenId, notification)
                //push notification
                await UserInfo.updateOne({ mongoUserId: mongoUser.replyTo }, {
                    $push: { notification }
                });
            }
        }

        const sharedNotification = async (mongoUser) => {

            const RealPostData = await PostReaction.findOne({ _id: documentKey._id });

            const userInfoData = await UserInfo.findOne({ mongoUserId: RealPostData.ownerId })

            const getFirstTenWords = (str) => {
                const words = str.split(" ");
                return words.slice(0, 10).join(" ");
            }
            const firstTenWords = getFirstTenWords(RealPostData.rawText);

            const notification = {
                _id: new BSON.ObjectId().toString(),
                type: 'post',
                subType: 'shared',
                showType:true,
                readFlag: false,
                readStamp: null,
                ownerId: RealPostData.ownerId,
                postId: RealPostData.postId,
                postType: RealPostData.postType,
                rawText: firstTenWords,
                thumbnail: RealPostData.thumbnail,
                userImage: mongoUser.userImage,
                userName: mongoUser.userName,
                mongoUserId: mongoUser.mongoUserId,
                count: 1,
                timeStamp: new Date(),
                mongoUserList: [mongoUser]
            };

            await UserInfo.updateOne({ mongoUserId: RealPostData.ownerId }, {
                $push: { notification }
            });

            pushNotification_FCM(userInfoData.tokenId, notification)

        }

        // ---------------------------------------------------------------------------------------------
        // ----------------->-> if remove any field then not execute the conditions ----------------->->
        // ---------------------------------------------------------------------------------------------
        if (updateDescription.truncatedArrays.length > 0) {
            console.log(updateDescription.truncatedArrays)
        } else {

            // like notification ................................................l-1
            const isLikedByUpdated = 'likedby' in updateDescription.updatedFields;
            // updatedFields: { likeCount: 1, likedby: [ [Object] ] }
            if (isLikedByUpdated) {
                const likedByArray = updateDescription.updatedFields.likedby;
                if (likedByArray.length > 0) {
                    const userdata = likedByArray[0];
                    const reactionType = 'like';

                    const mongoUser = {
                        mongoUserId: userdata.mongoUserId,
                        userName: userdata.userName,
                        userImage: userdata.userImage
                    };
                    // push like notification
                    pushNotification(mongoUser, reactionType);

                } else {
                    console.log('likedby array is empty.');
                }
            }
            // shared notification ................................................l-1
            const isSharedByUpdated = 'sharedByList' in updateDescription.updatedFields;
            if (isSharedByUpdated) {
                const sharedByArray = updateDescription.updatedFields.sharedByList;
                if (sharedByArray.length > 0) {
                    const userdata = sharedByArray[0];
                    const reactionType = 'shared';

                    const mongoUser = {
                        mongoUserId: userdata.mongoUserId,
                        userName: userdata.userName,
                        userImage: userdata.userImage
                    };
                    // push like notification
                    sharedNotification(mongoUser)


                } else {
                    console.log('shared array is empty.');
                }
            }
            // comment notification ................................................ c-1
            const isCommentUpdated = 'commentLists' in updateDescription.updatedFields;
            if (isCommentUpdated) {
                const commentArray = updateDescription.updatedFields.commentLists;
                if (commentArray.length > 0) {
                    const userdata = commentArray[0];
                    const reactionType = 'comment';

                    const mongoUser = {
                        mongoUserId: userdata.mongoUserId,
                        replyTo: userdata.replyTo,
                        commentId: userdata.commentId,
                        userName: userdata.userName,
                        userImage: userdata.userImage
                    };
                    // push comment notification
                    pushNotification(mongoUser, reactionType);

                } else {
                    console.log('commentLists array is empty.');
                }
            }

            const str = Object.keys(updateDescription.updatedFields)[0];
            if (str) {
                const numberOfDots = (str.match(/\./g) || []).length;
                if (numberOfDots === 1) {

                    // like notification ................................................l-2
                    Object.keys(updateDescription.updatedFields).forEach(async (key) => {
                        if (key.startsWith('likedby.')) {
                            const userdata = updateDescription.updatedFields[key];
                            const reactionType = 'like'

                            const mongoUser = {
                                mongoUserId: userdata.mongoUserId,

                                userName: userdata.userName,
                                userImage: userdata.userImage
                            };

                            //push notification
                            pushNotification(mongoUser, reactionType);
                        }
                    });
                    // shared notification ................................................l-2
                    Object.keys(updateDescription.updatedFields).forEach(async (key) => {
                        if (key.startsWith('sharedByList.')) {
                            const userdata = updateDescription.updatedFields[key];
                            const reactionType = 'shared'
                            const mongoUser = {
                                mongoUserId: userdata.mongoUserId,

                                userName: userdata.userName,
                                userImage: userdata.userImage
                            };

                            //push notification
                            // console.log(mongoUser)
                            sharedNotification(mongoUser)
                        }
                    });

                    // comment notification ................................................c-2
                    Object.keys(updateDescription.updatedFields).forEach(async (key) => {
                        if (key.startsWith('commentLists.')) {
                            const userdata = updateDescription.updatedFields[key];
                            const reactionType = 'comment';

                            const mongoUser = {
                                mongoUserId: userdata.mongoUserId,
                                replyTo: userdata.replyTo,
                                commentId: userdata.commentId,

                                userName: userdata.userName,
                                userImage: userdata.userImage
                            };
                            // push comment notification
                            if (mongoUser.replyTo) {
                                commentMentionNotification(mongoUser) //commentMention
                            } else {
                                pushNotification(mongoUser, reactionType);
                            }
                        }
                    });
                }

                //------------------------------------------------- POST COMMENT LIKE -------------------------------

                if (str.split(".")[0] === 'commentLists' && str.split(".")[2] === 'likeCount') {
                    Object.keys(updateDescription.updatedFields).forEach(async (key) => {
                        if (key.startsWith('commentLists.')) {
                            const index = str.split(".")[1]
                            // console.log(index)
                            console.log('remove->', updateDescription.updatedFields)

                            const RealPostData = await PostReaction.findOne({ _id: documentKey._id });
                            const comment = RealPostData.commentLists[index]

                            // console.log(RealPostData.ownerId, comment.mongoUserId)// incomplete------------=====

                            if ('i') {
                                const getFirstTenWords = (str) => {
                                    const words = str.split(" ");
                                    return words.slice(0, 10).join(" ");
                                }
                                const firstTenWords = getFirstTenWords(RealPostData.rawText);

                                const notification = {
                                    _id: new BSON.ObjectId().toString(),
                                    type: 'post',
                                    subType: 'commentLike',
                                    showType:true,
                                    readFlag: false,
                                    readStamp: null,
                                     ownerId: RealPostData.ownerId,
                                    postId: RealPostData.postId,
                                    postType: RealPostData.postType,
                                    rawText: firstTenWords,
                                    thumbnail: RealPostData.thumbnail,
                                    comment: comment.commentId,
                                    count: comment.likeCount,
                                    timeStamp: new Date(),
                                    mongoUserList: []
                                };

                                if (RealPostData.ownerId === comment.mongoUserId) {
                                    console.log('user liked his comment')
                                } else {
                                    const userInfoData = await UserInfo.findOne({ mongoUserId: comment.mongoUserId })

                                    // Extract the notification array from the provided data
                                    const notifications = userInfoData.notification;
                                    const postIdToCheck = RealPostData.postId;
                                    if (notifications && notifications.length > 0) {
                                        const filteredNotifications = notifications.filter((notification) => {
                                            const { postId, subType } = notification;
                                            return (
                                                postId === postIdToCheck &&
                                                subType === 'commentLike'
                                            )
                                        });
                                        
                                        const lastNotification = filteredNotifications[filteredNotifications.length - 1]
                                        if (lastNotification) {
                                            if (new Date() - new Date(lastNotification.timeStamp) > 1 * 1 * 1000) {
                                                pushNotification_FCM(userInfoData.tokenId, notification)
                                                // push notification
                                                await UserInfo.updateOne({ mongoUserId: comment.mongoUserId }, {
                                                    $push: { notification }
                                                });
                                                console.log('NOTIFY comment like');

                                            } else {
                                                console.log('timeStamp not crossed define time period');
                                            }
                                        } else {
                                            console.log('comment liked');
                                            pushNotification_FCM(userInfoData.tokenId, notification)
                                            // push notification
                                            await UserInfo.updateOne({ mongoUserId: comment.mongoUserId }, {
                                                $push: { notification }
                                            });
                                        }
                                    } else {
                                        pushNotification_FCM(userInfoData.tokenId, notification)
                                        // push notification
                                        await UserInfo.updateOne({ mongoUserId: comment.mongoUserId }, {
                                            $push: { notification }
                                        });
                                        console.log('notification field created,someone give first reactions ');
                                    }
                                }
                            }
                        }
                    });
                }
            }
        }
    } catch (error) {
        console.log('post reaction notification', error);
    }
};


