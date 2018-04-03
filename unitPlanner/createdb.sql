DROP DATABASE IF EXISTS plannerdb;
CREATE DATABASE IF NOT EXISTS plannerdb;

USE plannerdb;

CREATE TABLE IF NOT EXISTS units (
  unitid INT PRIMARY KEY AUTO_INCREMENT,
  unitname VARCHAR(20),
  unitfullname VARCHAR(100),
  userid VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS objectives (
  objid INT PRIMARY KEY AUTO_INCREMENT,
  objectivetext TEXT,
  unitid INT NOT NULL,
  FOREIGN KEY(unitid) REFERENCES units(unitid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS weeks (
  weekid INT PRIMARY KEY AUTO_INCREMENT,
  weeknumber INT,
  title VARCHAR(20),
  topics TEXT,
  notes TEXT,
  resources TEXT,
  unitid INT,
  FOREIGN KEY(unitid) REFERENCES units(unitid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS weekstoobjectivies (
  linkid INT PRIMARY KEY AUTO_INCREMENT,
  objid INT NOT NULL,
  weekid INT NOT NULL,
  FOREIGN KEY(objid) REFERENCES objectives(objid) ON DELETE CASCADE,
  FOREIGN KEY(weekid) REFERENCES weeks(weekid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  userid INT PRIMARY KEY AUTO_INCREMENT,
  googletoken VARCHAR(50),
  username VARCHAR(200),
  gmail VARCHAR(300)
);

CREATE TABLE IF NOT EXISTS usersunitlink (
  unitlinkid INT PRIMARY KEY AUTO_INCREMENT,
  userid INT NOT NULL,
  unitid INT NOT NULL,
  FOREIGN KEY(unitid) REFERENCES units(unitid) ON DELETE CASCADE,
  FOREIGN KEY(userid) REFERENCES users(userid) ON DELETE CASCADE
);

INSERT INTO units VALUES (1 ,"WEBSCRP", "Web Script", "110900211868756842381");
INSERT INTO units VALUES (2 ,"WEBF1", "Web foundations 1", "110900211868756842381");
INSERT INTO units VALUES (3 ,"WEBRES", "", "110900211868756842381");
INSERT INTO units VALUES (4 ,"MATHFUN", "Maths and functional programming", "110900211868756842381");
INSERT INTO units VALUES (5 ,"Tester", "", "110900211868756842381");

INSERT INTO weeks VALUES (1 , 1, "CSS", '["Stuff","CSS"]', "NOTES", '["http://www.port.ac.uk","http://www.google.com","Text book"]', 1);
INSERT INTO weeks VALUES (3 , 2, "HTML", '["Things"]', "Things", '["http://www.port.ac.uk"]', 1);
INSERT INTO weeks VALUES (4 , 5, "5", '[""]', "", '[""]', 1);
INSERT INTO weeks VALUES (5 , 4, "4", '[""]', "", '[""]', 1);
INSERT INTO weeks VALUES (6 , 3, "Tests", '[""]', "", '[""]', 1);
INSERT INTO weeks VALUES (2 , 1, "Ting", '[""]', "", '["Book"]', 2);

INSERT INTO objectives VALUES (1 , "Web", 1);
INSERT INTO objectives VALUES (2 , "Tests", 1);
INSERT INTO objectives VALUES (3 , "Sytle", 1);

INSERT INTO weekstoobjectivies VALUES (1 , 1, 1);
