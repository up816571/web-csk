'use strict';

// create one connection to the database
let sqlPromise = null;

const mysql = require('mysql2/promise');
const config = require('./config.json');

async function init() {
  if (sqlPromise) return sqlPromise;

  sqlPromise = newConnection();
  return sqlPromise;
}

async function shutDown() {
  if (!sqlPromise) return;
  const stashed = sqlPromise;
  sqlPromise = null;
  await releaseConnection(await stashed);
}

async function newConnection() {
  const sql = await mysql.createConnection(config.mysql);

  // handle unexpected errors by just logging them
  sql.on('error', (err) => {
    console.error(err);
    sql.end();
  });

  return sql;
}

async function releaseConnection(connection) {
  await connection.end();
}

async function getUnit(userid) {
  const sql = await init();
  const query = sql.format('SELECT * FROM units WHERE userid = ?', userid);
  const [units] = await sql.query(query);
  return units;
}

async function addUnit(unitName, unitfullname,userid) {
  const sql = await init();
  const insertQuery = sql.format('INSERT INTO units SET ? ;', {unitName, unitfullname, userid});
  await sql.query(insertQuery);
}

async function getSingleUnit(unitid, userid) {
  const sql = await init();
  const query = sql.format('SELECT * FROM units WHERE userid = ? AND unitid = ?', [userid, unitid]);
  const [unit] = await sql.query(query);
  return unit;
}

async function saveSingleUnit(unitid, unitName, unitfullname,userid) {
  const sql = await init();
  const insertQuery = sql.format('UPDATE units SET unitname = ?, unitfullname = ? WHERE unitid = ? AND userid = ?', [unitName, unitfullname, unitid, userid]);
  await sql.query(insertQuery);
}

async function deleteUnit(unitid, userid) {
  const sql = await init();
  const deleteQuery = sql.format('DELETE FROM units WHERE unitid = ? AND userid = ?', [unitid, userid]);
  await sql.query(deleteQuery);
}

async function getWeeks(unitid) {
  const sql = await init();
  const query = sql.format('SELECT * FROM weeks WHERE unitid = ? ORDER BY weeknumber', [unitid]);
  const [weeks] = await sql.query(query);
  return weeks;
}

async function getFullName(unitid) {
  const sql = await init();
  const query = sql.format('SELECT unitfullname FROM units WHERE unitid = ?', [unitid]);
  const [name] = await sql.query(query);
  return name[0];
}

async function saveWeek(unitid, title, weeknumber) {
  const sql = await init();
  const insertQuery = sql.format('INSERT INTO weeks (title, weeknumber, unitid) VALUES (?,?, (SELECT unitid FROM units WHERE unitid = ?));', [title, weeknumber, unitid]);
  await sql.query(insertQuery);
}

async function getWeeksInfo(weekid) {
  const sql = await init();
  const query = sql.format('SELECT * FROM weeks WHERE weekid = ?', [weekid]);
  const [info] = await sql.query(query);
  return info[0];
}

async function addNote(weekid, notes) {
  const sql = await init();
  const insertQuery = sql.format('UPDATE weeks SET notes = ? WHERE weekid = ?', [notes, weekid]);
  await sql.query(insertQuery);
}

async function addTopic(weekid, topics) {
  const sql = await init();
  const insertQuery = sql.format('UPDATE weeks SET topics = ? WHERE weekid = ?', [topics, weekid]);
  await sql.query(insertQuery);
}

async function addResource(weekid, resources) {
  const sql = await init();
  const insertQuery = sql.format('UPDATE weeks SET resources = ? WHERE weekid = ?', [resources, weekid]);
  await sql.query(insertQuery);
}

async function getObjectives(unitid) {
  const sql = await init();
  const query = sql.format('SELECT * FROM objectives WHERE unitid = ?', [unitid]);
  const [objectives] = await sql.query(query);
  return objectives;
}

async function getLink(weekid) {
  const sql = await init();
  const query = sql.format('SELECT objid FROM weekstoobjectivies WHERE weekid = ?', [weekid]);
  const [objectives] = await sql.query(query);
  return objectives;
}

async function addLinks(objid, weekid) {
  const sql = await init();
  const query = sql.format('SELECT * FROM weekstoobjectivies WHERE objid = ? AND weekid = ?', [objid, weekid]);
  const [links] = await sql.query(query);
  if (links == null) {
    const insertQuery = sql.format('INSERT INTO weekstoobjectivies (objid, weekid) VALUES ((SELECT objid FROM objectives WHERE objid = ?), (SELECT weekid FROM weeks WHERE weekid = ?));', [objid, weekid]);
    await sql.query(insertQuery);
  }
}

async function getGroupedWeeks(unitid, objid) {
  const sql = await init();
  const query = sql.format('SELECT weeks.* FROM weeks INNER JOIN weekstoobjectivies ON weeks.weekid=weekstoobjectivies.weekid WHERE weeks.unitid = ? AND weekstoobjectivies.objid = ? ORDER BY weeks.weeknumber', [unitid, objid]);
  const [objectives] = await sql.query(query);
  return objectives;
}

async function addObjective(unitid, objectivetext) {
  const sql = await init();
  const insertQuery = sql.format('INSERT INTO objectives (objectivetext, unitid) VALUES (?, (SELECT unitid FROM units WHERE unitid = ?));', [objectivetext, unitid]);
  await sql.query(insertQuery);
}

async function removeLink(objid, weekid) {
  const sql = await init();
  const deleteQuery = sql.format('DELETE FROM weekstoobjectivies WHERE objid = ? AND weekid = ?', [objid, weekid]);
  await sql.query(deleteQuery);
}

module.exports = {
  getUnit: getUnit,
  addUnit: addUnit,
  getSingleUnit: getSingleUnit,
  saveSingleUnit: saveSingleUnit,
  deleteUnit: deleteUnit,
  getWeeks: getWeeks,
  getFullName: getFullName,
  saveWeek: saveWeek,
  getWeeksInfo: getWeeksInfo,
  addNote: addNote,
  addTopic: addTopic,
  addResource: addResource,
  getObjectives: getObjectives,
  getLink: getLink,
  addLinks: addLinks,
  getGroupedWeeks: getGroupedWeeks,
  addObjective: addObjective,
  removeLink: removeLink,
};
