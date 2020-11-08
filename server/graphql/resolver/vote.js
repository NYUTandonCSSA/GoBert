const { AuthenticationError } = require('apollo-server')

const Rate = require('../../models/Rate')
const checkAuth = require('../../utils/checkAuth')

module.exports = {
  Mutation: {
    async upvote(_, { rateId }, context) {
      const user = checkAuth(context)
      try {
        var rate = await Rate.findById(rateId)
        if (!rate) {
          throw new Error("Rate doesn't Exist")
        }
        var upvotes = rate.upvotes
        var downvotes = rate.downvotes
        const index1 = upvotes.indexOf(user.username)
        const index2 = downvotes.indexOf(user.username)

        if (index1 > -1) {
          upvotes.splice(index1, 1)
        } else {
          upvotes.push(user.username)
        }
        if (index2 > -1) {
          downvotes.splice(index2, 1)
        }

        await Rate.updateOne(
          {
            _id: rateId,
          },
          {
            $set: {
              upvotes: upvotes,
              downvotes: downvotes,
            },
          }
        )

        rate['upvotes'] = upvotes
        rate['downvotes'] = downvotes
        return rate
      } catch (err) {
        throw new Error(err)
      }
    },
    async downvote(_, { rateId }, context) {
      const user = checkAuth(context)
      try {
        const rate = await Rate.findById(rateId)
        if (!rate) {
          throw new Error("Rate doesn't Exist")
        }

        var upvotes = rate.upvotes
        var downvotes = rate.downvotes
        const index1 = upvotes.indexOf(user.username)
        const index2 = downvotes.indexOf(user.username)

        if (index1 > -1) {
          upvotes.splice(index1, 1)
        }

        if (index2 > -1) {
          downvotes.splice(index2, 1)
        } else {
          downvotes.push(user.username)
        }

        await Rate.updateOne(
          {
            _id: rateId,
          },
          {
            $set: {
              upvotes: upvotes,
              downvotes: downvotes,
            },
          }
        )

        rate['upvotes'] = upvotes
        rate['downvotes'] = downvotes
        return rate
      } catch (err) {
        throw new Error(err)
      }
    },
  },
}
