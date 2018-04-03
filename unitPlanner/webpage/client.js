'use strict';

window.addEventListener('load', initialize);

/**
 * Gloabl variables
 * @param {int} currentUnit - The unit that has been selected
 * @param {int} currentWeek - The Week that has been selected
 * @param {bool} isSelected - If a week is currently highlighted
 * @param {bool} beingDeleted - Check if a week is being deleted
 */
let currentUnit;
let currentWeek;
let isSelected = false;
let beingDeleted = false;

//On loading the page show the login form
function initialize() {
  showLogin();
}

/** showLogin loads the login form */
function showLogin() {
  const loginPage = document.getElementById("login-page").content.cloneNode(true);
  document.getElementById('contentHolder').innerHTML='';
  document.getElementById('contentHolder').appendChild(loginPage);
}

/** onSignIn is used when the sign in button is clicked */
async function onSignIn(googleUser) {
  let profile = googleUser.getBasicProfile();
  let name = profile.getName();
  let email = profile.getEmail();
  //Check if user exsists and save users data for share functionality
  const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  const fetchOptions = {
    method: 'GET',
    headers: {'Authorization': 'Bearer ' + token}
  };

  let url = '/data/users/';
  url += '?email=' + email;
  url += '&name=' + name;

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    console.log(response.status);
    return;
  }
  showMain();
}

/** onSignIn log a user out */
function signOut() {
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    console.log('User signed out.');
    showLogin();
  });
}

/** showMain is used when a user has logged in, loads the main view */
function showMain() {
  const mainPage = document.getElementById("main-page").content.cloneNode(true);
  document.getElementById('contentHolder').innerHTML='';
  document.getElementById('contentHolder').appendChild(mainPage);
  document.getElementById('add_unit').addEventListener('click', addUnit);
  let closeButtons = document.querySelectorAll('.close-button');
  closeButtons.forEach((buttons) => {
    buttons.addEventListener('click', closepopup);
  });
  requestUnits();
}

//Unit Functions

/** requestUnits used to get all of a users units */
async function requestUnits() {
  const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  const fetchOptions = {
    method: 'GET',
    headers: {'Authorization': 'Bearer ' + token}
  };

  const response = await fetch('/data/units', fetchOptions);
  if (!response.ok) {
    console.log(response.status);
    return;
  }

  //returns the list of units
  const data = await response.json();
  const cardTemplateEl = document.getElementById('card-holder');
  cardTemplateEl.innerHTML='';
  if (data.length == 0) {
    cardTemplateEl.innerHTML='No Units added yet';
    return;
  }

  data.forEach((unit) => {
    const unitTemplateEl = document.getElementById('unit-card').content.cloneNode(true);
    unitTemplateEl.querySelector('.title').textContent = unit.unitname || 'No Title';
    unitTemplateEl.querySelector('.unit').dataset.id = unit.unitid;
    cardTemplateEl.appendChild(unitTemplateEl);
  });

  let allUnits = document.querySelectorAll(".unit");
  allUnits.forEach((units) => {
    units.addEventListener('click', displayUnitInfo);
  });

  let allUnitsEdit = document.querySelectorAll(".edit-unit");
  allUnitsEdit.forEach((units) => {
    units.addEventListener('click', editUnit);
  });
}

/** addUnit used to load the pop up box to input a unit */
function addUnit() {
  document.getElementById('add_unit_popup').style.display = "block";
  document.getElementById('submit-button').addEventListener('click', submitUnit);
  document.addEventListener('click', closePopUps);
}

/** closepopup used to close pop up boxes */
function closepopup() {
  document.getElementById('add_unit_popup').style.display = "none";
  document.getElementById('edit_unit_popup').style.display = "none";
  document.removeEventListener('click', closePopUps);
}

/**
 * closePopUps is added when a popup us open
 * closes the pop up if clicked outside the pop up area
 */
function closePopUps() {
  if (event.target == document.getElementById('add_unit_popup') || event.target == document.getElementById('edit_unit_popup')) {
    closepopup();
  }
}

