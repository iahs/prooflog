import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import '../methods.js'

import './main.html';

Meteor.subscribe("proofs");
Meteor.subscribe("proofnos");
Meteor.subscribe("courses", function () {

Accounts.ui.config({
  extraSignupFields: [{
      fieldName: 'realName',
      fieldLabel: 'Real name',
      inputType: 'text',
      visible: true,
      validate: function(value, errorFunction) {
        if (!value) {
          errorFunction("Please write your real name");
          return false;
        } else if (value.length < 3) {
          errorFunction("Name is too short");
          return false;
        } else {
          return true;
        }
      }
  }, {
      fieldName: 'preferredName',
      fieldLabel: 'Preferred name (if different)',
      inputType: 'text',
      visible: true,
      validate: function(value, errorFunction) {
        if (value && value.length < 3) {
          errorFunction("Preferred name is too short");
          return false;
        } else {
          return true;
        }
      }
  }, {
      fieldName: 'huid',
      fieldLabel: 'HUID (8 digits, if applicable)',
      inputType: 'text',
      visible: true,
  }, {
      fieldName: 'course',
      fieldLabel: 'Course',
      inputType: 'select',
      showFieldLabel: true,
      data: Courses.find({}).fetch(),
      visible: true
  }]
});
});

Template.body.helpers({
presented: function () {
  return Proofs.find({presentedBy: Meteor.user().username}, {sort: {createdAt: -1}});
},
pending: function () {
  return Proofs.find({presentedTo: Meteor.user().username, confirmed:false}, {sort: {createdAt: -1}});
},
heard: function () {
  return Proofs.find({presentedTo: Meteor.user().username, confirmed:true}, {sort: {createdAt: -1}});
},
points: function () {
  var listenPts = Courses.findOne({value: Meteor.user().profile.course}).listenPts;
  var presentedPoints = Proofs.find({presentedBy: Meteor.user().username, confirmed: true}, {points: 1}).map(function (proof) {return proof.points;}).reduce(function(pv, cv) { return pv + cv; }, 0);
  var heardPoints = listenPts * Proofs.find({presentedTo: Meteor.user().username, confirmed: true}, {_id: 1}).count();
    return +(presentedPoints + heardPoints).toFixed(2);
}
});

Template.presentedProof.events({
"click .delete": function () {
  Meteor.call("withdrawProof", this._id, Alerts.callback("Proof withdrawn"));
}
});

Template.request.events({
"click .confirmProof": function () {
  Meteor.call("confirmProof", this._id, Alerts.callback("Proof confirmed"));
},
"click .denyProof": function () {
  Meteor.call("denyProof", this._id, Alerts.callback("Proof denied"));
}
});

// Template.scrollBar.rendered = function () {
//   Meteor.defer($.scrollIt);
// };

Alerts.defaultOptions = {
  dismissable: false,
  classes: 'alert',
  autoHide: 800,
  fadeIn: 200,
  fadeOut: 600,
  alertsLimit : 2
};
Alerts.callback = function (string) {
return function (err, res) {
    if (!err) {
        Alerts.add(string, 'success');
    } else {
        Alerts.add("Error: " + err.toString());
    }
};
}
