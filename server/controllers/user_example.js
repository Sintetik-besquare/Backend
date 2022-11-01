//list of function of endpoint for user
//example
const userController = {
    
    getAll: async (req,res)=>{
        return res.status(200).json({sucess: true, message:'Created first API endpoint!'})
    },
    getById: async (req,res)=>{
        const {id} = req.params;
        return res.status(200).json({sucess: true, message:`Created first API endpoint! ${id}`})
    },
    createUser: async (req,res)=>{
        const {id,firstname,lastname,userType} = req.body;

        //validation
        let errors = {};
        let errorMessage ='';
        let isBodyValid = true;

        //firstname
        if (!firstname||
            typeof firstname !=='string'||
            firstname.trim().length ===0){
            isBodyValid = false;
            errors['firstname'] = "Input must be a string and not empty";
        };

        //lastname
        if (!lastname ||
            typeof lastname !=='string'||
            lastname.trim().length ===0){
            isBodyValid = false;
            errors['lastname'] = "Input must be a string and not empty";
        };

        //user type
        if (!userType ||
            typeof userType !=='string'||
            userType.trim().length ===0){
            isBodyValid = false;
            errors['userType'] = "Input must be a string and not empty";
        }else{
            const checks = ['user','admin'];
            //to make sure the user type is either user/admin only
            const found = checks.some((check)=>check===userType);
            //if the user type is not user/admin 
            if(!found){
                isBodyValid = false;
                errors['userType'] = "Input only can have these value " + checks.join(', ');
            }
        };

        if(!isBodyValid){
            return res.status(400).json({
                sucess: false,
                errorMessage: 'Please enter a valid input',
                errors 
            });
        };

        //todo: add more validation or use a validation library 
        
        //create user
        const userPayload = {
            id,
            firstname,
            lastname,
            userType
        }
        return res.status(200).json({sucess: true, message:`Created first API endpoint! ${id}. Data:`,userPayload})
        
        
    },
    updateUser:(req,res)=>{
        //todo
    },
    deleteUser:(req,res)=>{
       //todo
    },
}


module.exports = userController;