/** submitUnit used to save a unit to the database */
async function submitUnit() {
  const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  const fetchOptions = {
    method: 'POST',
    headers: {'Authorization': 'Bearer ' + token}
  };

  const titleEl = document.getElementById('title-input');
  const fullEl = document.getElementById('full-title-input')
  const errorAppender = document.getElementById('error-appender-add');
  document.getElementById('error-appender-add').innerHTML='';
  if (!titleEl.checkValidity()) {
    document.getElementById('error-appender-add').innerHTML+='<p>Invalid short code, this field must not be blank.</p>';
    return;
  }
  if (!fullEl.checkValidity()) {
    document.getElementById('error-appender-add').innerHTML+='<p>Invalid full name, this field must not be blank.</p>';
    return;
  }

  let url = '/data/units';
  url += '?title=' + encodeURIComponent(titleEl.value);
  url += '&full=' + encodeURIComponent(fullEl.value);

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    console.log(response.status);
    return;
  }
  document.getElementById('add_unit_popup').style.display = "none";
  requestUnits();
}

/**
 * editUnit used to get the unit info to a edit pop up box and add event listiners
 * @param {event} e the element that was clicked
 */
async function editUnit(e) {
  const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  const fetchOptions = {
    method: 'GET',
    headers: {'Authorization': 'Bearer ' + token}
  };

  document.getElementById('edit_unit_popup').style.display = "block";
  const errorAppender = document.getElementById('error-appender-edit');
  document.getElementById('error-appender-edit').innerHTML='';
  document.getElementById('save-button').addEventListener('click', saveUnit);
  document.getElementById('delete-unit-button').addEventListener('click', deleteUnit);
  document.getElementById('share-button').addEventListener('click', shareUnit);

  const el = getWrapper(e.target);
  currentUnit = el.dataset.id;

  let url = '/data/units/single/';
  url += '?unitid=' + encodeURIComponent(currentUnit);

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    console.log(response.status);
    return;
  }

  const data = await response.json();
  data.forEach((unit) => {
    document.getElementById('title-unit-input').value = unit.unitname;
    document.getElementById('full-title-unit-input').value = unit.unitfullname;
  });

  getSharedUsers();

  document.addEventListener('click', closePopUps);
}

/** getSharedUsers used to get any users a unit has been shared with */
async function getSharedUsers() {
  const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  const fetchOptions = {
    method: 'GET',
    headers: {'Authorization': 'Bearer ' + token}
  };

  let url = '/data/units/share';
  url += '?unitid=' + encodeURIComponent(currentUnit);

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    console.log(response.status);
    return;
  }

  const data = await response.json();
  let shareHolderEl = document.getElementById('share-appender');
  shareHolderEl.innerHTML='';

  if (data.length > 0) {
    shareHolderEl.innerHTML='<h3>Shared with<h3>';
    data.forEach((user) => {
      const userTemplateEl = document.getElementById('shared-users').content.cloneNode(true);
      userTemplateEl.querySelector('.user-name').textContent = user.username;
      shareHolderEl.appendChild(userTemplateEl);
    });
  }
}

/** shareUnit save another user to a unit */
async function shareUnit() {
  const emailEl = document.getElementById('share-input');
  if (!emailEl.checkValidity()) {
    document.getElementById('error-appender-add').innerHTML+='<p>Invalid email, this field must not be blank.</p>';
    return;
  }

  const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  const fetchOptions = {
    method: 'POST',
    headers: {'Authorization': 'Bearer ' + token}
  };

  let url = '/data/units/share/';
  url += '?email=' + encodeURIComponent(emailEl.value);
  url += '&unitid=' + encodeURIComponent(currentUnit);

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    console.log(response.status);
    return;
  }
}

/** saveUnit updates the title and shortcode when editing */
async function saveUnit() {
  const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  const fetchOptions = {
    method: 'POST',
    headers: {'Authorization': 'Bearer ' + token}
  };

  const titleEl = document.getElementById('title-unit-input');
  const fullEl = document.getElementById('full-title-unit-input');
  const errorAppender = document.getElementById('error-appender-edit');
  document.getElementById('error-appender-edit').innerHTML='';
  if (!titleEl.checkValidity()) {
    document.getElementById('error-appender-edit').innerHTML+='<p>Invalid shortcode, this field must not be blank.</p>';
    return;
  }
  if (!fullEl.checkValidity()) {
    document.getElementById('error-appender-add').innerHTML+='<p>Invalid full name, this field must not be blank.</p>';
    return;
  }

  let url = '/data/units/edit/';
  url += '?title=' + encodeURIComponent(titleEl.value);
  url += '&full=' + encodeURIComponent(fullEl.value);
  url += '&unitid=' + encodeURIComponent(currentUnit);
  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    console.log(response.status);
    return;
  }

  closepopup();
  requestUnits();
  getUnitFullName();
}

