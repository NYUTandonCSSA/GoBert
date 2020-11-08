module.exports = function displayScoreRound(score) {
    return Math.round((score + Number.EPSILON) * 100) / 100
};
