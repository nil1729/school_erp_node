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
const Subject = require('../models/Subject');
const Exam = require('../models/Exam');
const moment = require('moment');

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
    const exams = await Exam.find({startDate: {$gte: new Date()}});
    return res.render('admin/dashboard', {student: students.length, CLASS: classes.length, teacher: teacher.length, exam: exams.length});
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
                    const rem = await Class.findOne({className: c.name});
                    c.students = c.students.concat(rem.students);
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

const jsonToCSVSubject = async () => {
    const subjects = await Subject.find();
    const fields = ['title', 'code', 'className', 'class_ID'];
    const opts = { fields };
    const parser = new Parser(opts);
    const csvData = parser.parse(subjects);
    fs.writeFileSync('./public/exports/subject.csv', csvData);
};

// Add Single Subject
router.get('/subject-add', async(req, res) => {
    await jsonToCSVSubject()
    const classes = await Class.find().sort({className: 1});
    const teachers = await User.find({role: 'teacher'}).sort({name: -1});
    res.render('forms/subject_add', {classes, teachers});
});

// Add Single Subjects POST
router.post('/subject-add', async(req, res) => {
    try {
        let c = await Class.findById(req.body.class_ID).select('className');
        const {title, class_ID, teachers, code} = req.body;
        let subject = new Subject({
            title,
            class_ID,
            className: c.className,
            teachers,
            code
        });
        subject = await subject.save();
        res.json({subject});
    } catch (e) {
        console.log(e);
         res.redirect('back');
    }
});

// ADD Subjects via CSV
router.get('/subject-csv', async(req, res) => {
    await jsonToCSVSubject()
    res.render('forms/subject_csv');
});

// Add Subjects via CSV POST
router.post('/subject-csv', async(req, res) => {
    upload(req, res, async (err) => {
        if (err) {
              res.render('forms/subject_csv', {error: err});
        }else if(typeof req.file === 'undefined'){
              res.render('forms/subject_csv', {error: 'No file Selected'});
        }else{
            let filePath = `${req.file.destination}/${req.file.filename}`;
            let jsonArray = await csv().fromFile(filePath);
            try {
                const updateArray = async () => {
                    jsonArray.forEach(async sb => {
                        let c = await Class.findOne({className: sb.className}).select('_id');
                        sb.class_ID = c._id;
                        let subject = new Subject(sb);
                        await subject.save();
                    });
                }
                await updateArray();
                fs.unlink(filePath, async (e)=> {
                    if(e){
                        console.log(e);
                        return res.render('forms/subject_csv', {error: 'Server Error'});
                    }else{
                        //  res.json({jsonArray});
                        return res.render('forms/subject_csv', {error: 'File Uploaded Successfully'});
                    }
                });
            } catch (e) {
                console.log(e);
                fs.unlink(filePath, async(e) => {
                    if(e){
                        return res.render('forms/subject_csv', {error: 'Server Error'});
                    }
                    return res.render('forms/subject_csv', {error: 'Duplicate Data Found'});
                });
            } 
        }
      });
});

// Get Subject Details
router.get('/subjects', async (req, res) => {
    const subjects = await Subject.find().populate('class_ID').sort({className: -1});
    const classes = await Class.find().sort({className: 1});
    const teachers = await User.find({role: 'teacher'}).sort({name: -1});
    res.render('admin/subjects', {subjects, teachers, classes});
});

// Update Subject Teachers only
router.post('/subject/:id/teachers', async (req, res) => {
    try {
        let subject = await Subject.findById(req.params.id);
        subject.teachers = subject.teachers.concat(req.body.teachers);
        subject = await Subject.updateOne({_id: subject._id}, subject);
        res.json({subject}); 
    } catch (e) {
        console.log(e);
        res.redirect('back');
    }
});

// Exam Add Routes 
router.get('/exam-add', async (req, res) => {
    const subjects = await Subject.find().populate('class_ID').sort({className: -1});
    const classes = await Class.find().sort({className: 1});
    res.render('forms/exam_add', {subjects, classes});
});

router.post('/exam-add', async(req, res) => {
    const {title, classes, subjects, date} = req.body;
    const d = new Date(date);
    const formattedDate = moment(d).format("Do MMM YYYY");
    try {
        let exam = new Exam({title, classes, subjects, startDate: d, date: formattedDate});
        exam = await exam.save();
        res.redirect('/admin/exams');
    } catch (e) {
        console.log(e);
        res.redirect('back');
    }
});

// get All Exam Details
router.get('/exams', async (req, res) => {
    try {
        let exams = await Exam.find().sort({startDate: 1}).populate('subjects').populate('classes');
        res.render('admin/exams', {exams, currentDate: new Date});
    } catch (e) {
        console.log(e);
        res.redirect('back');
    }
});
module.exports = router