// THIS FILE NEEDS REORGANIZED
// THE ALGORITHM USED HERE FOR SCHEDULE GENERATION IS PRETTY MESSY

const User = require('../../models/User');
const Course = require('../../models/Course');
const Professor = require('../../models/Professor');
const RateSummary = require('../../models/RateSummary');
const Section = require('../../models/Section');
const Semester = require('../../models/Semester');
const checkAuth = require('../../utils/checkAuth');

const product = require('cartesian-product');
const dateConverter = require('date-and-time');
const pattern = dateConverter.compile('h:m A');
//blue green, green, light yellow, red-orange, light purple, light brown, light green
const colorPanel = ['#86E3CE', '#D0E6A5', '#FFDD94', '#FA897B', '#CCABDB', '#cab6a2', '#d2dbc9']
const closedColor = '#757575'

async function fromShoppingCartGetCourseInfo(courses) {
    const allSemesters = await Semester.find({});
    var result = {
        'semesters': []
    };

    for (let i = 0; i < allSemesters.length; i++) {
        result['semesters'].push(allSemesters[i].term);
    }
    for (let i = 0; i < courses.length; i++) {
        const currCourse = await Course.findOne({
            courseID: courses[i].courseID,
            courseTitle: courses[i].courseTitle
        });
        courses[i]['numRate'] = currCourse.numRate;
        courses[i]['score'] = Math.round((currCourse.score + Number.EPSILON) * 100) / 100;
        courses[i]['_id'] = currCourse.id;
    }

    result['courses'] = courses;
    return result;
}

function removeSectionFromSchedule(section, schedule){
    var result = [];
    for (let i = 0; i < schedule.length; i++) {
        const element = schedule[i];
        if (element.courseID === section.courseID && element.courseTitle === section.courseTitle) {
            // schedule.splice(i, 1);
            continue;
        }
        result.push(element);
    }
    return result;
}

function convertDaystimes(schedules){
    for (let i = 0; i < schedules.length; i++) {
        for (let j = 0; j < schedules[i].length; j++) {

            const elem = schedules[i][j];
            var obj = {
                'courseID': elem.courseID,
                'courseTitle': elem.courseTitle,
                'professor': elem.professor,
                'classNo': elem.classNo,
                'term': elem.term,
                "TBA": false,
                "daysOfWeek": [],
                "start": "",
                "end": "",
                '_id': elem.course_id,
                'dates': elem.dates,
                "duration": elem.daystimes,
                "status": elem.status,
                "color": elem.color,
                "priority": elem.priority,
                "courseScore": elem.courseScore,
                "professorScore": elem.professorScore,
                "rmpScore": elem.rmpScore
            }

            var dt = "";
            if (elem.daystimes){
                dt = elem.daystimes;
            } else {
                // we already modify this
                continue;
            }
            
            // console.log(elem);
            if (dt === "TBA") {
                obj['TBA'] = true;
                obj['duration'] = "TBA";
            }else{
                if (dt.includes('Su')) {
                    obj['daysOfWeek'].push(0);
                }
                if (dt.includes('Mo')) {
                    obj['daysOfWeek'].push(1);
                }
                if (dt.includes('Tu')) {
                    obj['daysOfWeek'].push(2);
                }
                if (dt.includes('We')) {
                    obj['daysOfWeek'].push(3);
                }
                if (dt.includes('Th')) {
                    obj['daysOfWeek'].push(4);
                }
                if (dt.includes('Fr')) {
                    obj['daysOfWeek'].push(5);
                }
                if (dt.includes('Sa')) {
                    obj['daysOfWeek'].push(6);
                }
                // timing = "10:30am - 1:30pm"
                const timing = dt.split(/ (.+)/)[1];
                obj['duration'] = timing;
                // convert 12 hour to 24 hour manner
                var toBeUpdated = timing.split(' - ');
                var start = toBeUpdated[0];
                var end = toBeUpdated[1];

                function convertTo24(t){
                    if (t.includes('am')){
                        t = t.replace(/am/g, ":00");
                    }
                    if (t.includes('pm')){
                        var temp = t.split(':');
                        if (temp[0] !== '12'){
                            t = (parseInt(temp[0]) + 12).toString() + ":" + temp[1];
                        }
                        t = t.replace(/pm/g, ":00");
                    }
                    return t;
                }

                obj['start'] = convertTo24(start);
                obj['end'] = convertTo24(end);
            }
            schedules[i][j] = obj;
        }
    }

    return schedules;
}

