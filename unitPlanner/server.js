'use strict';

const express = require('express');
const app = express();
const db = require('./sql-model.js');

const GoogleAuth = require('simple-google-openid');

// you can put your client ID here
app.use(GoogleAuth("428194716118-ea261sj658deb5gq406lr1e14c8u8sh2.apps.googleusercontent.com"));

// this will serve the HTML file shown below
app.use('/', express.static('webpage'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, async () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// GET  /data/units           - returns all units for a specified user
//      /data/units/single    - retrives the unit of a certian id
//      /data/weeks           - retrives all weeks of a unit
//      /data/units/fullname  - retrives just the full name of a specified unit
//      /data/weeks/week      - retrives all the content of a week
//      /data/objectives      - retrives all objectives of a unit
//      /data/links           - retrives the objectives linked to a specific week
//      /data/weeks/group     - gets only a small subrange of groups sepcified by objective
//      /data/users           - checks to see if a user exsists and if not adds them
//      /data/units/share     - gets all the other users a unit is shared with
// POST /data/units           - adds a unit to the database
//      /data/units/edit      - updates a units shortcode and fullname
//      /data/weeks           - adds a week to the database
//      /data/weeks/notes     - updates notes in the database
//      /data/weeks/topics    - updates the database with more topics in a array
//      /data/weeks/resources - updates the database with more resources in a array
//      /api/links            - adds a link between a week and a objective
//      /data/objectives      - adds a objecitve to the database
//      /data/units/share     - adds a unit to another users shared list
// DELETE /data/units         - removes a unit from the database
//      /api/links            - reomves the linke between a week and a objective
//      /data/weeks           - removes a week from the database
//      /data/objectives      - removes a objective from the database
app.get('/data/units', getUnitsToPage);
app.get('/data/units/single', getSingleUnit);
app.get('/data/weeks', getWeeksToPage);
app.get('/data/units/fullname', getUnitFullName);
app.get('/data/weeks/week', getWeekInfo);
app.get('/data/objectives', getObjectives);
app.get('/data/links', getLinks);
app.get('/data/weeks/group', selecteWeeksGroup);
app.get('/data/users', checkUserExsists);
app.get('/data/units/share', getShared);
app.post('/data/units', postNewUnit);
app.post('/data/units/edit', saveSingleUnit);
app.post('/data/weeks', addWeeks);
app.post('/data/weeks/notes', addNotes);
app.post('/data/weeks/topics', addTopics);
app.post('/data/weeks/resources', addResources);
app.post('/api/links', addLink);
app.post('/data/objectives', addObjective);
app.post('/data/units/share', addUserUnitLink);
app.delete('/data/units', deleteUnit);
app.delete('/api/links', deleteLink);
app.delete('/data/weeks', deleteWeeks);
app.delete('/data/objectives', deleteObjective);

//server function

//GETS
async function getUnitsToPage(req, res) {
  res.send(await db.getUnit(req.user.id));
}

async function getSingleUnit(req, res) {
  const unitID = req.query.unitid;
  res.send(await db.getSingleUnit(unitID, req.user.id));
}

async function getWeeksToPage(req, res) {
  const unitID = req.query.unitid;
  res.send(await db.getWeeks(unitID));
}

async function getUnitFullName(req, res) {
  const unitID = req.query.unitid;
  res.send(await db.getFullName(unitID));
}

async function getWeekInfo(req, res) {
  const weekID = req.query.weekid;
  res.send(await db.getWeeksInfo(weekID));
}

async function getObjectives(req, res) {
  const unitID = req.query.unitid;
  res.send(await db.getObjectives(unitID));
}

async function getLinks(req, res) {
  const weekID = req.query.weekid;
  res.send(await db.getLink(weekID));
}

async function selecteWeeksGroup(req, res) {
  const unitID = req.query.unitid;
  const objID = req.query.objid;
  res.send(await db.getGroupedWeeks(unitID, objID));
}

async function checkUserExsists(req, res) {
  const name = req.query.name;
  const email = req.query.email;
  let users = await db.checkUsers(req.user.id);
  //check to see if the user exsists and if not then add them
  if (users.length == 0) {
    res.send(await db.addUser(name, email, req.user.id));
  } else {
    res.send(users);
  }
}

async function getShared(req, res) {
  const unitID = req.query.unitid;
  res.send(await db.getSharedUsers(unitID));
}


//POST
async function postNewUnit(req, res) {
  const title = req.query.title;
  const full = req.query.full;
  res.send(await db.addUnit(title, full, req.user.id));
}

async function saveSingleUnit(req, res) {
  const unitID = req.query.unitid;
  const title = req.query.title;
  const full = req.query.full;
  res.send(await db.saveSingleUnit(unitID, title, full, req.user.id));
}

async function addWeeks(req, res) {
  const unitID = req.query.unitid;
  const title = req.query.title;
  let nums = await db.getWeekNums(unitID);
  let nextWeek = 1;
  //check if it will be week 1 else add the next week in the list
  if (nums.length != 0 ) {
    nextWeek = nums.length + 1;
  }
  res.send(await db.saveWeek(unitID, title, nextWeek));
}

async function addNotes(req, res) {
  const weekID = req.query.weekid;
  const notes = req.query.notes;
  res.send(await db.addNote(weekID, notes));
}

async function addTopics(req, res) {
  const weekID = req.query.weekid;
  const topic = req.query.topic;
  res.send(await db.addTopic(weekID, topic));
}

async function addResources(req, res) {
  const weekID = req.query.weekid;
  const resource = req.query.resource;
  res.send(await db.addResource(weekID, resource));
}

async function addLink(req, res) {
  const weekID = req.query.weekid;
  const objID = req.query.objid;
  res.send(await db.addLinks(objID, weekID));
}

async function addObjective(req, res) {
  const unitID = req.query.unitid;
  const title = req.query.title;
  res.send(await db.addObjective(unitID, title));
}

async function addUserUnitLink(req, res) {
  const unitID = req.query.unitid;
  const email = req.query.email;
  res.send(await db.addUserUnitLink(unitID, email));
}

//DELETE
async function deleteUnit(req, res) {
  const unitID = req.query.unitid;
  res.send(await db.deleteUnit(unitID, req.user.id));
}

async function deleteLink(req, res) {
  const weekID = req.query.weekid;
  const objID = req.query.objid;
  res.send(await db.removeLink(objID, weekID));
}

async function deleteWeeks(req, res) {
  const weekID = req.query.weekid;
  const unitID = req.query.unitid;
  res.send(await db.removeWeek(unitID, weekID));
  let nums = await db.getWeekNums(unitID);
  let previousNum = 0;
  let jumpPos = [];
  //check to see if any weeks are now 1 ahead and get the array
  nums.forEach((number) => {
    if (number.weeknumber != 1) {
      if (number.weeknumber - 1 != previousNum) {
        jumpPos.push(number);
      }
    }
    previousNum += 1;
  });

  //for all the jumped weeks update the database with the week before
  let newWeek = 1;
  jumpPos.forEach(async (num) => {
    if (num.weeknumber > 1) {
      newWeek = num.weeknumber - 1;
    } else {
      newWeek = 1;
    }
    res.send(await db.updateWeekNums(unitID, num.weeknumber, newWeek));
  });
}

async function deleteObjective(req ,res) {
  const objID = req.query.objid;
  const unitID = req.query.unitid;
  res.send(await db.removeObjective(objID, unitID));
}
