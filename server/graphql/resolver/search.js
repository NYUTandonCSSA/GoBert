// const stringSimilarity = require('string-similarity');
// const leven = require('leven');

const Professor = require('../../models/Professor')
const RMP = require('../../models/RMPRecord')
const escapeRegex = require('../../utils/escape')
const escapeCourse = require('../../utils/escapeCourse')
const displayScoreRound = require('../../utils/displayScoreRound')
const Course = require('../../models/Course')

async function searchRMP(query) {
  // check if ',' in query: split it, find fname and lname
  // else: split by space, treat the first as fname, the last as lname
  // do a search with fullname.
  // if the query doesn't contain comma nor space
  if (!query.includes(',') && !query.includes(' ')) {
    const fuzzyQuery = new RegExp(escapeRegex(query), 'gi')
    return await RMP.find({
      $or: [
        {
          lastname: fuzzyQuery,
        },
        {
          firstname: fuzzyQuery,
        },
        {
          name: fuzzyQuery,
        },
      ],
    })
  }

  // look up the entire escaped query
  var professors = await RMP.find({
    name: new RegExp(escapeRegex(query), 'gi'),
  })

  // try firstname and lastname
  if (professors.length === 0) {
    var fname = ''
    var lname = ''
    if (query.includes(',')) {
      var name = query.split(',')
      fname = name[1].trim()
      if (fname.includes('.')) {
        var temp = fname.split('.')
        fname = temp[0].trim()
      }
      lname = name[0].trim()
    } else {
      var name = query.split(' ')
      fname = name[0].trim()
      lname = name[name.length - 1].trim()
    }

    professors = await RMP.find({
      firstname: new RegExp(escapeRegex(fname), 'gi'),
      lastname: new RegExp(escapeRegex(lname), 'gi'),
    })
  }

  // try reverse firstname and lastname
  if (professors.length === 0) {
    if (query.includes(',')) {
      var name = query.split(',')
      lname = name[1].trim()
      if (lname.includes('.')) {
        var temp = fname.split('.')
        lname = temp[0].trim()
      }
      fname = name[0].trim()
    } else {
      var name = query.split(' ')
      lname = name[0].trim()
      fname = name[name.length - 1].trim()
    }

    professors = await RMP.find({
      firstname: new RegExp(escapeRegex(fname), 'gi'),
      lastname: new RegExp(escapeRegex(lname), 'gi'),
    })
  }
  for (let i = 0; i < professors.length; i++) {
    professors[i]['category'] = 'Professor'
  }
  return await professors
}

// exact same logic. Maybe combine the database of RMP and professor together?
async function searchProfessor(query) {
  // check if ',' in query: split it, find fname and lname
  // else: split by space, treat the first as fname, the last as lname
  // do a search with fullname.

  // if the query doesn't contain comma nor space
  if (!query.includes(',') && !query.includes(' ')) {
    const fuzzyQuery = new RegExp(escapeRegex(query), 'gi')
    return await Professor.find({
      $or: [
        {
          lastname: fuzzyQuery,
        },
        {
          firstname: fuzzyQuery,
        },
        {
          name: fuzzyQuery,
        },
      ],
    })
  }

  // look up the entire escaped query
  var professors = await Professor.find({
    name: new RegExp(escapeRegex(query), 'gi'),
  })

  // try firstname and lastname
  if (professors.length === 0) {
    var fname = ''
    var lname = ''
    if (query.includes(',')) {
      var name = query.split(',')
      fname = name[1].trim()
      if (fname.includes('.')) {
        var temp = fname.split('.')
        fname = temp[0].trim()
      }
      lname = name[0].trim()
    } else {
      var name = query.split(' ')
      fname = name[0].trim()
      if (fname.includes('.')) {
        var temp = fname.split('.')
        fname = temp[0].trim()
      }
      lname = name[name.length - 1].trim()
    }

    professors = await Professor.find({
      firstname: new RegExp(escapeRegex(fname), 'gi'),
      lastname: new RegExp(escapeRegex(lname), 'gi'),
    })
  }

  // try reverse firstname and lastname
  if (professors.length === 0) {
    if (query.includes(',')) {
      var name = query.split(',')
      lname = name[1].trim()
      if (lname.includes('.')) {
        var temp = fname.split('.')
        lname = temp[0].trim()
      }
      fname = name[0].trim()
    } else {
      var name = query.split(' ')
      lname = name[0].trim()
      fname = name[name.length - 1].trim()
    }

    professors = await Professor.find({
      firstname: new RegExp(escapeRegex(fname), 'gi'),
      lastname: new RegExp(escapeRegex(lname), 'gi'),
    })
  }

  return await professors
}

async function searchCourse(query) {
  // TODO
  // remove special characters
  // search courseID union courseTitle union _total
  // remove special characters and turm all consecutive white spaces into one white space

  query = query.replace('\n', ' ')
  const albert_regex = /[a-z]+-[a-z]+ [0-9a-z]+-[0-9a-z]+ \([0-9]+\)/g

  if (query.match(albert_regex)) {
    const s = query.split('-')
    query = s[0] + s[1]
  }

  const fuzzyQuery = escapeCourse(query)
  return await Course.find({
    $or: [
      {
        _total: new RegExp(fuzzyQuery, 'gi'),
      },
      {
        _total_concat: new RegExp(fuzzyQuery.replace(' ', ''), 'gi'),
      },
    ],
  })
}

async function searchGobert(query) {
  // for first time look up
  query = query.toLowerCase()
  var professors = await searchProfessor(query)
  var courses = await searchCourse(query)

  // for second time look up and sorting
  var lookupWords = query.split(' ')
  var i = lookupWords.length
  // remove the words that have length < median length;
  var medianLength = lookupWords.sort((a, b) => a.length - b.length)
  var median = medianLength[Math.floor(medianLength.length / 2)]
  while (i--) {
    if (lookupWords[i].length < median) {
      lookupWords.splice(i, 1)
    }
  }

  function countOccurence(str1, array) {
    str1 = str1.toLowerCase()
    var c = 0
    for (var i = array.length - 1; i >= 0; i--) {
      if (str1.indexOf(array[i]) !== -1) {
        str1.replace(array[i])
        c += 1
      }
    }
    return c
  }

  function compare(a, b) {
    var countA = 0
    var countB = 0
    countA += countOccurence(a.name, lookupWords)
    countB += countOccurence(b.name, lookupWords)

    if (countA > countB) {
      return -1
    }
    if (countB < countA) {
      return 1
    }
    return 0
  }

  for (let i = 0; i < professors.length; i++) {
    professors[i]['category'] = 'Professor'
    professors[i]['professor'] = professors[i]['name']
  }
  for (let i = 0; i < courses.length; i++) {
    courses[i]['category'] = 'Course'
    courses[i]['name'] =
      courses[i]['courseID'] + ': ' + courses[i]['courseTitle']
  }
  var result = professors.concat(courses)

  for (let i = 0; i < result.length; i++) {
    result[i]['score'] = displayScoreRound(result[i]['score'])
  }

  return result.sort(compare)
}

module.exports = {
  Query: {
    async getSearchResult(_, { query }, context, info) {
      try {
        const try_length_of_query = query.replace(/[^a-zA-Z0-9]+/g, '')
        if (try_length_of_query.length < 3) {
          throw new Error("Your search didn't return any results")
        }
        const gobertResult = await searchGobert(query)
        if (gobertResult.length == 0) {
          throw new Error("Your search didn't return any results")
        }
        return gobertResult
      } catch (err) {
        throw new Error(err)
      }
    },
  },
}