function cleanSchedule(allSchedules){

    var possibleSchedules = [];
    
    while(allSchedules.length !== 0){
        var oneSchedule = allSchedules.pop();
        // parse all sections in a schedule into weekdays: Su Mo Tu We Th Fr Sa
        var sectionByDays = [ [], [], [], [], [], [], [] ];

        for (let j = 0; j < oneSchedule.length; j++) {
            const oneSection = oneSchedule[j];
            const t = oneSection.daystimes.split(/ (.+)/);
            const days = t[0];
            if (days.includes('Su')) {
                sectionByDays[0].push(oneSection);
            }
            if (days.includes('Mo')) {
                sectionByDays[1].push(oneSection);
            }
            if (days.includes('Tu')) {
                sectionByDays[2].push(oneSection);
            }
            if (days.includes('We')) {
                sectionByDays[3].push(oneSection);
            }
            if (days.includes('Tu')) {
                sectionByDays[4].push(oneSection);
            }
            if (days.includes('Fr')) {
                sectionByDays[5].push(oneSection);
            }
            if (days.includes('Sa')) {
                sectionByDays[6].push(oneSection);
            }
        }

        var conflictFlag = false;
        for (let j = 0; j < sectionByDays.length; j++) {
            const oneDay = sectionByDays[j];
            for (let k = 0; k < oneDay.length; k++) {
                const oneSection = oneDay[k];
                const oneTime = oneSection.daystimes;
                for (let m = k + 1; m < oneDay.length; m++) {
                    const secSection = oneDay[m];
                    const secTime = secSection.daystimes;
                    const time1 = oneTime.split(/ (.+)/)[1];
                    const time2 = secTime.split(/ (.+)/)[1];
                    conflictFlag = timeOverlap(time1, time2);
                    if (conflictFlag){
                        allSchedules.push(removeSectionFromSchedule(oneSection, oneSchedule));
                        allSchedules.push(removeSectionFromSchedule(secSection, oneSchedule));
                        break;
                    }
                }
                if (conflictFlag) { break; }
            }
            if (conflictFlag) { break; }
        }

        if (!conflictFlag) {
            possibleSchedules.push(oneSchedule);
        }

    }

    var unsortedSchedules = convertDaystimes(possibleSchedules);

    return unsortedSchedules;
    // return convertDaystimes(possibleSchedules);
}

