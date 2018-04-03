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

/**
 * getUnit gets all units a user has made and unit shtat were shared with them
 * @param {int} userid the users google token
 * @returns {Object} units all the units found
 */
async function getUnit(userid) {
  const sql = await init();
  const query = sql.format('SELECT * FROM units WHERE userid = ?', userid);
  let [units] = await sql.query(query);
  const sharedquery = sql.format('SELECT * FROM units WHERE unitid = (SELECT unitid FROM usersunitlink WHERE userid = (SELECT userid FROM users WHERE googletoken = ?))', [userid]);
  const [sharedunits] = await sql.query(sharedquery);
  units = units.concat(sharedunits);
  return units;
}

/**
 * addUnit adds a unit
 * @param {string} unitName unit shortcode
 * @param {string} unitfullname units full name
 * @param {int} userid the users google token
 */
async function addUnit(unitName, unitfullname, userid) {
  const sql = await init();
  const insertQuery = sql.format('INSERT INTO units SET ? ;', {unitName, unitfullname, userid});
  await sql.query(insertQuery);
}

/**
 * getUnit gets 1 unit with a specific id
 * @param {int} unitid the units id
 * @param {int} userid the users google token
 * @returns {Object} unit the unit that was found
 */
async function getSingleUnit(unitid, userid) {
  const sql = await init();
  const query = sql.format('SELECT * FROM units WHERE userid = ? AND unitid = ?', [userid, unitid]);
  const [unit] = await sql.query(query);
  return unit;
}

/**
 * saveSingleUnit updates a unit, must be the owner
 * @param {int} unitid the units id
 * @param {string} unitName the new unit shortcode
 * @param {string} unitfullname the new units fullname
 * @param {int} userid the users google token
 */
async function saveSingleUnit(unitid, unitName, unitfullname, userid) {
  const sql = await init();
  const insertQuery = sql.format('UPDATE units SET unitname = ?, unitfullname = ? WHERE unitid = ? AND userid = ?', [unitName, unitfullname, unitid, userid]);
  await sql.query(insertQuery);
}

/**
 * deleteUnit removes a unit from the database, must be the owner of the unit
 * @param {int} unitid the units id
 * @param {int} userid the users google token
 */
async function deleteUnit(unitid, userid) {
  const sql = await init();
  const deleteQuery = sql.format('DELETE FROM units WHERE unitid = ? AND userid = ?', [unitid, userid]);
  await sql.query(deleteQuery);
}

/**
 * getWeeks gets all the weeks for a unit
 * @param {int} unitid the units id
 * @returns {Object} weeks all weeks for a unit
 */
async function getWeeks(unitid) {
  const sql = await init();
  const query = sql.format('SELECT * FROM weeks WHERE unitid = ? ORDER BY weeknumber', [unitid]);
  const [weeks] = await sql.query(query);
  return weeks;
}

/**
 * getFullName gets the full name of a unit
 * @param {int} unitid the units id
 * @returns {Object} name the units full name
 */
async function getFullName(unitid) {
  const sql = await init();
  const query = sql.format('SELECT unitfullname FROM units WHERE unitid = ?', [unitid]);
  const [name] = await sql.query(query);
  return name[0];
}

/**
 * saveWeek adds a week to the database
 * @param {int} unitid the units id
 * @param {string} title the weeks name
 * @param {int} weeknumber the number of a week
 */
async function saveWeek(unitid, title, weeknumber) {
  const sql = await init();
  const insertQuery = sql.format('INSERT INTO weeks (title, weeknumber, unitid) VALUES (?,?, (SELECT unitid FROM units WHERE unitid = ?));', [title, weeknumber, unitid]);
  await sql.query(insertQuery);
}

/**
 * getWeeksInfo gets all a weeks content such as topics, notes, resources
 * @param {int} weekid the weeks id
 * @returns {object} info all the weeks content
 */
async function getWeeksInfo(weekid) {
  const sql = await init();
  const query = sql.format('SELECT * FROM weeks WHERE weekid = ?', [weekid]);
  const [info] = await sql.query(query);
  return info[0];
}

