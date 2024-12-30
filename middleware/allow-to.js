module.exports=(...roles)=>{
   return (re,res,next)=>{
        if(!roles.includes(re.user.role)){
            return res.status(403).send({message:"Access Denied"})
        }

        next()
    }
}