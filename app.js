const express = require('express');
const mysql = require('mysql');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // ใส่รหัสผ่านของคุณที่นี่
    database: 'mydb'
});

db.connect(err => {
    if (err) {
        console.error('DB connection error:', err);
    } else {
        console.log('Connected to DB');
    }
});

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Student Management</title>
            <script>
                async function fetchStudents() {
                    const response = await fetch('/show');
                    const students = await response.json();
                    const studentList = document.getElementById('student-list');
                    studentList.innerHTML = '';
                    students.forEach(student => {
                        const li = document.createElement('li');
                        li.textContent = \`\${student.student_id}: \${student.first_name} \${student.last_name}\`;
                        const deleteButton = document.createElement('button');
                        deleteButton.textContent = 'Delete';
                        deleteButton.onclick = () => deleteStudent(student.student_id);
                        li.appendChild(deleteButton);

                        const editButton = document.createElement('button');
                        editButton.textContent = 'Edit';
                        editButton.onclick = () => editStudent(student.student_id, student.first_name, student.last_name);
                        li.appendChild(editButton);

                        studentList.appendChild(li);
                    });
                }

                async function addStudent() {
                    const studentId = document.getElementById('student_id').value;
                    const firstName = document.getElementById('first_name').value;
                    const lastName = document.getElementById('last_name').value;

                    const response = await fetch('/insert', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ student_id: studentId, first_name: firstName, last_name: lastName })
                    });
                    if (response.ok) {
                        alert('Student added successfully');
                        fetchStudents(); // Refresh the student list
                    } else {
                        alert('Error adding student');
                    }
                }

                async function deleteStudent(studentId) {
                    const response = await fetch(\`/delete/\${studentId}\`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        alert('Student deleted successfully');
                        fetchStudents(); // Refresh the student list
                    } else {
                        alert('Error deleting student');
                    }
                }

                async function editStudent(studentId, firstName, lastName) {
                    const newFirstName = prompt('Enter new first name:', firstName);
                    const newLastName = prompt('Enter new last name:', lastName);

                    if (newFirstName !== null && newLastName !== null) {
                        const response = await fetch(\`/update/\${studentId}\`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ first_name: newFirstName, last_name: newLastName })
                        });
                        if (response.ok) {
                            alert('Student updated successfully');
                            fetchStudents(); // Refresh the student list
                        } else {
                            alert('Error updating student');
                        }
                    }
                }
            </script>
        </head>
        <body>
            <h1>Student Management</h1>
            <h2>Add Student</h2>
            <input type="text" id="student_id" placeholder="Student ID">
            <input type="text" id="first_name" placeholder="First Name">
            <input type="text" id="last_name" placeholder="Last Name">
            <button onclick="addStudent()">Add Student</button>

            <h2>Student List</h2>
            <ul id="student-list"></ul>

            <script>
                fetchStudents(); // Load students on page load
            </script>
        </body>
        </html>
    `);
});

app.post('/insert', (req, res) => {
    const { student_id, first_name, last_name } = req.body;
    const query = 'INSERT INTO students (student_id, first_name, last_name) VALUES (?, ?, ?)';
    
    db.query(query, [student_id, first_name, last_name], (err, result) => {
        if (err) {
            console.error('Insert error:', err);
            res.status(500).send('Error inserting data');
        } else {
            console.log(`Inserted: ${student_id}, ${first_name}, ${last_name}`);
            res.send('Data inserted successfully');
        }
    });
});

app.get('/show', (req, res) => {
    const query = 'SELECT * FROM students';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Select error:', err);
            res.status(500).send('Error retrieving data');
        } else {
            console.log('Fetched results:', results);
            res.json(results);
        }
    });
});

app.delete('/delete/:student_id', (req, res) => {
    const { student_id } = req.params;
    const query = 'DELETE FROM students WHERE student_id = ?';
    
    db.query(query, [student_id], (err, result) => {
        if (err) {
            console.error('Delete error:', err);
            res.status(500).send('Error deleting data');
        } else if (result.affectedRows === 0) {
            res.status(404).send('Student not found');
        } else {
            res.send(`Student with ID ${student_id} deleted successfully`);
        }
    });
});

app.put('/update/:student_id', (req, res) => {
    const { student_id } = req.params;
    const { first_name, last_name } = req.body;
    const query = 'UPDATE students SET first_name = ?, last_name = ? WHERE student_id = ?';
    
    db.query(query, [first_name, last_name, student_id], (err, result) => {
        if (err) {
            console.error('Update error:', err);
            res.status(500).send('Error updating data');
        } else if (result.affectedRows === 0) {
            res.status(404).send('Student not found');
        } else {
            res.send(`Student with ID ${student_id} updated successfully`);
        }
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
