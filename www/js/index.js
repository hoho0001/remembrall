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
    // document.querySelector("#autoadd-btn").addEventListener("click", app.autoaddNote);
    document.querySelector("#create-btn").addEventListener("click", app.addNote);
    document.querySelector("#back-btn").addEventListener("click", app.goHome);
    document.querySelector("#cancel-btn").addEventListener("click", app.goHome);
    cordova.plugins.notification.local.on("click", function (notification) {
      navigator.notification.alert("clicked: " + notification.id);
      //user has clicked on the popped up notification
      // reschedule the notification to next year
      let newAt = luxon.DateTime.fromSeconds(notification.at).plus({year: 1});
      notification.at = newAt.toJSDate();
      
      cordova.plugins.notification.local.cancel(notification.id);
      cordova.plugins.notification.local.schedule(notification, app.createNotePage);
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
    app.setHeader('noteAdding');

    document.getElementById('title').value = '';
    document.getElementById('date').valueAsDate = new Date();
  },
  addNote: function (ev) {
    let id = new Date().getMilliseconds();
    let today = luxon.DateTime.local();

    let title = document.getElementById('title').value;
    // let content = document.getElementById('content').value;
    let date = document.getElementById('date').value;

    if (!title) {
      navigator.notification.alert("Please enter the Title!");
      document.getElementById('title').focus();
    } else if (!date) {
      navigator.notification.alert("Please enter the Date!");
      document.getElementById('date').focus;
    } else {
      let createDate = luxon.DateTime.fromSQL(date).set({year: today.year, hour: 8});
      
      let remindDate;
      
      console.log(createDate);

      if( createDate.diffNow('days') > 7 ){
        // console.log("Plus 7 days");
        remindDate = createDate.minus({ days: 7 }); // alert before 7 days
      }else {
        // console.log("Plus 7 days 1 years");
        remindDate = createDate.plus({ years: 1 , days: -7 }) // alert before 7 days,  next year
      }
      let noteOptions = {
        id: id,
        title: title,
        at: remindDate.toJSDate(),
        badge: 1,
        data: createDate.toMillis()
      };

      cordova.plugins.notification.local.schedule(noteOptions, app.createNotePage);
      navigator.notification.alert("Added notification id " + id);

    }
  },
  removeNoteConfirmation: function(ev){
    ev.preventDefault();
    deletedItem = ev.currentTarget.getAttribute('data-id');
    app.highlightItem(deletedItem);
    navigator.notification.confirm(`Remove the notification id: ${deletedItem} ?` , app.cancelNote, "Remove", ['Cancel', 'Remove']);
  },
  cancelNote: function(buttonIndex){
    if (buttonIndex === 2 ){
      cordova.plugins.notification.local.cancel(deletedItem,function() {
       app.createNotePage();
      });
    }
  },
  goHome: function () {
    app.navigation("noteList");
    app.setHeader('noteList');
  },
  setHeader: function(page){

    if(page == "noteList"){
      document.querySelector("#header h2").textContent ="Notifications";
      document.getElementById("add-btn").classList.remove('hide');
      document.getElementById("back-btn").classList.add('hide');
    } else if (page == "noteAdding"){
      document.querySelector("#header h2").textContent ="Add Notification";
      document.getElementById("add-btn").classList.add('hide');
      document.getElementById("back-btn").classList.remove('hide');
    }
  },
  
  createNotePage: function () {
    app.setHeader('noteList');
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
        let createdDate = document.createElement('h4');
        
        let button = document.createElement('img');
        createdDate.textContent = luxon.DateTime.fromMillis(parseInt(element.data)).toLocaleString({ month: 'short', day: '2-digit' }); //=> 'April 20';
        let remindDate = luxon.DateTime.fromSeconds(element.at).toLocaleString(luxon.DateTime.DATETIME_FULL); //=> 4/20/2017, 11:32 AM'
        
        title.textContent = element.title;

        div.className = "noteItem";
        title.setAttribute('data-id', element.id);
        title.className = 'noteTitle';
        title.setAttribute('remindDate', remindDate);
        createdDate.className = 'noteCreatedDate';
        
        button.src = 'img/baseline_delete_outline_black_36dp.png';
        button.className = "remove";
        button.id = 'remove-btn';
        button.setAttribute('data-id', element.id);
        button.alt = "remove";

        div.appendChild(button);
        div.appendChild(title);
        div.appendChild(createdDate);
        
        
        df.appendChild(div);
        button.addEventListener("click", app.removeNoteConfirmation);
        title.addEventListener("click", app.showRemindDate);

      });
      page.appendChild(df);
    });
    app.navigation("noteList");
  },
  showRemindDate: function(ev){
    ev.preventDefault();
    navigator.notification.alert("Schedule at: " + ev.currentTarget.getAttribute('remindDate'));
    app.highlightItem(ev.currentTarget.getAttribute('data-id'));
  },
  autoaddNote: function () {
    let inOneMin = new Date();
    inOneMin.setMinutes(inOneMin.getMinutes() + 1);
    let id = new Date().getMilliseconds();

    let noteOptions = {
      id: id,
      title: "This is the Title",
      // text: "Don't forget to do that thing.",
      at: inOneMin,
      badge: 1,
      data: Date.now()
    };
    cordova.plugins.notification.local.schedule(noteOptions, app.createNotePage);

    navigator.notification.alert("Added notification id " + id);
  },
  highlightItem: function (id) {
    document.querySelectorAll('.noteItem').forEach( item => {
      item.classList.remove('highlight');
      if ( item.querySelector('.noteTitle').getAttribute('data-id') == id ){
        item.classList.add('highlight');
      }
    });
  }
};
app.init();