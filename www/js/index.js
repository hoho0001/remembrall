// Local Notifications:
// https://www.npmjs.com/package/de.appplant.cordova.plugin.local-notification/v/0.8.5
// https://github.com/katzer/cordova-plugin-local-notifications/wiki - reference
// https://github.com/katzer/cordova-plugin-local-notifications - beware the ReadMe file. This is v0.9.0-beta

// Installation
// cordova plugin add de.appplant.cordova.plugin.local-notification

//Build (XCode 10 causes build issues for iOS so it needs the --buildFlag)
// cordova emulate ios --target="iPhone-8, 12.0" --buildFlag="-UseModernBuildSystem=0"

// Dialogs:
// https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-dialogs/index.html

let app = {
  deletedItem: null,
  init: function () {
    document.addEventListener("deviceready", app.ready);
  },
  ready: function () {
    app.addListeners();
    app.createNotePage();
  },
  addListeners: function () {
    document.querySelector("#add-btn").addEventListener("click", app.addNotePage);
    document.querySelector("#list-btn").addEventListener("click", app.createNotePage);
    document.querySelector("#create-btn").addEventListener("click", app.addNote);
    document.querySelector("#back-btn").addEventListener("click", app.goHome);
    cordova.plugins.notification.local.on("click", function (notification) {
      navigator.notification.alert("clicked: " + notification.id);
      //user has clicked on the popped up notification
      console.log(notification.data);
    });
    cordova.plugins.notification.local.on("trigger", function (notification) {
      //added to the notification center on the date to trigger it.
      navigator.notification.alert("triggered: " + notification.id);
    });
  },
  navigation: function(page){
    document.querySelectorAll('.page').forEach( item => item.classList.add('hide'));
    document.getElementById(page).classList.remove('hide');
    console.log(page);
  },

  addNotePage: function(){
    app.navigation("noteAdding");
    document.getElementById('title').value = '';
    document.getElementById('content').value = '';
    document.getElementById('date').value = '';
  },
  addNote: function (ev) {

    let id = new Date().getMilliseconds();
    let today = luxon.DateTime.local();

    let title = document.getElementById('title').value;
    let content = document.getElementById('content').value;
    let date = document.getElementById('date').value;

    let createDate = luxon.DateTime.fromSQL(date).set({year: today.year, hour: 8});
    
    let remindDate;
    
    console.log(createDate);

    if( createDate.diffNow('days') > 7 ){
      // console.log("Plus 7 days");
      remindDate = createDate.plus({ days: -7 }); // alert before 7 days
    }else {
      // console.log("Plus 7 days 1 years");
      remindDate = createDate.plus({ years: 1 , days: -7 }) // alert before 7 days,  next year
    }

    let noteOptions = {
      id: id,
      title: title,
      text: content,
      at: remindDate.toJSDate(),
      badge: 1,
      data: createDate.toMillis()
    };

    cordova.plugins.notification.local.schedule(noteOptions, app.createNotePage);
    
    // cordova.plugins.notification.local.cancel(id, function () {
    //   // will get rid of notification id 1 if it has NOT been triggered or added to the notification center
    //   // cancelAll() will get rid of all of them
    // });
    // cordova.plugins.notification.local.clear(id, function () {
    //   // will dismiss a notification that has been triggered or added to notification center
    // });
    // cordova.plugins.notification.local.isPresent(id, function (present) {
    //   // navigator.notification.alert(present ? "present" : "not found");
    //   // can also call isTriggered() or isScheduled()
    //   // getAllIds(), getScheduledIds() and getTriggeredIds() will give you an array of ids
    //   // get(), getAll(), getScheduled() and getTriggered() will get the notification based on an id
    // });
    // // app.navigation("noteList");
  },
  removeNote: function(ev){
    ev.preventDefault();
    deletedItem = ev.currentTarget.getAttribute('data-id');
    navigator.notification.confirm(`Remove the notification id: ${deletedItem} ?` , app.cancelNote, "Remove", ['Remove', 'Cancel']);
  },
  cancelNote: function(buttonIndex){
    if (buttonIndex === 1 ){
      cordova.plugins.notification.local.cancel(deletedItem,function() {
       app.createNotePage();
      });
    }
  },
  goHome: function () {
    app.navigation("noteList");
  },
  s: function(){
    
  },
  createNotePage: function () {
    let page = document.getElementById('noteList');
    let df = new DocumentFragment();
    page.innerHTML = "";

    cordova.plugins.notification.local.getAll(notes => {
      // notes is an array of all the notifications
      notes.sort((a,b) => {  // sort the Notifications by AT ASC 
        if (a.data < b.data) { return -1; }
        else if (a.data > b.data) { return 1; }
        else { return 0; }
      });
      notes.forEach( element => {
        console.log(element);
        let div = document.createElement('div');
        let title = document.createElement('h3');
        let at = document.createElement('h4');
        let text = document.createElement('p');
        let button = document.createElement('button');

        let createDate = luxon.DateTime.fromMillis(parseInt(element.data));
        
        at.textContent = createDate.toLocaleString({ month: 'long', day: '2-digit' }); //=> 'April 20';
        

        title.textContent = element.title;
        text.textContent = element.text;
        button.textContent = "Remove";
        button.className = "remove";
        button.setAttribute('data-id', element.id);

        div.appendChild(title);
        div.appendChild(text);
        div.appendChild(at);
        div.appendChild(button);
        df.appendChild(div);
        
      });
      
      page.appendChild(df);

      document.querySelectorAll(".remove").forEach(item => {
        item.addEventListener("click", app.removeNote);
      });
    });
    app.navigation("noteList");
  }
};
app.init();