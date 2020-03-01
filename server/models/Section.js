const { model, Schema } = require('mongoose');

const sectionSchema = new Schema({
	courseID: String,
	term: String,
	classNo: String,
	daysTimes: String,
	location: String,
	room: String,
	status: String,
	professor: String
})

module.exports = model('sections', sectionSchema);