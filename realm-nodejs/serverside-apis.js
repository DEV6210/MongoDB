//xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-------------<> REALM <>---------XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
import Realm from 'realm'


const appConfig = {
    id: 'application-0-sendn',
    baseUrl: 'https://realm.mongodb.com'
};

const app = new Realm.App(appConfig);

// done
router.post('/app/register', async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const user = await app.emailPasswordAuth.registerUser({ email, password });
        res.status(201).json({ message: 'Successfully registered', user: user });
    } catch (error) {
        console.error(error);
        res.status(401).json({ error: 'Error signing up' });
    }
});
// done
router.post('/app/login', async (req, res) => {
    try {
        const credentials = Realm.Credentials.emailPassword(req.body.email, req.body.password);
        const user = await app.logIn(credentials);
        console.log('anonymous login:', user.id);
        res.status(201).json('Successfully Login', 'anonymous login:', user.id)

    } catch (error) {
        res.status(401).json('Error logging in:')
    }
})

// done email send  resetpass -----------first send----1
router.post('/app/requestPasswordReset', async (req, res) => {
    try {
        const email = req.body.email
        await app.emailPasswordAuth.sendResetPasswordEmail({ email });

        res.status(201).json('Password reset email sent successfully!')
    } catch (error) {
        res.status(400).json('bad request')

    }
})

// done resetpass -----------first send----2
router.post('/app/resetPassword', async (req, res) => {
    try {
        await app.emailPasswordAuth.resetPassword({
            password: "123456",
            token: "ac2566b95df5f357c171be5f8305d2d10c611721a574b19b3cbc5b663e6c000436a324bb547555727dc83bd147b7903fd0d22b973f0fe911f63b34bddc4b9f3f",
            tokenId: "64a843a8bcf11894f766aaa7",
        });

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error resetting password' });
    }
});

//-------------------------------------------------------------------------------------------------------------------
