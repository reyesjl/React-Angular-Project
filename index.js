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

// delete a user from the database
app.delete("/delete-user", async (req, res) => {
    const username = req.body.username;

    // handle empty params
    if (!username) {
        res.json({error: "params not given"});
    } else {
        // delete user from database
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
				return [item.firstname, item.lastname, item.username, item.email];
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
				return [item.firstname, item.lastname];
            });
            res.json({users: userlist});
        } catch (err) {
            console.log(err);
			res.json({status: "error: listing users (summary) - code[4]"});
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
				"SELECT * from attendees where name = $1 AND workshop = $2";
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
