const express = require('express')
const sqlite3 = require('sqlite3')
const cors = require('cors');
const bodyParser = require('body-parser');


const app = express()
const port = 5001;
var db = new sqlite3.Database('crmServer.db');

app.use(cors());
app.use(express.urlencoded({ extend:true, 'limit': '50mb', parameterLimit:50000 }))
app.use(bodyParser.json({limit: '50mb'}));

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

app.post("/addOutgoingInvoice", (req, res) => {
    let invoice_info = req.body.invoice;
    console.log(invoice_info);

    db.run('INSERT INTO outgoingInvoices (date, client, invoiceValue, invoiceState, type, typeOfPayment) VALUES (?, ?, ?, ?, ?, ?)', 
    [invoice_info.date, invoice_info.client, invoice_info.total_value, 0, invoice_info.type, invoice_info.typeOfPayment], 
    function(err) {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).send('Error inserting invoice');
        }

        console.log(`Data inserted successfully with ID: ${this.lastID}`);
        
        // Iterate over the products and validate them
        invoice_info.products.forEach((product) => {
            // Validate product fields (name, price, quantity)
            if (product.name == '' || product.price === 0 || product.quantity === 0) {
                console.log(`Skipping product due to missing fields: ${JSON.stringify(product)}`);
                return; 
            } else {
                // Insert valid product into the database
                db.run('INSERT INTO product (invoice_id, name, quantity, price, discount) VALUES (?, ?, ?, ?, ?)', 
                [this.lastID, product.name, product.quantity, product.price, product.discount], function(err) {
                    if (err) {
                        console.error('Error inserting product:', err);
                    } else {
                        console.log(`Product inserted: ${product.name}`);
                    }
                });
            }
        });

        // Send response back after processing
        res.end(JSON.stringify({"done": true}));
    });
});

app.delete("/deleteOutgoingInvoices", (req, res) =>{
    db.all("DELETE FROM outgoingInvoices WHERE uid = '"+ req.query.id +"'", [], (err, rows) => {
        res.end(JSON.stringify({"done": true}));
    });
    // console.log(req.query);
});


app.post("/addIncomingInvoice", (req, res) => {
    let invoice_info = req.body.invoice;
    console.log(invoice_info);

    db.run('INSERT INTO incomingInvocies (expDate, date, supplier, invoiceValue, State, type, typeOfPayment) VALUES (?, ?, ?, ?, ?, ?, ?)', 
    [invoice_expDate, invoice_info.date, invoice_info.supplier, invoice_info.total_value, 0, invoice_info.type, invoice_info.typeOfPayment], 
    function(err) {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).send('Error inserting invoice');
        }

        console.log(`Data inserted successfully with ID: ${this.lastID}`);

        // Send response back after processing
        res.end(JSON.stringify({"done": true}));
    });
});

app.delete("/deleteIncomingInvoices", (req, res) =>{
    db.all("DELETE FROM incomingInvoices WHERE uid = '"+ req.query.id +"'", [], (err, rows) => {
        res.end(JSON.stringify({"done": true}));
    });
    // console.log(req.query);
});



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
