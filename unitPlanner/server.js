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

//Server API
app.get('/data/units', getUnitsToPage);
app.get('/data/units/single', getSingleUnit);
app.get('/data/weeks', getWeeksToPage);
app.get('/data/units/fullname', getUnitFullName);
app.get('/data/weeks/week', getWeekInfo);
app.get('/data/objectives', getObjectives);
app.get('/api/links', getLinks);
app.get('/data/weeks/group', selecteWeeksGroup);
app.post('/data/units', postNewUnit);
app.post('/data/units/edit', saveSingleUnit);
app.post('/data/weeks', addWeeks);
app.post('/data/weeks/notes', addNotes);
app.post('/data/weeks/topics', addTopics);
app.post('/data/weeks/resources', addResources);
app.post('/api/links', addLink);
app.post('/data/objectives', addObjective);
app.delete('/data/units', deleteUnit);
app.delete('/api/links', deleteLink);
app.delete('/data/weeks', deleteWeeks);
app.delete('/data/objectives', deleteObjective);

//server function

async function getUnitsToPage(req, res) {
  res.send(await db.getUnit(req.user.id));
}

async function postNewUnit(req, res) {
  const title = req.query.title;
  const full = req.query.full;
  res.send(await db.addUnit(title, full,req.user.id));
}

async function getSingleUnit(req, res) {
  const unitID = req.query.unitid;
  res.send(await db.getSingleUnit(unitID, req.user.id));
}

async function saveSingleUnit(req, res) {
  const unitID = req.query.unitid;
  const title = req.query.title;
  const full = req.query.full;
  res.send(await db.saveSingleUnit(unitID, title, full,req.user.id));
}

async function deleteUnit(req, res) {
  const unitID = req.query.unitid;
  res.send(await db.deleteUnit(unitID, req.user.id));
}

async function getWeeksToPage(req, res) {
  const unitID = req.query.unitid;
  res.send(await db.getWeeks(unitID));
}

async function getUnitFullName(req, res) {
  const unitID = req.query.unitid;
  res.send(await db.getFullName(unitID));
}

async function addWeeks(req, res) {
  const unitID = req.query.unitid;
  const title = req.query.title;
  let nums = await db.getWeekNums(unitID);
  let nextWeek = 1;
  if (nums.length != 0 ) {
    nextWeek = nums.length + 1;
  }
  res.send(await db.saveWeek(unitID, title, nextWeek));
}

async function getWeekInfo(req, res) {
  const weekID = req.query.weekid;
  res.send(await db.getWeeksInfo(weekID));
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

async function getObjectives(req, res) {
  const unitID = req.query.unitid;
  res.send(await db.getObjectives(unitID));
}

async function getLinks(req, res) {
  const weekID = req.query.weekid;
  res.send(await db.getLink(weekID));
}

async function addLink(req, res) {
  const weekID = req.query.weekid;
  const objID = req.query.objid;
  res.send(await db.addLinks(objID, weekID));
}

async function selecteWeeksGroup(req, res) {
  const unitID = req.query.unitid;
  const objID = req.query.objid;
  res.send(await db.getGroupedWeeks(unitID, objID));
}

async function addObjective(req, res) {
  const unitID = req.query.unitid;
  const title = req.query.title;
  res.send(await db.addObjective(unitID, title));
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
  nums.forEach((number) => {
    if (number.weeknumber != 1) {
      if (number.weeknumber - 1 != previousNum) {
        jumpPos.push(number);
      }
    }
    previousNum += 1;
  });

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
