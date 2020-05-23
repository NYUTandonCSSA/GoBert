// Some utility functions to clear the backend data. Non-essential

const Course = require('../../models/Course');
const Professor = require('../../models/Professor');
const Rate = require('../../models/Rate');
const RateSummary = require('../../models/RateSummary');
const Section = require('../../models/Section');
const User = require('../../models/User');

module.exports = {
    Mutation: {
        async getFirstLastName(_, {
            password
        }){
            // await Professor.update({}, {
            //     $set:{
            //         firstname: "f",
            //         lastname: "l"
            //     }
            // })
            const professors = await Professor.find({});
            for (let i = 0; i < professors.length; i++) {
                const elem = professors[i];
                var temp = elem.name.split(' ');
                var fname = temp[0];
                var lname = temp[temp.length - 1];
                await Professor.updateOne({
                  name: elem.name
                }, {
                  $set: {
                    firstname: fname,
                    lastname: lname
                  }
                });
            }

            return 'updated all professors fname and lname';
        },
        async getFullCourseName(_, {
            password
        }){
            const courses = await Course.find({});
            for (let i = 0; i < courses.length; i++) {
                const elem = courses[i];
                var total = (elem.courseID + ' ' + elem.courseTitle).replace(/[^a-zA-Z0-9 ]+/g, "");
                total = total.replace(/\s\s+/g, ' ');
                var total_concat = total.replace(/\s/g, '');
                await Course.updateOne({
                    courseID: elem.courseID,
                    courseTitle: elem.courseTitle
                }, {
                    $set: {
                        _total: total,
                        _total_concat: total_concat
                    }
                });
            }

            return 'updated all courses';
        },
        async clearAll(_, {
            password
        }){ 
            // await Section.updateMany({}, {
            //   $rename: {
            //     "daystimes": "dt"
            //   }
            // });
            // return "halo";
            if (password !== 'Kaixuan'){
                throw new Error('incorrect password');
            }

            const users = await User.find({});

            for (let i = 0; i < users.length; i++) {
                var cart = users[i].shoppingCart;
                for (let j = 0; j < cart.length; j++) {
                    var c = cart[j];
                    console.log(c, c.courseID, c.courseTitle);
                    const course_id = (await Course.findOne({
                        courseID: c.courseID,
                        courseTitle: c.courseTitle
                    }))._id.toString();
                    
                    cart[j].course_id = course_id;
                }

                await User.updateOne({
                    username: users[i].username
                }, {
                    $set: {
                        shoppingCart: cart
                    }
                });
            }


            const rates = await Rate.find({});
            const courses = [];
            const professors = [];
            const rateSummaries = [];
            
            for (let i = 0; i < rates.length; i++) {
                const rate = rates[i];
                const ci = courses.findIndex(element => element.courseID === rate.courseID && element.courseTitle === rate.courseTitle);
                const pi = professors.findIndex(element => element.name === rate.professor);
                const ri = rateSummaries.findIndex(element => element.courseID === rate.courseID && element.courseTitle === rate.courseTitle && element.professor === rate.professor);
                // course not exist
                if (ci === -1){
                    courses.push({
                        'courseID': rate.courseID,
                        'courseTitle': rate.courseTitle,
                        'score': rate.courseScore,
                        'numRate': 1
                    });
                }else{
                    const score = courses[ci]['score'];
                    const numRate = courses[ci]['numRate'];
                    courses[ci]['score'] = (score * numRate + rate.courseScore) / (numRate + 1.0);
                    courses[ci]['numRate'] += 1;
                }
                // professor not exist
                if (pi === -1){
                    professors.push({
                        'name': rate.professor,
                        'numRate': 1,
                        'score': rate.professorScore
                    })
                } else {
                    const score = professors[pi]['score'];
                    const numRate = professors[pi]['numRate'];
                    professors[pi]['score'] = (score * numRate + rate.professorScore) / (numRate + 1.0);
                    professors[pi]['numRate'] += 1;
                }
                // rateSummary not exist
                if (ri === -1) {
                    rateSummaries.push({
                        'professor': rate.professor,
                        'courseID': rate.courseID,
                        'courseTitle': rate.courseTitle,
                        'avgCourseScore': rate.courseScore,
                        'avgProfScore': rate.professorScore,
                        'numRate': 1
                    })
                } else {
                    const avgCourseScore = rateSummaries[ri]['avgCourseScore'];
                    const avgProfScore = rateSummaries[ri]['avgProfScore'];
                    const numRate = rateSummaries[ri]['numRate'];
                    rateSummaries[ri]['avgCourseScore'] = (avgCourseScore * numRate + rate.courseScore) / (numRate + 1.0);
                    rateSummaries[ri]['avgProfScore'] = (avgProfScore * numRate + rate.professorScore) / (numRate + 1.0);
                    rateSummaries[ri]['numRate'] += 1;
                }
            }

            // clear db course;
            await Course.updateMany({}, {
                $set: {
                    numRate: 0,
                    score: 0
                }
            });
            // clear db professor;
            await Professor.updateMany({}, {
                $set: {
                  numRate: 0,
                  score: 0
                }
            });
            // clear db rateSummary;
            await RateSummary.updateMany({}, {
                $set: {
                    numRate: 0,
                    avgCourseScore: 0.0,
                    avgProfScore: 0.0
                }
            });

            // update db course;
            for (let i = 0; i < courses.length; i++) {
                const element = courses[i];
                await Course.updateOne({
                    courseID: element.courseID,
                    courseTitle: element.courseTitle
                }, {
                    $set: element
                });
            }

            // update professor;
            for (let i = 0; i < professors.length; i++) {
                const element = professors[i];
                await Professor.updateOne({
                    name: element.name
                }, {
                    $set: element
                });
            }
            
            // update rateSummary;
            for (let i = 0; i < rateSummaries.length; i++) {
                const element = rateSummaries[i];
                await RateSummary.updateOne({
                    courseID: element['courseID'],
                    courseTitle: element['courseTitle'],
                    professor: element['professor']
                }, {
                    $set: {
                        numRate: element['numRate'],
                        avgProfScore: element['avgProfScore'],
                        avgCourseScore: element['avgCourseScore']
                    }
                });
            }

            return "finish update db";
        }
    }
}