/** deleteUnit adds 2 extra buttons to the edit popup to confrim or cancel the delete */
async function deleteUnit() {
  const errorAppender = document.getElementById('error-appender-edit');
  document.getElementById('error-appender-edit').innerHTML='';
  const deletes = document.getElementById("delete-warning").content.cloneNode(true);
  document.getElementById('error-appender-edit').appendChild(deletes);
  document.getElementById('cancel-delete').addEventListener('click', closepopup);
  document.getElementById('confirm-delete').addEventListener('click', confimredDelete);
}

/** confimredDelete removes a unit from the database */
async function confimredDelete() {
  const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  const fetchOptions = {
    method: 'DELETE',
    headers: {'Authorization': 'Bearer ' + token}
  };

  let url = '/data/units/';

  url += '?unitid=' + encodeURIComponent(currentUnit);

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    console.log(response.status);
    return;
  }
  closepopup();
  requestUnits();
}

//Wrapper helper functions

/**
 * getWrapper finds the unit wrapper when clicked within a unit element
 * @param {element} el the element being clicked
 * @return {element} el the parent element
 */
function getWrapper(el) {
  while (!el.classList.contains('unit') )  {
    el = el.parentElement;
  }
  return el;
}

/**
 * getWeekWrapper finds the week wrapper when clicked within a week element
 * @param {element} el the element being clicked
 * @return {element} el the parent element
 */
function getWeekWrapper(el) {
  while (!el.classList.contains('week') )  {
    el = el.parentElement;
  }
  return el;
}

/**
 * getObjWrapper finds the objective wrapper when clicked within a objective element
 * @param {element} el the element being clicked
 * @return {element} el the parent element
 */
function getObjWrapper(el) {
  while (!el.classList.contains('objective') )  {
    el = el.parentElement;
  }
  return el;
}

/**
 * displayUnitInfo calls functions to show weeks and objectives when a unit is clicked
 * @param {event} e the element being clicked
 */
async function displayUnitInfo(e) {
  const el = getWrapper(e.target);
  currentUnit = el.dataset.id;
  document.getElementById('main-content').classList.remove("hidden");
  //hide a week content if clicking another unit
  blankWeekContent();
  getUnitFullName();
  document.getElementById('add-obj').addEventListener('click', addObject);
  document.getElementById('add-week').addEventListener('click', addWeek);
  let units = document.querySelectorAll(".unit");
  units.forEach((unit) => {unit.classList.remove("highlighted");});
  el.classList.add("highlighted");
  isSelected = false;
  displayWeeks();
  displayObjectives();
}

/** getUnitFullName gets the full name of a unit */
async function getUnitFullName() {
  const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  const fetchOptions = {
    method: 'GET',
    headers: {'Authorization': 'Bearer ' + token}
  };

  let url = '/data/units/fullname';
  url += '?unitid=' + currentUnit;

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    console.log(response.status);
    return;
  }

  const data = await response.json();
  if (data.unitfullname == "") {
    document.getElementById('unit-titles').textContent = "You should really add a full unit name!";
    return;
  }
  document.getElementById('unit-titles').textContent = data.unitfullname;
}

// Week Functions

/** displayWeeks finds all the weeks on a unit and passes that list to displaySelectedWeeks */
async function displayWeeks() {
  const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  const fetchOptions = {
    method: 'GET',
    headers: {'Authorization': 'Bearer ' + token}
  };

  let url = '/data/weeks';
  url += '?unitid=' + currentUnit;

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    console.log(response.status);
    return;
  }

  const data = await response.json();
  displaySelectedWeeks(data);
}

/** addWeek shows a input box and button for adding a week */
async function addWeek() {
  document.getElementById('add-a-week').classList.remove('hidden');
  document.getElementById('save-week-button').addEventListener('click', saveWeek);
  document.getElementById('cancel-week-button').addEventListener('click', cancelWeek);
}

