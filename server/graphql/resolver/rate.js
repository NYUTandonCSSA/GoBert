const {
  AuthenticationError
} = require('apollo-server');

const Rate = require('../../models/Rate');
const RateSummary = require('../../models/RateSummary');
const Professor = require('../../models/Professor');
const Course = require('../../models/Course');
const checkAuth = require('../../utils/checkAuth');

module.exports = {
    Query: {
      // given rateID. return the rate
      async getOneRating(_, {rateId}){
        try{
          return await Rate.findById(rateId);
        }catch (err) {
          throw new Error(err);
        }
      },
      // given courseID, courseTitle, professorname, return all the ratings of that 
      // courseID+courseTitle+Professor 
      async getRatings(_,
      {
        searchCourseInput: {
          cID,
          cTitle,
          professor
        }
      }, 
      context,
      info){
        try {
          var rateSummaries = await Rate.find({
            courseID: cID,
            courseTitle: cTitle,
            professor: professor
          }).sort({ createdAt: -1 });
          return rateSummaries;
        } catch (err) {
          throw new Error(err);
        }
      }
    },

    Mutation: {
      async postRate(_, { 
        rateInput: {
          courseID, courseTitle, courseScore, professor,
          professorScore, term, anonymity, comment
        }
      },
      context,
      info){
        const user = checkAuth(context);
        try{
          // TODO: Fault Tolerant, if anything fail, nothing should be committed.
          
          // Check if that user already rate the course
          const oldRate = await Rate.findOne({
            username: user.username,
            courseID,
            courseTitle,
            professor
          });
          if (oldRate) {
            throw Error("User already rated this course");
          }
          
          // Check if the professor exists
          const currProf = await Professor.findOne({
            name: professor
          });
          if (!currProf){
            throw Error("professor " + professor + " not exists");
          }

          // Check if the course exists
          const currCourse = await Course.findOne({
            courseID,
            courseTitle
          });
          if (!currCourse) {
            throw Error("course " + courseID + ": " + courseTitle + " not exists");
          }

          // create a new rate
          const newRate = new Rate({
            username: user.username,
            courseTitle, courseID, courseScore,
            term, anonymity, professor,
            professorScore, comment,
            upvotes: [], downvotes: [],
            createdAt: new Date().toISOString()
          });
          const rate = await newRate.save();

          // Update RateSummary
          const ratesum = await RateSummary.findOne({
            courseID,
            courseTitle,
            professor
          });
          var newRateSummary = new RateSummary({
            courseID, courseTitle, professor,
            numRate: 1,
            avgProfScore: professorScore,
            avgCourseScore: courseScore
          });

          if (ratesum) {
            await RateSummary.updateOne({
              courseID, courseTitle, professor
            }, {
              $set: {
                avgProfScore: (ratesum.avgProfScore * ratesum.numRate + professorScore) / (ratesum.numRate + 1),
                avgCourseScore: (ratesum.avgCourseScore * ratesum.numRate + courseScore) / (ratesum.numRate + 1),
                numRate: ratesum.numRate + 1
              }
            });

            newRateSummary = await RateSummary.findOne({
              courseID, courseTitle, professor
            });
          } else {
            newRateSummary = await newRateSummary.save();
          }

          // Update Prof Score
          await Professor.updateOne({ name: professor }, 
          {
            $set: {
              score: ((currProf.score * currProf.numRate) + professorScore) / (currProf.numRate + 1),
              numRate: currProf.numRate + 1,
            }
          });

          // Update Course Score
          await Course.updateOne({ courseID, courseTitle }, 
          {
            $set: {
              score: ((currCourse.score * currCourse.numRate) + courseScore) / (currCourse.numRate + 1),
              numRate: currCourse.numRate + 1
            }
          })

          const ratings = await Rate.find({
            courseID: courseID,
            courseTitle: courseTitle,
            professor: professor
          })

          newRateSummary['ratings'] = ratings;
          newRateSummary.avgCourseScore = Math.round((newRateSummary.avgCourseScore + Number.EPSILON) * 100) / 100
          newRateSummary.avgProfScore = Math.round((newRateSummary.avgProfScore + Number.EPSILON) * 100) / 100
          return await newRateSummary;

        } catch(err){
          throw new Error(err);
        }
      },

      // deleteRate follows a similar logic to postRate
      async deleteRate(_, { rateId }, context){
        const user = checkAuth(context);
        try{
          const rate = await Rate.findById(rateId);
          if (!rate) {
            throw new Error("Rate doesn't Exist");
          }
          if (user.username === rate.username){
            // delete the rate
            await rate.delete();
            // decrease rateSummary Score
            const ratesum = await RateSummary.findOne({
              courseID: rate.courseID,
              courseTitle: rate.courseTitle,
              professor: rate.professor
            });
            if (ratesum.numRate != 1){
              await RateSummary.updateOne({
                courseID: rate.courseID,
                courseTitle: rate.courseTitle,
                professor: rate.professor
              }, {
                $set: {
                  avgProfScore: (ratesum.avgProfScore * ratesum.numRate - rate.professorScore) / (ratesum.numRate - 1),
                  avgCourseScore: (ratesum.avgCourseScore * ratesum.numRate - rate.courseScore) / (ratesum.numRate - 1),
                  numRate: ratesum.numRate - 1
                }
              });
            } else {
              await RateSummary.updateOne({
                courseID: rate.courseID,
                courseTitle: rate.courseTitle,
                professor: rate.professor
              }, {
                $set: {
                  avgProfScore: 0,
                  avgCourseScore: 0,
                  numRate: 0
                }
              });
            }
            // decrease professor score
            const prof = await Professor.findOne({ name: rate.professor });
            if (prof.numRate != 1){
              await Professor.updateOne({
                name: prof.name
              }, {
                $set: {
                  score: ((prof.score * prof.numRate) - rate.professorScore) / (prof.numRate - 1),
                  numRate: prof.numRate - 1,
                }
              });
            }else {
              await Professor.updateOne({
                name: prof.name
              }, {
                $set: {
                  score: 0,
                  numRate: 0,
                }
              });
            }
            // decrease course score
            const course = await Course.findOne({
              courseID: rate.courseID,
              courseTitle: rate.courseTitle
            });
            if (course.numRate != 1) {
              await Course.updateOne({
                courseID: rate.courseID,
                courseTitle: rate.courseTitle
              }, {
                $set: {
                  score: ((course.score * course.numRate) - rate.courseScore) / (course.numRate - 1),
                  numRate: course.numRate - 1,
                }
              });
            } else {
              await Course.updateOne({
                courseID: rate.courseID,
                courseTitle: rate.courseTitle
              }, {
                $set: {
                  score: 0,
                  numRate: 0,
                }
              });
            }

            // reutrn the rateSummary[ratings]
            var rateSummary = await RateSummary.findOne({
              courseID: rate.courseID,
              courseTitle: rate.courseTitle,
              professor: rate.professor
            });

            const ratings = await Rate.find({
              courseID: rate.courseID,
              courseTitle: rate.courseTitle,
              professor: rate.professor
            })

            rateSummary['ratings'] = ratings;
            rateSummary.avgCourseScore = Math.round((rateSummary.avgCourseScore + Number.EPSILON) * 100) / 100
            rateSummary.avgProfScore = Math.round((rateSummary.avgProfScore + Number.EPSILON) * 100) / 100
            return rateSummary;
          }else{
            throw new AuthenticationError('Action not allowed');
          }
        } catch (err) {
          throw new Error(err);
        }
      }
    }
}