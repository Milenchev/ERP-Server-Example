const express = require('express')
const sqlite3 = require('sqlite3')
const cors = require('cors');


const app = express()
const port = 5001;
var db = new sqlite3.Database('crmServer.db');

app.use(cors());

app.get('/outgoingInvoices',(req, res) => {
    res.setHeader('Content-Type', 'application/json');

    db.all('SELECT * FROM outgoingInvoices', [], (err, rows) => {
        res.end(JSON.stringify({ "outgoingInvoices": rows }));
    });
})

app.get('/incomingInvoices',(req, res) => {
    res.setHeader('Content-Type', 'application/json');

    db.all('SELECT * FROM incomingInvoices', [], (err, rows) => {
        res.end(JSON.stringify({"incomingInvoices": rows}));
    });
});

app.get('/getDashboardInvoices',(req, res) => {
    res.setHeader('Content-Type', 'application/json');


    db.all('SELECT * FROM outgoingInvoices', [], (err, rows_outgoing) => {
        db.all('SELECT * FROM incomingInvoices', [], (err, rows_incoming) => {
            res.end(JSON.stringify({"incoming": rows_incoming, "outgoing":rows_outgoing}));
        });
    });


});

app.get('/getProductbyInvoice_id', (req, res) => {
    console.log("SOMEONE IS TRYING TO LOGIN!!!!!");
    console.log(req.query);
    res.setHeader('Content-Type', 'application/json');
    db.all("SELECT * FROM product WHERE invoice_id = '"+ req.query.invoice_id +"'", [], (err, rows) => {
        res.end(JSON.stringify({"product": rows}));
        });
        
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