/**
 * addNote updates the notes of a week
 * @param {int} weekid the weeks id
 * @param {string} notes the note to save
 */
async function addNote(weekid, notes) {
  const sql = await init();
  const insertQuery = sql.format('UPDATE weeks SET notes = ? WHERE weekid = ?', [notes, weekid]);
  await sql.query(insertQuery);
}

/**
 * addTopic updates the topics of a week
 * @param {int} weekid the weeks id
 * @param {string} topics the topic array in string format
 */
async function addTopic(weekid, topics) {
  const sql = await init();
  const insertQuery = sql.format('UPDATE weeks SET topics = ? WHERE weekid = ?', [topics, weekid]);
  await sql.query(insertQuery);
}

/**
 * addResource updates the resources of a week
 * @param {int} weekid the weeks id
 * @param {string} resources the resources array in string format
 */
async function addResource(weekid, resources) {
  const sql = await init();
  const insertQuery = sql.format('UPDATE weeks SET resources = ? WHERE weekid = ?', [resources, weekid]);
  await sql.query(insertQuery);
}

/**
 * getObjectives gets the objectives for a unit
 * @param {int} unitid the units id
 * @returns {object} objectives all the objectives for a unit
 */
async function getObjectives(unitid) {
  const sql = await init();
  const query = sql.format('SELECT * FROM objectives WHERE unitid = ?', [unitid]);
  const [objectives] = await sql.query(query);
  return objectives;
}

/**
 * getLink gets all objectives that are linked to a week
 * @param {int} weekid the weeks id
 * @returns {object} objectives that a are linked to a week
 */
async function getLink(weekid) {
  const sql = await init();
  const query = sql.format('SELECT objid FROM weekstoobjectivies WHERE weekid = ?', [weekid]);
  const [objectives] = await sql.query(query);
  return objectives;
}

/**
 * addLinks adds a link between an objective and a week
 * @param {int} objid the objectives id
 * @param {int} weekid the weeks id
 */
async function addLinks(objid, weekid) {
  const sql = await init();
  const query = sql.format('SELECT * FROM weekstoobjectivies WHERE objid = ? AND weekid = ?', [objid, weekid]);
  const [links] = await sql.query(query);
  //check if the link exsists already
  if (links.length == 0) {
    const insertQuery = sql.format('INSERT INTO weekstoobjectivies (objid, weekid) VALUES ((SELECT objid FROM objectives WHERE objid = ?), (SELECT weekid FROM weeks WHERE weekid = ?));', [objid, weekid]);
    await sql.query(insertQuery);
  }
}

/**
 * getGroupedWeeks gets all weeks the are linked to a certain objective
 * @param {int} objid the objectives id
 * @param {int} unitid the units id
 */
async function getGroupedWeeks(unitid, objid) {
  const sql = await init();
  const query = sql.format('SELECT weeks.* FROM weeks INNER JOIN weekstoobjectivies ON weeks.weekid=weekstoobjectivies.weekid WHERE weeks.unitid = ? AND weekstoobjectivies.objid = ? ORDER BY weeks.weeknumber', [unitid, objid]);
  const [objectives] = await sql.query(query);
  return objectives;
}

/**
 * addObjective saves a objective
 * @param {int} unitid the units id
 * @param {string} objectivetext the objectives name
 */
async function addObjective(unitid, objectivetext) {
  const sql = await init();
  const insertQuery = sql.format('INSERT INTO objectives (objectivetext, unitid) VALUES (?, (SELECT unitid FROM units WHERE unitid = ?));', [objectivetext, unitid]);
  await sql.query(insertQuery);
}

/**
 * removeLink deletes a link between an objective and a week
 * @param {int} objid the objectives id
 * @param {int} weekid the weeks id
 */
async function removeLink(objid, weekid) {
  const sql = await init();
  const deleteQuery = sql.format('DELETE FROM weekstoobjectivies WHERE objid = ? AND weekid = ?', [objid, weekid]);
  await sql.query(deleteQuery);
}

