exports = async function(changeEvent){
      try {
        const UserInfo = context.services.get("mongodb-atlas").db("theclinkapp").collection("userinfos");
        const Posts = context.services.get("mongodb-atlas").db("theclinkapp").collection("posts");

        const { fullDocument, documentKey } = changeEvent;
        // console.log('Newly inserted post:', documentKey._id);

        if (fullDocument.shared === false) {
            await UserInfo.updateOne({ mongoUserId: fullDocument.mongoUserId }, {
                $inc: { myPostCount: 1 }
            });
        } else if (fullDocument.shared === true) {
            // sharedPostCount
            await UserInfo.updateOne({ mongoUserId: fullDocument.mongoUserId }, {
                $inc: { sharedPostCount: 1 }
            });

            // postSharedCount
            await UserInfo.updateOne({ mongoUserId: fullDocument.realOwnerId }, {
                $inc: { postSharedCount: 1 }
            });

            if (fullDocument.shared === true) {
                const realPostOwner = await Posts.findOne({ realPostId: fullDocument.realPostId, shared: false });
                // console.log('Post Owner MongoUserId:', realPostOwner.mongoUserId);
                // console.log('Shared By  MongoUserId:', fullDocument.mongoUserId);
                const RealPostsData = realPostOwner
                const SharedPostsData = fullDocument
                // sharePostNotification(realPostOwner.postId, realPostOwner.mongoUserId, fullDocument.mongoUserId, RealPostsData, SharedPostsData);
            }
        }
    } catch (error) {
        console.log('error from insert post', error)
    }
}