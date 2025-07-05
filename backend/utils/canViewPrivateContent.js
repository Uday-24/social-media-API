/**
 * Check if the requesting user can view content of a target user
 * @param {Object} targetProfile - Mongoose Profile document (must include isPrivate and followers)
 * @param {ObjectId} currentUserId - ID of the requesting user
 * @returns {Boolean}
 */
function canViewPrivateContent(targetProfile, currentUserId) {
  if (!targetProfile.isPrivate) return true;
  if (!currentUserId) return false;
  if (targetProfile.user.equals(currentUserId)) return true;

  return targetProfile.followers.some((followerId) =>
    followerId.equals(currentUserId)
  );
}

module.exports = canViewPrivateContent;