 Template.admin.helpers({
    proofnos: function () {
      return Proofnos.find({}, {sort: {no: -1}});
    },
    courses: function () {
      return Courses.find({});
    },
    unconfirmed: function () {
      return Meteor.users.find({"profile.confirmed": null});
    },
    usersForCourse: function () {
      return Template.instance().usersForCourse.get();
    }
  });

  Template.admin.events({
    "submit .make-admin": function (event) {
      var name = event.target.adminify.value;
      var level = event.target.level.value;

      if ($.inArray(name, Template.admin.helpers.users) === -1) {
        return false;
      }

      Meteor.call("changeUserLevel", name, level, Alerts.callback("User level changed"));

      // Clear form
      event.target.adminify.value = "";

      // Prevent default form submit
      return false;
    },
    "submit .change-proof": function (event) {
      var no = event.target.no.value;
      if (!no)
        return false;
      var release = $(event.target.release).datepicker("getDate");
      var due = $(event.target.due).datepicker("getDate");
      var course = event.target.course.value;

      Meteor.call("changeProofno", null, 'insert', {no: no, release: release, due: due, course: course}, Alerts.callback("Proof created"));

      // Clear form
      event.target.no.value = "";
      $(event.target.release).datepicker("setDate", null);
      $(event.target.due).datepicker("setDate", null);
      Template.admin.rendered(true);

      // Prevent default form submit
      return false;
    },
    "change .release": function (event) {
      Meteor.call("changeProofno", this._id, 'release', new Date($(event.target).val()), Alerts.callback("Proof release date changed"));
    },
    "change .due": function (event) {
      Meteor.call("changeProofno", this._id, 'due', new Date($(event.target).val()), Alerts.callback("Proof due date changed"));
    },
    "click .delete": function () {
      Meteor.call("changeProofno", this._id, 'delete', null, Alerts.callback("Proof deleted"));
    },
    "click .confirmUser": function () {
      Meteor.call("confirmUser", this._id, true, Alerts.callback("User confirmed"));
    },
    "click .denyUser": function () {
      Meteor.call("confirmUser", this._id, false, Alerts.callback("User deleted"));
    },
    "change #courseForUsers": function (event) {
      var listenPts = Courses.findOne({label: $(event.target).val()}).listenPts;
      var users = Meteor.users.find({"profile.course": $(event.target).val(), "profile.isCA": {$ne: true}}).map(
          function (user) {
            var presentedPoints = Proofs.find({presentedBy: user.username, confirmed: true}, {points: 1}).map(function (proof) {return proof.points;}).reduce(function(pv, cv) { return pv + cv; }, 0);
            var heardPoints = listenPts * Proofs.find({presentedTo: user.username, confirmed: true}, {_id: 1}).count();
              user.points = +(presentedPoints + heardPoints).toFixed(2);
              return user;
          }
      );
      Template.instance().usersForCourse.set(users);
    },
    "click #deleteCourses": function () {
      if (confirm("Permanently delete all users and proofs?")) {
        Meteor.call("deleteCourses", Alerts.callback("All data deleted"));
      }
    },
    "submit .add-course": function (event) {
      var name = event.target.name.value;
      if (!name)
        return false;
      var earlyPts = event.target.earlyPts.value;
      var latePts = event.target.latePts.value;
      var listenPts = event.target.listenPts.value;

      Meteor.call("addCourse", {label: name, value: name, earlyPts: +earlyPts, latePts: +latePts, listenPts: +listenPts}, Alerts.callback("Course created"));

      // Clear form
      event.target.name.value = "";
      event.target.earlyPts.value = "";
      event.target.latePts.value = "";
      event.target.listenPts.value = "";

      // Prevent default form submit
      return false;
    },
  });

  Template.admin.created = function (rerender) {
    this.usersForCourse = new ReactiveVar([]);
  };

  Template.admin.rendered = function (rerender) {
    Meteor.setTimeout(function () {
      Template.admin.helpers.users = Meteor.users.find({}, {username: 1}).fetch().map(function (i) {return i.username;});
        $( "#adminify" ).autocomplete({
          source: Template.admin.helpers.users,
          close: function () {
            $( ".make-admin" ).submit();
          }
        });
        var format = $.datepicker.RFC_822;
        $( ".datepicker" ).datepicker({dateFormat: format});
        $('.datepicker').each(function() {
          $(this).datepicker("setDate", this.value ? new Date(this.value) : null);
        });
        $( "#new-release" ).datepicker("setDate", new Date());
     }, 500);
  };