/**
 * removeWeek deletes a week
 * @param {int} unitid the units id
 * @param {int} weekid the weeks id
 */
async function removeWeek(unitid, weekid) {
  const sql = await init();
  const deleteQuery = sql.format('DELETE FROM weeks WHERE weekid = ? AND unitid = ?', [weekid, unitid]);
  await sql.query(deleteQuery);
}

/**
 * removeObjective deletes a objective
 * @param {int} objid the objectives id
 * @param {int} unitid the units id
 */
async function removeObjective(objid, unitid) {
  const sql = await init();
  const deleteQuery = sql.format('DELETE FROM objectives WHERE objid = ? AND unitid = ?', [objid, unitid]);
  await sql.query(deleteQuery);
}

/**
 * getWeekNums gets the weeknumbers of weeks for a unit
 * @param {int} unitid the units id
 * @returns {Object} all the week numbers
 */
async function getWeekNums(unitid) {
  const sql = await init();
  const query = sql.format('SELECT weeknumber FROM weeks WHERE unitid = ? ORDER BY weeknumber', [unitid]);
  const [weekNums] = await sql.query(query);
  return weekNums;
}

/**
 * updateWeekNums updates the week number of a week
 * @param {int} unitid the units id
 * @param {int} weeknumber the weeks current number
 * @param {int} newweek the new weeks number
 */
async function updateWeekNums(unitid, weeknumber, newweek) {
  const sql = await init();
  const insertQuery = sql.format('UPDATE weeks SET weeknumber = ? WHERE weeknumber = ? AND unitid = ?', [newweek, weeknumber, unitid]);
  await sql.query(insertQuery);
}

/**
 * checkUsers checks if a user is in the users table
 * @param {int} googletoken the users google token
 * @returns {Object} the user
 */
async function checkUsers(googletoken) {
  const sql = await init();
  const query = sql.format('SELECT * FROM users WHERE googletoken = ?', [googletoken]);
  const [users] = await sql.query(query);
  return users;
}

/**
 * addUser adds a users information to the database
 * @param {string} username the users name
 * @param {string} gmail the users gmail
 * @param {int} googletoken the users google token
 */
async function addUser(username, gmail, googletoken) {
  const sql = await init();
  const insertQuery = sql.format('INSERT INTO users SET ? ;', {googletoken, username, gmail});
  await sql.query(insertQuery);
}

/**
 * addUser adds a users information to the database
 * @param {int} unitid the units id
 * @param {string} gmail the users gmail
 */
async function addUserUnitLink(unitid, gmail) {
  const sql = await init();
  const usersquery = sql.format('SELECT * FROM users WHERE gmail = ?', [gmail]);
  const [users] = await sql.query(usersquery);
  //check to see a user exsists
  if (users.length != 0) {
    const query = sql.format('SELECT * FROM usersunitlink WHERE userid = (SELECT userid FROM users WHERE gmail = ?) AND unitid = (SELECT unitid FROM units WHERE unitid = ?)', [gmail, unitid]);
    const [links] = await sql.query(query);
    //check if the unit is already shared
    if (links.length == 0) {
      const insertQuery = sql.format('INSERT INTO usersunitlink (userid, unitid) VALUES ((SELECT userid FROM users WHERE gmail = ?), (SELECT unitid FROM units WHERE unitid = ?));', [gmail, unitid]);
      await sql.query(insertQuery);
    }
  }
}

/**
 * addUser adds a users information to the database
 * @param {int} unitid the units id
 * @returns {Object} all users shared with the unit
 */
async function getSharedUsers(unitid) {
  const sql = await init();
  const query = sql.format('SELECT username FROM users WHERE userid = (SELECT userid FROM usersunitlink WHERE unitid = ?)', [unitid]);
  const [users] = await sql.query(query);
  return users;
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
  removeWeek: removeWeek,
  removeObjective: removeObjective,
  getWeekNums: getWeekNums,
  updateWeekNums: updateWeekNums,
  checkUsers: checkUsers,
  addUser: addUser,
  addUserUnitLink: addUserUnitLink,
  getSharedUsers: getSharedUsers,
};
