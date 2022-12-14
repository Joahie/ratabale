//dependencies and such
const router = require('express').Router();
const { render } = require('ejs');
const { application } = require('express');
const mongoclient = global.mongoclient;
const MongoTeachers = mongoclient.db("ratable").collection("teachers")
const MongoContact = mongoclient.db("ratable").collection("contact")
const MongoAccounts = mongoclient.db("ratable").collection("accounts")
const env = require("dotenv").config()

//middleware for cookie authentication
const isAuth = (req, res, next)=>{
    if(req.session.email){
        next()
    }else{
        req.session.nextRedirect = req.originalUrl
        res.redirect('/signin')
    }
}

    
//renders the addAReview page when people visit [insert website url]/addareview
router.get("/addAReview", (req,res)=>{
    res.render('addAReview')
})

//post request for when people want to add a review (middleware isAuth function is there to make sure that the user is logged in before they add a review)
router.post("/addAReview", isAuth, async (req, res)=>{
    var answer = req.body.name
    var results = await MongoTeachers.findOne({ nameToLowerCase: answer})
    let StringifiedResults = JSON.stringify(results)
    let ParsedResults = JSON.parse(StringifiedResults)
    return res.render("rateAnInstructor", {
        name: ParsedResults.name,
        dbname: answer
    })
})
//get request for when the search function is used
router.get("/search", async (req,res)=>{
       try{
        var answer = req.query.search.toLowerCase();  
        
        var answer = answer.replaceAll(' ', '') 
        var results = await MongoTeachers.findOne({ nameToLowerCase: answer})
        let StringifiedResults = JSON.stringify(results)
        let ParsedResults = JSON.parse(StringifiedResults)
            return res.render("results", {
                nameWithoutSpaces: answer,
                valid: true,
                name: ParsedResults.name,
                subject: ParsedResults.subjectclass.toLowerCase(),
                school: ParsedResults.school,
                rating:  Math.floor(ParsedResults.rating),
                rQuantity: ParsedResults.rQuantity,
                clarity: Math.floor(ParsedResults.clarity),
                accessibility: Math.floor(ParsedResults.accessibility),
                organization: Math.floor(ParsedResults.organization),
                difficulty: Math.floor(ParsedResults.difficulty),
                notes: ParsedResults.notes,
                teacher: ParsedResults.teacher,
                user: req.session.email
            })    
        }catch(err){
            console.log(err)
         return res.render("results", {

                valid: false,
                name: req.query.search,
                user: req.session.email

            })
                             
    }   
});
//post request for people adding an instructor
router.post('/addAnInstructor', async (req, res)=>{
    var answer = req.body
    let temp = answer.name.toLowerCase().replaceAll(' ', '') 
    if(answer.typeOfEducator == "Tutor"){
        var teacher = false
    }else{
        var teacher = true
    }
    var results = await MongoTeachers.findOne({ nameToLowerCase: temp})
    if (!results){
                
        MongoTeachers.insertOne({nameToLowerCase: temp, name: answer.name, rating: null, school: answer.school, subjectclass: answer.subjectClass, teacher: teacher, rQuantity: 0, accessibility: null, clarity: null, difficulty: null, organization: null, notes: [], users: []})
        
        res.redirect("/search?search=" + answer.name)
    }else{
        return res.render("addAnInstructor", {
            alreadyCreated: true,
            teacherName: answer.name
        })
    }})
    