/** addWeek removes the div */
function cancelWeek() {
  document.getElementById('add-week-form').reset();
  document.getElementById('add-a-week').classList.add('hidden');
}

/** saveWeek saves the week to the database */
async function saveWeek() {
  const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  const fetchOptions = {
    method: 'POST',
    headers: {'Authorization': 'Bearer ' + token}
  };

  const weekTitleEl = document.getElementById('week-title-input');
  const numEl = document.getElementById('week-num-input');
  if (!weekTitleEl.checkValidity()) {
    return;
  }

  let url = '/data/weeks/';
  url += '?title=' + encodeURIComponent(weekTitleEl.value);
  url += '&unitid=' + encodeURIComponent(currentUnit);
  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    console.log(response.status);
    return;
  }

  document.getElementById('add-a-week').classList.add('hidden');
  document.getElementById('add-week-form').reset();
  isSelected = false;
  displayWeeks();
}

/**
 * removeWeek deletes a week from the database
 * @param {event} event the element being clicked
 */
async function removeWeek(event) {
  beingDeleted = true;
  const el = getWeekWrapper(event.target);
  const weekid = el.dataset.weekid;
  const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  const fetchOptions = {
    method: 'DELETE',
    headers: {'Authorization': 'Bearer ' + token}
  };

  let url = '/data/weeks/';
  url += '?weekid=' + encodeURIComponent(weekid);
  url += '&unitid=' + encodeURIComponent(currentUnit);

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    console.log(response.status);
    return;
  }
  removeFilters();
  displayWeeks();
}

// Week Content Functions

/** displayWeekInfo shows all topics notes and resources of a week */
async function displayWeekInfo() {
  //check if its being deleted before running
  if (!beingDeleted) {
    isSelected = true;
    const weekContentHolderEl = document.getElementById('weeks-content-holder');
    weekContentHolderEl.innerHTML = "";
    const weekContentTemplateEl = document.getElementById('weeks-main-content').content.cloneNode(true);
    weekContentHolderEl.appendChild(weekContentTemplateEl);

    let weeks = document.querySelectorAll(".week");
    if (typeof this != "undefined") {
      weeks.forEach((week) => {week.classList.remove("highlighted");});
      this.classList.add("highlighted");
      currentWeek = this.dataset.weekid;
    }

    const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
    const fetchOptions = {
      method: 'GET',
      headers: {'Authorization': 'Bearer ' + token}
    };

    let url = '/data/weeks/week/';
    url += '?weekid=' + currentWeek;

    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      console.log(response.status);
      return;
    }

    const data = await response.json();
    let topics = JSON.parse(data.topics);
    let resources = JSON.parse(data.resources);

    document.getElementById('add-topic').addEventListener('click', function() {addTopic(topics);});
    document.getElementById('save-notes-button').addEventListener('click', saveNotes);
    document.getElementById('add-resource').addEventListener('click', function() {addResource(resources);});
    document.getElementById('notes-text-area').value = data.notes;

    //add all topics from the topic array
    const topicHolder = document.getElementById('topic-holder');
    topicHolder.innerHTML = "";
    if (topics != null) {
      topics.forEach((topic) => {
        const topicTemplateEl = document.getElementById('topic-card').content.cloneNode(true);
        topicTemplateEl.querySelector('.title').textContent = topic;
        topicHolder.appendChild(topicTemplateEl);
      });
    } else {
      topicHolder.innerHTML = "<h3>No topics</h3>";
    }

    //https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
    //Source of regEx url checking code
    const pattern = new RegExp('^(https?:\\/\\/)?'+ '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ '((\\d{1,3}\\.){3}\\d{1,3}))'+ '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ '(\\?[;&a-z\d%_.~+=-]*)?'+ '(\\#[-a-z\d_]*)?$','i');

    //add all resources from the topic array
    const resourceHolder = document.getElementById('resource-holder');
    resourceHolder.innerHTML = "";
    if (resources != null) {
      resources.forEach((resource) => {
        let linkedResource = resource;
        //check if a resource is a link
        if (pattern.test(resource)) {
          linkedResource = "<a href=\"" + resource + "\">" + resource + "</a>";
        }
        const resourceTemplateEl = document.getElementById('resource-card').content.cloneNode(true);
        resourceTemplateEl.querySelector('.title').innerHTML = linkedResource;
        resourceHolder.appendChild(resourceTemplateEl);
      });
    } else {
      resourceHolder.innerHTML = "<h3>No resources</h3>";
    }
    showDependencies();
  }
  beingDeleted = false;
}

