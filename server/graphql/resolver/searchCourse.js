const Course = require('../../models/Course');
const RateSummary = require('../../models/RateSummary');
const Rate = require('../../models/Rate');
const escapeRegex = require("../../utils/escape");
const Teach = require('../../models/Teach');
const {
  Types
} = require('mongoose');

var ObjectId = Types.ObjectId;

module.exports = {
	CourseQuery: {
		GetCourseDetail: {
			async getCourseDetail(_,
			{
				id
			}, 
			context,
			info){
				try {
                    var course = await Course.findOne({
                        _id: ObjectId(id)
					});
					if (!course){
						throw new Error("Cannot find Course");
					}
					const sections = await Teach.find({
						courseID: course.courseID,
						courseTitle: course.courseTitle,
					});
                    var courseStats = [];
					for (let i = 0; i < sections.length; i++) {
						const prof = sections[i]['professor'];
						if (prof === "Staff"){
							continue;
						}
						var rating = await RateSummary.findOne({
							courseID: course.courseID,
							courseTitle: course.courseTitle,
							professor: prof
						});
						var ratings = await Rate.find({
							courseID: course.courseID,
							courseTitle: course.courseTitle,
							professor: prof
						});
						
						if (!rating) {
							rating = {
								'courseID': course.courseID,
								'courseTitle': course.courseTitle,
								'avgProfScore': 0.0,
								'avgCourseScore': 0.0,
								'numRate': 0,
								'professor': prof,
								'ratings': []
							}
						}else{
							rating['ratings'] = ratings;
							rating['avgProfScore'] = Math.round((rating['avgProfScore'] + Number.EPSILON) * 100) / 100
							rating['avgCourseScore'] = Math.round((rating['avgCourseScore'] + Number.EPSILON) * 100) / 100
						}
                        courseStats.push(rating);
                    }
					course['score'] = Math.round((course['score'] + Number.EPSILON) * 100) / 100
                    course['rateSummary'] = courseStats;
                    return course;
				} catch (err) {
				  throw new Error(err);
				}
			}
		},

		QuerySectionExact: {
			// if empty, means no result
			async searchSectionExact(_, 
			{
				searchSectionStatInput: {
					cID,
					cTitle,
					prof
				}
			}, 
			context,
			info) {
				try {
					const stats = await RateSummary.find({
						courseID: cID,
						courseTitle: cTitle,
						professor: prof
					});
					return stats;
				} catch (err) {
					throw new Error(err);
				}
			}
		}
	}
}