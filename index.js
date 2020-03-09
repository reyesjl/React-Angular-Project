// create app and set dependencies
const express = require('express');
const bodyParser = require('express');
const dateFormat = require('dateformat');
// use example: dateFormat(row.wdate, "yyyy-mm-dd")

const app = express();

// set app info
app.set("port", 3000);
app.use(bodyParser.json({type: "application/json"}));
app.use(bodyParser.urlencoded({extended: true}));

// connection pool
const Pool = require("pg").Pool;	
const config = {			
	host: "localhost",		
	user: "postgres",			
	password: "zAdRUnapr8", 	
	database: "server2"
};

// the actual connection happens here
const pool = new Pool(config);

// create a new user in the database
app.post("/create-user", async (req, res) => {
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const username = req.body.username;
    const email = req.body.email;

    // handle empty params
    if (!firstname || !lastname || !username || !email) {
        res.json({error: "params not given"});
    } else {
        // query database and search for existing username
        try {
            const template = "SELECT * FROM users WHERE username = $1";
            const response = await pool.query(template, [username]);

            // username not found; go ahead an insert!
            if(response.rowCount == 0) {
                try {
                    const template = "INSERT INTO users (firstname, lastname, username, email) VALUES ($1, $2, $3, $4)";
                    const response = await pool.query(template, [firstname, lastname, username, email]);
                    res.json({status: "user added"});
                } catch (err) {
                    console.log(err);
			        res.json({status: "error: inserting new user - code[1]"});
                }
            // username has been found; do not add
            } else {
                res.json({status: "username taken"});
            }
        } catch (err) {
            console.log(err);
			res.json({status: "error: searching for user - code[2]"});
        }
    }
});

// delete a user FROM the database
app.delete("/delete-user", async (req, res) => {
    const username = req.body.username;

    // handle empty params
    if (!username) {
        res.json({error: "params not given"});
    } else {
        // delete user FROM database
        try {
            const template = "DELETE FROM users WHERE username = $1";
            const response = await pool.query(template, [username]);
            res.json({status: "deleted"});
        } catch (err) {
            console.log(err);
			res.json({status: "error: deleting user - code[3]"});
        }
    }
});

// list users
app.get("/list-users", async (req, res) => {
    const type = req.query.type;

    // handle empty params
    if (!type) {
        res.json({error: "params not given"});
    } else if (type == "full"){
        // list all info about each user
        try {
            const template = "SELECT * FROM users";
            const response = await pool.query(template);
            const userlist = response.rows.map(function(item) {
				return {firstname: item.firstname, lastname: item.lastname, username: item.username, email: item.email};
            });
            res.json({users: userlist});
        } catch (err) {
            console.log(err);
			res.json({status: "error: listing users (full) - code[4]"});
        }
    } else {
        // list all info about each user
        try {
            const template = "SELECT firstname, lastname FROM users";
            const response = await pool.query(template);
            
            const userlist = response.rows.map(function(item) {
				return {firstname: item.firstname, lastname: item.lastname};
            });
            
            res.json({users: userlist});
        } catch (err) {
            console.log(err);
			res.json({status: "error: listing users (summary) - code[4]"});
        }
    }
});

// create a workshop in the database
app.post("/add-workshop", async (req, res) => {
    const title = req.body.title;
    const date = req.body.date;
    const location = req.body.location;
    const maxseats = req.body.maxseats;
    const instructor = req.body.instructor;

    // handle empty params
    if (!title || !date || !location || !maxseats || !instructor) {
        res.json({error: "params not given"});
    } else {
        // query database and search for existing username
        try {
            const template = "SELECT * FROM workshops WHERE wsname = $1 AND wsdate = $2 AND wslocation = $3";
            const response = await pool.query(template, [title, date, location]);

            // workshop doesnt yet exist; continue to add
            if(response.rowCount == 0) {
                try {
                    const template = "INSERT INTO workshops (wsname, wsdate, wslocation, wsmaxseats, wsinstructor) VALUES ($1, $2, $3, $4, $5)";
                    const response = await pool.query(template, [title, date, location, maxseats, instructor]);
                    res.json({status: "workshop added"});
                } catch (err) {
                    console.log(err);
			        res.json({status: "error: adding wrokshop - code[5]"});
                }
            // workshop found in DB; dont add
            } else {
                res.json({status: "workshop already in database"});
            }
        } catch (err) {
            console.log(err);
			res.json({status: "error: searching for workshop - code[6]"});
        }
    }
});