/** saveNotes updates the database with the notes textarea */
async function saveNotes() {
  const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  const fetchOptions = {
    method: 'POST',
    headers: {'Authorization': 'Bearer ' + token}
  };

  const notesEl = document.getElementById('notes-text-area');
  if (!notesEl.checkValidity()) {
    return;
  }

  let url = '/data/weeks/notes/';
  url += '?notes=' + encodeURIComponent(notesEl.value);
  url += '&weekid=' + encodeURIComponent(currentWeek);
  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    console.log(response.status);
    return;
  }
  document.getElementById('save-notes-button').textContent = "Saved";
  document.getElementById('save-notes-button').disabled = true;
  setTimeout(function(){
    document.getElementById('save-notes-button').textContent = "Save";
    document.getElementById('save-notes-button').disabled = false;
  }, 1000);
}

/**
 * addTopic shows the div for adding a topic
 * @param {array} topicArr a array of all the topics for a week
 */
function addTopic(topicArr) {
  document.getElementById('add-a-topic').classList.remove('hidden');
  document.getElementById('save-topic-button').addEventListener('click', function() {saveTopic(topicArr);});
  document.getElementById('cancel-topic-button').addEventListener('click', cancelTopic);
}

/** cancelTopic hides the dive for adding a topic */
function cancelTopic() {
  document.getElementById('add-topic-form').reset();
  document.getElementById('add-a-topic').classList.add('hidden');
}

/**
 * saveTopic adds a topic to a array and then saves that array to the database
 * @param {array} topicArr a array of all the topics for a week
 */

async function saveTopic(topicArr) {
  let newTopicArr = topicArr;
  const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  const fetchOptions = {
    method: 'POST',
    headers: {'Authorization': 'Bearer ' + token}
  };

  const topicTitleEl = document.getElementById('topic-title-input');
  if (!topicTitleEl.checkValidity()) {
    return;
  }

  //Array is converted so it can be saved to the database as a string
  newTopicArr.push(topicTitleEl.value);
  newTopicArr = JSON.stringify(newTopicArr);

  let url = '/data/weeks/topics/';
  url += '?topic=' + encodeURIComponent(newTopicArr);
  url += '&weekid=' + encodeURIComponent(currentWeek);
  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    console.log(response.status);
    return;
  }

  document.getElementById('add-a-topic').classList.add('hidden');
  document.getElementById('add-topic-form').reset();
  displayWeekInfo();
}

/**
 * addResource shows the input div form to add a resource
 * @param {array} resourceArr a array of all the resources for a week
 */
function addResource(resourceArr) {
  document.getElementById('add-a-resource').classList.remove('hidden');
  document.getElementById('save-resource-button').addEventListener('click', function() {saveResource(resourceArr);});
  document.getElementById('cancel-resource-button').addEventListener('click', cancelResource);
}

/** cancelResource hides the input div form to add a resource */
function cancelResource() {
  document.getElementById('add-resource-form').reset();
  document.getElementById('add-a-resource').classList.add('hidden');
}

/**
 * saveResource adds the new resource to the database by converting an array
 * @param {array} resourceArr a array of all the resources for a week
 */
async function saveResource(resourceArr) {
  let newResourceArr = resourceArr;
  const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  const fetchOptions = {
    method: 'POST',
    headers: {'Authorization': 'Bearer ' + token}
  };

  const resourceTitleEl = document.getElementById('resource-title-input');
  if (!resourceTitleEl.checkValidity()) {
    return;
  }

  newResourceArr.push(resourceTitleEl.value);
  newResourceArr = JSON.stringify(newResourceArr);

  let url = '/data/weeks/resources/';
  url += '?resource=' + encodeURIComponent(newResourceArr);
  url += '&weekid=' + encodeURIComponent(currentWeek);
  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    console.log(response.status);
    return;
  }

  document.getElementById('add-a-resource').classList.add('hidden');
  document.getElementById('add-resource-form').reset();
  displayWeekInfo();
}

