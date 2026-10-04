const express = require('express');
const mysql = require('mysql2');
const app = express();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'student_management'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }

    console.log('Connected to MySQL');
});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    db.query('SELECT * FROM students ORDER BY id DESC', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }

        res.render('index', {
            students: results
        });
    });
});

app.get('/students/add', (req, res) => {
    res.render('add');
});

app.post('/students/add', (req, res) => {
    const { student_id, first_name, last_name, course, year_level, email } = req.body;

    if (!student_id || !first_name || !last_name || !course || !year_level || !email) {
        return res.status(400).send('All fields are required');
    }

    if (!Number.isInteger(Number(year_level)) || Number(year_level) < 1 || Number(year_level) > 4) {
        return res.status(400).send('Year level must be between 1 and 4');
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        return res.status(400).send('Please enter a valid email address');
    }

    const checkSql = 'SELECT id FROM students WHERE student_id = ?';

    db.query(checkSql, [student_id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }

        if (results.length > 0) {
            return res.status(400).send('Student ID already exists');
        }

        const sql = `
            INSERT INTO students
            (student_id, first_name, last_name, course, year_level, email)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const values = [student_id, first_name, last_name, course, year_level, email];

        db.query(sql, values, (err) => {
            if (err) {
                console.error('INSERT ERROR:', err);
                return res.status(500).send('Unable to save student');
            }

            res.redirect('/');
        });
    });
});

app.get('/students/search', (req, res) => {
    const keyword = req.query.keyword || '';

    const sql = `
        SELECT * FROM students
        WHERE student_id LIKE ?
        OR first_name LIKE ?
        OR last_name LIKE ?
        OR course LIKE ?
    `;

    const searchValue = `%${keyword}%`;

    db.query(
        sql,
        [
            searchValue,
            searchValue,
            searchValue,
            searchValue
        ],
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Search error');
            }

            res.render('index', {
                students: results
            });
        }
    );
});


/* EDIT STUDENT */

app.get('/students/edit/:id', (req, res) => {
    const { id } = req.params;

    db.query(
        'SELECT * FROM students WHERE id = ?',
        [id],
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Database error');
            }

            if (results.length === 0) {
                return res.status(404).send('Student not found');
            }

            res.render('edit', {
                student: results[0]
            });
        }
    );
});

app.post('/students/edit/:id', (req, res) => {
    const { id } = req.params;

    const {
        student_id,
        first_name,
        last_name,
        course,
        year_level,
        email
    } = req.body;

    if (!student_id || !first_name || !last_name || !course || !year_level || !email) {
        return res.status(400).send('All fields are required');
    }

    if (!Number.isInteger(Number(year_level)) || Number(year_level) < 1 || Number(year_level) > 4) {
        return res.status(400).send('Year level must be between 1 and 4');
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        return res.status(400).send('Please enter a valid email address');
    }

    const checkSql = 'SELECT id FROM students WHERE student_id = ? AND id != ?';

    db.query(checkSql, [student_id, id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }

        if (results.length > 0) {
            return res.status(400).send('Student ID already exists');
        }

        const sql = `
            UPDATE students
            SET student_id = ?,
                first_name = ?,
                last_name = ?,
                course = ?,
                year_level = ?,
                email = ?
            WHERE id = ?
        `;

        const values = [
            student_id,
            first_name,
            last_name,
            course,
            year_level,
            email,
            id
        ];

        db.query(sql, values, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Unable to update student');
            }

            res.redirect('/');
        });
    });
});


app.post('/students/delete', (req, res) => {
    const { id } = req.body;

    const sql = 'DELETE FROM students WHERE id = ?';

    db.query(sql, [id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Unable to delete student');
        }

        res.redirect('/');
    });
});

app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});