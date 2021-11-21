const express = require("express");
const inquirer = require("inquirer");
const mysql = require("mysql2");
require("dotenv").config();
const consoleTable = require("console.table");

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const db = mysql.createConnection(
    {
        host: 'localhost',
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    },
    console.log(`Connected to the employees_db database.`)
);

function departmentTable() {
    db.query("SELECT * FROM department ORDER BY department.id", function (err, results) {
        if (err) {
            console.log(err);
            return;
        }
        console.table(results);
        init();
        return;
    });
};
function rolesTable() {
    const sql =
        "SELECT role.id, title, salary, department.name FROM department INNER JOIN role ON role.department_id = department.id ORDER BY role.id";
    db.query(sql, (err, results) => {
        if (err) {
            console.log(err);
            return;
        } else {
            console.table(results);
            init();
            return;
        }
    });
};
function employeeAllTable() {
    const sql = `
    SELECT employee.id, 
    employee.first_name,
    employee.last_name,
    role.title,
    department.name,	
    role.salary
    FROM employee
    INNER JOIN role
    ON employee.role_id = role.id
    INNER JOIN department
    ON role.department_id = department.id
    LEFT OUTER JOIN employee AS Managers
    ON employee.manager_id = managers.id
    ORDER BY employee.id`;
    db.query(sql, (err, results) => {
        if (err) {
            console.log(err);
            return;
        } else {
            console.table(results);
            init();
            return;
        }
    });
};

function addDepartment() {
    inquirer
        .prompt([
            {
                type: "input",
                name: "department_name",
                message: "What is the name of the department?",
            },
        ])
        .then((answers) => {
            const sql = `
                  INSERT INTO department (name)
                  VALUES ("${answers.department_name}")`;
            db.query(sql, (err, results) => {
                if (err) {
                    console.log(err);
                    return;
                }
                init();
            });
        });
};

function addRole() {
    let sql = `SELECT * from department`;
    db.query(sql, (err, results) => {
        if (err) {
            console.log(err);
            return
        }
        inquirer.prompt([
            {
                type: "input",
                message: "What is the title of the role?",
                name: "role_title",
            },
            {
                type: "input",
                message: "What is the salary for this role?",
                name: "role_salary",
            },
            {
                type: "list",
                message: "What department is this role associated with?",
                name: "role_id",
                choices: results.map((department) => {
                    return {
                        name: department.name,
                        value: department.id
                    }
                })
            },
        ])
            .then((answers) => {
                const sql = `
              INSERT INTO role (title, salary, department_id)
              VALUES ("${answers.role_title}", ${answers.role_salary}, ${answers.role_id})
      `;
                db.query(sql, (err, results) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    init();
                    return;
                });

            })

    });
};

function addEmployee() {
    const sql = `SELECT * FROM role`;
    db.query(sql, (err, roleResults) => {
        if (err) {
            console.log(err);
            return;
        }
        const sql = `SELECT * FROM employee`;
        db.query(sql, (err, managerResults) => {
            if (err) {
                console.log(err);
                return;
            }
            inquirer.prompt([
                {
                    type: "input",
                    message: "What is the employee's first name?",
                    name: "fName",
                },
                {
                    type: "input",
                    message: "What is the employee's last name?",
                    name: "lName",
                },
                {
                    type: "list",
                    message: "What is the employee's role?",
                    name: "role_title",
                    choices: roleResults.map((role) => {
                        return {
                            name: role.title,
                            value: role.id
                        }
                    })
                },
                {
                    type: "list",
                    message: "Who is the employee's manager?",
                    name: "manager",
                    choices: [{ name: "None", value: null }, ...managerResults.map((manager) => {
                        return {
                            name: manager.first_name + " " + manager.last_name,
                            value: manager.id
                        }
                    })]
                },
            ])
                .then((answers) => {
                    let sql = `
          INSERT INTO employee (first_name, last_name, role_id, manager_id)
          VALUES("${answers.fName}", "${answers.lName}", ${answers.role_title}, ${answers.manager})`;
                    db.query(sql, (err, results) => {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        init();
                        return;
                    });
                });
        })
    })
};