//Objective functions

/** displayObjectives adds all objectives for a unit to the page */
async function displayObjectives() {
  const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  const fetchOptions = {
    method: 'GET',
    headers: {'Authorization': 'Bearer ' + token}
  };

  let url = '/data/objectives';
  url += '?unitid=' + currentUnit;

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    console.log(response.status);
    return;
  }

  const data = await response.json();
  const objectiveHolderEl = document.getElementById('objective-holder');
  objectiveHolderEl.innerHTML='';
  if (data.length == 0) {
    objectiveHolderEl.innerHTML='No objectives yet!';
    return;
  }

  data.forEach((objective) => {
    const objTemplateEl = document.getElementById('objective-temp').content.cloneNode(true);
    objTemplateEl.querySelector('.objective-title').textContent = objective.objectivetext;
    objTemplateEl.querySelector('.objective').dataset.objid = objective.objid;
    objectiveHolderEl.appendChild(objTemplateEl);
  });

  let objectives = document.querySelectorAll('.objective');
  objectives.forEach((obj) => {
    obj.addEventListener('click', function() {
      if (event.target == this.childNodes[3]) {
        displayWeekInfo();
      } else if (event.target == this.childNodes[5]){
        removeObj();
      } else {
        displayGroupWeeks(event);
      }
    });
    obj.addEventListener('dragstart', function() {initDrag(event);});
  });
}

/** removeObj deletes an objective */
async function removeObj() {
  const el = getObjWrapper(event.target);
  const objid = el.dataset.objid;
  const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  const fetchOptions = {
    method: 'DELETE',
    headers: {'Authorization': 'Bearer ' + token}
  };

  let url = '/data/objectives/';
  url += '?objid=' + encodeURIComponent(objid);
  url += '&unitid=' + encodeURIComponent(currentUnit);

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    console.log(response.status);
    return;
  }
  displayObjectives();
}

/** addObject shows the form for adding an objective */
async function addObject() {
  removeFilters();
  document.getElementById('add-a-objective').classList.remove('hidden');
  document.getElementById('save-obj-button').addEventListener('click', saveObject);
  document.getElementById('cancel-obj-button').addEventListener('click', cancelObject);
}

/** cancelObject hides the form for adding an objective */
function cancelObject() {
  document.getElementById('add-objective-form').reset();
  document.getElementById('add-a-objective').classList.add('hidden');
}

/** saveObject saves and objecitve to the database */
async function saveObject() {
  const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  const fetchOptions = {
    method: 'POST',
    headers: {'Authorization': 'Bearer ' + token}
  };

  const objTitleEl = document.getElementById('objective-title-input');
  if (!objTitleEl.checkValidity()) {
    return;
  }

  let url = '/data/objectives/';
  url += '?title=' + encodeURIComponent(objTitleEl.value);
  url += '&unitid=' + encodeURIComponent(currentUnit);
  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    console.log(response.status);
    return;
  }

  document.getElementById('add-a-objective').classList.add('hidden');
  document.getElementById('add-objective-form').reset();
  displayObjectives();
}

/** initDrag start of dragging and objective to transfer its id */
function initDrag(event) {
  event.dataTransfer.setData("text", event.target.dataset.objid);
}

/** allowDrop lets the objective be dropped */
function allowDrop(e) {
    e.preventDefault();
}

/** saveObjLink saves a link between an objective and a week that the objective was dropped on*/
async function saveObjLink(event) {
  const el = getWeekWrapper(event.target);
  const weekid = el.dataset.weekid;
  let objectiveid = event.dataTransfer.getData("text");
  event.preventDefault();

  const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  const fetchOptions = {
    method: 'POST',
    headers: {'Authorization': 'Bearer ' + token}
  };

  let url = '/api/links';
  url += '?objid=' + encodeURIComponent(objectiveid);
  url += '&weekid=' + encodeURIComponent(weekid);
  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    console.log(response.status);
    return;
  }
  showDependencies();
}

