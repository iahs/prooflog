Meteor.methods({
  reportProof: function (no, presentedTo) {
    var course = Courses.findOne({value: Meteor.user().profile.course});
    var due = Proofnos.findOne({course: Meteor.user().profile.course, no: no}, {due: 1});
    due = due.due ? due.due : new Date();
    Proofs.insert({
      no: no,
      presentedTo: presentedTo,
      presentedBy: Meteor.user().username,
      points: new Date() - due < 86400000 ? course.earlyPts : course.latePts,
      confirmed: false,
    });
  },
  withdrawProof: function (id) {
    Proofs.remove({_id: id, presentedBy: Meteor.user().username});
  },
  confirmProof: function (id) {
    Proofs.update({_id: id, presentedTo: Meteor.user().username}, {$set: {confirmed: true}});
  },
  denyProof: function (id) {
    Proofs.remove({_id: id, presentedTo: Meteor.user().username, confirmed: false});
  },
  changeProofno: function (id, op, val) {
    if (!Meteor.user().profile.isAdmin) {
      throw new Meteor.Error("not-authorized");
    }
    if (op === 'insert') {
      Proofnos.insert(val);
    } else if (op === 'delete') {
      Proofnos.remove(id);
    } else if (op === 'release') {
      Proofnos.update(id, {$set: {release: val}});
    } else if (op === 'due') {
      Proofnos.update(id, {$set: {due: val}});
    } else {
      throw new Meteor.Error("not-implemented");
    }
  },
  changeUserLevel: function (name, level) {
    if (!Meteor.user().profile.isAdmin) {
      throw new Meteor.Error("not-authorized");
    }
    Meteor.users.update({username: name}, {$set: {"profile.isAdmin": level >= 3, "profile.isCA": level >= 2}});
  },
  confirmUser: function (id, confirm) {
    if (!Meteor.user().profile.isAdmin) {
      throw new Meteor.Error("not-authorized");
    }
    if (confirm)
      Meteor.users.update(id, {$set: {"profile.confirmed": true}});
    else
      Meteor.users.remove(id);
  },
  usersForProof: function (proof, onlyCAs) {
    if (proof === '') {
      return [];
    }
    var qualified = onlyCAs ? [] : Proofs.find({no: proof, confirmed: true}, {presentedBy: 1}).fetch().map(function (i) {
      return i.presentedBy;
    });
    var CAs = Meteor.users.find({"profile.isCA": true}, {username: 1}).fetch().map(function (i) {
      return i.username;
    });
    return qualified.concat(CAs);
  },
  points: function() {
    if (!Meteor.user().profile.isAdmin) {
      throw new Meteor.Error("not-authorized");
    }
    var ret = {};
    console.log(ret);
    Proofs.aggregate([{$group: {_id: '$presentedBy', points: {$sum: '$points'}}}]).forEach(function (item) {
      ret[item._id] = item.points;
    });
    console.log(ret);
    Proofs.aggregate([{$group: {_id: '$presentedTo', points: {$sum: 0.1}}}]).forEach(function (item) {
      ret[item._id] = ret[item._id] + item.points || item.points;
    });
    console.log(ret);
    return ret;
  },
  deleteCourses: function () {
    if (!Meteor.user().profile.isAdmin) {
      throw new Meteor.Error("not-authorized");
    }
    import backup from 'mongodb-backup';
    backup({
      uri: process.env.MONGO_URL,
      root: '/root/backups',
      tar: new Date().toString().split(' GMT')[0] + '.tar',
      callback: Meteor.bindEnvironment(function () {
        Meteor.users.remove({"profile.isAdmin": {$ne: true}});
        Proofnos.remove({});
        Proofs.remove({});
        Courses.remove({});
      })
    });
  },
  addCourse: function (val) {
    if (!Meteor.user().profile.isAdmin) {
      throw new Meteor.Error("not-authorized");
    }
    Courses.insert(val);
  },
  fakeUsers: function () {
    return;
    var names = ["Ian Isley","Charmain Climer","Ulrike Urick","Rosette Roop","Emogene Escobedo","Harriette Hance","Romaine Raisor","Eloisa Eslinger","Jolie Judge","Lorraine Longworth","Meryl Mckinnis","Fae Fagen","Marylin Macpherson","Chana Cushing","Nena Natoli","Raye Reynold","Noella Nishida","Cammy Coen","Nannie Norby","Cassidy Crosswell","Lera Lander","Delsie Dozier","Marnie Maugeri","Phil Patillo","Kendra Klick","Isa Izaguirre","Jonathan Jakubowski","Izetta Infante","Gerri Graham","Elois Eisenbarth","Antone Abboud","Eartha Eatmon","Julianne Jeffreys","Layne Latham","Gina Glance","Adelia Armagost","Rolf Rake","Tracie Turpin","Kathleen Kamer","Tonia Tibbles","Claretta Carbone","Ron Romaine","Rachal Rothrock","Sid Shen","Jaymie James","Mariano Magee","Song Stricklin","Alda Abram","Margene Makela","Apolonia Angle"];
    for (var name in names) {
        Meteor.users.insert({"emails" : [ { "address" : name.split(' ')[1] + "@college.harvard.edu", "verified" : false } ], "profile" : { "realName" : name, "preferredName" : name, "huid" : Math.floor(Math.random() * 89900000 + 10000000).toString(), "course" : Math.random() > .2 ? "23a" : '115', "confirmed" : Math.random() > .1 , "isCA": Math.random() > .82}, "username" : name });
    }

  }
});
