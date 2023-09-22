exports = async function(changeEvent){
     try {
        const UserInfo = context.services.get("mongodb-atlas").db("theclinkapp").collection("userinfos");
        const UserFollowings = context.services.get("mongodb-atlas").db("theclinkapp").collection("user_followings");
        const ReportedUsers = context.services.get("mongodb-atlas").db("theclinkapp").collection("reported_users");
        //---------------------------------------------------------------------------
        // const Posts = context.services.get("mongodb-atlas").db("theclinkapp").collection("posts")
        // const PostReaction = context.services.get("mongodb-atlas").db("theclinkapp").collection("post_reactions");
        // const ReportedPost = context.services.get("mongodb-atlas").db("theclinkapp").collection("reported_posts");

        const { documentKey } = changeEvent;

        console.log('deleted user documentKey:', documentKey._id)

        console.log(changeEvent)

        // Perform additional actions for a deleted user
        await UserInfo.deleteOne({ _id: documentKey._id })
        await UserFollowings.deleteOne({ _id: documentKey._id })
        await ReportedUsers.deleteOne({ _id: documentKey._id })
        // console.log('user related document delete from userinfos & user_followings & reported_posts collections');


        //---------------------------------------------------------------------------
        // removed post data 
        // await Posts.deleteOne({ _id: documentKey._id });
        // await PostReaction.deleteOne({ _id: documentKey._id });
        // await ReportedPost.deleteOne({ _id: documentKey._id });

        // console.log('post related document delete from post_reactions & reported_posts collections')

    } catch (error) {
        console.log('error from delete post', error)
    }
}
