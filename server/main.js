import { Meteor } from 'meteor/meteor';
import '../methods.js'

Meteor.startup(() => {
    Accounts.onCreateUser(function(options, user) {
      user.profile = options.profile;
      if (!user.profile.preferredName)
        user.profile.preferredName = user.profile.realName;
      user.username = user.profile.preferredName;
      return user;
  });

  Accounts.validateNewUser(function (user) {
    var prefname = user.profile.preferredName ? user.profile.preferredName : user.profile.realName;
    // if (Meteor.users.find({$and: [{username: prefname}, {$or: [{"profile.isAdmin": true}, {"profile.course": user.profile.course}]}]})) {
    if (Meteor.users.find({username: prefname}).count()) {
      if (user.profile.preferredName)
        throw new Meteor.Error(403, "Preferred name conflicts with existing user. Please make a small change, like including a middle initial.");
      else
        throw new Meteor.Error(403, "Real name conflicts with existing user. Please provide a preferred name with a small change, like including a middle initial.");
      return false;
    }
    return true;
  });

  Meteor.publish("proofs", function () {
    if (!this.userId) return null;
    var user = Meteor.users.findOne(this.userId, {profile: 1, username: 1});
    if (user.profile.isAdmin) {
      return Proofs.find({});
    } else {
      return Proofs.find({
        $or: [
          { presentedBy: user.username },
          { presentedTo: user.username }
        ]
      });
    }
  });

  Meteor.publish("proofnos", function () {
    if (!this.userId) return null;
    var user = Meteor.users.findOne(this.userId, {profile: 1});
    if (user.profile.isAdmin) {
      return Proofnos.find({});
    } else {
      return Proofnos.find({course: user.profile.course});
    }
  });

  Meteor.publish("courses", function () {
    return Courses.find({});
  })

  Meteor.publish(null, function () {
    if (!this.userId) return null;
    var user = Meteor.users.findOne(this.userId, {profile: 1});
    if (user.profile.isAdmin) {
      return Meteor.users.find({}, {username: 1, profile: 1, emails: 1});
    }
  });
});
