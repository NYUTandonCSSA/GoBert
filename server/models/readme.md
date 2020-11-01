# Info
The following is only the important piece that we will use primarily.
We still have rmp_records, sections, semesters, teaches, and users, but trivial.

## Courses
Contains the information of a course. _total & _total_concat are for searching purposes
We store the score and numRates here
so that we don't need to traverse Rates to get the score for a course.
- **_id**: ObjectId("5e992743cf536b7bbf1c85f2")
- **courseID**: [String] "ANSTUA 500"
- **courseTitle**: [String] "Animals and Public Policy SEM"
- **numRate**: [Number] 4
- **score**: [Number] 4.5
- **_total**: [String] "ANSTUA 500 Animals and Public Policy SEM"
- **_total_concat**: [String] "ANSTUA500AnimalsandPublicPolicySEM"

## Professors
Contains the information of a professor. So far, we treat name as the primary key 
(doesn't matter here) as it's in noSql table. We store the score and numRates here
so that we don't need to traverse Rates to get the score for a professor.
- **_id**: ObjectId("5e992749cf536b7bbf1d21af")
- **name**: [String] "Ami Imai Brett"
- **first name**: [String] "Ami"
- **last name**: [String] "Brett"
- **score**: [Number] 5
- **numRate**: [Number] 1

## Rates
Contains a single rate to a course and a professor that teaches that course
- **_id**: ObjectId("xxx")
-	**username**: String,
-	**courseTitle**: String,
-	**courseID**: String,
-	**courseScore**: Number,
-	**term**: String,
-	**anonymity**: Boolean,
-	**professor**: String,
-	**professorScore**: Number,
-	**comment**: String,
-	**upvotes**: [String], Array of Usernames
-	**downvotes**: [String], Array of Usernames
-	**createdAt**: String

## RateSummary
Contains the information of the calculated avg for a course and the professor that teaches that course.
So that we don't need to traverse Rates every time to calculate the avg.
-	**professor**: String,
-	**courseID**: String,
-	**courseTitle**: String,
-	**avgProfScore**: Number,
-	**avgCourseScore**: Number,
-	**numRate**: Number







