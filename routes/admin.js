const express = require('express');
const router = express.Router();
const checkAuthentication = require('../middleware/checkAuthentication');
const { check, validationResult } = require('express-validator');
const Student = require('../models/Student');
const multer = require('multer');
const path = require('path');
const { Parser } = require('json2csv');
const fs = require('fs');
const csv = require('csvtojson');
const Class = require('../models/Class');
const User = require('../models/User');
const bcrypt = require('bcrypt'); 

// File Filter Setup
const fileFilter = (req, file, cb) => {
    const extn = path.extname(file.originalname);
    const type = /csv/;
    if(!type.test(extn)){
        cb(new Error('Only CSV files can be uploaded'));
    }else{
        cb(null, file);
    }
};

// Multer Setup
const storage = multer.diskStorage({
    destination: (req, file, done) => {
        done(null, './public/imports');
    },
    filename: (req, file, done) => {
        done(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Upload Options
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter
}).single('csv');

// Dashboard
router.get('/dashboard', async (req, res) => {
    const students = await Student.find();
    const classes = await Class.find();
    const teacher = await User.find({role: 'teacher'});
    return res.render('admin/dashboard', {student: students.length, CLASS: classes.length, teacher: teacher.length});
});

const jsonToCSV = async () => {
    const students = await Student.find();
    const fields = ['firstName', 'lastName', 'email', 'phone', 'gaurdian', 'class', 'address', 'school_ID'];
    const opts = { fields };
    const parser = new Parser(opts);
    const csvData = parser.parse(students);
    fs.writeFileSync('./public/exports/student.csv', csvData);
};

// Student Add Form 
router.get('/student-add', async (req, res) => {
    const classes = await Class.find().sort({className: 1});
    await jsonToCSV();
    res.render('forms/student_add', {classes});
});

// Single Student Add POST
router.post('/student-add',[
    check('email', 'Please Provide a valid Email Address').isEmail(),
    check('phone', 'Please provide a valid Phone Number').isMobilePhone("en-IN")
] , async (req, res) => {
    const errorsArray = validationResult(req);
    if(!errorsArray.isEmpty()){
        let errors = [];
        errorsArray.errors.forEach(error => {
            errors.push(error.msg); 
        });
        return res.render('forms/student_add', {errors: errors, s: req.body});
    }
    try{
        let student = new Student(req.body);
        await student.save();
        let CLASS = await Class.findOne({className: student.class});
        CLASS.students.push(student);
        CLASS = await Class.findByIdAndUpdate(CLASS.id, CLASS);
        await CLASS.save();
        res.redirect('/admin/students');
    }catch(e){
        console.log(e);
        res.redirect('back');
    }
});

// Student CSV data 
router.get('/student-csv', async(req, res) => {
    await jsonToCSV();
    return res.render('forms/student_csv');
});

// Student add by CSV Import  POST
router.post('/student-csv', (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
            res.render('forms/student_csv', {error: err});
        }else if(typeof req.file === 'undefined'){
            res.render('forms/student_csv', {error: 'No file Selected'});
        }else{
            let filePath = `${req.file.destination}/${req.file.filename}`; 
            let jsonArray = await csv().fromFile(filePath);
            try {
                const students = await Student.insertMany(jsonArray);
                let classes = [];
                students.forEach(s =>{
                    const index = classes.length > 0 ? classes.findIndex(t => t.name === s.class) : -1 ;
                    if(index < 0){
                        classes.push({
                            name: s.class,
                            students: [s._id]
                        });
                    }else{
                        classes[index].students.push(s._id);
                    }
                });
                classes.forEach(async c => {
                    await Class.updateOne({className: c.name}, {$set: {students: c.students}});
                });
                fs.unlink(filePath, async (e)=> {
                    if(e){
                        console.log(e);
                        return res.render('forms/student_csv', {error: 'Server Error'});
                    }else{
                        return res.render('forms/student_csv', {error: 'File Uploaded Successfully'});
                    }
                });
            } catch (e) {
                console.log(e);
                fs.unlink(filePath, async(e) => {
                    if(e){
                        return res.render('forms/student_csv', {error: 'Server Error'});
                    }
                    return res.render('forms/student_csv', {error: 'Duplicate Data Found'});
                });
            }
        }
    });
});


// Get Students Details Table
router.get('/students', async (req, res) => {
    const students = await Student.find();
    const classes = await Class.find().sort({className: 1}).populate('students');
    classes.forEach(c => {
        c.students.forEach(s => {
            console.log(s);
        });
    });
    res.render('admin/students', {students, classes});
});