// [[section]]
// rankSchedule give the schedule a rank
// required and Open: 20
// required and Closed: 0 
// Interested and open: 4
// Interested and Closed: 0
// TBA and open: 0
// TBA and Closed: -5
function rankSchedule(allSchedules){
    console.log("sort schedules");
    var scores = []; // [index, scheduleScore]
    for (let i = 0; i < allSchedules.length; i++) {
        var scheduleScore = 0;
        // console.log("schedule", i);
        for (let j = 0; j < allSchedules[i].length; j++) {
            var priority = allSchedules[i][j].priority;
            var status = allSchedules[i][j].status;
            if (allSchedules[i][j].professor === "Staff"){
                scheduleScore -= 5;
            }
            // console.log(allSchedules[i][j].courseTitle, priority, status, allSchedules[i][j].TBA);
            if (allSchedules[i][j]['TBA'] && status === 'Open') {
              // console.log('TBA && Open');
              continue;
            }
            
            if (allSchedules[i][j]['TBA'] && priority === 'required' && status !== 'Open') {
              // console.log('TBA && !Open');
              scheduleScore -= 20;
              continue;
            }

            if (allSchedules[i][j]['TBA']) {
                // console.log('TBA && !Open');
                scheduleScore -= 25;
                continue;
            }

            // required
            if (priority === 'required' && status === 'Open'){
                // console.log('required && Open');
                scheduleScore += 20;
                continue;
            }
            if (priority === 'required' && status === 'Closed') {
                scheduleScore -= 5;
                continue;
            }
            // waitlist
            if (priority === 'required') {
                scheduleScore -= 3;
                continue;
            }

            // interested
            if (priority === 'interested' && status === 'Open'){
                // console.log('interested && Open');
                scheduleScore += 4;
                continue;
            }
            if (priority === 'interested' && status === 'Closed'){
                scheduleScore -= 12;
                continue;
            }
            // waitlist
            if (priority === 'interested'){
                scheduleScore -= 8;
                continue;
            }
        }
        scores.push([i, scheduleScore]);
    }

    var sortedScores = scores.sort(function(a, b){
        // return < 0 to sort a in front of b
        return b[1] - a[1]; 
    });

    var sortedSchedules = [];

    // sort teh schedule based on the sortedScores;
    for (let i = 0; i < allSchedules.length; i++) {
        sortedSchedules.push(allSchedules[sortedScores[i][0]]);
    }

    // deduplicate schedules based on classNo
    console.log("deduplicate schedules");
    uniqueSchedule = {};
    result = [];
    for (let i = 0; i < sortedSchedules.length; i++) {
        const s = sortedSchedules[i]; // one schedule;
        var currSections = [];
        for (let j = 0; j < sortedSchedules[i].length; j++) {
          currSections.push(sortedSchedules[i][j].classNo);
        }

        const sectionKey = JSON.stringify(currSections.sort());
        if (uniqueSchedule.hasOwnProperty(sectionKey)) {
            continue;
        } else {
            uniqueSchedule[sectionKey] = 1;
            result.push(sortedSchedules[i]);
        }
    }

    return result;
}


// format "10:40am - 12:30pm", "12:20pm - 13:50pm"
// return true
function timeOverlap(time1, time2) {

    var tl = time1.replace(/am/g, " AM");
    tl = tl.replace(/pm/g, " PM");
    var tr = time2.replace(/am/g, " AM");
    tr = tr.replace(/pm/g, " PM");

    const t1 = tl.split(" - ");
    const t2 = tr.split(" - ");

    const t1start = dateConverter.parse(t1[0], pattern);
    const t1end = dateConverter.parse(t1[1], pattern);
    const t2start = dateConverter.parse(t2[0], pattern);
    const t2end = dateConverter.parse(t2[1], pattern);

    return (t1start <= t2start && t2start <= t1end) || (t2start <= t1start && t1start <= t2end);
}

