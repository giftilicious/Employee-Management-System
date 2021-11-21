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

console.log('\n\nWelcome To The Employee Management System\n\n===============================\n');


const init = () => {
    inquirer
        .prompt([
            {
                type: "list",
                name: "initialize",
                message: "What would you like to do?",
                choices: [
                    "View All Employees",
                    "Add Employee",
                    "Update Employee Role",
                    "View All Roles",
                    "Add Role",
                    "View All Departments",
                    "Add Department",
                    "Quit"
                ],
            },
        ])
        .then((answers) => {
            if (answers.initialize === "View All Employees") {
                viewEmployee();
            } else if (answers.initialize === "Add Employee") {
                addEmployee();
            } else if (answers.initialize === "Update Employee Role") {
                updateEmployee();
            } else if (answers.initialize === "View All Roles") {
                viewRole();
            } else if (answers.initialize === "Add Role") {
                addRole();
            } else if (answers.initialize === "View All Departments") {
                viewDepartment();
            } else if (answers.initialize === "Add Department") {
                addDepartment();
            } else {
                console.log("Have a great day!");
            }
            return;
        });
};

// titlePage();
init();


function viewDepartment() {
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
function viewRole() {
    const sql = `
        SELECT role.id, 
        title, 
        salary, 
        department.name 
        FROM department 
        INNER JOIN role 
        ON role.department_id = department.id 
        ORDER BY role.id`;
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
function viewEmployee() {
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
        LEFT OUTER JOIN employee AS manager
        ON employee.manager_id = manager.id
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
                name: "departmentName",
                message: "What is the name of the department?",
            },
        ])
        .then((answers) => {
            const sql = `
                  INSERT INTO department (name)
                  VALUES ("${answers.departmentName}")`;
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
                message: "What is the name of the role?",
                name: "role_title",
            },
            {
                type: "input",
                message: "What is the salary of the role?",
                name: "role_salary",
            },
            {
                type: "list",
                message: "What department does the role belong to?",
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
                    name: "firstName",
                },
                {
                    type: "input",
                    message: "What is the employee's last name?",
                    name: "lastName",
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
          VALUES("${answers.firstName}", "${answers.lastName}", ${answers.role_title}, ${answers.manager})`;
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
    let newRole = [];
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
                newRole.push({
                    name: results[i].first_name + " " + results[i].last_name,
                    value: results[i].id,
                });
            }
            inquirer
                .prompt([
                    {
                        type: "list",
                        message: "Which employee's role do you want to update?",
                        name: "current_role",
                        choices: newRole,
                    },
                    {
                        type: "list",
                        message: "Which role do you want to assign the selected employee?",
                        name: "updated_role",
                        choices: role,
                    },
                ])
                .then((answers) => {
                    // console.log({ current_role: answers.current_role })
                    let sql = `UPDATE employee SET role_id=? WHERE id=?`
                    db.query(sql, [answers.updated_role, answers.current_role], (err, results) => {
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



app.listen(PORT)