/** showDependencies highlights all the objectives a week has been asigned */
async function showDependencies() {
  if (isSelected && !beingDeleted) {
    const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
    const fetchOptions = {
      method: 'GET',
      headers: {'Authorization': 'Bearer ' + token}
    };

    let url = '/data/links';
    url += '?weekid=' + currentWeek;

    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      console.log(response.status);
      return;
    }

    const data = await response.json();

    let objectives = document.querySelectorAll('.objective');
    objectives.forEach((obj) => {
      obj.classList.remove("highlighted");
      obj.childNodes[3].classList.add("hidden");
      data.forEach((ids) =>{
        if (obj.dataset.objid == ids.objid) {
          obj.classList.add("highlighted");
          obj.childNodes[3].classList.remove("hidden");
        }
      });
    });

    let removeButtons = document.querySelectorAll('.delete-obj-link');
    removeButtons.forEach((button) => {
      button.addEventListener('click', function() {removeWeekObjLink(event)});
    });
  }
  beingDeleted = false;
}

/** removeWeekObjLink deletes a link between an objective and a week */
async function removeWeekObjLink(event) {
  const el = getObjWrapper(event.target);
  const objid = el.dataset.objid;
  const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  const fetchOptions = {
    method: 'DELETE',
    headers: {'Authorization': 'Bearer ' + token}
  };

  let url = '/api/links/';
  url += '?objid=' + encodeURIComponent(objid);
  url += '&weekid=' + encodeURIComponent(currentWeek);

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    console.log(response.status);
    return;
  }
  displayWeekInfo();
}

/** displayGroupWeeks shows all weeks that are assigned to an objective */
async function displayGroupWeeks(event) {
  cancelObject();
  isSelected = false;
  const el = getObjWrapper(event.target);
  const objid = el.dataset.objid;

  removeObjectiveHighlight();
  el.classList.add("highlighted");

  const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  const fetchOptions = {
    method: 'GET',
    headers: {'Authorization': 'Bearer ' + token}
  };

  let url = '/data/weeks/group';
  url += '?unitid=' + currentUnit;
  url += '&objid=' + objid;

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    console.log(response.status);
    return;
  }

  const data = await response.json();
  let removeFilter = document.getElementById('remove-obj-filter');
  removeFilter.classList.remove('hidden');
  removeFilter.addEventListener('click', removeFilters);
  blankWeekContent();
  displaySelectedWeeks(data);
}

/**
 * displaySelectedWeeks adds all weeks the page that were passed in data
 * @param {object} data all of the weeks passed by other functions
 */
function displaySelectedWeeks(data) {
  const weekHolderEl = document.getElementById('week-holder');
  weekHolderEl.innerHTML='';
  if (data.length == 0) {
    weekHolderEl.innerHTML='No weeks for this objective!';
    return;
  }

  data.forEach((weeks) => {
    const weekTemplateEl = document.getElementById('week-card').content.cloneNode(true);
    weekTemplateEl.querySelector('.title').textContent = weeks.weeknumber + ': ' + weeks.title || 'No Title';
    weekTemplateEl.querySelector('.week').dataset.weekid = weeks.weekid;
    weekHolderEl.appendChild(weekTemplateEl);
  });

  let deleteWeeks = document.querySelectorAll(".delete-week-button");
  deleteWeeks.forEach((button) => {
    button.addEventListener('click', function() {removeWeek(event)});
  });

  let allWeeks = document.querySelectorAll(".week");
  allWeeks.forEach((weeks) => {
    weeks.addEventListener('click', displayWeekInfo);
    weeks.addEventListener('dragover', allowDrop);
    weeks.addEventListener('drop', function() {saveObjLink(event);});
  });
}

//Helper functions

/** removeObjectiveHighlight is a helper function to remove all objective highlights */
function removeObjectiveHighlight() {
  let objectives = document.querySelectorAll('.objective');
  objectives.forEach((obj) => {
    obj.classList.remove("highlighted");
    obj.childNodes[3].classList.add("hidden");
  });
}

/** removeFilters is to remove any objectives being selected and showing assosicted weeks */
function removeFilters() {
  isSelected = false;
  blankWeekContent();
  removeObjectiveHighlight();
  document.getElementById('remove-obj-filter').classList.add('hidden');
  displayWeeks();
}

/** blankWeekContent removes the week content template */
function blankWeekContent() {
  const weekContentHolderEl = document.getElementById('weeks-content-holder');
  weekContentHolderEl.innerHTML = "";
}
