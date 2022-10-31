const { queryByPromise } = require('../dbconfig/db');

const createCredential = {
    createCredential: async (req,res)=>{
        const {email, password} = req.body;

        //To do add some error handeling using try{}catch{}
        
        //validation
        let errors = {};
        let errorMessage ='';
        let isBodyValid = true;

        //email
        //todo
        if (!email){
            isBodyValid = false;
            errors['email'] = "Input must be not empty";
        };  
        const user_email = await queryByPromise(
            `SELECT * 
             FROM sintetik.account
             WHERE email= '$email'`
        );
        if (user_email.result.length) {
            isBodyValid = false;
            errors['email'] = "Duplicated";
        };
    
        //password 
        if (!password){
            isBodyValid = false;
            errors['password'] = "Input must be not empty";
        };

        if(!isBodyValid){
            return res.status(400).json({
                sucess: false,
                errorMessage: 'Please enter a valid input',
                errors 
            });
        };
        
        const my_query = {
            text: `INSERT INTO sintetik.account (email, password) VALUES($1,$2)`,
            values: [email,password]
        };

        const newCredential = await queryByPromise(my_query);
        return res.status(200).json({sucess: true, message:"Data:", newCredential})


    }
};

module.exports= createCredential;    