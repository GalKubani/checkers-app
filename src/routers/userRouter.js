const express= require('express');
const User= require('../models/usermodel');
const router= new express.Router()
const auth= require('../middleware/auth')


router.post('/users', async (req,res)=>{
    const user= new User(req.body)
    try{
        await user.save()
        const token= await user.generateAuthToken()
        res.status(201).send({user,token})
    }catch(error){
        res.status(400).send(error)
    }
})
router.post('/users/login',async(req,res)=>{
    let username=req.query.name
    let password=req.query.password
    let userCreated=false
    try{
        const user= await User.findByCredentials(username,password)
    }
    catch(err){
        const user= await new User({username,password})
        try{
            await user.save()
            const token= await user.generateAuthToken()
            res.status(201).send({user,token})
            userCreated=true
        }catch(e){}
    }
    if(!userCreated){
        try{
            const user= await User.findByCredentials(username,password)
            const token= await user.generateAuthToken()
            res.send({user,token});
        }catch(error){
            res.status(500).send(error)
        }
    }
})
router.post('/users/logout',auth,async(req,res)=>{
    try{
        req.user.tokens=req.user.tokens.filter((token)=>{
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    }catch(err){
        res.status(500).send()
    }
})
router.patch('/users/updateratings',auth ,async(req,res)=>{
    try{
        const user = req.user
        user.ratings += (req.query.ratings*1)
        await user.save()
        res.send(user)
    }catch(error){
        res.status(400).send(error)
    }
})
module.exports= router