function mathPogging(originalNumber, newNumber, numberOfReviewers){
    let temp
    let temp1 = originalNumber*1
    let temp2 = newNumber*1
    let temp3 = numberOfReviewers*1 +1
    if(originalNumber == null){temp = 0}

    temp = (temp1*(temp3-1)+temp2)/temp3
    return temp
}
router.post("/rateAnInstructor", async (req, res)=>{
    let username  = req.session.email
    var answer = req.body
    var results = await MongoTeachers.findOne({ nameToLowerCase: answer.submit})
    console.log(results)
    let StringifiedResults = JSON.stringify(results)
    let ParsedResults = JSON.parse(StringifiedResults)
    let notesTemp = ParsedResults.notes
    let newUsers = ParsedResults.users
    try{
        if(ParsedResults.users.includes(username) == true){
            return res.redirect("/search?search=" + answer.submit)
        }else{
            
        let tempusers = newUsers.push(username)
        notesTemp.push(answer.notes)
        ratingTemp = mathPogging(ParsedResults.rating, answer.rating, ParsedResults.rQuantity)
        clarityTemp = mathPogging(ParsedResults.clarity, answer.clarity, ParsedResults.rQuantity)
        difficultyTemp = mathPogging(ParsedResults.difficulty, answer.difficulty, ParsedResults.rQuantity)
        accessibilityTemp = mathPogging(ParsedResults.accessibility, answer.accessibility, ParsedResults.rQuantity)
        organizationTemp = mathPogging(ParsedResults.organization, answer.organization, ParsedResults.rQuantity)
        quantityTemp = ParsedResults.rQuantity*1 + 1
        MongoTeachers.updateOne({nameToLowerCase: answer.submit},  {$set: { rating: ratingTemp, clarity: clarityTemp, difficulty: difficultyTemp, organization: organizationTemp, accessibility: accessibilityTemp, rQuantity: quantityTemp, notes: notesTemp, users: tempusers}}) 
        return res.redirect("/search?search=" + answer.submit)
        }
    }catch(err){
        console.log(err)
        return res.redirect("/search?search=" + answer.submit)
    }
   
})
router.get("/signin", (req, res)=>{
    res.render("signin", {            incorrect: false
    })
})


router.get("/signup", (req, res)=>{
    res.render("signup", {
        passwordsEqual: true,
                emailTaken: false,
    })
    
})
router.post("/contact", (req,res)=>{
    var answer = req.body

    MongoContact.insertOne({name: answer.name, email: answer.email, text: answer.text
    })
    return res.render("contact", {
        received: true,
        user: req.session.email
    })
})


router.get('/contact', (req,res)=>{
    return res.render("contact", {
        received: false,
        user: req.session.email
    })})


router.post('/signout', (req,res)=>{
    req.session.destroy(e => {
        if (e) return res.send(e);
        else return res.redirect("/")
    })
})
router.get('/', (req, res)=>{
    res.render('index', {user: req.session.email})
})
router.get('/addAnInstructor', isAuth, (req, res)=>{
    res.render('addAnInstructor', {
        alreadyCreated: false,
        teacherName: null})
})

router.get('/rateAnInstructor', isAuth, (req, res)=>{
    res.render('rateAnInstructor')
})
router.post("/signin", async (req, res)=>{
    var answer = req.body
    var results = await MongoAccounts.findOne({ email: answer.email.toLowerCase(), password: answer.password})
    console.log(results)
    if(results == null){
        return res.render("signin", {
            incorrect: true
        })          
    }else{
        req.session.email = answer.email.toLowerCase()
        return res.redirect(req.session.nextRedirect || "/")
    }
})

router.post('/signup', async (req, res)=>{
    try{
        var answer = req.body

        if (answer.password != answer.confirmPassword){
            return res.render("signup", {
                passwordsEqual: false,
                emailTaken: false          
            })    
        }

        var results = await MongoAccounts.findOne({ email: answer.email.toLowerCase()})
        if(results != null){
            return res.render("signup", {
                passwordsEqual: true,
                emailTaken: true,
            })          
        }
        await MongoAccounts.insertOne({name: answer.name, email: answer.email.toLowerCase(), password: answer.password})


        return res.redirect("signin")    
        }catch(err){
            console.log(err)
            return res.render("signup")
                             
    }   
})


router.all('*', (req, res) => {
    res.status(404).render('404', {                user: req.session.email
    });
  });


module.exports = router;
