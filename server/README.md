## GraphQL, MongoDB and Express
- add a config.js file of the format with the following content. This role has a read only access to the database. If you need write access, please contact me directly.
config.js
```
module.exports = {
	MONGODB: 'mongodb+srv://dbreader:dbreader@courseapi-ujwvo.mongodb.net/nyu?retryWrites=true&w=majority',
	CURRENT_TERM: "Fall 2019",
	SECRET_KEY: "Secret"
}
```
- npm i
- npm start

##### you can try the following code out in localhost:4000/playground, please see https://graphql.org/graphql-js/graphql-clients/ for client side code
##### Mutation API
```
mutation {

  register(registerInput:{
    username: "kai"
    password: "hashed"
    confirmPassword: "hashed"
    email: "kai@kai.com"
  }){
    token
    email
    standing
    major
    createdAt
    username
  }

  login(username: "kai", password: "hashed") {
    email
    username
    token
    standing
    major
    createdAt
  }

  # When you do a postRate in localhost:4000, you need to add
  # http header: { "Authorization":"Bearer userToken" }, where userToken is the token retruned by register/login
  postRate(
      rateInput: {
      	courseID: "CSUY 2124"
        courseTitle: "Object Oriented Programming LAB"
        courseScore: 4.5
        professor: "John Sterling"
        professorScore: 5.0
        term: "Spring 2020"
        anonymity: false
        comment: "The course is helpful and sterling is great"       
    }
  ){
    username
    anonymity
    courseID
    courseTitle
    term
    courseScore
    professor
    professorScore
    comment
    upvotes
    downvotes
    createdAt
  }

  deleteRate(rateId: "rateID"){
    professor
    ratings{
      comment
      upvotes
      courseScore
      professorScore
    }
    avgProfScore
    avgCourseScore
    courseID
    courseTitle
    numRate
  }

  upvote(rateId: "rateID"){
    alreadyRate
    username
    courseID
    courseTitle
    courseScore
    professor
    professorScore
    term
    anonymity
    comment
    upvotes
    downvotes
    createdAt
    id
  }
  
  downvote(rateId: "rateID"){
    alreadyRate
    username
    courseID
    courseTitle
    courseScore
    professor
    professorScore
    term
    anonymity
    comment
    upvotes
    downvotes
    createdAt
    id
  }

  # Shopping Carts
  # addToShoppingCart -> [Course]
  addToShoppingCart(username:"cindy123", courseID: "CSUY 2124", courseTitle: "Object Oriented Programming LEC", priority: "required"){
    courseID
    courseTitle
    score
    numRate
    priority
    _id
  }

  # removeFromShoppingCart -> Course
  removeFromShoppingCart(username:"cindy123", courseID: "CSGY 6413", courseTitle: "Compiler Design and Construction LEC"){
    courseID
    courseTitle
    score
    numRate
    priority
    _id
  }

  # changeCoursePriority -> Course
  changeCoursePriority(username:"cindy123", courseID: "CSGY 6413", courseTitle: "Compiler Design and Construction LEC", priority: "required"){
    courseID
    courseTitle
    score
    numRate
    priority
    _id
  }
}
```
##### Query API
```
query {
  # This Query will return a combined result for course & professor
  getSearchResult(query: "sterling") {
    category
    name
    courseID
    courseTitle
    _id
	  score
    numRate
    rscore
    rnumRate
    wouldTakeAgain
    levelOfDifficulty
    tags
  }

  # the id returned by getSearchResult
  getCourseDetail(id: "5e991dd09302c2f4d17b41fc"){
    courseID
    courseTitle
    score
    numRate
  	rateSummary{
      professor
      courseID
      courseTitle
      avgProfScore
      avgCourseScore
      numRate
      ratings{
        username
        username
        anonymity
        courseID
        courseTitle
        term
        courseScore
        professor
        professorScore
        comment
        upvotes
        downvotes
        _id
      }
    }
  }
  
  # Same format, but different param
  getProfessorDetail(query: "John Sterling"){
    name
    _id
	  score
    numRate
    rscore
    rnumRate
    wouldTakeAgain
    levelOfDifficulty
    tags
  	rateSummary{
      professor
      courseID
      courseTitle
      avgProfScore
      avgCourseScore
      numRate
      course_id
      ratings{
        username
        username
        anonymity
        courseID
        courseTitle
        term
        courseScore
        professor
        professorScore
        comment
        upvotes
        downvotes
        _id
      }
    }
  }

  # you need to provide a token in authorization
  getShoppingCart(username:"cindy123"){
    courses{
      courseID
      score
      numRate
      priority
      courseTitle
      _id
    }
    semesters
  }

  generateSchedule(username: "cindy123", term: "Spring 2020", onlyOpen: false,
    intendedCourses:[
      "5e790d64199406c82611abb9", 
      "5e790d64199406c82611abc7", 
      "5e790d64199406c82611abba", 
      "5e790d64199406c82611bda5",
    	"5e790d64199406c826119d7e",
    	"5e790d64199406c82611be3d"]){
    noSection{
      courseID
      courseTitle
      priority
      reason
    }
    schedule{
      courseID
      courseTitle
      TBA
      daysOfWeek
      start
      end
      professor
      classNo
      term
      _id
      priority
      dates
      duration
      status
      color // if status !== 'Open', color will be fixed. greyish color.
      courseScore
      professorScore
      rmpScore
    }
  }

}

```

##### Archived API
```
query{
  getRatings(
      searchCourseInput: {
        cID: "CSUY 2124"
        cTitle: "Object Oriented Programming"
        professor:"John Sterling"
    }
  ){
    username
    anonymity
    courseID
    courseTitle
    term
    courseScore
    professor
    professorScore
    comment
    upvotes
    downvotes
    createdAt
    _id
  }

  getProfessorByName(query: "John") {
    name
    score
    numRate
  }

  getCourse(query: "object oriented") {
    courseID
    courseTitle
    score
    numRate
    _id
  }
}
```
