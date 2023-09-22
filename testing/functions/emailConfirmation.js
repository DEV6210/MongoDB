const nodemailer = require('nodemailer');

exports = async function ({ query, headers, body }, response) {
    try {
      const { email }= JSON.parse(body.text());

      // const User = context.services.get("mongodb-atlas").db("theclinkapp").collection("users");
      // const data=await User.findOne({email:email},{_id:0,email:1})
      
      if(email){
        const emailService=context.values.get('emailService')
        const transporter = nodemailer.createTransport({
            host: emailService.host, // Incoming server
            port: emailService.port, // SMTP port for secure SSL/TLS connection
            secure: true, // Use SSL/TLS
            auth: {
                user: emailService.email, // Your email address
                pass: emailService.pass // Your email password
            }
        });
        
        const generateSixDigitOTP=()=> {
          const min = 100000;
          const max = 999999;
          return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        const otp = generateSixDigitOTP();

        // Email content
        const mailOptions = {
            from: {
                name: 'Clink Verification', // Custom sender name
                address: emailService.email // Your email address
            }, // Sender email address
            to: email, // Recipient email address
            subject: 'Complete your Sign Up procedures', // Email subject
            html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="style.css" />
    <title>Account Verification</title>
</head>

<body>
    <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
        <div style="margin:20px auto;width:95%;padding:20px 0">
            <div style="border-bottom:1px solid #eee">
                <img src='https://clinktestapp.s3.ap-south-1.amazonaws.com/configurations/clink-full-logo.png'
                    style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600" alt='logo' height="50px" />
            </div>
            <p style="font-size:1.1em">Hi,</p>
            <p>Use the following OTP to complete your Sign Up procedures. OTP is
                valid for 5 minutes</p>
            <h2
                style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">
                ${otp}</h2>
            <p style="font-size:0.9em;">Regards,<br />The Clink Team</p>
            <hr style="border:none;border-top:1px solid #eee" />
            
        </div>
    </div>
</body>
</html>
            `
        };

        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                // console.log('Error sending email:', error);
                response.setStatusCode(401).setBody(JSON.stringify({message:'Error sending email:', error}))
            } else {
                // console.log('Email sent:', EJSON.parse(info.response));
                response.setStatusCode(201).setBody(JSON.stringify({otp:otp, message: "Successfully Send OTP to Registered Email",info}));
            }
        });
        
        response.setStatusCode(201).setBody(JSON.stringify({otp:otp, message: "Successfully Send OTP to Registered Email",data}));
      }else{
        response.setStatusCode(401).setBody(JSON.stringify({message: "The email id entered is not registered"}));
      }
      
    } catch (error) {
        response.setStatusCode(400).setBody(JSON.stringify({message:'MongoDB Backend Function Error',error}));
    }
};