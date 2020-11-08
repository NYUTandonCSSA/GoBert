const Professor = require('../../models/Professor')
const RateSummary = require('../../models/RateSummary')
const Rate = require('../../models/Rate')
const escapeRegex = require('../../utils/escape')
const Teach = require('../../models/Teach')
const Course = require('../../models/Course')
const displayScoreRound = require('../../utils/displayScoreRound')

module.exports = {
  ProfQuery: {
    GetProfessorDetail: {
      // if empty, means no result
      async getProfessorDetail(_, { query }, context) {
        try {
          var professor = await Professor.findOne({
            name: query,
          })
          if (!professor) {
            throw new Error('Cannot find professor ' + query)
          }
          var teaches = await Teach.find({
            professor: query,
          })
          var profStats = []
          for (let i = 0; i < teaches.length; i++) {
            const courseID = teaches[i]['courseID']
            const courseTitle = teaches[i]['courseTitle']
            const professor = teaches[i]['professor']
            var rating = await RateSummary.findOne({
              courseID: courseID,
              courseTitle: courseTitle,
              professor: professor,
            })
            var ratings = await Rate.find({
              courseID: courseID,
              courseTitle: courseTitle,
              professor: professor,
            })
            var course = await Course.findOne({
              courseID: courseID,
              courseTitle: courseTitle,
            })

            if (!rating) {
              rating = {
                courseID: courseID,
                courseTitle: courseTitle,
                avgProfScore: 0.0,
                avgCourseScore: 0.0,
                numRate: 0,
                professor: professor,
                ratings: [],
                course_id: course._id,
              }
            } else {
              rating['ratings'] = ratings
              rating['avgProfScore'] = displayScoreRound(rating['avgProfScore'])
              rating['avgCourseScore'] = displayScoreRound(
                rating['avgCourseScore']
              )
              rating['course_id'] = course._id
            }
            profStats.push(rating)
          }

          professor['score'] = displayScoreRound(professor['score'])
          professor['rateSummary'] = profStats
          return professor
        } catch (err) {
          throw new Error(err)
        }
      },
    },
  },
}
