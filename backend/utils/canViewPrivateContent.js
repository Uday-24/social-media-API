/**
 * Check if the requesting user can view content of a target user
 * @param {Object} targetUser - Mongoose User document (must include isPrivate and followers)
 * @param {ObjectId} currentUserId - ID of the requesting user
 * @returns {Boolean}
 */
function canViewPrivateContent(targetUser, currentUserId) {
  if (!targetUser.isPrivate) return true;

  if (!currentUserId) return false; // Not logged in

  if (targetUser._id.equals(currentUserId)) return true; // Owner

  return targetUser.followers.some((followerId) =>
    followerId.equals(currentUserId)
  );
}

module.exports = canViewPrivateContent;