// enroll users into workshops
app.post("/enroll", async (req, res) => {
    const title = req.body.title;
    const date = req.body.date;
    const location = req.body.location;
    const username = req.body.username;

    //handle empty params
    if (!title || !date || !location || !username) {
        res.json({error: "params not given"});
    } else {
        // ensure username exists
        try {

            // username doesnt exists check query
            const  templateUser = "SELECT * FROM users WHERE username = $1"
            const responseUser = await pool.query(templateUser, [username]);

            // workshop doesnt exist check query
            const templateWorkshop = "SELECT * FROM workshops WHERE wsname = $1 AND wsdate = $2 AND wslocation = $3";
            const responseWorkshop = await pool.query(templateWorkshop, [title, date, location]);

            // user already enrolled check query
            const templateEnrolled = "SELECT * FROM attending WHERE username = (SELECT username FROM users WHERE username = $1) AND workshopid = (SELECT workshopid FROM workshops WHERE wsname = $2 AND wsdate = $3 AND wslocation = $4);"
            const responseEnrolled = await pool.query(templateEnrolled, [username, title, date, location]);

            // seats already full check
            const templateSeatlimit = "SELECT wsmaxseats FROM workshops WHERE wsname = $1 AND wsdate = $2 AND wslocation = $3";
            const responseSeatlimit = await pool.query(templateSeatlimit, [title, date, location]);

            // check available seats 
            const templateUsersEnrolled = "SELECT count(distinct username) as enrolled FROM attending WHERE workshopid = (SELECT workshopid FROM workshops WHERE wsname = $1 AND wsdate = $2 AND wslocation = $3)";
            const responseUsersEnrolled = await pool.query(templateUsersEnrolled, [title, date, location]);

            if (responseUser.rowCount == 0) {
                res.json({status: "user not in database"});
            } else if (responseWorkshop.rowCount == 0) {
                res.json({status: "workshop does not exist"});
            } else if (responseEnrolled.rowCount > 0) {
                res.json({status: "user already enrolled"});
            } else if (responseUsersEnrolled.rows[0].enrolled == responseSeatlimit.rows[0].wsmaxseats) {
                res.json({status: "no seats available"});
            } else {
                // template for enrolling a new user to workshop
                const templateEnrollUser = "insert into attending (username, workshopid) values ( (SELECT username FROM users WHERE username = $1), (SELECT workshopid FROM workshops WHERE wsname = $2 AND wsdate = $3 AND wslocation = $4))";
                const responseEnrollUser = await pool.query(templateEnrollUser, [username, title, date, location]);
                res.json({status: "user added"});
            }
        } catch (err) {
            console.log(err);
			res.json({status: "error: enrolling user - code[7]"});
        }
    }
});

// list all workshops
app.get("/list-workshops", async (req, res) => {
    // list all workshops
    try {
        const template = "SELECT wsname, wsdate, wslocation FROM workshops";
        const response = await pool.query(template);
        const workshopList = response.rows.map(function(item) {
            return {title: item.wsname, date: dateFormat(item.wsdate, "yyyy-mm-dd"), location: item.wslocation};
        });
        res.json({workshops: workshopList});
    } catch (err) {
        console.log(err);
		res.json({status: "error: retreiving workshops - code[8]"});
    }
});

// list workshop attendees
app.get("/attendees", async (req, res) => {
    const title = req.query.title;
    const date = req.query.date;
    const location = req.query.location;

    // check aprameters
    if (!title || !date || !location) {
        res.json({error: "params not given"});
    } else {

        // setup query
        try {
            const workshopTemplate = "SELECT * FROM workshops WHERE wsname = $1 AND wsdate = $2 AND wslocation = $3";
            const workshopResponse = await pool.query(workshopTemplate, [title, date, location]);

            if (workshopResponse.rowCount == 0) {
                res.json({error: "workshop does not exist"});
            } else {
                const attendeesTemplate = "SELECT firstname, lastname FROM users JOIN attendees ON users.username = attendees.username WHERE workshopid = (SELECT workshopid FROM workshops WHERE wsname = $1 AND wsdate = $2 AND wslocation = $3)";
                const attendingResponse = await pool.query(attendeesTemplate, [title, date, location]);
            
                const attendeesList = attendingResponse.rows.map(function(item) {
                    return {firstname: item.firstname, lastname: item.lastname};
                });
                res.json({attendees: attendeesList});
            }
        } catch (err) {
            console.log(err);
            res.json({status: "error: retreiving attendees [9]"});
        }
    }
});

/**
app.post("/api", async (req, res) => {

	const name = req.body.attendee;
	const workshopName = req.body.workshop;

	// check for empty params
	if (!req.body.attendee || !req.body.workshop) {
		res.json({error: "parameters not given"});
	} else {
		// check for duplicate record
		try {
			const template = 
				"SELECT * FROM attendees WHERE name = $1 AND workshop = $2";
			const response = await pool.query(template, [name, workshopName]);

			// query DB and see how many rows
			if (response.rowCount == 0) {

				// no rows were found, so it will not be a duplicate
				try {
					const template = 
						"INSERT INTO attendees (name, workshop) VALUES ($1, $2)";
					const response = await pool.query(template, [name, workshopName]);
					res.json({ 
						attendee: req.body.attendee,
						workshop: req.body.workshop
					  });
				} catch (err) {
					console.log(err);
					res.json({status: "error"});
				}
			} else {	

				// cannot insert because duplicate was found
				res.json({error: "attendee already enrolled"});
			}
		} catch (err) {
			console.log(err);
			res.json({status: "error"});
		}
	}
});
*/

// start app
app.listen( app.get("port"), () => {
	console.log(`Find the server at http://localhost:${ app.get("port") }`);
});