module.exports = {
    Query: {
        async getShoppingCart(_, {
            username
        },
        context) {
            const tempUser = checkAuth(context);
            if (username === tempUser.username){
                try {
                    const user = await User.findOne({
                        username: tempUser.username
                    });

                    return await fromShoppingCartGetCourseInfo(user.shoppingCart);

                } catch (err){
                    throw new Error(err);
                }

            }else {
                throw new Error("User not match");
            }
        },

        async generateSchedule(_, {
            username, term, intendedCourses, onlyOpen
        },
        context){
            const tempUser = checkAuth(context);
            if (username === tempUser.username) {
              try { 
                const user = await User.findOne({
                    username: tempUser.username
                });
                // Assume all courses are required
                // TODO add priority
                // get all the sections
                var cart = user.shoppingCart.filter(elem => intendedCourses.includes(elem.course_id.toString()));
                // var cart = user.shoppingCart;
                var allSections = [];
                var priority = {};
                var colormap = {};
                var result = {};
                result['noSection'] = [];
                var course_id = {};

                var courseContainSection = 0;
                for (let i = 0; i < cart.length; i++) {
                    const map_key = cart[i].courseID + cart[i].courseTitle;

                    priority[map_key] = cart[i].priority;
                    course_id[map_key] = cart[i].course_id;
                    
                    colormap[map_key] = colorPanel[courseContainSection % colorPanel.length];
                    
                    // round to 2 digits
                    var course_score = Math.round(((await Course.findOne({
                      courseID: cart[i].courseID,
                      courseTitle: cart[i].courseTitle
                    })).score + Number.EPSILON) * 100) / 100;

                    // for scoring to display in frontend
                    var professor_name = "";
                    // professor_name-> overall score
                    var professor_score = {};
                    var professor_rscore = {};
                    // no open section
                    const sections1 = await Section.find({
                        courseID: cart[i].courseID,
                        courseTitle: cart[i].courseTitle,
                        status: "Open",
                        term: term
                    });
                    const sections2 = await Section.find({
                        courseID: cart[i].courseID,
                        courseTitle: cart[i].courseTitle,
                        term: term
                    });

                    if (sections1.length === 0){
                        cart[i]['reason'] = "No open section in " + term;
                            result['noSection'].push(cart[i]);
                        if (onlyOpen === true){
                            continue;
                        }
                    }

                    if (sections2.length === 0) {
                        cart[i]['reason'] = "Course not offer in " + term;
                        result['noSection'].push(cart[i]);
                        continue;
                    }

                    var sectionWithPriorty = [];
                    
                    if (onlyOpen == true){
                        // there are some sections that only the classNo is different.
                        // remove those given we need scheduling. This also solves the TBA duplicates.
                        sectionWithPriorty = Array.from(new Set(sections1.map(a => (a.professor + a.daystimes + a.status))))
                            .map(id => {
                                return sections1.find(a => (a.professor + a.daystimes + a.status) === id)
                            })
                    } else {
                        // there are some sections that only the classNo is different.
                        // remove those given we need scheduling. This also solves the TBA duplicates.
                        sectionWithPriorty = Array.from(new Set(sections2.map(a => (a.professor + a.daystimes + a.status))))
                            .map(id => {
                                return sections2.find(a => (a.professor + a.daystimes + a.status) === id)
                            })
                    }

                    courseContainSection += 1;

                    for (let j = 0; j < sectionWithPriorty.length; j++) {
                        const element = sectionWithPriorty[j];
                        // gathering info
                        professor_name = element.professor;
                        if (!professor_score.hasOwnProperty(professor_name)) {
                            const p = await Professor.findOne({
                              name: professor_name
                            });
                            if (p){
                                professor_score[professor_name] = Math.round((p.score + Number.EPSILON) * 100) / 100;
                                if(p.rscore){
                                    professor_rscore[professor_name] = p.rscore;
                                }else {
                                    professor_rscore[professor_name] = 0;
                                }
                            } else {
                                professor_score[professor_name] = 0;
                                professor_rscore[professor_name] = 0;
                            }
                        }

                        // console.log(course_score_with_professor);

                        sectionWithPriorty[j]['priority'] = priority[element.courseID + element.courseTitle];
                        sectionWithPriorty[j]['course_id'] = course_id[element.courseID + element.courseTitle];
                        sectionWithPriorty[j]['courseScore'] = course_score;
                        
                        if (professor_score.hasOwnProperty(professor_name)){
                            sectionWithPriorty[j]['professorScore'] = professor_score[professor_name];
                            if (professor_rscore.hasOwnProperty(professor_name)){
                                sectionWithPriorty[j]['rmpScore'] = professor_rscore[professor_name];
                            }
                        }

                        sectionWithPriorty[j]['color'] = colormap[element.courseID + element.courseTitle];
                        if (sectionWithPriorty[j]['status'] !== "Open") {
                            sectionWithPriorty[j]['color'] = closedColor;
                        }
                    }
                    allSections.push(sectionWithPriorty);
                }
                // console.log("color mapping", colormap);
                // cartesian products to find all potential schedule
                var unsortedSchedules = cleanSchedule(product(allSections));
                var sortedSchedules = rankSchedule(unsortedSchedules);
                result['schedule'] = sortedSchedules;
                result['noSection'] = result['noSection'].filter(function unique(value, index, self){
                    return self.indexOf(value) === index;
                });
                return result;
              } catch (err) {
                throw new Error(err);
              }

            } else {
              throw new Error("User not match");
            }
        }
    },
    Mutation: {
        async addToShoppingCart(_, {
            username,
            courseID,
            courseTitle,
            priority
        }, context) {
            const tempUser = checkAuth(context);
            if (tempUser.username === username) {
                try{
                    const user = await User.findOne({
                        username: tempUser.username
                    });
                    var newShoppingCart = user.shoppingCart;
                    for (let index = 0; index < newShoppingCart.length; index++) {
                        const element = newShoppingCart[index];
                        if(courseID === element.courseID && courseTitle === element.courseTitle){
                            throw new Error( courseID + ' ' + courseTitle + ' is already in shopping cart');
                        }
                    }
                    
                    const courseExist = await Course.findOne({
                        courseID: courseID,
                        courseTitle: courseTitle
                    });

                    if (courseExist){
                        newShoppingCart.push({
                            'courseID': courseID,
                            'courseTitle': courseTitle,
                            'course_id': courseExist._id,
                            'priority': priority
                        });
                        await User.updateOne({
                            username: tempUser.username
                        }, {
                        $set: {
                            shoppingCart: newShoppingCart
                        }
                        });
                        return (await fromShoppingCartGetCourseInfo(newShoppingCart))['courses'];
                    } else {
                        throw new Error(courseID + ' ' + courseTitle + ' does not exist')
                    }

                } catch (err){
                    throw new Error(err);
                }

            } else {
                throw new Error("User not match");
            }
        },
        async removeFromShoppingCart(_, {
            username,
            courseID,
            courseTitle
        }, context){
            const tempUser = checkAuth(context);
            if (tempUser.username === username) {

                try {
                    const user = await User.findOne({
                        username: tempUser.username
                    });
                    var newShoppingCart = user.shoppingCart;
                    for (let index = 0; index < newShoppingCart.length; index++) {
                        const element = newShoppingCart[index]
                        if (element.courseID == courseID && courseTitle) {
                            newShoppingCart.splice(index, 1);
                            await User.updateOne({
                                username: tempUser.username
                            }, {
                                $set: {
                                    shoppingCart: newShoppingCart
                                }
                            });
                            return (await fromShoppingCartGetCourseInfo([element]))['courses'][0];
                        }
                    }
                    throw new Error("Cannot find " + courseID + " " + courseTitle + " in user shopping cart");
                } catch (err) {
                    throw new Error(err);
                }

            } else {
              throw new Error("User not match");
            }
        },

        async changeCoursePriority(_, {
            username,
            courseID,
            courseTitle,
            priority
        }, context){
            const tempUser = checkAuth(context);
            if (tempUser.username === username) {
              try {
                const user = await User.findOne({
                  username: tempUser.username
                });
                var newShoppingCart = user.shoppingCart;
                for (let index = 0; index < newShoppingCart.length; index++) {
                    const element = newShoppingCart[index];
                    if (element.courseID === courseID && element.courseTitle === courseTitle){
                        newShoppingCart[index].priority = priority;
                        await User.updateOne({
                            username: tempUser.username
                        }, {
                            $set: {
                                shoppingCart: newShoppingCart
                            }
                        });
                        return (await fromShoppingCartGetCourseInfo([element]))['courses'][0];
                    }
                }

                throw new Error("Cannot find " + courseID + " " + courseTitle + " in user shopping cart");
              } catch (err) {
                throw new Error(err);
              }

            } else {
              throw new Error("User not match");
            }
        }
    }
}