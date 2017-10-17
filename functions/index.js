const functions = require('firebase-functions');
// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

/**
 * Average store
 *
 * - meta
 *    - voters
 *    - sum
 *    - average
 */
const reviewsRev = functions.database.ref('reviews/{userId}');
const metaRef = admin.database().ref('/meta');

/**
 * Appends average value to the meta data store.
 * @param {Number} value User's review.
 * @return {Promise} Promise resolved when the data have been updated.
 */
function appendVote(value) {
  return metaRef.once('value')
  .then(snap => {
    var votersCount = snap.child('voters').val();
    var sum = snap.child('sum').val();
    votersCount++;
    sum += value;
    var newAverage = sum / votersCount;
    console.log('Append vote: average ', newAverage);
    return Promise.all([
      metaRef.child('voters').set(votersCount),
      metaRef.child('sum').set(sum),
      metaRef.child('average').set(newAverage)
    ]);
  });
}
/**
 * Updates user's review value.
 *
 * @param {Number} newValue User's new review value
 * @param {Number} oldValue User's old review value
 * @return {Promise} Promise resolved when the data have been updated.
 */
function updateVote(newValue, oldValue) {
  return metaRef.once('value')
  .then(snap => {
    var votersCount = snap.child('voters').val();
    var sum = snap.child('sum').val();
    sum -= oldValue;
    sum += newValue;
    var newAverage = sum / votersCount;
    console.log('Updating vote: average ', newAverage);
    return Promise.all([
      metaRef.child('voters').set(votersCount),
      metaRef.child('sum').set(sum),
      metaRef.child('average').set(newAverage)
    ]);
  });
}
/**
 * Removes user's review value.
 *
 * @param {Number} oldValue User's removed review value
 * @return {Promise} Promise resolved when the data have been updated.
 */
function deleteVote(oldValue) {
  return metaRef.once('value')
  .then(snap => {
    var votersCount = snap.child('voters').val();
    var sum = snap.child('sum').val();
    votersCount--;
    sum -= oldValue;
    var newAverage = sum / votersCount;
    return Promise.all([
      metaRef.child('voters').set(votersCount),
      metaRef.child('sum').set(sum),
      metaRef.child('average').set(newAverage)
    ]);
  });
}

/**
 * Adds information to the average store data.
 */
exports.createReview = reviewsRev.onCreate(event => {
  const newValue = event.data.val();
  const addedRating = newValue.rating;
  console.log('Adding rating of value', addedRating);
  return appendVote(addedRating);
});

/**
 * Updates information to the average store data.
 */
exports.updateReview = reviewsRev.onUpdate(event => {
  const newValue = event.data.val();
  const previousValue = event.data.previous.val();
  const newRating = newValue.rating;
  const oldRating = previousValue.rating;
  console.log('Replacing ', oldRating , ' with new value', newRating);
  return updateVote(newRating, oldRating);
});
/**
 * Updates information to the average store data.
 */
exports.deleteReview = reviewsRev.onDelete(event => {
  const previousValue = event.data.previous.val();
  const oldRating = previousValue.rating;
  console.log('Deleting rating of value', oldRating);
  return deleteVote(oldRating);
});