function updateEmployee() {
    let role = [];
    let employeeData = [];
    let sql = `SELECT id, title from role`;
    db.query(sql, (err, results) => {
        if (err) {
            console.log(err);
            return;
        }
        for (let i = 0; i < results.length; i++) {
            role.push({
                name: results[i].title,
                value: results[i].id,
            });
        }
        let sql = `SELECT id, first_name, last_name from employee`;
        db.query(sql, (err, results) => {
            if (err) {
                console.log(err);
                return;
            }
            for (let i = 0; i < results.length; i++) {
                employeeData.push({
                    name: results[i].first_name + " " + results[i].last_name,
                    value: results[i].id,
                });
            }
            inquirer
                .prompt([
                    {
                        type: "list",
                        message: "Which employee's role would you like to update?",
                        name: "original_role",
                        choices: employeeData,
                    },
                    {
                        type: "list",
                        message: "What would you like to change their role too?",
                        name: "updated_role",
                        choices: role,
                    },
                ])
                .then((answers) => {
                    let sql = `UPDATE employee SET role_id=? WHERE id)?`;
                    db.query(sql, (answers.updated_role, answers.original_role), (err, results) => {
                        if (err) {
                            console.log(err);
                        }
                        init();
                        return;
                    });
                });
        });
    });
};

const titlePage = () => {
    console.log(`
  /$$$$$$$$                         /$$                                               /$$      /$$                                                                  
 | $$_____/                        | $$                                              | $$$    /$$$                                                                  
 | $$       /$$$$$$/$$$$   /$$$$$$ | $$  /$$$$$$  /$$   /$$  /$$$$$$   /$$$$$$       | $$$$  /$$$$  /$$$$$$  /$$$$$$$   /$$$$$$   /$$$$$$   /$$$$$$   /$$$$$$       
 | $$$$$   | $$_  $$_  $$ /$$__  $$| $$ /$$__  $$| $$  | $$ /$$__  $$ /$$__  $$      | $$ $$/$$ $$ |____  $$| $$__  $$ |____  $$ /$$__  $$ /$$__  $$ /$$__  $$      
 | $$__/   | $$ \ $$ \ $$| $$  \ $$| $$| $$  \ $$| $$  | $$| $$$$$$$$| $$$$$$$$      | $$  $$$| $$  /$$$$$$$| $$  \ $$  /$$$$$$$| $$  \ $$| $$$$$$$$| $$  \__/      
 | $$      | $$ | $$ | $$| $$  | $$| $$| $$  | $$| $$  | $$| $$_____/| $$_____/      | $$\  $ | $$ /$$__  $$| $$  | $$ /$$__  $$| $$  | $$| $$_____/| $$            
 | $$$$$$$$| $$ | $$ | $$| $$$$$$$/| $$|  $$$$$$/|  $$$$$$$|  $$$$$$$|  $$$$$$$      | $$ \/  | $$|  $$$$$$$| $$  | $$|  $$$$$$$|  $$$$$$$|  $$$$$$$| $$            
 |________/|__/ |__/ |__/| $$____/ |__/ \______/  \____  $$ \_______/ \_______/      |__/     |__/ \_______/|__/  |__/ \_______/ \____  $$ \_______/|__/            
                         | $$                     /$$  | $$                                                                      /$$  \ $$                          
                         | $$                    |  $$$$$$/                                                                     |  $$$$$$/                          
                         |__/                     \______/                                                                       \______/                           
 
 `)
}

const init = () => {
    inquirer
        .prompt([
            {
                type: "list",
                name: "begin",
                message: "Choose an option...",
                choices: [
                    "View all departments",
                    "View all roles",
                    "View all employees",
                    "Add a department",
                    "Add a role",
                    "Add an employee",
                    "Update an employee role",
                    "Exit",
                ],
            },
        ])
        .then((answers) => {
            if (answers.begin === "View all departments") {
                departmentTable();
            } else if (answers.begin === "View all roles") {
                rolesTable();
            } else if (answers.begin === "View all employees") {
                employeeAllTable();
            } else if (answers.begin === "Add a department") {
                addDepartment();
            } else if (answers.begin === "Add a role") {
                addRole();
            } else if (answers.begin === "Add an employee") {
                addEmployee();
            } else if (answers.begin === "Update an employee role") {
                updateEmployee();
            } else {
                console.log("Have a great day!");
            }
            return;
        });
};

titlePage();
init();


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});