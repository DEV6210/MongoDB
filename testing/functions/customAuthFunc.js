

exports = async(user) => {
  try{
    
    const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
    
    const s3Client = new S3Client({
      region: context.values.get('awsCredentials').AWS_Region,
      credentials: {
        accessKeyId: context.values.get('awsCredentials').Access_key,
        secretAccessKey: context.values.get('awsCredentials').Secret_access_key,
      },
    });
    const params = {
      Bucket: context.values.get('awsCredentials').Buket_Name,
      Key: 'admins/C928339552.png',
    };
    
    try{
      //delete image from s3 bucket
      const command = new DeleteObjectCommand(params)
      await s3Client.send(command)
      console.log('success');
    }catch(error){
      console.log('error')
    }
    
    }catch(error){
      console.log('function',error)
    }
};