const jsonToCSVclass = async () => {
    const classes = await Class.find();
    const fields = ['className', 'classRoomNo', 'teacherInCharge', 'location'];
    const opts = { fields };
    const parser = new Parser(opts);
    const csvData = parser.parse(classes);
    fs.writeFileSync('./public/exports/class.csv', csvData);
};

// Add Single Class  
router.get('/class-add', async(req, res) => {
    await jsonToCSVclass();
    res.render('forms/class_add');
});

// Add Single Class POST
router.post('/class-add', async(req, res) => {
    try {
        let CLASS = new Class(req.body);
        CLASS = await CLASS.save();
        res.json({CLASS}); 
    } catch (e) {
        console.log(e);
        res.redirect('back');
    }
});


// Add Class via CSV
router.get('/class-csv', async (req, res) => {
    await jsonToCSVclass();
    res.render('forms/class_csv');
});

// Add Classes via CSV POST
router.post('/class-csv', (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
            res.render('forms/class_csv', {error: err});
        }else if(typeof req.file === 'undefined'){
            res.render('forms/class_csv', {error: 'No file Selected'});
        }else{
            let filePath = `${req.file.destination}/${req.file.filename}`; 
            let jsonArray = await csv().fromFile(filePath);
            try {
                const classes =  await Class.insertMany(jsonArray);
                fs.unlink(filePath, async (e)=> {
                    if(e){
                        console.log(e);
                        return res.render('forms/student_csv', {error: 'Server Error'});
                    }else{
                        //  res.json({classes});
                        return res.render('forms/student_csv', {error: 'File Uploaded Successfully'});
                    }
                });
            } catch (e) {
                console.log(e);
                fs.unlink(filePath, async(e) => {
                    if(e){
                        return res.render('forms/student_csv', {error: 'Server Error'});
                    }
                    return res.render('forms/student_csv', {error: 'Duplicate Data Found'});
                });
            }
        }
    });
});

// Classes For Admin
router.get('/classes', async (req, res) => {
    const classes = await Class.find().sort({classRoomNo: 1});
    res.render('admin/classes', {classes});
});


const jsonToCSVTeacher = async () => {
    const teachers = await User.find({role: 'teacher'});
    const fields = ['name', 'email', 'phone', 'instructor', 'subject', 'address', 'qualification'];
    const opts = { fields };
    const parser = new Parser(opts);
    const csvData = parser.parse(teachers);
    fs.writeFileSync('./public/exports/teacher.csv', csvData);
};

// Teacher Add Single GET
router.get('/teacher-add', async (req, res) => {
    await jsonToCSVTeacher();
    const classes = await Class.find().sort({className: 1});
    res.render('forms/teacher_add', {classes});
});

// Techer Add Single POST
router.post('/teacher-add', async(req, res) => {
     try{
        let teacher = new User(req.body);
        teacher.password = await bcrypt.hash(teacher.password, 10);
        teacher = await teacher.save(); 
        res.json({teacher});
     }catch(e){
        console.log(e);
        res.redirect('back');
     };
});


// Teacher CSV GET
router.get('/teacher-csv', async (req, res) => {
    await jsonToCSVTeacher();
    res.render('forms/teacher_csv');
});

router.post('/teacher-csv', async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
              res.render('forms/class_csv', {error: err});
          }else if(typeof req.file === 'undefined'){
              res.render('forms/class_csv', {error: 'No file Selected'});
          }else{
            let filePath = `${req.file.destination}/${req.file.filename}`; 
            let jsonArray = await csv().fromFile(filePath);
            try {
                const teachers =  await User.insertMany(jsonArray);
                fs.unlink(filePath, async (e)=> {
                    if(e){
                        console.log(e);
                        return res.render('forms/student_csv', {error: 'Server Error'});
                    }else{
                        //  res.json({teachers});
                        return res.render('forms/student_csv', {error: 'File Uploaded Successfully'});
                    }
                });
            } catch (e) {
                console.log(e);
                fs.unlink(filePath, async(e) => {
                    if(e){
                        return res.render('forms/student_csv', {error: 'Server Error'});
                    }
                    return res.render('forms/student_csv', {error: 'Duplicate Data Found'});
                });
            }
          }
      });
});

// Get Details Of Teacher
router.get('/teachers', async (req, res) => {
    const teachers = await User.find({role: 'teacher'}).sort({name: 1});
    res.render('admin/teachers', {teachers});
});


module.exports = router