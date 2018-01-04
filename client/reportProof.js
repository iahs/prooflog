 Template.reportProof.helpers({
    proofnos: function () {
      var presented = Proofs.find({presentedBy: Meteor.user().username}, {no: 1}).fetch().map(function (i) {
        return i.no;
      });
      var proofnos = [{no: ''}].concat(Proofnos.find({release: {$lte: new Date()}, course: Meteor.user().profile.course}, {no: 1}).fetch());
      return $.grep(proofnos, function (el) { return $.inArray( el.no.toString(), presented ) == -1; });
    },
    type: "normal",
    isParty: function () {
      return Template.instance().isParty.get();
    },
    due: function () {
      var presented = Proofs.find({presentedBy: Meteor.user().username}, {no: 1}).fetch().map(function (i) {
        return i.no;
      });
      var proofnos = Proofnos.find({release: {$lte: new Date()}, course: Meteor.user().profile.course, due: {$lte: new Date(+new Date() + 7 * 24 * 60 * 60 * 1000)}}, {no: 1, due: 1}).fetch();
      return $.grep(proofnos, function (el) { return $.inArray( el.no.toString(), presented ) == -1; }).map(function (el) {
        el.deadline = $.datepicker.formatDate($.datepicker.RFC_822, el.due);
        return el;
      });
    },
    session: function (key) {
      return Session.get(key);
    },
    usersForProof: function (proof) {
      return Session.get(proof + '-users');
    }
  });

  Template.reportProof.events({
    "submit .report-proof": function (event) {
      var presentedTo = event.target.presentedTo.value;
      var proof = event.target.no.value;

      if ($.inArray(presentedTo, Session.get(proof + '-users')) === -1) {
        return false;
      }

      Meteor.call("reportProof", proof, presentedTo, Alerts.callback("Proof reported"));

      // Clear form
      event.target.presentedTo.value = "";

      // Disable fields if applicable
      Meteor.defer(function () {
        $( "#no" ).trigger("change");
      });

      // Prevent default form submit
      return false;
    },
    "change #no": function(evt) {
      var proof = $(evt.target).val();
      var onlyCAs = false; //Template.reportProof.helpers.type === 'section';
      if (proof !== '') {
        $( "#presentedTo" ).prop( "disabled", true );
        if (!onlyCAs) {
          Session.set(proof, true);
          Meteor.call('usersForProof', proof, onlyCAs, function (err, val) {
            Session.set(proof + '-users', val);
           $( "#presentedTo" ).autocomplete( "option", "source", val);
           $( "#presentedTo" ).prop( "disabled", false );
          });
        } else {
           // $( "#presentedTo" ).autocomplete( "option", "source", Session.get(proof + '-users'));
           throw new Meteor.Error("not-implemented");
        }
      } else {
        $( "#presentedTo" ).prop( "disabled", true );
      }
    },
    "change #type": function(evt) {
      Template.reportProof.helpers.type = $(evt.target).val();
      Template.instance().isParty.set(Template.reportProof.helpers.type === 'party');
    }
  });

  Template.reportProof.created = function () {
    this.isParty = new ReactiveVar(false);
  };

  Template.reportProof.rendered = function () {
    Meteor.defer(function () {
        $( "#presentedTo" ).autocomplete({
          source: [],
          close:  function () {
            $( ".report-proof" ).submit();
          }
        });
     });
    var accordion = function () {
      $( "#due" ).accordion({
        beforeActivate: function( event, ui ) {
          var proof = ui.newHeader.data('no');
          if (!Session.get(proof)) {
            Session.set(proof, true);
            Meteor.call('usersForProof', proof, false, function (err, val) {Session.set(proof + '-users', val);});
          }
        },
        collapsible: true,
        active: false,
        heightStyle: "content",
        icons: { "header": "ui-icon-plus", "activeHeader": "ui-icon-minus" }
      });
    };
    Meteor.defer(accordion);
    setTimeout(accordion, 400);
  };
